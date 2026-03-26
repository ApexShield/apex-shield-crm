import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

async function getUserGoogleToken(base44, userEmail) {
  const auths = await base44.asServiceRole.entities.UserGoogleAuth.filter({
    user_email: userEmail
  });
  if (auths.length === 0) return null;
  
  const auth = auths[0];
  const tokenExpiry = new Date(auth.token_expiry);
  const now = new Date();

  if (tokenExpiry > now) {
    return { access_token: auth.access_token, google_email: auth.google_email };
  }

  if (auth.refresh_token) {
    const CLIENT_ID = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID");
    const CLIENT_SECRET = Deno.env.get("google_oauth_client_secret");

    const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        refresh_token: auth.refresh_token,
        grant_type: 'refresh_token'
      })
    });

    if (refreshResponse.ok) {
      const newTokens = await refreshResponse.json();
      await base44.asServiceRole.entities.UserGoogleAuth.update(auth.id, {
        access_token: newTokens.access_token,
        token_expiry: new Date(Date.now() + (newTokens.expires_in * 1000)).toISOString()
      });
      return { access_token: newTokens.access_token, google_email: auth.google_email };
    }
  }

  return null;
}

function formatICSDate(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

function buildICS(comp, startDate, endDate, organizerName, organizerEmail, location) {
  const uid = `${comp.id}@apexshieldcrm.com`;
  const now = new Date();
  
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Apex Shield CRM//PT',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatICSDate(now)}`,
    `DTSTART:${formatICSDate(startDate)}`,
    `DTEND:${formatICSDate(endDate)}`,
    `SUMMARY:${comp.titulo}`,
    `DESCRIPTION:${(comp.descricao || 'Compromisso agendado via Apex Shield CRM').replace(/\n/g, '\\n')}`,
    `LOCATION:${location}`,
    `ORGANIZER;CN=${organizerName}:mailto:${organizerEmail}`,
    `ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;CN=${comp.email_participante}:mailto:${comp.email_participante}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Lembrete - 1 hora antes',
    'END:VALARM',
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Lembrete - 30 minutos antes',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

function buildEmailHTML(comp, organizerName, organizerEmail, dayStr, timeStart, timeEnd, location) {
  const isOnline = comp.modalidade === 'online';
  const meetLink = comp.meeting_link || '';

  // Email HTML limpo e profissional — sem excesso de imagens/gradientes para evitar spam
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Convite: ${comp.titulo}</title></head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:24px 16px;">
<tr><td align="center">
<table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e0e0e0;">

<!-- Header -->
<tr><td style="background-color:#1a365d;padding:24px 32px;text-align:center;">
  <h1 style="color:#ffffff;font-size:18px;margin:0;font-weight:700;">Convite para Compromisso</h1>
</td></tr>

<!-- Body -->
<tr><td style="padding:32px;">
  <p style="color:#333333;font-size:15px;line-height:1.5;margin:0 0 20px;">
    Olá, você foi convidado(a) para o seguinte compromisso:
  </p>

  <!-- Event Details -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;margin-bottom:20px;">
    <tr><td style="padding:20px;">
      <h2 style="color:#1a365d;font-size:18px;margin:0 0 16px;font-weight:700;">${comp.titulo}</h2>
      
      <table cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
        <tr>
          <td style="width:24px;vertical-align:top;padding-top:2px;color:#64748b;">&#128197;</td>
          <td style="padding-left:8px;color:#334155;font-size:14px;line-height:1.5;">
            <strong>${dayStr}</strong>
          </td>
        </tr>
      </table>

      <table cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
        <tr>
          <td style="width:24px;vertical-align:top;padding-top:2px;color:#64748b;">&#128336;</td>
          <td style="padding-left:8px;color:#334155;font-size:14px;line-height:1.5;">
            <strong>${timeStart} - ${timeEnd}</strong> (Horário de Brasília)
          </td>
        </tr>
      </table>

      <table cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
        <tr>
          <td style="width:24px;vertical-align:top;padding-top:2px;color:#64748b;">${isOnline ? '&#128187;' : '&#128205;'}</td>
          <td style="padding-left:8px;color:#334155;font-size:14px;line-height:1.5;">
            ${isOnline ? 'Reunião Online' : location}
            ${meetLink ? `<br><a href="${meetLink}" style="color:#2563eb;text-decoration:none;font-size:13px;">${meetLink}</a>` : ''}
          </td>
        </tr>
      </table>

      <table cellpadding="0" cellspacing="0">
        <tr>
          <td style="width:24px;vertical-align:top;padding-top:2px;color:#64748b;">&#128100;</td>
          <td style="padding-left:8px;color:#334155;font-size:14px;line-height:1.5;">
            Organizador: <strong>${organizerName}</strong>
            <br><span style="color:#64748b;font-size:13px;">${organizerEmail}</span>
          </td>
        </tr>
      </table>

      ${comp.descricao ? `
      <div style="margin-top:16px;padding-top:12px;border-top:1px solid #e2e8f0;">
        <p style="color:#64748b;font-size:12px;margin:0 0 4px;font-weight:600;">OBSERVAÇÕES:</p>
        <p style="color:#334155;font-size:13px;margin:0;line-height:1.5;">${comp.descricao}</p>
      </div>` : ''}
    </td></tr>
  </table>

  ${meetLink ? `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
    <tr><td align="center">
      <a href="${meetLink}" target="_blank" style="display:inline-block;background-color:#2563eb;color:#ffffff;padding:12px 32px;border-radius:6px;font-weight:700;font-size:14px;text-decoration:none;">Entrar na Reunião</a>
    </td></tr>
  </table>` : ''}

  <div style="background:#eff6ff;border-radius:6px;padding:16px;border:1px solid #bfdbfe;text-align:center;">
    <p style="color:#1e40af;font-size:13px;margin:0;font-weight:600;">
      Este email contém um convite de calendário em anexo.
    </p>
    <p style="color:#3b82f6;font-size:12px;margin:4px 0 0;">
      Aceite ou recuse diretamente pelo seu aplicativo de email ou calendário.
    </p>
  </div>
</td></tr>

<!-- Footer -->
<tr><td style="background-color:#f8fafc;padding:16px 32px;text-align:center;border-top:1px solid #e2e8f0;">
  <p style="color:#94a3b8;font-size:11px;margin:0;">Enviado via Apex Shield CRM</p>
</td></tr>

</table>
</td></tr>
</table>
</body></html>`;
}

function buildPlainText(comp, organizerName, organizerEmail, dayStr, timeStart, timeEnd, location) {
  const meetLink = comp.meeting_link || '';
  let text = `Convite para Compromisso\n\n`;
  text += `Você foi convidado(a) para o seguinte compromisso:\n\n`;
  text += `${comp.titulo}\n`;
  text += `Data: ${dayStr}\n`;
  text += `Horário: ${timeStart} - ${timeEnd} (Horário de Brasília)\n`;
  text += `Local: ${location}\n`;
  if (meetLink) text += `Link da reunião: ${meetLink}\n`;
  text += `Organizador: ${organizerName} (${organizerEmail})\n`;
  if (comp.descricao) text += `\nObservações: ${comp.descricao}\n`;
  text += `\nEste email contém um convite de calendário. Aceite ou recuse pelo seu app de email/calendário.\n`;
  text += `\n---\nEnviado via Apex Shield CRM`;
  return text;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { compromisso_id } = await req.json();
    if (!compromisso_id) {
      return Response.json({ error: 'compromisso_id é obrigatório' }, { status: 400 });
    }

    const compromissos = await base44.entities.Compromisso.filter({ id: compromisso_id });
    const comp = compromissos[0];
    if (!comp) {
      return Response.json({ error: 'Compromisso não encontrado' }, { status: 404 });
    }
    if (!comp.email_participante) {
      return Response.json({ error: 'Compromisso não possui email de participante' }, { status: 400 });
    }

    // Auto-fill meeting link
    if (comp.modalidade === 'online' && !comp.meeting_link && user.link_reuniao_padrao) {
      comp.meeting_link = user.link_reuniao_padrao;
      await base44.entities.Compromisso.update(comp.id, { meeting_link: user.link_reuniao_padrao });
    }

    const startDate = new Date(comp.data_inicio);
    const endDate = new Date(comp.data_fim || new Date(startDate.getTime() + 3600000));
    if (isNaN(startDate.getTime())) {
      return Response.json({ error: 'Data de início inválida' }, { status: 400 });
    }

    const optsBR = { timeZone: 'America/Sao_Paulo' };
    const dayStr = startDate.toLocaleDateString('pt-BR', { ...optsBR, weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    const timeStart = startDate.toLocaleTimeString('pt-BR', { ...optsBR, hour: '2-digit', minute: '2-digit' });
    const timeEnd = endDate.toLocaleTimeString('pt-BR', { ...optsBR, hour: '2-digit', minute: '2-digit' });

    const organizerName = user.full_name || 'Apex Shield CRM';
    const organizerEmail = user.email;
    const location = comp.modalidade === 'online' ? (comp.meeting_link || 'Online') : (comp.endereco || 'A definir');

    // Build ICS content
    const icsContent = buildICS(comp, startDate, endDate, organizerName, organizerEmail, location);
    const icsBase64 = btoa(unescape(encodeURIComponent(icsContent)));

    // Build email content
    const emailBody = buildEmailHTML(comp, organizerName, organizerEmail, dayStr, timeStart, timeEnd, location);
    const plainText = buildPlainText(comp, organizerName, organizerEmail, dayStr, timeStart, timeEnd, location);

    // Simple subject line (avoids spam filters)
    const subject = `Convite: ${comp.titulo} - ${dayStr}`;

    // Build MIME message with calendar invite as native part (not just attachment)
    // This makes email clients show Accept/Decline buttons natively
    const boundary = `----=_Part_${Date.now()}`;
    const altBoundary = `----=_Alt_${Date.now()}`;

    const mimeMessage = [
      `To: ${comp.email_participante}`,
      `From: ${organizerName} <${organizerEmail}>`,
      `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      ``,
      `--${boundary}`,
      `Content-Type: multipart/alternative; boundary="${altBoundary}"`,
      ``,
      // Part 1: Plain text
      `--${altBoundary}`,
      `Content-Type: text/plain; charset=UTF-8`,
      `Content-Transfer-Encoding: base64`,
      ``,
      btoa(unescape(encodeURIComponent(plainText))),
      ``,
      // Part 2: HTML
      `--${altBoundary}`,
      `Content-Type: text/html; charset=UTF-8`,
      `Content-Transfer-Encoding: base64`,
      ``,
      btoa(unescape(encodeURIComponent(emailBody))),
      ``,
      // Part 3: Calendar invite inline (this is what triggers native Accept/Decline in email clients)
      `--${altBoundary}`,
      `Content-Type: text/calendar; charset=UTF-8; method=REQUEST`,
      `Content-Transfer-Encoding: base64`,
      ``,
      icsBase64,
      ``,
      `--${altBoundary}--`,
      ``,
      // Attachment: .ics file (for clients that don't support inline calendar)
      `--${boundary}`,
      `Content-Type: application/ics; name="invite.ics"`,
      `Content-Disposition: attachment; filename="invite.ics"`,
      `Content-Transfer-Encoding: base64`,
      ``,
      icsBase64,
      ``,
      `--${boundary}--`
    ].join('\r\n');

    const rawEncoded = btoa(unescape(encodeURIComponent(mimeMessage)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Try user's Google token first
    const userAuth = await getUserGoogleToken(base44, user.email);
    
    if (!userAuth) {
      // Fallback: Send via Base44 SendEmail (without .ics - plain email)
      // The SendEmail integration sends clean emails from a verified domain, reducing spam
      console.log('Usuário não conectou Google. Enviando via SendEmail para:', comp.email_participante);
      
      await base44.integrations.Core.SendEmail({
        from_name: organizerName,
        to: comp.email_participante,
        subject: subject,
        body: emailBody
      });
      console.log('Email enviado com sucesso para participante:', comp.email_participante);

      await base44.entities.Compromisso.update(comp.id, { email_enviado: true });
      
      return Response.json({ 
        success: true, 
        message: `Convite enviado para ${comp.email_participante}. Para enviar convites com aceitar/recusar nativo, conecte seu Google na página de Compromissos.`,
        google_event_id: null
      });
    }

    // Send via Gmail with full MIME (calendar invite with native Accept/Decline)
    console.log('Enviando via Gmail do usuário:', userAuth.google_email);
    const gmailToken = userAuth.access_token;

    const gmailRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${gmailToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw: rawEncoded })
    });

    if (!gmailRes.ok) {
      const errText = await gmailRes.text();
      console.error('Gmail send error:', errText);
      
      // Fallback to SendEmail if Gmail fails
      console.log('Gmail falhou, usando SendEmail como fallback');
      await base44.integrations.Core.SendEmail({
        from_name: organizerName,
        to: comp.email_participante,
        subject: subject,
        body: emailBody
      });
      await base44.entities.Compromisso.update(comp.id, { email_enviado: true });
      return Response.json({ 
        success: true, 
        message: `Convite enviado para ${comp.email_participante} (via email alternativo)`,
        google_event_id: null
      });
    }

    console.log('Email enviado com sucesso via Gmail');
    await base44.entities.Compromisso.update(comp.id, { email_enviado: true });

    // Create Google Calendar event (triggers native invite from Google)
    let googleEventId = null;
    try {
      console.log('Criando evento no Google Calendar do usuário:', userAuth.google_email);
      
      const calEvent = {
        summary: comp.titulo,
        description: comp.descricao || '',
        location: location,
        start: { dateTime: comp.data_inicio, timeZone: 'America/Sao_Paulo' },
        end: { dateTime: (comp.data_fim || new Date(startDate.getTime() + 3600000).toISOString()), timeZone: 'America/Sao_Paulo' },
        attendees: [{ email: comp.email_participante }],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 60 },
            { method: 'popup', minutes: 30 }
          ]
        }
      };

      const calRes = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${gmailToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(calEvent)
      });

      if (calRes.ok) {
        const calData = await calRes.json();
        googleEventId = calData.id;
        await base44.entities.Compromisso.update(comp.id, { google_event_id: calData.id });
        console.log('Evento criado no Google Calendar:', calData.id);
      } else {
        const calErr = await calRes.text();
        console.error('Erro ao criar evento no Calendar:', calErr);
      }
    } catch (calError) {
      console.error('Erro ao adicionar ao Calendar:', calError.message);
    }

    return Response.json({ 
      success: true, 
      message: `Convite de calendário enviado para ${comp.email_participante}`,
      google_event_id: googleEventId
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});