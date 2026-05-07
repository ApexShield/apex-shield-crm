import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ── Helpers ──

function formatICSDate(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

function buildICS(comp, startDate, endDate, organizerName, organizerEmail, location) {
  const uid = `${comp.id}@apexshieldcrm.com`;
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Apex Shield CRM//PT',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatICSDate(new Date())}`,
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
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

function buildEmailHTML(comp, organizerName, organizerEmail, dayStr, timeStart, timeEnd, location) {
  const isOnline = comp.modalidade === 'online';
  const meetLink = comp.meeting_link || '';
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Convite: ${comp.titulo}</title></head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:24px 16px;">
<tr><td align="center">
<table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e0e0e0;">
<tr><td style="background-color:#1a365d;padding:24px 32px;text-align:center;">
  <h1 style="color:#ffffff;font-size:18px;margin:0;font-weight:700;">Convite para Compromisso</h1>
</td></tr>
<tr><td style="padding:32px;">
  <p style="color:#333;font-size:15px;line-height:1.5;margin:0 0 20px;">
    Olá, você foi convidado(a) para o seguinte compromisso:
  </p>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;margin-bottom:20px;">
    <tr><td style="padding:20px;">
      <h2 style="color:#1a365d;font-size:18px;margin:0 0 16px;font-weight:700;">${comp.titulo}</h2>
      <p style="color:#334155;font-size:14px;margin:4px 0;">&#128197; <strong>${dayStr}</strong></p>
      <p style="color:#334155;font-size:14px;margin:4px 0;">&#128336; <strong>${timeStart} - ${timeEnd}</strong> (Horário de Brasília)</p>
      <p style="color:#334155;font-size:14px;margin:4px 0;">${isOnline ? '&#128187; Reunião Online' : '&#128205; ' + location}${meetLink ? '<br><a href="' + meetLink + '" style="color:#2563eb;font-size:13px;">' + meetLink + '</a>' : ''}</p>
      <p style="color:#334155;font-size:14px;margin:4px 0;">&#128100; Organizador: <strong>${organizerName}</strong><br><span style="color:#64748b;font-size:13px;">${organizerEmail}</span></p>
      ${comp.descricao ? '<div style="margin-top:16px;padding-top:12px;border-top:1px solid #e2e8f0;"><p style="color:#64748b;font-size:13px;margin:0;">' + comp.descricao + '</p></div>' : ''}
    </td></tr>
  </table>
  ${meetLink ? '<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;"><tr><td align="center"><a href="' + meetLink + '" target="_blank" style="display:inline-block;background-color:#2563eb;color:#ffffff;padding:12px 32px;border-radius:6px;font-weight:700;font-size:14px;text-decoration:none;">Entrar na Reunião</a></td></tr></table>' : ''}
  <div style="background:#eff6ff;border-radius:6px;padding:16px;border:1px solid #bfdbfe;text-align:center;">
    <p style="color:#1e40af;font-size:13px;margin:0;font-weight:600;">
      Este email contém um convite de calendário em anexo.
    </p>
    <p style="color:#3b82f6;font-size:12px;margin:4px 0 0;">
      Aceite ou recuse diretamente pelo seu aplicativo de email ou calendário.
    </p>
  </div>
</td></tr>
<tr><td style="background-color:#f8fafc;padding:16px 32px;text-align:center;border-top:1px solid #e2e8f0;">
  <p style="color:#94a3b8;font-size:11px;margin:0;">Enviado via Apex Shield CRM</p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

function buildPlainText(comp, organizerName, organizerEmail, dayStr, timeStart, timeEnd, location) {
  let text = `Convite para Compromisso\n\n`;
  text += `Você foi convidado(a) para:\n\n`;
  text += `${comp.titulo}\n`;
  text += `Data: ${dayStr}\n`;
  text += `Horário: ${timeStart} - ${timeEnd} (Horário de Brasília)\n`;
  text += `Local: ${location}\n`;
  if (comp.meeting_link) text += `Link: ${comp.meeting_link}\n`;
  text += `Organizador: ${organizerName} (${organizerEmail})\n`;
  if (comp.descricao) text += `\nObs: ${comp.descricao}\n`;
  text += `\nAceite ou recuse pelo seu app de calendário.\n---\nApex Shield CRM`;
  return text;
}

// ── RFC 2045 base64 (76-char line wrapping) ──
function base64Encode(str) {
  // Encode UTF-8 string to base64
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  const b64 = btoa(binary);
  // Wrap at 76 chars per RFC 2045
  return b64.replace(/(.{76})/g, '$1\r\n');
}

// ── Build raw MIME with text/calendar part (triggers native Accept/Decline) ──
function buildMIME(comp, icsContent, emailHTML, plainText, organizerName, organizerEmail, subject) {
  const boundary = `----=_Part_${Date.now()}_main`;
  const altBoundary = `----=_Part_${Date.now()}_alt`;

  // RFC 2047 encode subject for UTF-8
  const encodedSubject = `=?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;

  const parts = [
    `From: ${organizerName} <${organizerEmail}>`,
    `To: ${comp.email_participante}`,
    `Subject: ${encodedSubject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: multipart/alternative; boundary="${altBoundary}"`,
    ``,
    // Plain text part
    `--${altBoundary}`,
    `Content-Type: text/plain; charset=UTF-8`,
    `Content-Transfer-Encoding: base64`,
    ``,
    base64Encode(plainText),
    ``,
    // HTML part
    `--${altBoundary}`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: base64`,
    ``,
    base64Encode(emailHTML),
    ``,
    // Calendar part inline (THIS makes email clients show Accept/Decline natively)
    `--${altBoundary}`,
    `Content-Type: text/calendar; charset=UTF-8; method=REQUEST`,
    `Content-Transfer-Encoding: base64`,
    ``,
    base64Encode(icsContent),
    ``,
    `--${altBoundary}--`,
    ``,
    // .ics file attachment (fallback for clients that don't support inline calendar)
    `--${boundary}`,
    `Content-Type: application/ics; name="invite.ics"`,
    `Content-Disposition: attachment; filename="invite.ics"`,
    `Content-Transfer-Encoding: base64`,
    ``,
    base64Encode(icsContent),
    ``,
    `--${boundary}--`
  ];

  return parts.join('\r\n');
}

// URL-safe base64 for Gmail API
function urlSafeBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// ── Main handler ──

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

    const organizerName = user.full_name || 'Apex Shield CRM';
    const organizerEmail = user.email;
    const location = comp.modalidade === 'online' ? (comp.meeting_link || 'Online') : (comp.endereco || 'A definir');

    const optsBR = { timeZone: 'America/Sao_Paulo' };
    const dayStr = startDate.toLocaleDateString('pt-BR', { ...optsBR, weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    const timeStart = startDate.toLocaleTimeString('pt-BR', { ...optsBR, hour: '2-digit', minute: '2-digit' });
    const timeEnd = endDate.toLocaleTimeString('pt-BR', { ...optsBR, hour: '2-digit', minute: '2-digit' });
    const subject = `Convite: ${comp.titulo} - ${dayStr}`;

    // ══════════════════════════════════════════════════════════════════
    // ATTEMPT 1: Google Calendar API via shared connector
    // Creates event with sendUpdates=all → Google sends native invite
    // with Accept / Maybe / Decline buttons in the client's email
    // ══════════════════════════════════════════════════════════════════
    try {
      const { accessToken: calToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
      console.log('Using shared Google Calendar connector to create event');

      const calEvent = {
        summary: comp.titulo,
        description: comp.descricao || 'Compromisso agendado via Apex Shield CRM',
        location: location,
        start: { dateTime: comp.data_inicio, timeZone: 'America/Sao_Paulo' },
        end: { dateTime: (comp.data_fim || new Date(startDate.getTime() + 3600000).toISOString()), timeZone: 'America/Sao_Paulo' },
        attendees: [
          { email: comp.email_participante, responseStatus: 'needsAction' }
        ],
        guestsCanModify: false,
        guestsCanSeeOtherGuests: false,
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 60 },
            { method: 'popup', minutes: 30 }
          ]
        }
      };

      // Add conference data if online without existing link
      let calUrl = 'https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all';
      if (comp.modalidade === 'online' && !comp.meeting_link) {
        calEvent.conferenceData = {
          createRequest: {
            requestId: `meet-${comp.id}-${Date.now()}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' }
          }
        };
        calUrl += '&conferenceDataVersion=1';
      } else if (comp.meeting_link) {
        calEvent.description += `\n\nLink da reunião: ${comp.meeting_link}`;
      }

      const calRes = await fetch(calUrl, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${calToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(calEvent)
      });

      if (calRes.ok) {
        const calData = await calRes.json();
        const newMeetLink = calData.hangoutLink || calData.conferenceData?.entryPoints?.find(e => e.entryPointType === 'video')?.uri;

        const updateData = { email_enviado: true, google_event_id: calData.id };
        if (newMeetLink && !comp.meeting_link) updateData.meeting_link = newMeetLink;
        await base44.entities.Compromisso.update(comp.id, updateData);

        console.log('SUCCESS: Calendar event created:', calData.id, '- Google will send native invite to', comp.email_participante);
        return Response.json({
          success: true,
          method: 'google_calendar',
          message: `Convite de calendário enviado para ${comp.email_participante} com opções de Aceitar/Recusar`,
          google_event_id: calData.id,
          meeting_link: newMeetLink || comp.meeting_link
        });
      }

      const calErr = await calRes.text();
      console.error('Google Calendar API error:', calRes.status, calErr);
    } catch (calConnErr) {
      console.error('Google Calendar connector error:', calConnErr.message);
    }

    // ══════════════════════════════════════════════════════════════════
    // ATTEMPT 2: Gmail API via shared connector with MIME + .ics
    // Sends email with text/calendar part → email clients show 
    // Accept/Decline buttons natively
    // ══════════════════════════════════════════════════════════════════
    try {
      const { accessToken: gmailToken } = await base44.asServiceRole.connectors.getConnection('gmail');
      console.log('Using shared Gmail connector to send MIME email with .ics');

      const icsContent = buildICS(comp, startDate, endDate, organizerName, organizerEmail, location);
      const emailHTML = buildEmailHTML(comp, organizerName, organizerEmail, dayStr, timeStart, timeEnd, location);
      const plainText = buildPlainText(comp, organizerName, organizerEmail, dayStr, timeStart, timeEnd, location);
      const mimeMessage = buildMIME(comp, icsContent, emailHTML, plainText, organizerName, organizerEmail, subject);

      const rawEncoded = urlSafeBase64(mimeMessage);

      const gmailRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${gmailToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw: rawEncoded })
      });

      if (gmailRes.ok) {
        await base44.entities.Compromisso.update(comp.id, { email_enviado: true });
        console.log('SUCCESS: Email sent via Gmail with .ics calendar invite to', comp.email_participante);
        return Response.json({
          success: true,
          method: 'gmail_ics',
          message: `Convite com calendário enviado para ${comp.email_participante} via email com opções de Aceitar/Recusar`,
          google_event_id: null
        });
      }

      const gmailErr = await gmailRes.text();
      console.error('Gmail API error:', gmailRes.status, gmailErr);
    } catch (gmailConnErr) {
      console.error('Gmail connector error:', gmailConnErr.message);
    }

    // ══════════════════════════════════════════════════════════════════
    // ATTEMPT 3: All methods failed
    // ══════════════════════════════════════════════════════════════════
    console.error('ALL methods failed to send invite to', comp.email_participante);
    return Response.json({
      success: false,
      error: 'Não foi possível enviar o convite. Verifique as conexões do Google Calendar e Gmail nas configurações.'
    }, { status: 500 });

  } catch (error) {
    console.error('Fatal error in enviarConviteCompromisso:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});