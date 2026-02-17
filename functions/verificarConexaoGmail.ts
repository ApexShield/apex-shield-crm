import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Gmail permanece como conector global (admin envia emails pelo sistema)
    let gmailOk = false;
    try {
      const gmailToken = await base44.asServiceRole.connectors.getAccessToken("gmail");
      if (gmailToken) {
        const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
          headers: { 'Authorization': `Bearer ${gmailToken}` }
        });
        gmailOk = res.ok;
      }
    } catch (e) {
      console.error('Gmail check failed:', e.message);
    }

    // Calendar agora é por usuário - verificar conexão individual
    let calendarOk = false;
    let calendarEmail = null;
    try {
      const auths = await base44.asServiceRole.entities.UserGoogleAuth.filter({
        user_email: user.email
      });
      if (auths.length > 0) {
        const auth = auths[0];
        const tokenExpiry = new Date(auth.token_expiry);
        if (tokenExpiry > new Date()) {
          calendarOk = true;
          calendarEmail = auth.google_email;
        } else if (auth.refresh_token) {
          // Tentar renovar
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
            calendarOk = true;
            calendarEmail = auth.google_email;
          }
        }
      }
    } catch (e) {
      console.error('Calendar user check failed:', e.message);
    }

    return Response.json({ gmail: gmailOk, calendar: calendarOk, calendarEmail });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});