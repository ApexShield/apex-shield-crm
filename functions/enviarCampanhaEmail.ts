import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

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

    // Get user's OWN Google token (not the app admin's)
    const userAuth = await getUserGoogleToken(base44, user.email);
    const accessToken = userAuth?.access_token || null;
    if (accessToken) {
      console.log(`Usando Gmail do usuário: ${userAuth.google_email}`);
    } else {
      console.log(`Usuário ${user.email} não conectou Google, usando SendEmail como fallback`);
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

      const ctaButton = campanha.link_conteudo
        ? `<div style="text-align:center;margin:32px 0 16px;">
            <a href="${campanha.link_conteudo}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;padding:16px 48px;border-radius:50px;text-decoration:none;font-weight:800;font-size:16px;letter-spacing:0.5px;box-shadow:0 4px 15px rgba(99,102,241,0.4);mso-padding-alt:0;">
              &#9654;&nbsp; VER PUBLICAÇÃO
            </a>
          </div>
          <p style="text-align:center;color:#94a3b8;font-size:11px;margin:8px 0 0;">Clique no botão acima para conferir</p>`
        : '';

      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#f0f0f5;font-family:'Segoe UI',Arial,Helvetica,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:24px 16px;">

  <!-- Card Principal -->
  <div style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 30px rgba(99,102,241,0.12);">

    <!-- Header com gradiente -->
    <div style="background:linear-gradient(135deg,#4338ca 0%,#6366f1 40%,#8b5cf6 70%,#a78bfa 100%);padding:40px 32px 48px;text-align:center;position:relative;">
      <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:12px;padding:8px 20px;margin-bottom:16px;">
        <span style="color:#e0e7ff;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">&#128640; Nova Publicação</span>
      </div>
      <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:800;line-height:1.3;text-shadow:0 2px 4px rgba(0,0,0,0.1);">${campanha.titulo || 'Novidade para você!'}</h1>
    </div>

    <!-- Seta decorativa -->
    <div style="text-align:center;margin-top:-16px;">
      <div style="display:inline-block;width:32px;height:32px;background:#ffffff;transform:rotate(45deg);box-shadow:0 2px 8px rgba(0,0,0,0.06);"></div>
    </div>

    <!-- Corpo -->
    <div style="padding:24px 32px 32px;">

      <!-- Saudação destacada -->
      <div style="background:linear-gradient(135deg,#eef2ff,#f5f3ff);border-radius:14px;padding:20px 24px;margin-bottom:24px;border-left:4px solid #6366f1;">
        <p style="color:#1e293b;font-size:15px;line-height:1.8;margin:0;white-space:pre-line;">${msg}</p>
      </div>

      <!-- CTA -->
      ${ctaButton}

      <!-- Divider -->
      <div style="margin:28px 0 20px;border-top:1px solid #e2e8f0;"></div>

      <!-- Footer do card -->
      <div style="text-align:center;">
        <div style="display:inline-block;background:linear-gradient(135deg,#4338ca,#6366f1);width:36px;height:36px;border-radius:10px;line-height:36px;margin-bottom:8px;">
          <span style="color:white;font-size:16px;font-weight:800;">${(corretorNome.charAt(0) || 'A').toUpperCase()}</span>
        </div>
        <p style="color:#334155;font-size:13px;font-weight:700;margin:4px 0 2px;">${corretorNome}</p>
        <p style="color:#94a3b8;font-size:11px;margin:0;">Seu consultor de proteção financeira</p>
      </div>
    </div>
  </div>

  <!-- Rodapé externo -->
  <div style="text-align:center;padding:20px 16px 8px;">
    <p style="color:#94a3b8;font-size:10px;margin:0 0 4px;">Enviado via APEX SHIELD CRM</p>
    <p style="color:#cbd5e1;font-size:9px;margin:0;">Você recebeu este email porque é cliente de ${corretorNome}.</p>
  </div>

</div>
</body></html>`;

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