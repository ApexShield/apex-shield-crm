import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const now = new Date();
    console.log('Inicio enviarLembrete:', now.toISOString());

    // Janela de tempo: compromissos entre 20min e 70min a partir de agora
    const windowStart = new Date(now.getTime() + 20 * 60000).toISOString();
    const windowEnd = new Date(now.getTime() + 70 * 60000).toISOString();

    const compromissos = await base44.asServiceRole.entities.Compromisso.filter(
      { data_inicio: { $gte: windowStart, $lte: windowEnd } },
      '-data_inicio',
      50
    );
    console.log('Compromissos na janela:', compromissos.length);

    const candidatos = compromissos.filter(c => c.email_participante);

    if (candidatos.length === 0) {
      console.log('Nenhum candidato para lembrete');
      return Response.json({ success: true, message: '0 lembrete(s) enviado(s)', details: [] });
    }

    const conn = await base44.asServiceRole.connectors.getConnection("gmail");
    const accessToken = conn.accessToken;

    const emailsSent = [];

    for (const comp of candidatos) {
      const startTime = new Date(comp.data_inicio);
      const diffMin = (startTime.getTime() - now.getTime()) / 60000;

      let reminderType = null;
      if (diffMin > 55 && diffMin <= 65 && !comp.lembrete_1h_enviado) {
        reminderType = '1h';
      } else if (diffMin > 25 && diffMin <= 35 && !comp.lembrete_30min_enviado) {
        reminderType = '30min';
      }
      if (!reminderType) continue;

      const endTime = comp.data_fim ? new Date(comp.data_fim) : new Date(startTime.getTime() + 3600000);
      const optsBR = { timeZone: 'America/Sao_Paulo' };
      const dayFull = startTime.toLocaleDateString('pt-BR', { ...optsBR, weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
      const tStart = startTime.toLocaleTimeString('pt-BR', { ...optsBR, hour: '2-digit', minute: '2-digit' });
      const tEnd = endTime.toLocaleTimeString('pt-BR', { ...optsBR, hour: '2-digit', minute: '2-digit' });

      const tempoRestante = reminderType === '1h' ? '1 hora' : '30 minutos';
      const grad = reminderType === '1h' ? 'linear-gradient(135deg,#f59e0b,#d97706)' : 'linear-gradient(135deg,#ef4444,#dc2626)';

      const locationInfo = comp.modalidade === 'online'
        ? (comp.meeting_link ? '<a href="' + comp.meeting_link + '" style="color:#4f46e5;font-weight:700;">Acessar Reuniao Online</a>' : 'Online')
        : (comp.endereco || 'Presencial');

      const meetBtn = comp.meeting_link
        ? '<div style="text-align:center;margin:28px 0 12px;"><a href="' + comp.meeting_link + '" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#6366f1);color:white;padding:16px 52px;border-radius:14px;text-decoration:none;font-weight:700;font-size:16px;">Entrar na Reuniao</a></div>'
        : '';

      const html = '<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;">'
        + '<div style="background:' + grad + ';padding:40px 32px;text-align:center;">'
        + '<h1 style="color:white;margin:0;font-size:22px;">Lembrete de Compromisso</h1>'
        + '<p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:15px;">Faltam <strong>' + tempoRestante + '</strong></p>'
        + '</div>'
        + '<div style="padding:32px;">'
        + '<h2 style="color:#1e1b4b;font-size:20px;">' + (comp.titulo || '') + '</h2>'
        + '<p style="color:#1e293b;font-size:15px;">' + dayFull + '</p>'
        + '<p style="color:#1e293b;font-size:15px;">' + tStart + ' - ' + tEnd + ' (Horario de Brasilia)</p>'
        + '<p style="color:#1e293b;font-size:15px;">Local: ' + locationInfo + '</p>'
        + (comp.descricao ? '<p style="color:#334155;font-size:14px;">' + comp.descricao + '</p>' : '')
        + meetBtn
        + '<p style="color:#94a3b8;font-size:12px;text-align:center;margin-top:24px;">Lembrete automatico do APEX SHIELD CRM.</p>'
        + '</div></div>';

      const assunto = reminderType === '1h'
        ? 'Lembrete: ' + (comp.titulo || 'Compromisso') + ' em 1 hora'
        : 'Atencao: ' + (comp.titulo || 'Compromisso') + ' em 30 minutos!';

      const bodyB64 = btoa(unescape(encodeURIComponent(html)));
      const subjectB64 = btoa(unescape(encodeURIComponent(assunto)));

      const mime = 'To: ' + comp.email_participante + '\r\n'
        + 'Subject: =?UTF-8?B?' + subjectB64 + '?=\r\n'
        + 'MIME-Version: 1.0\r\n'
        + 'Content-Type: text/html; charset=UTF-8\r\n'
        + 'Content-Transfer-Encoding: base64\r\n'
        + '\r\n'
        + bodyB64;

      const rawBytes = new TextEncoder().encode(mime);
      let bin = '';
      for (let i = 0; i < rawBytes.length; i++) {
        bin += String.fromCharCode(rawBytes[i]);
      }
      const raw = btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

      try {
        const resp = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + accessToken, 'Content-Type': 'application/json' },
          body: JSON.stringify({ raw })
        });

        if (resp.ok) {
          const upd = reminderType === '1h' ? { lembrete_1h_enviado: true } : { lembrete_30min_enviado: true };
          await base44.asServiceRole.entities.Compromisso.update(comp.id, upd);
          emailsSent.push({ id: comp.id, titulo: comp.titulo, tipo: reminderType, email: comp.email_participante });
          console.log('Lembrete enviado:', comp.titulo, reminderType, comp.email_participante);
        } else {
          console.error('Gmail error ' + comp.id + ':', await resp.text());
        }
      } catch (sendErr) {
        console.error('Send error ' + comp.id + ':', sendErr.message);
      }
    }

    console.log('Fim enviarLembrete. Enviados:', emailsSent.length);
    return Response.json({
      success: true,
      message: emailsSent.length + ' lembrete(s) enviado(s)',
      details: emailsSent
    });
  } catch (err) {
    console.error('Erro geral enviarLembrete:', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
});