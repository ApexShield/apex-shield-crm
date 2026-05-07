import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

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

async function createGoogleCalendarEvent(accessToken, comp, startDate, endDate, organizerEmail, location) {
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

  // Add conference data if online meeting
  if (comp.modalidade === 'online') {
    if (comp.meeting_link) {
      // Use existing meeting link in description
      calEvent.description = `${calEvent.description}\n\nLink da reunião: ${comp.meeting_link}`;
    } else {
      // Request Google Meet creation
      calEvent.conferenceData = {
        createRequest: {
          requestId: `meet-${comp.id}-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' }
        }
      };
    }
  }

  // sendUpdates=all makes Google send a native calendar invite email to attendees
  // This email has native Accept/Maybe/Decline buttons that work in ALL email clients
  let url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all';
  if (!comp.meeting_link && comp.modalidade === 'online') {
    url += '&conferenceDataVersion=1';
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(calEvent)
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('Google Calendar API error:', errText);
    return { success: false, error: errText };
  }

  const eventData = await response.json();
  const meetingLink = eventData.hangoutLink || 
    eventData.conferenceData?.entryPoints?.find(e => e.entryPointType === 'video')?.uri;

  return { 
    success: true, 
    eventId: eventData.id, 
    htmlLink: eventData.htmlLink,
    meetingLink: meetingLink 
  };
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

    // Auto-fill meeting link from user default
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

    // ═══════════════════════════════════════════════════════════════
    // STRATEGY: Create a Google Calendar event with sendUpdates=all
    // Google itself sends a native invite email with Accept/Decline
    // This works perfectly in Gmail, Outlook, Apple Mail, etc.
    // ═══════════════════════════════════════════════════════════════

    // Attempt 1: Use user's own Google OAuth token
    const userAuth = await getUserGoogleToken(base44, user.email);
    
    if (userAuth) {
      console.log('Creating calendar event via user Google account:', userAuth.google_email);
      
      const result = await createGoogleCalendarEvent(
        userAuth.access_token, comp, startDate, endDate, organizerEmail, location
      );

      if (result.success) {
        const updateData = { 
          email_enviado: true, 
          google_event_id: result.eventId 
        };
        // Save meeting link if Google Meet was created
        if (result.meetingLink && !comp.meeting_link) {
          updateData.meeting_link = result.meetingLink;
        }
        await base44.entities.Compromisso.update(comp.id, updateData);

        console.log('Calendar event created successfully:', result.eventId);
        return Response.json({ 
          success: true, 
          message: `Convite de calendário enviado para ${comp.email_participante} com opções de Aceitar/Recusar`,
          google_event_id: result.eventId,
          meeting_link: result.meetingLink || comp.meeting_link
        });
      }

      console.error('Failed with user token, trying shared connector...');
    } else {
      console.log('User has no Google OAuth, trying shared connector...');
    }

    // Attempt 2: Use shared Google Calendar connector
    try {
      const { accessToken: sharedToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
      
      if (sharedToken) {
        console.log('Creating calendar event via shared Google Calendar connector');
        
        const result = await createGoogleCalendarEvent(
          sharedToken, comp, startDate, endDate, organizerEmail, location
        );

        if (result.success) {
          const updateData = { 
            email_enviado: true, 
            google_event_id: result.eventId 
          };
          if (result.meetingLink && !comp.meeting_link) {
            updateData.meeting_link = result.meetingLink;
          }
          await base44.entities.Compromisso.update(comp.id, updateData);

          console.log('Calendar event created via shared connector:', result.eventId);
          return Response.json({ 
            success: true, 
            message: `Convite de calendário enviado para ${comp.email_participante} com opções de Aceitar/Recusar`,
            google_event_id: result.eventId,
            meeting_link: result.meetingLink || comp.meeting_link
          });
        }

        console.error('Shared connector also failed');
      }
    } catch (connErr) {
      console.error('Shared connector error:', connErr.message);
    }

    // Attempt 3: If all Calendar approaches fail, send email but warn user
    console.log('All Google Calendar methods failed. Sending plain email as last resort.');
    
    const optsBR = { timeZone: 'America/Sao_Paulo' };
    const dayStr = startDate.toLocaleDateString('pt-BR', { ...optsBR, weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    const timeStart = startDate.toLocaleTimeString('pt-BR', { ...optsBR, hour: '2-digit', minute: '2-digit' });
    const timeEnd = endDate.toLocaleTimeString('pt-BR', { ...optsBR, hour: '2-digit', minute: '2-digit' });
    const meetLink = comp.meeting_link || '';
    const isOnline = comp.modalidade === 'online';

    const subject = `Convite: ${comp.titulo} - ${dayStr}`;
    const emailBody = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${subject}</title></head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:24px 16px;">
<tr><td align="center">
<table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e0e0e0;">
<tr><td style="background-color:#1a365d;padding:24px 32px;text-align:center;">
  <h1 style="color:#ffffff;font-size:18px;margin:0;font-weight:700;">Convite para Compromisso</h1>
</td></tr>
<tr><td style="padding:32px;">
  <p style="color:#333;font-size:15px;line-height:1.5;margin:0 0 20px;">Olá, você foi convidado(a) para o seguinte compromisso:</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;margin-bottom:20px;">
    <tr><td style="padding:20px;">
      <h2 style="color:#1a365d;font-size:18px;margin:0 0 16px;font-weight:700;">${comp.titulo}</h2>
      <p style="color:#334155;font-size:14px;margin:4px 0;">&#128197; <strong>${dayStr}</strong></p>
      <p style="color:#334155;font-size:14px;margin:4px 0;">&#128336; <strong>${timeStart} - ${timeEnd}</strong> (Horário de Brasília)</p>
      <p style="color:#334155;font-size:14px;margin:4px 0;">${isOnline ? '&#128187;' : '&#128205;'} ${isOnline ? 'Reunião Online' : location}${meetLink ? `<br><a href="${meetLink}" style="color:#2563eb;">${meetLink}</a>` : ''}</p>
      <p style="color:#334155;font-size:14px;margin:4px 0;">&#128100; Organizador: <strong>${organizerName}</strong> (${organizerEmail})</p>
      ${comp.descricao ? `<p style="color:#64748b;font-size:13px;margin:12px 0 0;border-top:1px solid #e2e8f0;padding-top:12px;">${comp.descricao}</p>` : ''}
    </td></tr>
  </table>
  ${meetLink ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;"><tr><td align="center"><a href="${meetLink}" target="_blank" style="display:inline-block;background-color:#2563eb;color:#ffffff;padding:12px 32px;border-radius:6px;font-weight:700;font-size:14px;text-decoration:none;">Entrar na Reunião</a></td></tr></table>` : ''}
  <div style="background:#fef3c7;border-radius:6px;padding:16px;border:1px solid #fbbf24;text-align:center;">
    <p style="color:#92400e;font-size:13px;margin:0;font-weight:600;">⚠️ Para aceitar ou recusar, peça ao organizador para conectar o Google Calendar no CRM.</p>
  </div>
</td></tr>
<tr><td style="background-color:#f8fafc;padding:16px 32px;text-align:center;border-top:1px solid #e2e8f0;">
  <p style="color:#94a3b8;font-size:11px;margin:0;">Enviado via Apex Shield CRM</p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;

    await base44.integrations.Core.SendEmail({
      from_name: organizerName,
      to: comp.email_participante,
      subject: subject,
      body: emailBody
    });

    await base44.entities.Compromisso.update(comp.id, { email_enviado: true });

    return Response.json({ 
      success: true, 
      message: `Email enviado para ${comp.email_participante}, porém sem opção de Aceitar/Recusar. Conecte seu Google Calendar para enviar convites nativos.`,
      google_event_id: null,
      warning: 'no_calendar_connection'
    });
  } catch (error) {
    console.error('Error in enviarConviteCompromisso:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});