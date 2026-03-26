import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar se usuário tem Google Calendar conectado via UserGoogleAuth
    const auths = await base44.asServiceRole.entities.UserGoogleAuth.filter({
      user_email: user.email
    });

    if (auths.length === 0) {
      return Response.json({ 
        connected: false,
        needsAuth: true,
        message: 'Google Calendar não conectado'
      });
    }

    const auth = auths[0];
    const tokenExpiry = new Date(auth.token_expiry);
    const now = new Date();
    
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
          connected: false,
          needsAuth: true,
          message: 'Token expirado, reconecte sua conta'
        });
      }

      const newTokens = await refreshResponse.json();
      await base44.asServiceRole.entities.UserGoogleAuth.update(auth.id, {
        access_token: newTokens.access_token,
        token_expiry: new Date(Date.now() + (newTokens.expires_in * 1000)).toISOString()
      });

      return Response.json({ 
        connected: true,
        google_email: auth.google_email
      });
    }

    if (tokenExpiry < now) {
      return Response.json({ 
        connected: false,
        needsAuth: true,
        message: 'Token expirado, reconecte sua conta'
      });
    }

    return Response.json({ 
      connected: true,
      google_email: auth.google_email
    });
  } catch (error) {
    console.error('Erro ao verificar conexão:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});