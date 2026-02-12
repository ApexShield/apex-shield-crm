import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

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

    // Obter token diretamente
    const auths = await base44.asServiceRole.entities.UserGoogleAuth.filter({ user_email: user.email });
    if (!auths || auths.length === 0) {
      return Response.json({ error: 'Usuário precisa conectar conta Google', needsAuth: true }, { status: 401 });
    }

    let accessToken = auths[0].access_token;
    const tokenExpiry = new Date(auths[0].token_expiry);
    if (tokenExpiry < new Date() && auths[0].refresh_token) {
      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: Deno.env.get("GOOGLE_OAUTH_CLIENT_ID"),
          client_secret: Deno.env.get("google_oauth_client_secret"),
          refresh_token: auths[0].refresh_token,
          grant_type: 'refresh_token'
        })
      });
      if (!refreshResponse.ok) {
        return Response.json({ error: 'Token expirado. Reconecte Google.', needsAuth: true }, { status: 401 });
      }
      const newTokens = await refreshResponse.json();
      await base44.asServiceRole.entities.UserGoogleAuth.update(auths[0].id, {
        access_token: newTokens.access_token,
        token_expiry: new Date(Date.now() + (newTokens.expires_in * 1000)).toISOString()
      });
      accessToken = newTokens.access_token;
    }

    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!response.ok) {
      const error = await response.text();
      return Response.json({ error: 'Erro ao deletar evento', details: error }, { status: response.status });
    }

    return Response.json({ success: true, message: 'Evento deletado com sucesso' });

  } catch (error) {
    console.error('Erro ao deletar evento:', error);
    return Response.json({ error: error.message || 'Erro ao deletar evento' }, { status: 500 });
  }
});