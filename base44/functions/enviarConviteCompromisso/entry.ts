import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ── Helpers ──

function formatICSDate(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

function buildICS(comp, startDate, endDate, organizerName, organizerEmail, participantEmail, location) {
  const uid = `${comp.id}-${Date.now()}@apexshieldcrm.com`;
  const lines = [
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
    `ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;RSVP=FALSE;CN=${organizerName}:mailto:${organizerEmail}`,
    `ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;CN=${participantEmail}:mailto:${participantEmail}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Lembrete',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ];
  return lines.join('\r\n');
}

function buildEmailHTML(comp, organizerName, organizerEmail, dayStr, timeStart, timeEnd, location) {
  const isOnline = comp.modalidade === 'online';
  const meetLink = comp.meeting_link || '';
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Convite: ${comp.titulo}</title></head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:24px 16px;"><tr><td align="center">
<table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e0e0e0;">
<tr><td style="background-color:#1a365d;padding:24px 32px;text-align:center;"><h1 style="color:#ffffff;font-size:18px;margin:0;">Convite para Compromisso</h1></td></tr>
<tr><td style="padding:32px;">
  <p style="color:#333;font-size:15px;margin:0 0 20px;">Olá, você foi convidado(a) para o seguinte compromisso:</p>
  <table width="100%" style="background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;margin-bottom:20px;">
    <tr><td style="padding:20px;">
      <h2 style="color:#1a365d;font-size:18px;margin:0 0 16px;">${comp.titulo}</h2>
      <p style="color:#334155;font-size:14px;margin:4px 0;">&#128197; <strong>${dayStr}</strong></p>
      <p style="color:#334155;font-size:14px;margin:4px 0;">&#128336; <strong>${timeStart} - ${timeEnd}</strong> (Horário de Brasília)</p>
      <p style="color:#334155;font-size:14px;margin:4px 0;">${isOnline ? '&#128187; Reunião Online' : '&#128205; ' + location}${meetLink ? '<br><a href="'+meetLink+'" style="color:#2563eb;">'+meetLink+'</a>' : ''}</p>
      <p style="color:#334155;font-size:14px;margin:4px 0;">&#128100; Organizador: <strong>${organizerName}</strong> (${organizerEmail})</p>
      ${comp.descricao ? '<div style="margin-top:16px;padding-top:12px;border-top:1px solid #e2e8f0;"><p style="color:#64748b;font-size:13px;margin:0;">'+comp.descricao+'</p></div>' : ''}
    </td></tr>
  </table>
  ${meetLink ? '<p style="text-align:center;"><a href="'+meetLink+'" style="display:inline-block;background-color:#2563eb;color:#fff;padding:12px 32px;border-radius:6px;font-weight:700;text-decoration:none;">Entrar na Reunião</a></p>' : ''}
</td></tr>
<tr><td style="background-color:#f8fafc;padding:16px 32px;text-align:center;border-top:1px solid #e2e8f0;">
  <p style="color:#94a3b8;font-size:11px;margin:0;">Enviado via Apex Shield CRM</p>
</td></tr></table></td></tr></table></body></html>`;
}

// Simple base64 without line breaks (for MIME content parts)
function b64(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

// URL-safe base64 for Gmail API raw field
function urlSafeB64(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function buildMIMEMessage(toEmail, fromName, fromEmail, subject, htmlBody, icsContent) {
  const boundary = `boundary_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const altBoundary = `alt_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const encodedSubject = `=?UTF-8?B?${b64(subject)}?=`;
  
  const parts = [
    `From: ${fromName} <${fromEmail}>`,
    `To: ${toEmail}`,
    `Subject: ${encodedSubject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: multipart/alternative; boundary="${altBoundary}"`,
    ``,
    `--${altBoundary}`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: base64`,
    ``,
    b64(htmlBody),
    ``,
    `--${altBoundary}`,
    `Content-Type: text/calendar; charset=UTF-8; method=REQUEST`,
    `Content-Transfer-Encoding: base64`,
    ``,
    b64(icsContent),
    ``,
    `--${altBoundary}--`,
    ``,
    `--${boundary}`,
    `Content-Type: application/ics; name="invite.ics"`,
    `Content-Disposition: attachment; filename="invite.ics"`,
    `Content-Transfer-Encoding: base64`,
    ``,
    b64(icsContent),
    ``,
    `--${boundary}--`
  ];
  
  return parts.join('\r\n');
}

// ── Get user's own Google token ──
async function getUserGoogleToken(base44, userEmail) {
  for (const entityName of ['UserGoogleCalendarAuth', 'UserGoogleAuth']) {
    const auths = await base44.asServiceRole.entities[entityName].filter({ user_email: userEmail });
    if (auths.length === 0) continue;
    const auth = auths[0];
    const tokenExpiry = new Date(auth.token_expiry);
    if (tokenExpiry > new Date()) {
      return { access_token: auth.access_token, google_email: auth.google_email };
    }
    if (auth.refresh_token) {
      const CLIENT_ID = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID");
      const CLIENT_SECRET = Deno.env.get("google_oauth_client_secret");
      const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, refresh_token: auth.refresh_token, grant_type: 'refresh_token' })
      });
      if (refreshRes.ok) {
        const newTokens = await refreshRes.json();
        await base44.asServiceRole.entities[entityName].update(auth.id, {
          access_token: newTokens.access_token,
          token_expiry: new Date(Date.now() + (newTokens.expires_in * 1000)).toISOString()
        });
        return { access_token: newTokens.access_token, google_email: auth.google_email };
      }
    }
  }
  return null;
}

// ── Helper: Create Google Calendar event via API ──
async function createCalendarEvent(accessToken, comp, startDate, endDate, organizerEmail, participantEmail, location) {
  const calEvent = {
    summary: comp.titulo,
    description: comp.descricao || 'Compromisso agendado via Apex Shield CRM',
    location: location,
    start: { dateTime: comp.data_inicio, timeZone: 'America/Sao_Paulo' },
    end: { dateTime: (comp.data_fim || new Date(startDate.getTime() + 3600000).toISOString()), timeZone: 'America/Sao_Paulo' },
    attendees: [
      { email: organizerEmail },
      { email: participantEmail }
    ],
    guestsCanModify: false,
    reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 60 }, { method: 'popup', minutes: 30 }] }
  };

  let calUrl = 'https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all';
  if (comp.modalidade === 'online' && !comp.meeting_link) {
    calEvent.conferenceData = { createRequest: { requestId: `meet-${comp.id}-${Date.now()}`, conferenceSolutionKey: { type: 'hangoutsMeet' } } };
    calUrl += '&conferenceDataVersion=1';
  } else if (comp.meeting_link) {
    calEvent.description += `\n\nLink da reunião: ${comp.meeting_link}`;
  }

  const calRes = await fetch(calUrl, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(calEvent)
  });

  if (!calRes.ok) {
    const errText = await calRes.text();
    throw new Error(`Calendar API ${calRes.status}: ${errText}`);
  }

  return await calRes.json();
}

// ── Helper: Send MIME email via Gmail API ──
async function sendGmailMIME(accessToken, toEmail, fromName, fromEmail, subject, htmlBody, icsContent) {
  const mime = buildMIMEMessage(toEmail, fromName, fromEmail, subject, htmlBody, icsContent);
  const raw = urlSafeB64(mime);
  
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gmail API ${res.status}: ${errText}`);
  }
  return await res.json();
}

// ── Main handler ──

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { compromisso_id } = await req.json();
    if (!compromisso_id) return Response.json({ error: 'compromisso_id é obrigatório' }, { status: 400 });

    const compromissos = await base44.entities.Compromisso.filter({ id: compromisso_id });
    const comp = compromissos[0];
    if (!comp) return Response.json({ error: 'Compromisso não encontrado' }, { status: 404 });
    if (!comp.email_participante) return Response.json({ error: 'Compromisso não possui email de participante' }, { status: 400 });

    if (comp.modalidade === 'online' && !comp.meeting_link && user.link_reuniao_padrao) {
      comp.meeting_link = user.link_reuniao_padrao;
      await base44.entities.Compromisso.update(comp.id, { meeting_link: user.link_reuniao_padrao });
    }

    const startDate = new Date(comp.data_inicio);
    const endDate = new Date(comp.data_fim || new Date(startDate.getTime() + 3600000));
    if (isNaN(startDate.getTime())) return Response.json({ error: 'Data de início inválida' }, { status: 400 });

    const organizerName = user.full_name || 'Corretor';
    const organizerEmail = user.email;
    const participantEmail = comp.email_participante;
    const location = comp.modalidade === 'online' ? (comp.meeting_link || 'Online') : (comp.endereco || 'A definir');

    const optsBR = { timeZone: 'America/Sao_Paulo' };
    const dayStr = startDate.toLocaleDateString('pt-BR', { ...optsBR, weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    const timeStart = startDate.toLocaleTimeString('pt-BR', { ...optsBR, hour: '2-digit', minute: '2-digit' });
    const timeEnd = endDate.toLocaleTimeString('pt-BR', { ...optsBR, hour: '2-digit', minute: '2-digit' });
    const subject = `Convite: ${comp.titulo} - ${dayStr}`;

    // ══════════════════════════════════════════════════════════════════
    // STRATEGY 1: Google Calendar API (best — creates event in agenda directly)
    // Try user's own token first, then shared connector
    // ══════════════════════════════════════════════════════════════════
    
    const calendarTokens = [];
    
    // Try user's own Google token
    const userAuth = await getUserGoogleToken(base44, user.email);
    if (userAuth) {
      calendarTokens.push({ token: userAuth.access_token, source: 'user', email: userAuth.google_email });
    }
    
    // Always have shared connector as backup for Calendar
    try {
      const { accessToken: sharedCalToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
      calendarTokens.push({ token: sharedCalToken, source: 'shared_calendar', email: 'shared' });
    } catch (e) {
      console.log('Shared Google Calendar connector not available:', e.message);
    }

    for (const { token, source, email } of calendarTokens) {
      try {
        console.log(`Tentando criar evento via Calendar API (${source}: ${email})`);
        const calData = await createCalendarEvent(token, comp, startDate, endDate, organizerEmail, participantEmail, location);
        
        const newMeetLink = calData.hangoutLink || calData.conferenceData?.entryPoints?.find(e => e.entryPointType === 'video')?.uri;
        const updateData = { email_enviado: true, google_event_id: calData.id };
        if (newMeetLink && !comp.meeting_link) updateData.meeting_link = newMeetLink;
        await base44.entities.Compromisso.update(comp.id, updateData);

        console.log(`SUCCESS: Calendar event created (${source}). ID: ${calData.id}. Attendees: ${organizerEmail}, ${participantEmail}`);
        return Response.json({
          success: true,
          method: 'google_calendar',
          source: source,
          message: `Evento criado na agenda com convite para ${organizerEmail} e ${participantEmail}`,
          google_event_id: calData.id,
          meeting_link: newMeetLink || comp.meeting_link
        });
      } catch (err) {
        console.error(`Calendar API failed (${source}):`, err.message);
      }
    }

    // ══════════════════════════════════════════════════════════════════
    // STRATEGY 2: Gmail MIME with .ics (fallback — sends calendar invite via email)
    // Try user's Gmail, then shared Gmail connector
    // ══════════════════════════════════════════════════════════════════
    
    console.log('Calendar API failed for all sources. Falling back to Gmail MIME with .ics');
    
    // Get shared Gmail token
    let sharedGmailToken = null;
    let sharedGmailEmail = null;
    try {
      const gmailConn = await base44.asServiceRole.connectors.getConnection('gmail');
      sharedGmailToken = gmailConn.accessToken;
      // Get the email of the shared Gmail account
      const profileRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
        headers: { 'Authorization': `Bearer ${sharedGmailToken}` }
      });
      if (profileRes.ok) {
        const profile = await profileRes.json();
        sharedGmailEmail = profile.emailAddress;
      }
    } catch (e) {
      console.log('Shared Gmail connector not available:', e.message);
    }

    // Build ICS and HTML
    const senderEmail = sharedGmailEmail || organizerEmail;
    const icsContent = buildICS(comp, startDate, endDate, organizerName, senderEmail, participantEmail, location);
    const emailHTML = buildEmailHTML(comp, organizerName, organizerEmail, dayStr, timeStart, timeEnd, location);

    // Gmail sources to try
    const gmailSources = [];
    if (userAuth) {
      gmailSources.push({ token: userAuth.access_token, email: userAuth.google_email, source: 'user_gmail' });
    }
    if (sharedGmailToken) {
      gmailSources.push({ token: sharedGmailToken, email: sharedGmailEmail || 'shared', source: 'shared_gmail' });
    }

    for (const { token, email: gmailEmail, source } of gmailSources) {
      try {
        console.log(`Tentando enviar MIME com .ics via ${source} (${gmailEmail})`);
        
        // Send to participant
        await sendGmailMIME(token, participantEmail, organizerName, gmailEmail, subject, emailHTML, icsContent);
        console.log(`Email com .ics enviado para participante: ${participantEmail}`);
        
        // Send to organizer (if different)
        if (organizerEmail.toLowerCase() !== participantEmail.toLowerCase()) {
          try {
            await sendGmailMIME(token, organizerEmail, organizerName, gmailEmail, subject, emailHTML, icsContent);
            console.log(`Email com .ics enviado para organizador: ${organizerEmail}`);
          } catch (copyErr) {
            console.error('Erro ao enviar .ics para organizador:', copyErr.message);
          }
        }

        await base44.entities.Compromisso.update(comp.id, { email_enviado: true });
        return Response.json({
          success: true,
          method: 'gmail_ics',
          source: source,
          message: `Convite com .ics enviado para ${participantEmail} e ${organizerEmail}`
        });
      } catch (err) {
        console.error(`Gmail MIME failed (${source}):`, err.message);
      }
    }

    // ══════════════════════════════════════════════════════════════════
    // STRATEGY 3: Platform SendEmail (last resort — no .ics attachment)
    // ══════════════════════════════════════════════════════════════════
    try {
      console.log('Fallback final: SendEmail da plataforma (sem .ics)');
      await base44.integrations.Core.SendEmail({
        to: participantEmail,
        subject: subject,
        body: emailHTML,
        from_name: organizerName
      });
      if (organizerEmail.toLowerCase() !== participantEmail.toLowerCase()) {
        await base44.integrations.Core.SendEmail({
          to: organizerEmail,
          subject: subject,
          body: emailHTML,
          from_name: organizerName
        });
      }
      await base44.entities.Compromisso.update(comp.id, { email_enviado: true });
      return Response.json({ success: true, method: 'platform_email', message: `Convite enviado (sem .ics) para ${participantEmail}` });
    } catch (finalErr) {
      console.error('All methods failed:', finalErr.message);
    }

    return Response.json({ success: false, error: 'Não foi possível enviar o convite.' }, { status: 500 });

  } catch (error) {
    console.error('Fatal error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});