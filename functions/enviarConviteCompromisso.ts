import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

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

    // Also check if user has a default meeting link and comp is online without link
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
    const dayShort = startDate.toLocaleDateString('pt-BR', { ...optsBR, day: '2-digit', month: 'short' });
    const timeStart = startDate.toLocaleTimeString('pt-BR', { ...optsBR, hour: '2-digit', minute: '2-digit' });
    const timeEnd = endDate.toLocaleTimeString('pt-BR', { ...optsBR, hour: '2-digit', minute: '2-digit' });
    const weekdayShort = startDate.toLocaleDateString('pt-BR', { ...optsBR, weekday: 'short' }).toUpperCase();

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

    const emailBody = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0f0e2a;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0e2a;padding:32px 16px;">
<tr><td align="center">
<table width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.3);">

<!-- HEADER with gradient -->
<tr><td style="background:linear-gradient(135deg,#1a1640 0%,#2d2470 40%,#4338ca 100%);padding:0;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td style="padding:48px 40px 20px;text-align:center;">
      <!-- Logo -->
      <div style="width:56px;height:56px;background:rgba(255,255,255,0.15);border-radius:14px;display:inline-block;line-height:56px;font-size:24px;margin-bottom:16px;">🛡️</div>
      <div style="color:rgba(199,210,254,0.7);font-size:10px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:20px;">APEX SHIELD CRM</div>
    </td></tr>
    <!-- Date Card -->
    <tr><td style="padding:0 40px 40px;text-align:center;">
      <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
        <tr>
          <td style="background:rgba(255,255,255,0.12);border-radius:16px;padding:20px 28px;text-align:center;border:1px solid rgba(255,255,255,0.15);">
            <div style="color:rgba(199,210,254,0.8);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;">${weekdayShort}</div>
            <div style="color:white;font-size:42px;font-weight:900;line-height:1.1;margin:4px 0;">${startDate.toLocaleDateString('pt-BR', { ...optsBR, day: '2-digit' })}</div>
            <div style="color:rgba(199,210,254,0.8);font-size:12px;font-weight:600;">${startDate.toLocaleDateString('pt-BR', { ...optsBR, month: 'short', year: 'numeric' })}</div>
          </td>
          <td style="padding:0 20px;">
            <div style="width:40px;height:2px;background:rgba(255,255,255,0.2);"></div>
          </td>
          <td style="text-align:left;">
            <div style="color:white;font-size:28px;font-weight:800;line-height:1.2;">${timeStart}</div>
            <div style="color:rgba(199,210,254,0.6);font-size:13px;font-weight:500;margin-top:4px;">até ${timeEnd}</div>
            <div style="color:rgba(167,139,250,0.9);font-size:11px;font-weight:600;margin-top:4px;">Horário de Brasília</div>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</td></tr>

