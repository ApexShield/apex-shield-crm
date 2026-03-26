import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

async function getUserCalendarToken(base44, user) {
  const CLIENT_ID = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID");
  const CLIENT_SECRET = Deno.env.get("google_oauth_client_secret");
  
  const auths = await base44.asServiceRole.entities.UserGoogleAuth.filter({
    user_email: user.email
  });

  if (auths.length === 0) return null;
  const auth = auths[0];
  const tokenExpiry = new Date(auth.token_expiry);
  const now = new Date();

  if (tokenExpiry > now) return { access_token: auth.access_token, google_email: auth.google_email };

  if (auth.refresh_token) {
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
      return { access_token: newTokens.access_token, google_email: auth.google_email };
    }
  }
  return null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { eventId } = await req.json();
    if (!eventId) {
      return Response.json({ error: 'Campo obrigatório: eventId' }, { status: 400 });
    }

    // Usar SOMENTE o token do próprio usuário
    const userToken = await getUserCalendarToken(base44, user);
    if (!userToken) {
      return Response.json({ error: 'Google Calendar não conectado. Conecte sua conta primeiro.', needsUserAuth: true }, { status: 400 });
    }
    const accessToken = userToken.access_token;

    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}?sendUpdates=all`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!response.ok && response.status !== 404) {
      const errorText = await response.text();
      console.error('Google Calendar error:', errorText);
      return Response.json({ error: 'Erro ao deletar evento', details: errorText }, { status: response.status });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});