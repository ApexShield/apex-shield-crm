Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const userEmail = url.searchParams.get('state');

    if (!code || !userEmail) {
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
        headers: { 'Content-Type': 'text/html' }
      });
    }

    const CLIENT_ID = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID");
    const CLIENT_SECRET = Deno.env.get("google_oauth_client_secret");
    const REDIRECT_URI = `${url.origin}/api/apps/${Deno.env.get("BASE44_APP_ID")}/functions/callbackOAuthGoogle`;

    // Trocar código por tokens
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
      throw new Error('Falha ao obter tokens');
    }

    const tokens = await tokenResponse.json();

    // Obter informações do usuário Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${tokens.access_token}` }
    });

    const googleUser = await userInfoResponse.json();

    // Salvar direto no banco usando service role
    const BASE44_APP_ID = Deno.env.get("BASE44_APP_ID");
    const BASE44_SERVICE_ROLE_KEY = Deno.env.get("BASE44_SERVICE_ROLE_KEY");

    const authData = {
      user_email: userEmail,
      google_email: googleUser.email,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expiry: new Date(Date.now() + (tokens.expires_in * 1000)).toISOString(),
      scopes: tokens.scope?.split(' ') || []
    };

    // Verificar se já existe autenticação
    const checkResponse = await fetch(
      `https://api.base44.com/v1/apps/${BASE44_APP_ID}/entities/UserGoogleAuth?filter=${encodeURIComponent(JSON.stringify({ user_email: userEmail }))}`,
      {
        headers: {
          'Authorization': `Bearer ${BASE44_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const existingAuths = await checkResponse.json();

    if (existingAuths.length > 0) {
      // Atualizar
      await fetch(
        `https://api.base44.com/v1/apps/${BASE44_APP_ID}/entities/UserGoogleAuth/${existingAuths[0].id}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${BASE44_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(authData)
        }
      );
    } else {
      // Criar
      await fetch(
        `https://api.base44.com/v1/apps/${BASE44_APP_ID}/entities/UserGoogleAuth`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${BASE44_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(authData)
        }
      );
    }

    return new Response(`
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Conectado com Sucesso</title>
        </head>
        <body style="font-family: Arial; padding: 40px; text-align: center; background: linear-gradient(to bottom right, #10b981, #3b82f6); margin: 0;">
          <div style="background: white; padding: 40px; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); max-width: 500px; margin: 0 auto;">
            <div style="font-size: 60px; margin-bottom: 20px;">✅</div>
            <h2 style="color: #10b981; margin-bottom: 10px;">Conectado com sucesso!</h2>
            <p style="color: #64748b; margin-bottom: 20px;">Conta Google: <strong>${googleUser.email}</strong></p>
            <p id="status" style="color: #64748b; font-size: 14px;">Conexão salva! Fechando...</p>
          </div>
          <script>
            // Notificar a janela principal
            if (window.opener && !window.opener.closed) {
              window.opener.postMessage({ 
                type: 'google_auth_complete'
              }, '*');
            }
            
            // Fechar automaticamente
            setTimeout(() => {
              window.close();
            }, 2000);
          </script>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });

  } catch (error) {
    console.error('Erro no callback OAuth:', error);
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
      headers: { 'Content-Type': 'text/html' }
    });
  }
});