<!-- BODY -->
<tr><td style="padding:40px;">
  <!-- Event Title -->
  <div style="margin-bottom:28px;">
    <div style="color:#64748b;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;margin-bottom:8px;">📋 COMPROMISSO</div>
    <div style="color:#0f172a;font-size:22px;font-weight:800;line-height:1.3;">${comp.titulo}</div>
  </div>

  <!-- Info Cards -->
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
    <!-- Organizer -->
    <tr><td style="padding:14px 16px;background:#f8fafc;border-radius:12px;margin-bottom:8px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="width:40px;vertical-align:top;">
            <div style="width:36px;height:36px;background:linear-gradient(135deg,#4338ca,#6366f1);border-radius:10px;text-align:center;line-height:36px;font-size:16px;">👤</div>
          </td>
          <td style="padding-left:12px;">
            <div style="color:#94a3b8;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">Organizador</div>
            <div style="color:#1e293b;font-size:14px;font-weight:700;margin-top:2px;">${organizerName}</div>
            <div style="color:#6366f1;font-size:12px;font-weight:500;">${organizerEmail}</div>
          </td>
        </tr>
      </table>
    </td></tr>
    <tr><td style="height:8px;"></td></tr>
    <!-- Location/Meeting -->
    <tr><td style="padding:14px 16px;background:${isOnline ? '#eef2ff' : '#f0fdf4'};border-radius:12px;border:1px solid ${isOnline ? '#c7d2fe' : '#bbf7d0'};">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="width:40px;vertical-align:top;">
            <div style="width:36px;height:36px;background:${isOnline ? 'linear-gradient(135deg,#4338ca,#6366f1)' : 'linear-gradient(135deg,#059669,#10b981)'};border-radius:10px;text-align:center;line-height:36px;font-size:16px;">${isOnline ? '💻' : '📍'}</div>
          </td>
          <td style="padding-left:12px;">
            <div style="color:#94a3b8;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">${isOnline ? 'Reunião Online' : 'Local'}</div>
            <div style="color:#1e293b;font-size:14px;font-weight:700;margin-top:2px;">${isOnline ? (meetLink ? 'Sala de reunião virtual' : 'Online') : (comp.endereco || 'Presencial')}</div>
            ${meetLink ? `<div style="margin-top:4px;"><a href="${meetLink}" style="color:#4338ca;font-size:12px;font-weight:600;text-decoration:none;">🔗 ${meetLink.length > 45 ? meetLink.substring(0, 45) + '...' : meetLink}</a></div>` : ''}
          </td>
        </tr>
      </table>
    </td></tr>
    ${comp.descricao ? `
    <tr><td style="height:8px;"></td></tr>
    <tr><td style="padding:14px 16px;background:#fffbeb;border-radius:12px;border:1px solid #fde68a;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="width:40px;vertical-align:top;">
            <div style="width:36px;height:36px;background:linear-gradient(135deg,#d97706,#f59e0b);border-radius:10px;text-align:center;line-height:36px;font-size:16px;">📝</div>
          </td>
          <td style="padding-left:12px;">
            <div style="color:#94a3b8;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">Observações</div>
            <div style="color:#44403c;font-size:13px;margin-top:4px;line-height:1.5;">${comp.descricao}</div>
          </td>
        </tr>
      </table>
    </td></tr>` : ''}
  </table>

  ${meetLink ? `
  <!-- Meeting Button -->
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
    <tr><td align="center">
      <a href="${meetLink}" style="display:inline-block;background:linear-gradient(135deg,#4338ca,#6366f1);color:white;padding:16px 52px;border-radius:14px;text-decoration:none;font-weight:800;font-size:15px;box-shadow:0 8px 24px rgba(67,56,202,0.35);letter-spacing:0.02em;">
        💻 Entrar na Reunião
      </a>
    </td></tr>
  </table>` : ''}

  <!-- Divider -->
  <div style="height:1px;background:linear-gradient(to right,transparent,#e2e8f0,transparent);margin:4px 0 28px;"></div>

  <!-- RSVP Section -->
  <div style="text-align:center;margin-bottom:28px;">
    <div style="color:#0f172a;font-size:16px;font-weight:800;margin-bottom:6px;">Confirme sua presença</div>
    <div style="color:#94a3b8;font-size:12px;margin-bottom:20px;">Clique em uma das opções abaixo para responder</div>
    <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
      <tr>
        <td style="padding:0 6px;">
          <a href="${confirmUrl}" style="display:inline-block;background:linear-gradient(135deg,#059669,#10b981);color:white;padding:14px 40px;border-radius:12px;text-decoration:none;font-weight:800;font-size:14px;box-shadow:0 6px 20px rgba(5,150,105,0.35);">
            ✓ Aceitar
          </a>
        </td>
        <td style="padding:0 6px;">
          <a href="${declineUrl}" style="display:inline-block;background:linear-gradient(135deg,#dc2626,#ef4444);color:white;padding:14px 40px;border-radius:12px;text-decoration:none;font-weight:800;font-size:14px;box-shadow:0 6px 20px rgba(220,38,38,0.3);">
            ✕ Recusar
          </a>
        </td>
      </tr>
    </table>
  </div>

  <!-- ICS notice -->
  <div style="background:linear-gradient(135deg,#f0fdf4,#ecfdf5);border-radius:12px;padding:16px 20px;border:1px solid #bbf7d0;text-align:center;">
    <div style="font-size:14px;margin-bottom:4px;">📎</div>
    <div style="color:#166534;font-size:12px;font-weight:600;">Arquivo <strong>invite.ics</strong> em anexo</div>
    <div style="color:#4ade80;font-size:11px;margin-top:2px;">Abra para adicionar automaticamente ao seu calendário</div>
  </div>
</td></tr>

<!-- FOOTER -->
<tr><td style="background:linear-gradient(135deg,#0f0e2a,#1a1640);padding:28px 40px;text-align:center;">
  <div style="display:inline-block;">
    <div style="display:inline-block;width:8px;height:8px;background:linear-gradient(135deg,#6366f1,#a78bfa);border-radius:50%;vertical-align:middle;margin-right:8px;"></div>
    <span style="color:rgba(148,163,184,0.8);font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;vertical-align:middle;">APEX SHIELD CRM</span>
  </div>
  <div style="color:rgba(100,116,139,0.5);font-size:10px;margin-top:10px;">Proteção inteligente para o seu futuro</div>
</td></tr>

</table>
</td></tr>
</table>
</body></html>`;

    const subject = `Convite: ${comp.titulo} - ${dayStr} ${timeStart} - ${timeEnd} (BRT)`;

    const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    const icsBase64 = btoa(unescape(encodeURIComponent(icsContent)));

    const mimeMessage = [
      `To: ${comp.email_participante}`,
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

    const accessToken = await base44.asServiceRole.connectors.getAccessToken("gmail");

    const gmailRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw: rawEncoded })
    });

    if (!gmailRes.ok) {
      const errText = await gmailRes.text();
      console.error('Gmail send error:', errText);
      return Response.json({ error: 'Falha ao enviar email', details: errText }, { status: 500 });
    }

    await base44.entities.Compromisso.update(comp.id, { email_enviado: true });

    return Response.json({ success: true, message: `Convite enviado para ${comp.email_participante}` });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});