import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar autenticação do usuário
    const auths = await base44.asServiceRole.entities.UserGoogleAuth.filter({
      user_email: user.email
    });

    if (auths.length === 0) {
      return Response.json({ 
        error: 'Usuário não conectou conta Google',
        needsAuth: true
      }, { status: 404 });
    }

    const auth = auths[0];
    const tokenExpiry = new Date(auth.token_expiry);
    const now = new Date();

    // Se o token expirou, renovar usando refresh_token
    if (tokenExpiry < now && auth.refresh_token) {
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

      if (!refreshResponse.ok) {
        return Response.json({ 
          error: 'Token expirado e falha ao renovar',
          needsAuth: true
        }, { status: 401 });
      }

      const newTokens = await refreshResponse.json();

      // Atualizar token no banco
      await base44.asServiceRole.entities.UserGoogleAuth.update(auth.id, {
        access_token: newTokens.access_token,
        token_expiry: new Date(Date.now() + (newTokens.expires_in * 1000)).toISOString()
      });

      return Response.json({
        access_token: newTokens.access_token,
        google_email: auth.google_email
      });
    }

    return Response.json({
      access_token: auth.access_token,
      google_email: auth.google_email
    });

  } catch (error) {
    console.error('Erro ao obter token:', error);
    return Response.json({ 
      error: error.message || 'Erro ao obter token',
      needsAuth: false
    }, { status: 500 });
  }
});