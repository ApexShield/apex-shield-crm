import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const errorHtml = (msg) => new Response(`
    <html><body style="font-family:Arial;padding:40px;text-align:center;">
      <h2 style="color:#ef4444;">❌ Erro na autenticação</h2>
      <p>${msg}</p>
      <button onclick="window.close()">Fechar</button>
    </body></html>
  `, { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } });

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const stateParam = url.searchParams.get('state');
    const errorParam = url.searchParams.get('error');

    if (errorParam) {
      console.error("Google OAuth error:", errorParam);
      return errorHtml("Google retornou erro: " + errorParam);
    }

    if (!code || !stateParam) {
      return errorHtml("Parâmetros inválidos");
    }

    const userEmail = stateParam;
    const CLIENT_ID = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID");
    const CLIENT_SECRET = Deno.env.get("google_oauth_client_secret");
    const BASE44_APP_ID = Deno.env.get("BASE44_APP_ID");

    if (!CLIENT_ID || !CLIENT_SECRET) {
      console.error("Missing OAuth credentials");
      return errorHtml("Credenciais OAuth não configuradas");
    }

    const REDIRECT_URI = `https://app--apex-shield-crm--69587402a43b69a04695a178.base44.app/api/apps/${BASE44_APP_ID}/functions/callbackOAuthGoogle`;

    console.log("Callback OAuth recebido. Email:", userEmail);

    // 1. Trocar código por tokens
    let tokens;
    try {
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

      const tokenText = await tokenResponse.text();
      console.log("Token response status:", tokenResponse.status);
      
      if (!tokenResponse.ok) {
        console.error('Erro token:', tokenText);
        return errorHtml("Falha ao obter tokens do Google. Tente novamente.");
      }

      tokens = JSON.parse(tokenText);
      console.log("Tokens obtidos com sucesso");
    } catch (e) {
      console.error("Erro ao trocar código:", e.message);
      return errorHtml("Erro ao trocar código por token");
    }

    // 2. Obter informações do usuário Google
    let googleUser;
    try {
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { 'Authorization': `Bearer ${tokens.access_token}` }
      });
      googleUser = await userInfoResponse.json();
      console.log("Google user:", googleUser.email);
    } catch (e) {
      console.error("Erro ao obter info do usuário:", e.message);
      return errorHtml("Erro ao obter informações da conta Google");
    }

    // 3. Salvar tokens usando service role
    try {
      const base44 = createClientFromRequest(req);

      const authData = {
        user_email: userEmail,
        google_email: googleUser.email,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || "",
        token_expiry: new Date(Date.now() + ((tokens.expires_in || 3600) * 1000)).toISOString(),
        scopes: tokens.scope ? tokens.scope.split(' ') : []
      };

      console.log("Salvando auth data para:", userEmail);

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
    } catch (e) {
      console.error("Erro ao salvar no Base44:", e.message, e);
      // Mesmo que falhe salvar, mostrar sucesso parcial
      return new Response(`
        <html><head><meta charset="UTF-8"></head>
        <body style="font-family:Arial;padding:40px;text-align:center;background:#fef3c7;margin:0;">
          <div style="background:white;padding:40px;border-radius:20px;box-shadow:0 20px 60px rgba(0,0,0,0.1);max-width:500px;margin:0 auto;">
            <div style="font-size:60px;margin-bottom:20px;">⚠️</div>
            <h3 style="color:#d97706;">Autenticação Google OK, mas houve um erro ao salvar.</h3>
            <p style="color:#64748b;">Tente conectar novamente.</p>
            <button onclick="window.close()" style="margin-top:16px;padding:8px 24px;border-radius:8px;background:#3b82f6;color:white;border:none;cursor:pointer;">Fechar</button>
          </div>
        </body></html>
      `, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }

    return new Response(`
      <html>
        <head><meta charset="UTF-8"><title>APEX SHIELD CRM - Conectado</title></head>
        <body style="font-family:Arial;padding:40px;text-align:center;background:linear-gradient(to bottom right,#10b981,#3b82f6);margin:0;">
          <div style="background:white;padding:40px;border-radius:20px;box-shadow:0 20px 60px rgba(0,0,0,0.3);max-width:500px;margin:0 auto;">
            <div style="font-size:60px;margin-bottom:20px;">✅</div>
            <h2 style="color:#10b981;margin-bottom:10px;">APEX SHIELD CRM</h2>
            <h3 style="color:#10b981;margin-bottom:10px;">Conectado com sucesso!</h3>
            <p style="color:#64748b;margin-bottom:20px;">Conta Google: <strong>${googleUser.email}</strong></p>
            <p style="color:#64748b;font-size:14px;">Conexão salva! Redirecionando...</p>
          </div>
          <script>
            if(window.opener && !window.opener.closed){
              window.opener.postMessage({type:'google_auth_complete'},'*');
            }
            // Try to close first, then redirect as fallback
            setTimeout(function(){
              window.close();
              // If window.close() didn't work, redirect to app
              setTimeout(function(){
                window.location.href = '/Compromissos';
              }, 500);
            },2000);
          </script>
        </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });

  } catch (error) {
    console.error('Erro geral no callback OAuth:', error.message, error.stack);
    return new Response(`
      <html><body style="font-family:Arial;padding:40px;text-align:center;">
        <h2 style="color:#ef4444;">❌ Erro na autenticação</h2>
        <p>Erro interno. Tente novamente.</p>
        <button onclick="window.close()">Fechar</button>
      </body></html>
    `, { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }
});