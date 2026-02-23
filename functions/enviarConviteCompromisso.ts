import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69587402a43b69a04695a178/4163a1b7d_Gemini_Generated_Image_qu3wkyqu3wkyqu3w-removebg.png';

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

    // Auto-fill meeting link from user default if online and not set
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
    const weekdayShort = startDate.toLocaleDateString('pt-BR', { ...optsBR, weekday: 'short' }).toUpperCase();
    const dayNum = startDate.toLocaleDateString('pt-BR', { ...optsBR, day: '2-digit' });
    const monthYear = startDate.toLocaleDateString('pt-BR', { ...optsBR, month: 'short', year: 'numeric' });

    // ICS
    const formatICSDate = (d) => {
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
    };

    const uid = `${comp.id}@apexshieldcrm.com`;
    const now = new Date();
    const organizerName = user.full_name || 'Apex Shield CRM';
    const organizerEmail = user.email;
    const location = comp.modalidade === 'online' ? (comp.meeting_link || 'Online') : (comp.endereco || 'A definir');

    const icsContent = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Apex Shield CRM//PT', 'CALSCALE:GREGORIAN', 'METHOD:REQUEST',
      'BEGIN:VEVENT', `UID:${uid}`, `DTSTAMP:${formatICSDate(now)}`, `DTSTART:${formatICSDate(startDate)}`, `DTEND:${formatICSDate(endDate)}`,
      `SUMMARY:${comp.titulo}`, `DESCRIPTION:${(comp.descricao || '').replace(/\n/g, '\\n')}`, `LOCATION:${location}`,
      `ORGANIZER;CN=${organizerName}:mailto:${organizerEmail}`,
      `ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;CN=${comp.email_participante}:mailto:${comp.email_participante}`,
      'STATUS:CONFIRMED', 'SEQUENCE:0',
      'BEGIN:VALARM', 'TRIGGER:-PT1H', 'ACTION:DISPLAY', 'DESCRIPTION:Lembrete', 'END:VALARM',
      'BEGIN:VALARM', 'TRIGGER:-PT30M', 'ACTION:DISPLAY', 'DESCRIPTION:Lembrete', 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');

    const funcBaseUrl = req.headers.get('x-base44-function-url') || '';
    const confirmUrl = funcBaseUrl.replace('enviarConviteCompromisso', 'confirmarPresenca') + `?id=${comp.id}&action=confirmar`;
    const declineUrl = funcBaseUrl.replace('enviarConviteCompromisso', 'confirmarPresenca') + `?id=${comp.id}&action=recusar`;

    const isOnline = comp.modalidade === 'online';
    const meetLink = comp.meeting_link || '';

    // MetLife colors: blue #0077c8, green #00af3f, dark blue #00205b
    const emailBody = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#00205b;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#00205b;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.4);">

<!-- HEADER -->
<tr><td style="background:linear-gradient(135deg,#00205b 0%,#003d8f 50%,#0077c8 100%);padding:36px 32px 28px;text-align:center;">
  <img src="${LOGO_URL}" alt="Apex Shield" style="width:80px;height:auto;margin-bottom:12px;" />
  <div style="color:rgba(255,255,255,0.6);font-size:10px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;">APEX SHIELD CRM</div>
</td></tr>

<!-- DATE STRIP -->
<tr><td style="background:#0077c8;padding:24px 32px;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="text-align:center;">
        <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
          <tr>
            <td style="background:rgba(255,255,255,0.15);border-radius:14px;padding:16px 24px;text-align:center;border:1px solid rgba(255,255,255,0.2);">
              <div style="color:rgba(255,255,255,0.7);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;">${weekdayShort}</div>
              <div style="color:white;font-size:38px;font-weight:900;line-height:1.1;margin:2px 0;">${dayNum}</div>
              <div style="color:rgba(255,255,255,0.7);font-size:11px;font-weight:600;">${monthYear}</div>
            </td>
            <td style="padding:0 20px;">
              <div style="width:32px;height:2px;background:rgba(255,255,255,0.3);"></div>
            </td>
            <td style="text-align:left;">
              <div style="color:white;font-size:26px;font-weight:800;line-height:1.2;">${timeStart}</div>
              <div style="color:rgba(255,255,255,0.6);font-size:13px;font-weight:500;margin-top:2px;">até ${timeEnd}</div>
              <div style="color:#00af3f;font-size:11px;font-weight:700;margin-top:4px;">Horário de Brasília</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</td></tr>

