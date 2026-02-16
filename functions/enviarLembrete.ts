import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get all compromissos in the next 90 minutes that have email_participante
    const now = new Date();
    const in90min = new Date(now.getTime() + 90 * 60 * 1000);
    const in60min = new Date(now.getTime() + 60 * 60 * 1000);
    const in55min = new Date(now.getTime() + 55 * 60 * 1000);
    const in30min = new Date(now.getTime() + 30 * 60 * 1000);
    const in25min = new Date(now.getTime() + 25 * 60 * 1000);

    // List upcoming compromissos
    const allCompromissos = await base44.asServiceRole.entities.Compromisso.list('-data_inicio', 200);
    
    const emailsSent = [];

    for (const comp of allCompromissos) {
      if (!comp.email_participante || !comp.data_inicio) continue;
      
      const startTime = new Date(comp.data_inicio);
      if (isNaN(startTime.getTime())) continue;
      
      // Check if the event is coming up in ~60 min (between 55-65 min from now)
      const diffMs = startTime.getTime() - now.getTime();
      const diffMin = diffMs / (60 * 1000);
      
      let reminderType = null;
      
      if (diffMin > 55 && diffMin <= 65) {
        // 1 hour reminder - check if we already sent it
        if (comp.lembrete_1h_enviado) continue;
        reminderType = '1h';
      } else if (diffMin > 25 && diffMin <= 35) {
        // 30 min reminder - check if we already sent it
        if (comp.lembrete_30min_enviado) continue;
        reminderType = '30min';
      } else {
        continue;
      }

      // Format dates
      const endTime = comp.data_fim ? new Date(comp.data_fim) : new Date(startTime.getTime() + 3600000);
      const day = startTime.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const timeStart = startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
      const timeEnd = endTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
      
      const tempoRestante = reminderType === '1h' ? '1 hora' : '30 minutos';
      const urgencyColor = reminderType === '1h' ? '#f59e0b' : '#ef4444';
      const urgencyBg = reminderType === '1h' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #ef4444, #dc2626)';

      const locationInfo = comp.modalidade === 'online' 
        ? (comp.meeting_link ? `<a href="${comp.meeting_link}" style="color:#6366f1;font-weight:600;text-decoration:none;">🔗 Acessar Reunião Online</a>` : '💻 Online')
        : (comp.endereco ? `📍 ${comp.endereco}` : '📍 Presencial');

      const emailBody = `
<div style="font-family:'Segoe UI',Roboto,Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <div style="background:${urgencyBg};padding:32px;text-align:center;">
    <div style="width:64px;height:64px;background:rgba(255,255,255,0.2);border-radius:16px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;">
      <span style="font-size:28px;">⏰</span>
    </div>
    <h1 style="color:white;margin:0;font-size:20px;font-weight:700;">Lembrete de Compromisso</h1>
    <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:14px;">Faltam <strong>${tempoRestante}</strong> para o seu compromisso</p>
  </div>
  
  <div style="padding:32px;">
    <div style="background:#f8fafc;border-radius:12px;padding:24px;border-left:4px solid ${urgencyColor};">
      <h2 style="color:#1e293b;margin:0 0 16px;font-size:18px;font-weight:700;">${comp.titulo}</h2>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:6px 0;color:#64748b;font-size:14px;width:30px;vertical-align:top;">📅</td>
          <td style="padding:6px 0;color:#334155;font-size:14px;font-weight:500;">${day}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#64748b;font-size:14px;vertical-align:top;">🕐</td>
          <td style="padding:6px 0;color:#334155;font-size:14px;font-weight:500;">${timeStart} - ${timeEnd}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#64748b;font-size:14px;vertical-align:top;">📍</td>
          <td style="padding:6px 0;color:#334155;font-size:14px;font-weight:500;">${locationInfo}</td>
        </tr>
        ${comp.descricao ? `<tr>
          <td style="padding:6px 0;color:#64748b;font-size:14px;vertical-align:top;">📝</td>
          <td style="padding:6px 0;color:#334155;font-size:14px;">${comp.descricao}</td>
        </tr>` : ''}
      </table>
    </div>

    ${comp.meeting_link ? `
    <div style="text-align:center;margin-top:24px;">
      <a href="${comp.meeting_link}" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:white;padding:14px 40px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;box-shadow:0 4px 12px rgba(79,70,229,0.3);">
        💻 Entrar na Reunião
      </a>
    </div>` : ''}

    <p style="color:#94a3b8;font-size:12px;text-align:center;margin-top:24px;">
      Este é um lembrete automático. Não é necessário responder este email.
    </p>
  </div>
  
  <div style="background:#f8fafc;padding:16px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="color:#94a3b8;font-size:11px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;margin:0;">
      ● APEX SHIELD CRM
    </p>
  </div>
</div>`;

      const assunto = reminderType === '1h'
        ? `⏰ Lembrete: ${comp.titulo} em 1 hora`
        : `🔔 Atenção: ${comp.titulo} em 30 minutos!`;

      // Send the reminder via the app's Gmail integration
      const accessToken = await base44.asServiceRole.connectors.getAccessToken("gmail");
      
      const mimeMessage = [
        `To: ${comp.email_participante}`,
        `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(assunto)))}?=`,
        `MIME-Version: 1.0`,
        `Content-Type: text/html; charset=UTF-8`,
        ``,
        emailBody
      ].join('\r\n');

      const encodedMessage = btoa(unescape(encodeURIComponent(mimeMessage)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ raw: encodedMessage })
      });

      if (response.ok) {
        // Mark that we sent the reminder
        const updateData = reminderType === '1h' 
          ? { lembrete_1h_enviado: true } 
          : { lembrete_30min_enviado: true };
        await base44.asServiceRole.entities.Compromisso.update(comp.id, updateData);
        emailsSent.push({ id: comp.id, titulo: comp.titulo, tipo: reminderType, email: comp.email_participante });
      } else {
        console.error(`Failed to send reminder for ${comp.id}:`, await response.text());
      }
    }

    return Response.json({ 
      success: true, 
      message: `${emailsSent.length} lembrete(s) enviado(s)`,
      details: emailsSent 
    });
  } catch (error) {
    console.error('Error in enviarLembrete:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});