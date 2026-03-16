import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { campanha_id } = await req.json();
    if (!campanha_id) return Response.json({ error: 'campanha_id obrigatório' }, { status: 400 });

    const campanha = await base44.entities.Campanha.get(campanha_id);
    if (!campanha) return Response.json({ error: 'Campanha não encontrada' }, { status: 404 });

    await base44.entities.Campanha.update(campanha_id, { status: 'enviando' });

    // CRITICAL: Only fetch clients that belong to the current user
    const statusMap = {
      novo: "Novo", ab_fone: "AB Fone", ab_visita: "AB Visita",
      ab_fechamento: "AB Fechamento", delay: "Delay", analise: "Análise",
      venda_feita: "Venda Feita", entrega_apolice: "Entrega de Apólice"
    };

    let filterQuery = { created_by: user.email };
    if (campanha.filtro_clientes && campanha.filtro_clientes !== 'todos') {
      filterQuery.status = statusMap[campanha.filtro_clientes];
    }

    const clientes = await base44.entities.Cliente.filter(filterQuery, '-created_date', 5000);
    console.log(`Clientes encontrados para ${user.email}: ${clientes.length}`);

    const clientesComEmail = clientes.filter(c => c.email && c.email.trim());
    if (clientesComEmail.length === 0) {
      await base44.entities.Campanha.update(campanha_id, { status: 'concluida', total_destinatarios: 0, emails_enviados: 0 });
      return Response.json({ success: true, message: 'Nenhum cliente com email encontrado', enviados: 0 });
    }

    // Get Gmail token
    let accessToken;
    try {
      const conn = await base44.asServiceRole.connectors.getConnection("gmail");
      accessToken = conn.accessToken;
    } catch (e) {
      console.error('Gmail connection error:', e.message);
      // Fallback to SendEmail
      accessToken = null;
    }

    const corretorNome = user.full_name || 'Corretor';
    let enviados = 0;
    let erros = 0;
    const envioLogs = [];

    for (const cliente of clientesComEmail) {
      const primeiroNome = (cliente.nome || '').split(' ')[0];
      const nomeCompleto = cliente.nome || '';

      let msg = campanha.mensagem
        .replace(/\[NOME\]/gi, primeiroNome)
        .replace(/\[NOME_COMPLETO\]/gi, nomeCompleto)
        .replace(/\[EMAIL\]/gi, cliente.email || '')
        .replace(/\[TELEFONE\]/gi, cliente.telefone || '')
        .replace(/\[CORRETOR\]/gi, corretorNome)
        .replace(/\[CATEGORIA\]/gi, cliente.status || '');

      const linkHtml = campanha.link_conteudo
        ? `<div style="text-align:center;margin:24px 0;">
            <a href="${campanha.link_conteudo}" style="display:inline-block;background:#4f46e5;color:white;padding:14px 40px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;">
              Ver Conteúdo
            </a>
          </div>`
        : '';

      const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
        <div style="background:#4f46e5;padding:32px;text-align:center;">
          <h1 style="color:white;margin:0;font-size:20px;">${campanha.titulo || 'Novidade para você!'}</h1>
        </div>
        <div style="padding:28px;">
          <p style="color:#334155;font-size:15px;line-height:1.7;white-space:pre-line;">${msg}</p>
          ${linkHtml}
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
          <p style="color:#94a3b8;font-size:12px;text-align:center;">Enviado por ${corretorNome}</p>
        </div>
      </div>`;

      const assunto = (campanha.assunto_email || campanha.titulo || 'Novidade para você!')
        .replace(/\[NOME\]/gi, primeiroNome)
        .replace(/\[CORRETOR\]/gi, corretorNome);

      let envioStatus = 'erro';
      let erroDetalhe = '';

      try {
        if (accessToken) {
          // Send via Gmail
          const bodyB64 = btoa(unescape(encodeURIComponent(html)));
          const subjectB64 = btoa(unescape(encodeURIComponent(assunto)));
          const mime = `To: ${cliente.email}\r\nSubject: =?UTF-8?B?${subjectB64}?=\r\nMIME-Version: 1.0\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n${bodyB64}`;
          const rawBytes = new TextEncoder().encode(mime);
          let bin = '';
          for (let i = 0; i < rawBytes.length; i++) {
            bin += String.fromCharCode(rawBytes[i]);
          }
          const raw = btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

          const resp = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ raw })
          });

          if (resp.ok) {
            envioStatus = 'enviado';
            enviados++;
          } else {
            const errText = await resp.text();
            erroDetalhe = errText.substring(0, 200);
            erros++;
            console.error('Gmail error para', cliente.email, errText);
          }
        } else {
          // Fallback: SendEmail
          await base44.integrations.Core.SendEmail({
            from_name: corretorNome,
            to: cliente.email,
            subject: assunto,
            body: html
          });
          envioStatus = 'enviado';
          enviados++;
        }
      } catch (e) {
        erroDetalhe = e.message.substring(0, 200);
        erros++;
        console.error('Send error', cliente.email, e.message);
      }

      envioLogs.push({
        campanha_id: campanha_id,
        cliente_id: cliente.id,
        cliente_nome: cliente.nome || '',
        canal: 'email',
        destino: cliente.email,
        status: envioStatus,
        erro_detalhe: erroDetalhe || undefined,
        mensagem_enviada: msg.substring(0, 500)
      });
    }

    // Bulk create envio logs
    if (envioLogs.length > 0) {
      try {
        await base44.entities.CampanhaEnvio.bulkCreate(envioLogs);
      } catch (e) {
        console.error('Erro ao salvar logs de envio:', e.message);
      }
    }

    await base44.entities.Campanha.update(campanha_id, {
      status: erros > 0 && enviados === 0 ? 'erro' : 'concluida',
      total_destinatarios: clientesComEmail.length,
      emails_enviados: enviados
    });

    return Response.json({ success: true, enviados, erros, total: clientesComEmail.length });
  } catch (err) {
    console.error('Erro geral enviarCampanhaEmail:', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
});