<!-- BODY -->
<tr><td style="background:#00205b;padding:32px;">
  <!-- Event Title -->
  <div style="margin-bottom:24px;">
    <div style="color:#0077c8;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;margin-bottom:6px;">📋 COMPROMISSO</div>
    <div style="color:#ffffff;font-size:20px;font-weight:800;line-height:1.3;">${comp.titulo}</div>
  </div>

  <!-- Info Cards -->
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
    <!-- Organizer -->
    <tr><td style="padding:12px 16px;background:rgba(0,119,200,0.15);border-radius:12px;border:1px solid rgba(0,119,200,0.3);">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="width:40px;vertical-align:top;">
            <div style="width:36px;height:36px;background:linear-gradient(135deg,#0077c8,#003d8f);border-radius:10px;text-align:center;line-height:36px;font-size:16px;">👤</div>
          </td>
          <td style="padding-left:12px;">
            <div style="color:#0077c8;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">Organizador</div>
            <div style="color:#ffffff;font-size:14px;font-weight:700;margin-top:2px;">${organizerName}</div>
            <div style="color:rgba(255,255,255,0.5);font-size:12px;">${organizerEmail}</div>
          </td>
        </tr>
      </table>
    </td></tr>
    <tr><td style="height:8px;"></td></tr>
    <!-- Location -->
    <tr><td style="padding:12px 16px;background:${isOnline ? 'rgba(0,119,200,0.15)' : 'rgba(0,175,63,0.15)'};border-radius:12px;border:1px solid ${isOnline ? 'rgba(0,119,200,0.3)' : 'rgba(0,175,63,0.3)'};">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="width:40px;vertical-align:top;">
            <div style="width:36px;height:36px;background:${isOnline ? 'linear-gradient(135deg,#0077c8,#003d8f)' : 'linear-gradient(135deg,#00af3f,#008a32)'};border-radius:10px;text-align:center;line-height:36px;font-size:16px;">${isOnline ? '💻' : '📍'}</div>
          </td>
          <td style="padding-left:12px;">
            <div style="color:${isOnline ? '#0077c8' : '#00af3f'};font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">${isOnline ? 'Reunião Online' : 'Local'}</div>
            <div style="color:#ffffff;font-size:14px;font-weight:700;margin-top:2px;">${isOnline ? (meetLink ? 'Sala de reunião virtual' : 'Online') : (comp.endereco || 'Presencial')}</div>
            ${meetLink ? `<div style="margin-top:4px;"><a href="${meetLink}" style="color:#0077c8;font-size:12px;font-weight:600;text-decoration:none;">🔗 ${meetLink.length > 40 ? meetLink.substring(0, 40) + '...' : meetLink}</a></div>` : ''}
          </td>
        </tr>
      </table>
    </td></tr>
    ${comp.descricao ? `
    <tr><td style="height:8px;"></td></tr>
    <tr><td style="padding:12px 16px;background:rgba(0,175,63,0.1);border-radius:12px;border:1px solid rgba(0,175,63,0.25);">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="width:40px;vertical-align:top;">
            <div style="width:36px;height:36px;background:linear-gradient(135deg,#00af3f,#008a32);border-radius:10px;text-align:center;line-height:36px;font-size:16px;">📝</div>
          </td>
          <td style="padding-left:12px;">
            <div style="color:#00af3f;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">Observações</div>
            <div style="color:rgba(255,255,255,0.8);font-size:13px;margin-top:4px;line-height:1.5;">${comp.descricao}</div>
          </td>
        </tr>
      </table>
    </td></tr>` : ''}
  </table>

  ${meetLink ? `
  <!-- Meeting Button -->
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
    <tr><td align="center">
      <table cellpadding="0" cellspacing="0" role="presentation"><tr><td align="center" style="background:#0077c8;border-radius:12px;box-shadow:0 6px 20px rgba(0,119,200,0.4);">
        <a href="${meetLink}" target="_blank" style="display:inline-block;padding:14px 48px;color:#ffffff;font-weight:800;font-size:15px;text-decoration:none;font-family:'Segoe UI',Roboto,Arial,sans-serif;">&#128187; Entrar na Reuni&atilde;o</a>
      </td></tr></table>
    </td></tr>
  </table>` : ''}

  <!-- Divider -->
  <div style="height:1px;background:linear-gradient(to right,transparent,rgba(0,119,200,0.3),transparent);margin:4px 0 24px;"></div>

  <!-- RSVP -->
  <div style="text-align:center;margin-bottom:24px;">
    <div style="color:#ffffff;font-size:16px;font-weight:800;margin-bottom:6px;">Confirme sua presença</div>
    <div style="color:rgba(255,255,255,0.5);font-size:12px;margin-bottom:18px;">Clique em uma das opções abaixo</div>
    <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
      <tr>
        <td style="padding:0 8px;">
          <table cellpadding="0" cellspacing="0" role="presentation"><tr><td align="center" style="background:#00af3f;border-radius:12px;box-shadow:0 6px 20px rgba(0,175,63,0.4);">
            <a href="${confirmUrl}" target="_blank" style="display:inline-block;padding:14px 36px;color:#ffffff;font-weight:800;font-size:14px;text-decoration:none;font-family:'Segoe UI',Roboto,Arial,sans-serif;">&#10003; Aceitar</a>
          </td></tr></table>
        </td>
        <td style="padding:0 8px;">
          <table cellpadding="0" cellspacing="0" role="presentation"><tr><td align="center" style="background:#dc2626;border-radius:12px;box-shadow:0 6px 20px rgba(220,38,38,0.4);">
            <a href="${declineUrl}" target="_blank" style="display:inline-block;padding:14px 36px;color:#ffffff;font-weight:800;font-size:14px;text-decoration:none;font-family:'Segoe UI',Roboto,Arial,sans-serif;">&#10005; Recusar</a>
          </td></tr></table>
        </td>
      </tr>
    </table>
  </div>

  <!-- ICS notice -->
  <div style="background:rgba(0,175,63,0.1);border-radius:10px;padding:14px 18px;border:1px solid rgba(0,175,63,0.25);text-align:center;">
    <div style="color:#00af3f;font-size:12px;font-weight:600;">📎 Arquivo <strong>invite.ics</strong> em anexo</div>
    <div style="color:rgba(255,255,255,0.4);font-size:11px;margin-top:2px;">Abra para adicionar ao seu calendário</div>
  </div>
