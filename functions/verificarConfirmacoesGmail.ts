import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const accessToken = await base44.asServiceRole.connectors.getAccessToken("gmail");

    // Search for recent emails containing "CONFIRMO" in the last 2 days
    const query = encodeURIComponent('subject:(Convite OR Compromisso OR Atualizado) newer_than:2d');
    const listResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}&maxResults=50`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );

    if (!listResponse.ok) {
      const err = await listResponse.text();
      console.error('Gmail list error:', err);
      return Response.json({ error: 'Erro ao listar emails' }, { status: 500 });
    }

    const listData = await listResponse.json();
    const messages = listData.messages || [];

    if (messages.length === 0) {
      return Response.json({ success: true, checked: 0, confirmed: 0 });
    }

    // Get all compromissos that have email_participante and are not yet confirmed
    const compromissos = await base44.asServiceRole.entities.Compromisso.filter({
      convidado_confirmou: false
    });

    const pendingByEmail = {};
    for (const comp of compromissos) {
      if (comp.email_participante) {
        const email = comp.email_participante.toLowerCase().trim();
        if (!pendingByEmail[email]) pendingByEmail[email] = [];
        pendingByEmail[email].push(comp);
      }
    }

    if (Object.keys(pendingByEmail).length === 0) {
      return Response.json({ success: true, checked: messages.length, confirmed: 0, message: 'Nenhum compromisso pendente de confirmação' });
    }

    let confirmed = 0;

    for (const msg of messages) {
      const msgResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );

      if (!msgResponse.ok) continue;

      const msgData = await msgResponse.json();
      const headers = msgData.payload?.headers || [];

      const fromHeader = headers.find(h => h.name.toLowerCase() === 'from')?.value || '';
      const subjectHeader = headers.find(h => h.name.toLowerCase() === 'subject')?.value || '';

      // Extract email from "Name <email>" format
      const emailMatch = fromHeader.match(/<([^>]+)>/) || [null, fromHeader];
      const senderEmail = (emailMatch[1] || '').toLowerCase().trim();

      if (!senderEmail || !pendingByEmail[senderEmail]) continue;

      // Check body for confirmation keywords
      const bodyText = extractBodyText(msgData.payload);
      const confirmKeywords = ['confirmo', 'confirmado', 'confirmar', 'sim, confirmo', 'presença confirmada'];
      const hasConfirmation = confirmKeywords.some(kw => bodyText.toLowerCase().includes(kw));

      if (hasConfirmation) {
        // Confirm all pending compromissos for this sender
        for (const comp of pendingByEmail[senderEmail]) {
          await base44.asServiceRole.entities.Compromisso.update(comp.id, {
            convidado_confirmou: true
          });
          confirmed++;
          console.log(`Confirmado: ${comp.titulo} - ${senderEmail}`);
        }
        // Remove from pending so we don't double-confirm
        delete pendingByEmail[senderEmail];
      }
    }

    return Response.json({ success: true, checked: messages.length, confirmed });
  } catch (error) {
    console.error('Error checking confirmations:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function extractBodyText(payload) {
  if (!payload) return '';

  // Direct body
  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  // Multipart - search parts recursively
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return decodeBase64Url(part.body.data);
      }
    }
    // Fallback to html
    for (const part of payload.parts) {
      if (part.mimeType === 'text/html' && part.body?.data) {
        return decodeBase64Url(part.body.data);
      }
      // Nested multipart
      if (part.parts) {
        const nested = extractBodyText(part);
        if (nested) return nested;
      }
    }
  }

  return '';
}

function decodeBase64Url(data) {
  try {
    const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(base64);
    return new TextDecoder().decode(Uint8Array.from(decoded, c => c.charCodeAt(0)));
  } catch {
    return '';
  }
}