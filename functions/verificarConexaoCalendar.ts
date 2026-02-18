import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // 1. Verificar se o usuário tem sua própria conexão Google
    const auths = await base44.asServiceRole.entities.UserGoogleAuth.filter({
      user_email: user.email
    });

    if (auths.length > 0) {
      const auth = auths[0];
      const tokenExpiry = new Date(auth.token_expiry);
      const now = new Date();

      let accessToken = auth.access_token;

      // Renovar se expirado
      if (tokenExpiry < now && auth.refresh_token) {
        const CLIENT_ID = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID");
        const CLIENT_SECRET = Deno.env.get("google_oauth_client_secret");

        const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: CLIENT_ID, client_secret: CLIENT_SECRET,
            refresh_token: auth.refresh_token, grant_type: 'refresh_token'
          })
        });

        if (refreshResponse.ok) {
          const newTokens = await refreshResponse.json();
          await base44.asServiceRole.entities.UserGoogleAuth.update(auth.id, {
            access_token: newTokens.access_token,
            token_expiry: new Date(Date.now() + (newTokens.expires_in * 1000)).toISOString()
          });
          accessToken = newTokens.access_token;
        } else {
          return Response.json({ connected: false, needsAuth: true, message: 'Token expirado. Reconecte sua conta Google.' });
        }
      }

      // Testar o token do usuário
      const testResponse = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (testResponse.ok) {
        const calendarData = await testResponse.json();
        return Response.json({
          connected: true,
          google_email: calendarData.id || auth.google_email,
          source: 'user',
          message: 'Sua conta Google Calendar está conectada'
        });
      } else {
        return Response.json({ connected: false, needsAuth: true, message: 'Erro ao acessar Google Calendar. Reconecte sua conta.' });
      }
    }

    // 2. Usuário não tem conexão própria - informar que precisa conectar
    return Response.json({
      connected: false,
      needsAuth: true,
      message: 'Conecte sua conta Google para ver seus compromissos no Google Calendar'
    });

  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});