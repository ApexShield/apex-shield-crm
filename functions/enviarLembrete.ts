import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  const user = await base44.auth.me();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
      status: 401, headers: { 'Content-Type': 'application/json' } 
    });
  }

  const now = new Date();
  console.log('enviarLembrete started at:', now.toISOString());

  // Fetch upcoming compromissos
  let allCompromissos = [];
  try {
    allCompromissos = await base44.asServiceRole.entities.Compromisso.list('-data_inicio', 200);
  } catch (e) {
    console.error('Error fetching compromissos:', e.message);
    return new Response(JSON.stringify({ error: 'Failed to fetch compromissos', detail: e.message }), { 
      status: 500, headers: { 'Content-Type': 'application/json' } 
    });
  }
  
  console.log('Total compromissos fetched:', allCompromissos.length);

  // Filter to only those needing reminders (20-70min from now)
  const candidatos = allCompromissos.filter(comp => {
    if (!comp.email_participante || !comp.data_inicio) return false;
    const startTime = new Date(comp.data_inicio);
    if (isNaN(startTime.getTime())) return false;
    const diffMin = (startTime.getTime() - now.getTime()) / 60000;
    return diffMin > 20 && diffMin <= 70;
  });

  console.log('Candidatos for reminders:', candidatos.length);

  if (candidatos.length === 0) {
    return new Response(JSON.stringify({ success: true, message: '0 lembrete(s) enviado(s)', details: [] }), { 
      status: 200, headers: { 'Content-Type': 'application/json' } 
    });
  }

  // Get Gmail connection once
  let accessToken;
  try {
    const conn = await base44.asServiceRole.connectors.getConnection("gmail");
    accessToken = conn.accessToken;
  } catch (e) {
    console.error('Error getting Gmail connection:', e.message);
    return new Response(JSON.stringify({ error: 'Gmail connection failed', detail: e.message }), { 
      status: 500, headers: { 'Content-Type': 'application/json' } 
    });
  }

  const emailsSent = [];
  const errors = [];

  for (const comp of candidatos) {
    const startTime = new Date(comp.data_inicio);
    const diffMin = (startTime.getTime() - now.getTime()) / 60000;

    let reminderType = null;
    if (diffMin > 55 && diffMin <= 65) {
      if (comp.lembrete_1h_enviado) continue;
      reminderType = '1h';
    } else if (diffMin > 25 && diffMin <= 35) {
      if (comp.lembrete_30min_enviado) continue;
      reminderType = '30min';
    } else {
      continue;
    }

    try {
      const endTime = comp.data_fim ? new Date(comp.data_fim) : new Date(startTime.getTime() + 3600000);
      const optsBR = { timeZone: 'America/Sao_Paulo' };
      const dayFull = startTime.toLocaleDateString('pt-BR', { ...optsBR, weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
      const timeStartStr = startTime.toLocaleTimeString('pt-BR', { ...optsBR, hour: '2-digit', minute: '2-digit' });
      const timeEndStr = endTime.toLocaleTimeString('pt-BR', { ...optsBR, hour: '2-digit', minute: '2-digit' });

      const tempoRestante = reminderType === '1h' ? '1 hora' : '30 minutos';
      const urgencyGradient = reminderType === '1h'
        ? 'linear-gradient(135deg,#f59e0b,#d97706)'
        : 'linear-gradient(135deg,#ef4444,#dc2626)';
      const urgencyIcon = reminderType === '1h' ? '⏰' : '🔔';

      const locationInfo = comp.modalidade === 'online'
        ? (comp.meeting_link ? `<a href="${comp.meeting_link}" style="color:#4f46e5;font-weight:700;text-decoration:none;">💻 Acessar Reunião Online</a>` : '💻 Online')
        : (comp.endereco ? `📍 ${comp.endereco}` : '📍 Presencial');

      const meetingButton = comp.meeting_link ? `
      <div style="text-align:center;margin:28px 0 12px;">
        <a href="${comp.meeting_link}" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#6366f1);color:white;padding:16px 52px;border-radius:14px;text-decoration:none;font-weight:700;font-size:16px;box-shadow:0 6px 20px rgba(79,70,229,0.35);">
          💻 Entrar na Reunião
        </a>
      </div>` : '';

      const emailBody = `<div style="font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;max-width:640px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.08);">
  <div style="background:${urgencyGradient};padding:40px 32px;text-align:center;">
    <div style="width:72px;height:72px;background:rgba(255,255,255,0.2);border-radius:18px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;border:2px solid rgba(255,255,255,0.25);">
      <span style="font-size:32px;">${urgencyIcon}</span>
    </div>
    <h1 style="color:white;margin:0;font-size:22px;font-weight:800;">Lembrete de Compromisso</h1>
    <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:15px;">Faltam <strong>${tempoRestante}</strong> para o seu compromisso</p>
  </div>
  <div style="padding:32px;">
    <div style="background:linear-gradient(135deg,#f8fafc,#fef3c7);border-radius:16px;padding:28px;border:1px solid #fde68a;">
      <h2 style="color:#1e1b4b;margin:0 0 20px;font-size:20px;font-weight:800;">${comp.titulo}</h2>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:10px 12px;font-size:18px;width:36px;vertical-align:top;">📅</td><td style="padding:10px 0;"><div style="color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;">Quando</div><div style="color:#1e293b;font-size:15px;font-weight:600;margin-top:2px;">${dayFull}</div></td></tr>
        <tr><td style="padding:10px 12px;font-size:18px;vertical-align:top;">🕐</td><td style="padding:10px 0;"><div style="color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;">Horário</div><div style="color:#1e293b;font-size:15px;font-weight:600;margin-top:2px;">${timeStartStr} - ${timeEndStr} (Horário de Brasília)</div></td></tr>
        <tr><td style="padding:10px 12px;font-size:18px;vertical-align:top;">📍</td><td style="padding:10px 0;"><div style="color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;">Local</div><div style="color:#1e293b;font-size:15px;font-weight:600;margin-top:2px;">${locationInfo}</div></td></tr>
        ${comp.descricao ? `<tr><td style="padding:10px 12px;font-size:18px;vertical-align:top;">📝</td><td style="padding:10px 0;"><div style="color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;">Descrição</div><div style="color:#334155;font-size:14px;margin-top:2px;">${comp.descricao}</div></td></tr>` : ''}
      </table>
    </div>
    ${meetingButton}
    <p style="color:#94a3b8;font-size:12px;text-align:center;margin-top:24px;">Este é um lembrete automático do APEX SHIELD CRM.</p>
  </div>
  <div style="background:linear-gradient(135deg,#f8fafc,#eef2ff);padding:20px 32px;text-align:center;border-top:1px solid #e2e8f0;">
    <span style="color:#64748b;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">APEX SHIELD CRM</span>
  </div>
</div>`;

      const assunto = reminderType === '1h'
        ? `Lembrete: ${comp.titulo} em 1 hora`
        : `Atencao: ${comp.titulo} em 30 minutos!`;

      // Build RFC 2822 MIME message
      const bodyBase64 = btoa(unescape(encodeURIComponent(emailBody)));

      const mimeMessage = [
        `To: ${comp.email_participante}`,
        `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(assunto)))}?=`,
        `MIME-Version: 1.0`,
        `Content-Type: text/html; charset=UTF-8`,
        `Content-Transfer-Encoding: base64`,
        ``,
        bodyBase64
      ].join('\r\n');

      // Encode the entire MIME message for Gmail API (web-safe base64)
      const rawBytes = new TextEncoder().encode(mimeMessage);
      let binaryStr = '';
      for (let i = 0; i < rawBytes.length; i++) {
        binaryStr += String.fromCharCode(rawBytes[i]);
      }
      const rawBase64 = btoa(binaryStr)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ raw: rawBase64 })
      });

      if (response.ok) {
        const updateData = reminderType === '1h'
          ? { lembrete_1h_enviado: true }
          : { lembrete_30min_enviado: true };
        await base44.asServiceRole.entities.Compromisso.update(comp.id, updateData);
        emailsSent.push({ id: comp.id, titulo: comp.titulo, tipo: reminderType, email: comp.email_participante });
        console.log(`Lembrete ${reminderType} enviado para ${comp.email_participante} - ${comp.titulo}`);
      } else {
        const errText = await response.text();
        console.error(`Failed to send reminder for ${comp.id}:`, errText);
        errors.push({ id: comp.id, error: errText });
      }
    } catch (emailErr) {
      console.error(`Error processing comp ${comp.id}:`, emailErr.message);
      errors.push({ id: comp.id, error: emailErr.message });
    }
  }

  console.log(`Done: ${emailsSent.length} sent, ${errors.length} errors`);
  
  return new Response(JSON.stringify({
    success: true,
    message: `${emailsSent.length} lembrete(s) enviado(s)`,
    details: emailsSent,
    errors: errors.length > 0 ? errors : undefined
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });
});