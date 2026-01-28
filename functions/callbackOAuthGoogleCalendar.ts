import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const CLIENT_ID = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID");
const CLIENT_SECRET = Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET");
const REDIRECT_URI = "https://apexshieldcrm.base44.app/api/functions/callbackOAuthGoogleCalendar";

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state'); // Email do usuário
    const error = url.searchParams.get('error');

    if (error) {
      return new Response(`
        <html>
          <body>
            <h1>Erro na autenticação</h1>
            <p>Você cancelou a autorização ou ocorreu um erro.</p>
            <script>window.close();</script>
          </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    if (!code || !state) {
      return Response.json({ error: 'Código ou state ausente' }, { status: 400 });
    }

    // Trocar código por tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code'
      })
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Erro ao trocar código por token:', errorData);
      return Response.json({ error: 'Erro ao obter tokens' }, { status: 500 });
    }

    const tokens = await tokenResponse.json();

    // Obter email da conta Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${tokens.access_token}` }
    });

    const userInfo = await userInfoResponse.json();
    const googleEmail = userInfo.email;

    // Salvar tokens no banco
    const base44 = createClientFromRequest(req);
    
    // Verificar se já existe conexão para este usuário
    const existing = await base44.asServiceRole.entities.UserGoogleCalendarAuth.filter({
      user_email: state
    });

    const tokenExpiry = new Date(Date.now() + (tokens.expires_in * 1000)).toISOString();

    if (existing.length > 0) {
      // Atualizar
      await base44.asServiceRole.entities.UserGoogleCalendarAuth.update(existing[0].id, {
        google_email: googleEmail,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || existing[0].refresh_token,
        token_expiry: tokenExpiry,
        connected_at: new Date().toISOString()
      });
    } else {
      // Criar novo
      await base44.asServiceRole.entities.UserGoogleCalendarAuth.create({
        user_email: state,
        google_email: googleEmail,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expiry: tokenExpiry,
        connected_at: new Date().toISOString()
      });
    }

    // Retornar HTML que fecha o popup
    return new Response(`
      <html>
        <body>
          <h1>✅ Conectado com sucesso!</h1>
          <p>Conta Google: <strong>${googleEmail}</strong></p>
          <p>Esta janela será fechada automaticamente...</p>
          <script>
            setTimeout(() => {
              window.close();
            }, 2000);
          </script>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });

  } catch (error) {
    console.error('Erro no callback OAuth:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});