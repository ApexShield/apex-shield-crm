import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const userEmail = url.searchParams.get('state');

    if (!code || !userEmail) {
      return new Response(
        `<html><body><script>window.close();</script><p>Erro: parâmetros inválidos</p></body></html>`,
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    const redirectUri = `${url.origin}/api/googleAuthCallback`;

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    const tokens = await tokenResponse.json();

    if (!tokens.access_token) {
      throw new Error('Falha ao obter tokens');
    }

    const base44 = createClientFromRequest(req);
    
    const existing = await base44.asServiceRole.entities.GoogleCalendarAuth.filter({ user_email: userEmail });
    
    const authData = {
      user_email: userEmail,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || null,
      expires_at: Date.now() + (tokens.expires_in * 1000)
    };

    if (existing.length > 0) {
      await base44.asServiceRole.entities.GoogleCalendarAuth.update(existing[0].id, authData);
    } else {
      await base44.asServiceRole.entities.GoogleCalendarAuth.create(authData);
    }

    return new Response(
      `<html><body><script>
        window.opener.postMessage({ type: 'google-auth-success' }, '*');
        window.close();
      </script><p>✅ Autenticação concluída! Esta janela pode ser fechada.</p></body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  } catch (error) {
    console.error('Erro no callback:', error);
    return new Response(
      `<html><body><p>❌ Erro: ${error.message}</p></body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
});