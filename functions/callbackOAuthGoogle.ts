import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const stateParam = url.searchParams.get('state');

    if (!code || !stateParam) {
      return new Response(`
        <html>
          <body style="font-family: Arial; padding: 40px; text-align: center;">
            <h2 style="color: #ef4444;">❌ Erro na autenticação</h2>
            <p>Parâmetros inválidos</p>
            <button onclick="window.close()">Fechar</button>
          </body>
        </html>
      `, {
        status: 400,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    const userEmail = stateParam;
    const CLIENT_ID = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID");
    const CLIENT_SECRET = Deno.env.get("google_oauth_client_secret");
    const BASE44_APP_ID = Deno.env.get("BASE44_APP_ID");
    
    // Usar app.base44.com — o proxy Base44 injeta o header Base44-App-Id automaticamente
    const REDIRECT_URI = `https://app.base44.com/api/apps/${BASE44_APP_ID}/functions/callbackOAuthGoogle`;

    console.log("Callback OAuth recebido. Email:", userEmail);
    console.log("Headers recebidos:", JSON.stringify(Object.fromEntries(req.headers.entries())));

    // 1. Trocar código por tokens do Google
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code'
      })
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Erro ao trocar código por token:', error);
      throw new Error('Falha ao obter tokens do Google');
    }

    const tokens = await tokenResponse.json();
    console.log("Tokens obtidos com sucesso");

    // 2. Obter informações do usuário Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${tokens.access_token}` }
    });
    const googleUser = await userInfoResponse.json();
    console.log("Google user:", googleUser.email);

    // 3. Criar o client Base44 direto do request original
    // Quando chamado via app.base44.com, o proxy injeta Base44-App-Id no header
    const base44 = createClientFromRequest(req);

    const authData = {
      user_email: userEmail,
      google_email: googleUser.email,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || "",
      token_expiry: new Date(Date.now() + (tokens.expires_in * 1000)).toISOString(),
      scopes: tokens.scope?.split(' ') || []
    };

    console.log("Salvando auth data para:", userEmail);

    // 4. Verificar se já existe autenticação e salvar
    const existingAuths = await base44.asServiceRole.entities.UserGoogleAuth.filter({
      user_email: userEmail
    });

    if (existingAuths && existingAuths.length > 0) {
      await base44.asServiceRole.entities.UserGoogleAuth.update(existingAuths[0].id, authData);
      console.log("Auth atualizado:", existingAuths[0].id);
    } else {
      await base44.asServiceRole.entities.UserGoogleAuth.create(authData);
      console.log("Auth criado");
    }

    return new Response(`
      <html>
        <head>
          <meta charset="UTF-8">
          <title>APEX SHIELD CRM - Conectado</title>
        </head>
        <body style="font-family: Arial; padding: 40px; text-align: center; background: linear-gradient(to bottom right, #10b981, #3b82f6); margin: 0;">
          <div style="background: white; padding: 40px; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); max-width: 500px; margin: 0 auto;">
            <div style="font-size: 60px; margin-bottom: 20px;">✅</div>
            <h2 style="color: #10b981; margin-bottom: 10px;">APEX SHIELD CRM</h2>
            <h3 style="color: #10b981; margin-bottom: 10px;">Conectado com sucesso!</h3>
            <p style="color: #64748b; margin-bottom: 20px;">Conta Google: <strong>${googleUser.email}</strong></p>
            <p id="status" style="color: #64748b; font-size: 14px;">Conexão salva! Fechando...</p>
          </div>
          <script>
            if (window.opener && !window.opener.closed) {
              window.opener.postMessage({ type: 'google_auth_complete' }, '*');
            }
            setTimeout(() => { window.close(); }, 2000);
          </script>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });

  } catch (error) {
    console.error('Erro no callback OAuth:', error.message, error);
    return new Response(`
      <html>
        <body style="font-family: Arial; padding: 40px; text-align: center;">
          <h2 style="color: #ef4444;">❌ Erro na autenticação</h2>
          <p>${error.message}</p>
          <button onclick="window.close()">Fechar</button>
        </body>
      </html>
    `, {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
});