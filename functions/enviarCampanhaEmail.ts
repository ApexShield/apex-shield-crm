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

      const logoUrl = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69587402a43b69a04695a178/74301f2d2_generated_image.png';

      const ctaButton = campanha.link_conteudo
        ? `<div style="text-align:center;margin:32px 0 16px;">
            <a href="${campanha.link_conteudo}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#00e676,#00c853);color:#0a1628;padding:16px 52px;border-radius:50px;text-decoration:none;font-weight:800;font-size:16px;letter-spacing:0.5px;box-shadow:0 4px 20px rgba(0,230,118,0.35);mso-padding-alt:0;">
              &#9654;&nbsp; VER PUBLICAÇÃO
            </a>
          </div>
          <p style="text-align:center;color:#64b5f6;font-size:11px;margin:8px 0 0;">Clique no botão acima para conferir</p>`
        : '';

      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#0a1628;font-family:'Segoe UI',Arial,Helvetica,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:0;">

  <!-- Fundo azul escuro completo -->
  <div style="background:linear-gradient(180deg,#0d1f3c 0%,#0a1628 100%);padding:32px 20px;">

    <!-- Logo -->
    <div style="text-align:center;margin-bottom:24px;">
      <img src="${logoUrl}" alt="Apex Shield" style="height:56px;width:auto;" />
    </div>

    <!-- Card Principal -->
    <div style="background:linear-gradient(145deg,#111d35 0%,#162544 50%,#1a2d52 100%);border-radius:20px;overflow:hidden;border:1px solid rgba(100,181,246,0.15);box-shadow:0 8px 32px rgba(0,0,0,0.3);">

      <!-- Header -->
      <div style="background:linear-gradient(135deg,#0d47a1 0%,#1565c0 40%,#1e88e5 100%);padding:36px 28px 40px;text-align:center;">
        <div style="display:inline-block;background:rgba(0,230,118,0.15);border:1px solid rgba(0,230,118,0.3);border-radius:20px;padding:6px 18px;margin-bottom:14px;">
          <span style="color:#69f0ae;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">&#128640; Nova Publicação</span>
        </div>
        <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:800;line-height:1.3;">${campanha.titulo || 'Novidade para você!'}</h1>
      </div>

      <!-- Corpo -->
      <div style="padding:28px 28px 32px;">

        <!-- Mensagem -->
        <div style="background:rgba(13,71,161,0.2);border-radius:14px;padding:20px 22px;margin-bottom:24px;border-left:4px solid #42a5f5;">
          <p style="color:#90caf9;font-size:15px;line-height:1.8;margin:0;white-space:pre-line;">${msg}</p>
        </div>

        <!-- CTA -->
        ${ctaButton}

        <!-- Divider -->
        <div style="margin:28px 0 20px;border-top:1px solid rgba(100,181,246,0.15);"></div>

        <!-- Footer do card -->
        <div style="text-align:center;">
          <div style="display:inline-block;background:linear-gradient(135deg,#1565c0,#1e88e5);width:40px;height:40px;border-radius:50%;line-height:40px;margin-bottom:8px;border:2px solid rgba(0,230,118,0.4);">
            <span style="color:#69f0ae;font-size:17px;font-weight:800;">${(corretorNome.charAt(0) || 'A').toUpperCase()}</span>
          </div>
          <p style="color:#e3f2fd;font-size:13px;font-weight:700;margin:4px 0 2px;">${corretorNome}</p>
          <p style="color:#64b5f6;font-size:11px;margin:0;">Seu consultor de proteção financeira</p>
        </div>
      </div>
    </div>

    <!-- Rodapé -->
    <div style="text-align:center;padding:24px 16px 8px;">
      <p style="color:#42a5f5;font-size:10px;margin:0 0 4px;font-weight:600;">APEX SHIELD CRM</p>
      <p style="color:#37474f;font-size:9px;margin:0;">Você recebeu este email porque é cliente de ${corretorNome}.</p>
    </div>

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
          const fromHeader = userAuth.google_email ? `From: "${corretorNome}" <${userAuth.google_email}>\r\n` : '';
          const mime = `${fromHeader}To: ${cliente.email}\r\nSubject: =?UTF-8?B?${subjectB64}?=\r\nMIME-Version: 1.0\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n${bodyB64}`;
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