</td></tr>

<!-- FOOTER -->
<tr><td style="background:#001a4d;padding:20px 32px;text-align:center;border-top:1px solid rgba(0,119,200,0.2);">
  <img src="${LOGO_URL}" alt="Apex Shield" style="width:32px;height:auto;margin-bottom:6px;" />
  <div style="color:rgba(255,255,255,0.4);font-size:10px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;">APEX SHIELD CRM</div>
  <div style="color:rgba(255,255,255,0.2);font-size:9px;margin-top:4px;">Proteção inteligente para o seu futuro</div>
</td></tr>

</table>
</td></tr>
</table>
</body></html>`;

    const subject = `Convite: ${comp.titulo} - ${dayStr} ${timeStart} - ${timeEnd} (BRT)`;

    const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    const icsBase64 = btoa(unescape(encodeURIComponent(icsContent)));

    const recipients = [comp.email_participante];
    if (organizerEmail && organizerEmail !== comp.email_participante) {
      recipients.push(organizerEmail);
    }

    const mimeMessage = [
      `To: ${recipients.join(', ')}`,
      `From: ${organizerEmail}`,
      `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      ``,
      `--${boundary}`,
      `Content-Type: multipart/alternative; boundary="${boundary}_alt"`,
      ``,
      `--${boundary}_alt`,
      `Content-Type: text/html; charset=UTF-8`,
      `Content-Transfer-Encoding: base64`,
      ``,
      btoa(unescape(encodeURIComponent(emailBody))),
      ``,
      `--${boundary}_alt`,
      `Content-Type: text/calendar; charset=UTF-8; method=REQUEST`,
      `Content-Transfer-Encoding: base64`,
      ``,
      icsBase64,
      ``,
      `--${boundary}_alt--`,
      ``,
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

    // Tentar usar token individual do usuário para Gmail, senão usa app connector
    let gmailToken = null;
    const userAuth = await getUserGoogleToken(base44, user.email);
    if (userAuth) {
      gmailToken = userAuth.access_token;
      console.log('Usando token Gmail do usuário:', userAuth.google_email);
    } else {
      gmailToken = await base44.asServiceRole.connectors.getAccessToken("gmail");
      console.log('Usando token Gmail do app connector (fallback)');
    }

    const gmailRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${gmailToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw: rawEncoded })
    });

    if (!gmailRes.ok) {
      const errText = await gmailRes.text();
      console.error('Gmail send error:', errText);
      // Se falhou com token do usuário, tentar app connector como fallback
      if (userAuth) {
        console.log('Tentando fallback com app connector Gmail...');
        const fallbackToken = await base44.asServiceRole.connectors.getAccessToken("gmail");
        const fallbackRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${fallbackToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ raw: rawEncoded })
        });
        if (!fallbackRes.ok) {
          const fallbackErr = await fallbackRes.text();
          console.error('Gmail fallback error:', fallbackErr);
          return Response.json({ error: 'Falha ao enviar email', details: fallbackErr }, { status: 500 });
        }
      } else {
        return Response.json({ error: 'Falha ao enviar email', details: errText }, { status: 500 });
      }
    }

    await base44.entities.Compromisso.update(comp.id, { email_enviado: true });

    // Criar evento no Google Calendar do ORGANIZADOR (usando token individual do usuário)
    let googleEventId = null;
    try {
      let calendarToken = null;
      if (userAuth) {
        calendarToken = userAuth.access_token;
        console.log('Usando token Calendar do usuário:', userAuth.google_email);
      } else {
        calendarToken = await base44.asServiceRole.connectors.getAccessToken("googlecalendar");
        console.log('Usando token Calendar do app connector (fallback)');
      }
      
      const calEvent = {
        summary: comp.titulo,
        description: comp.descricao || '',
        location: comp.modalidade === 'online' ? (comp.meeting_link || 'Online') : (comp.endereco || ''),
        start: { dateTime: comp.data_inicio, timeZone: 'America/Sao_Paulo' },
        end: { dateTime: (comp.data_fim || new Date(new Date(comp.data_inicio).getTime() + 3600000).toISOString()), timeZone: 'America/Sao_Paulo' },
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
          'Authorization': `Bearer ${calendarToken}`,
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
        console.error('Erro ao criar evento no Google Calendar:', calErr);
      }
    } catch (calError) {
      console.error('Erro ao adicionar ao Google Calendar:', calError.message);
    }

    return Response.json({ 
      success: true, 
      message: `Convite enviado para ${comp.email_participante}`,
      google_event_id: googleEventId
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});