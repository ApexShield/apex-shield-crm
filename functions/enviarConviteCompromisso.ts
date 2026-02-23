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

    // Fetch the compromisso
    const compromissos = await base44.entities.Compromisso.filter({ id: compromisso_id });
    const comp = compromissos[0];
    if (!comp) {
      return Response.json({ error: 'Compromisso não encontrado' }, { status: 404 });
    }

    if (!comp.email_participante) {
      return Response.json({ error: 'Compromisso não possui email de participante' }, { status: 400 });
    }

    const startDate = new Date(comp.data_inicio);
    const endDate = new Date(comp.data_fim || new Date(startDate.getTime() + 3600000));

    if (isNaN(startDate.getTime())) {
      return Response.json({ error: 'Data de início inválida' }, { status: 400 });
    }

    // Format dates for display (BRT)
    const optsBR = { timeZone: 'America/Sao_Paulo' };
    const dayStr = startDate.toLocaleDateString('pt-BR', { ...optsBR, weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    const timeStart = startDate.toLocaleTimeString('pt-BR', { ...optsBR, hour: '2-digit', minute: '2-digit' });
    const timeEnd = endDate.toLocaleTimeString('pt-BR', { ...optsBR, hour: '2-digit', minute: '2-digit' });

    // Generate ICS content
    const formatICSDate = (d) => {
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
    };

    const uid = `${comp.id}@apexshieldcrm.com`;
    const now = new Date();
    const organizerName = user.full_name || 'Apex Shield CRM';
    const organizerEmail = user.email;
    const location = comp.modalidade === 'online' 
      ? (comp.meeting_link || 'Online') 
      : (comp.endereco || 'A definir');

    const icsContent = [
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
      `DESCRIPTION:${(comp.descricao || '').replace(/\n/g, '\\n')}`,
      `LOCATION:${location}`,
      `ORGANIZER;CN=${organizerName}:mailto:${organizerEmail}`,
      `ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;CN=${comp.email_participante}:mailto:${comp.email_participante}`,
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      'BEGIN:VALARM',
      'TRIGGER:-PT1H',
      'ACTION:DISPLAY',
      'DESCRIPTION:Lembrete - 1 hora',
      'END:VALARM',
      'BEGIN:VALARM',
      'TRIGGER:-PT30M',
      'ACTION:DISPLAY',
      'DESCRIPTION:Lembrete - 30 minutos',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    // Build confirm/decline URLs
    const funcBaseUrl = req.headers.get('x-base44-function-url') || '';
    const confirmUrl = funcBaseUrl.replace('enviarConviteCompromisso', 'confirmarPresenca') + `?id=${comp.id}&action=confirmar`;
    const declineUrl = funcBaseUrl.replace('enviarConviteCompromisso', 'confirmarPresenca') + `?id=${comp.id}&action=recusar`;

    const locationInfo = comp.modalidade === 'online'
      ? (comp.meeting_link 
        ? `<a href="${comp.meeting_link}" style="color:#4f46e5;font-weight:700;text-decoration:none;display:inline-flex;align-items:center;gap:6px;">💻 Acessar Reunião Online</a>` 
        : '💻 Online')
      : (comp.endereco ? `📍 ${comp.endereco}` : '📍 Presencial');

    const meetingButton = comp.meeting_link ? `
    <div style="text-align:center;margin:24px 0 8px;">
      <a href="${comp.meeting_link}" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#6366f1);color:white;padding:14px 48px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;box-shadow:0 4px 16px rgba(79,70,229,0.35);">
        Entrar na Reunião
      </a>
    </div>` : '';

    const emailBody = `
<div style="font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;max-width:640px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#1e1b4b,#312e81,#4338ca);padding:40px 32px;text-align:center;">
    <div style="width:72px;height:72px;background:rgba(255,255,255,0.15);backdrop-filter:blur(10px);border-radius:18px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;border:2px solid rgba(255,255,255,0.2);">
      <span style="font-size:32px;">📅</span>
    </div>
    <h1 style="color:white;margin:0;font-size:22px;font-weight:800;letter-spacing:-0.02em;">Convite para Compromisso</h1>
    <p style="color:rgba(199,210,254,0.9);margin:8px 0 0;font-size:14px;">Você recebeu um convite de <strong style="color:white;">${organizerName}</strong></p>
  </div>
  
  <div style="padding:32px;">
    <div style="background:linear-gradient(135deg,#f8fafc,#eef2ff);border-radius:16px;padding:28px;border:1px solid #e0e7ff;">
      <h2 style="color:#1e1b4b;margin:0 0 20px;font-size:20px;font-weight:800;letter-spacing:-0.01em;">${comp.titulo}</h2>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:10px 12px;color:#6366f1;font-size:18px;width:36px;vertical-align:top;">📅</td>
          <td style="padding:10px 0;">
            <div style="color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Quando</div>
            <div style="color:#1e293b;font-size:15px;font-weight:600;margin-top:2px;">${dayStr}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:10px 12px;color:#6366f1;font-size:18px;vertical-align:top;">🕐</td>
          <td style="padding:10px 0;">
            <div style="color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Horário</div>
            <div style="color:#1e293b;font-size:15px;font-weight:600;margin-top:2px;">${timeStart} - ${timeEnd} (Horário de Brasília)</div>
          </td>
        </tr>
        <tr>
          <td style="padding:10px 12px;color:#6366f1;font-size:18px;vertical-align:top;">📍</td>
          <td style="padding:10px 0;">
            <div style="color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Local</div>
            <div style="color:#1e293b;font-size:15px;font-weight:600;margin-top:2px;">${locationInfo}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:10px 12px;color:#6366f1;font-size:18px;vertical-align:top;">👤</td>
          <td style="padding:10px 0;">
            <div style="color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Organizador</div>
            <div style="color:#1e293b;font-size:15px;font-weight:600;margin-top:2px;">${organizerName}</div>
            <div style="color:#64748b;font-size:13px;">${organizerEmail}</div>
          </td>
        </tr>
        ${comp.descricao ? `<tr>
          <td style="padding:10px 12px;color:#6366f1;font-size:18px;vertical-align:top;">📝</td>
          <td style="padding:10px 0;">
            <div style="color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Descrição</div>
            <div style="color:#334155;font-size:14px;margin-top:2px;line-height:1.5;">${comp.descricao}</div>
          </td>
        </tr>` : ''}
      </table>
    </div>

    ${meetingButton}

    <div style="margin:28px 0 20px;">
      <p style="color:#64748b;font-size:13px;font-weight:600;text-align:center;margin-bottom:16px;">Responda ao convite:</p>
      <div style="text-align:center;">
        <a href="${confirmUrl}" style="display:inline-block;background:linear-gradient(135deg,#059669,#10b981);color:white;padding:12px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;margin:0 6px;box-shadow:0 3px 12px rgba(5,150,105,0.3);">
          ✓ Sim
        </a>
        <a href="${declineUrl}" style="display:inline-block;background:linear-gradient(135deg,#dc2626,#ef4444);color:white;padding:12px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;margin:0 6px;box-shadow:0 3px 12px rgba(220,38,38,0.3);">
          ✕ Não
        </a>
      </div>
    </div>

    <div style="background:#fef3c7;border-radius:10px;padding:14px 18px;margin-top:20px;border:1px solid #fde68a;">
      <p style="color:#92400e;font-size:12px;margin:0;text-align:center;">📎 Em anexo: arquivo <strong>invite.ics</strong> - abra para adicionar ao seu calendário</p>
    </div>
  </div>
  
  <div style="background:linear-gradient(135deg,#f8fafc,#eef2ff);padding:20px 32px;text-align:center;border-top:1px solid #e2e8f0;">
    <div style="display:inline-flex;align-items:center;gap:8px;">
      <div style="width:8px;height:8px;background:linear-gradient(135deg,#4f46e5,#6366f1);border-radius:50%;"></div>
      <span style="color:#64748b;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">APEX SHIELD CRM</span>
    </div>
  </div>
</div>`;

    const subject = `Convite: ${comp.titulo} - ${dayStr} ${timeStart} - ${timeEnd} (BRT)`;

    // Build multipart MIME with ICS attachment
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

    // Send via Gmail
    const accessToken = await base44.asServiceRole.connectors.getAccessToken("gmail");

    const gmailRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ raw: rawEncoded })
    });

    if (!gmailRes.ok) {
      const errText = await gmailRes.text();
      console.error('Gmail send error:', errText);
      return Response.json({ error: 'Falha ao enviar email', details: errText }, { status: 500 });
    }

    // Mark email as sent
    await base44.entities.Compromisso.update(comp.id, { email_enviado: true });

    return Response.json({ 
      success: true, 
      message: `Convite enviado para ${comp.email_participante} com arquivo .ics anexo`
    });
  } catch (error) {
    console.error('Error in enviarConviteCompromisso:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});