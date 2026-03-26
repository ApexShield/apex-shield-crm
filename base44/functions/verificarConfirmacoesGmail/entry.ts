import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accessToken = await base44.asServiceRole.connectors.getAccessToken("gmail");

    // Get compromissos that have email_participante set but not yet confirmed
    const compromissos = await base44.asServiceRole.entities.Compromisso.filter({
      email_enviado: true,
      convidado_confirmou: false
    });

    if (!compromissos || compromissos.length === 0) {
      return Response.json({ success: true, message: 'Nenhum compromisso pendente de confirmação', confirmed: 0 });
    }

    // Build a map of participant emails to compromisso IDs
    const emailToCompromissos = {};
    for (const comp of compromissos) {
      if (comp.email_participante) {
        const email = comp.email_participante.toLowerCase().trim();
        if (!emailToCompromissos[email]) emailToCompromissos[email] = [];
        emailToCompromissos[email].push(comp);
      }
    }

    const participantEmails = Object.keys(emailToCompromissos);
    if (participantEmails.length === 0) {
      return Response.json({ success: true, message: 'Nenhum email de participante pendente', confirmed: 0 });
    }

    // Search Gmail for replies containing confirmation keywords
    // Look for emails from the last 30 days that contain "CONFIRMO" or similar
    const confirmKeywords = ['CONFIRMO', 'CONFIRMADO', 'CONFIRMAR', 'CONFIRMA', 'SIM, CONFIRMO', 'CONFIRMEI'];
    
    let confirmed = 0;
    const confirmedDetails = [];

    for (const email of participantEmails) {
      // Search for emails from this participant
      const query = `from:${email} newer_than:30d`;
      const searchUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=10`;
      
      const searchRes = await fetch(searchUrl, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (!searchRes.ok) {
        console.error(`Error searching emails for ${email}: ${searchRes.status}`);
        continue;
      }

      const searchData = await searchRes.json();
      if (!searchData.messages || searchData.messages.length === 0) continue;

      // Check each message for confirmation keywords
      let hasConfirmation = false;

      for (const msg of searchData.messages) {
        if (hasConfirmation) break;

        const msgUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`;
        const msgRes = await fetch(msgUrl, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (!msgRes.ok) continue;

        const msgData = await msgRes.json();
        
        // Check subject for "Re:" with compromisso title
        const subjectHeader = msgData.payload?.headers?.find(h => h.name.toLowerCase() === 'subject');
        const subject = subjectHeader?.value || '';
        
        // Check if this is a reply to one of our compromise emails
        const isReplyToCompromisso = subject.toLowerCase().includes('convite:') || 
                                      subject.toLowerCase().includes('compromisso');

        if (!isReplyToCompromisso) continue;

        // Get the email body text
        let bodyText = '';
        
        const getTextFromParts = (parts) => {
          if (!parts) return '';
          let text = '';
          for (const part of parts) {
            if (part.mimeType === 'text/plain' && part.body?.data) {
              text += atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
            }
            if (part.parts) {
              text += getTextFromParts(part.parts);
            }
          }
          return text;
        };

        if (msgData.payload?.body?.data) {
          bodyText = atob(msgData.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
        } else if (msgData.payload?.parts) {
          bodyText = getTextFromParts(msgData.payload.parts);
        }

        // Also use snippet as fallback
        bodyText += ' ' + (msgData.snippet || '');
        const upperBody = bodyText.toUpperCase();

        // Check for confirmation keywords
        for (const keyword of confirmKeywords) {
          if (upperBody.includes(keyword)) {
            hasConfirmation = true;
            break;
          }
        }
      }

      if (hasConfirmation) {
        // Mark all compromissos for this participant as confirmed
        for (const comp of emailToCompromissos[email]) {
          await base44.asServiceRole.entities.Compromisso.update(comp.id, { convidado_confirmou: true });
          confirmed++;
          confirmedDetails.push({ id: comp.id, titulo: comp.titulo, email });
        }
      }
    }

    return Response.json({ 
      success: true, 
      confirmed, 
      details: confirmedDetails,
      totalPending: compromissos.length,
      message: confirmed > 0 
        ? `${confirmed} compromisso(s) confirmado(s) automaticamente!` 
        : 'Nenhuma nova confirmação encontrada'
    });
  } catch (error) {
    console.error('Error checking confirmations:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});