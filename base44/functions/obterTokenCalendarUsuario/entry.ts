import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Helper: returns an access token for the current user's Google Calendar.
// Priority: user's own OAuth token (UserGoogleAuth) > app connector fallback.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // 1. Try user's individual Google auth
    const auths = await base44.asServiceRole.entities.UserGoogleAuth.filter({
      user_email: user.email
    });

    if (auths.length > 0) {
      const auth = auths[0];
      const tokenExpiry = new Date(auth.token_expiry);
      const now = new Date();

      // Token still valid
      if (tokenExpiry > now) {
        return Response.json({
          access_token: auth.access_token,
          google_email: auth.google_email,
          source: 'user'
        });
      }

      // Token expired - try refresh
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

          return Response.json({
            access_token: newTokens.access_token,
            google_email: auth.google_email,
            source: 'user'
          });
        }
      }
    }

    // 2. No user token available - return not connected
    return Response.json({
      access_token: null,
      google_email: null,
      source: 'none',
      needsAuth: true
    });

  } catch (error) {
    console.error('Erro ao obter token:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});