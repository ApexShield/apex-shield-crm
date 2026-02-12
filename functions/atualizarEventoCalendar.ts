import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { eventId, summary, description, startDateTime, endDateTime, location, attendees, colorId, sendUpdates } = await req.json();

    if (!eventId || !summary || !startDateTime || !endDateTime) {
      return Response.json({ 
        error: 'Campos obrigatórios: eventId, summary, startDateTime, endDateTime' 
      }, { status: 400 });
    }

    const mensagemPadrao = "⏰ IMPORTANTE: A confirmação deste compromisso ajuda muito na comunicação!";
    const descricaoAtual = description || '';
    const descricaoCompleta = descricaoAtual.includes('⏰ IMPORTANTE') ? descricaoAtual : descricaoAtual + "\n\n" + mensagemPadrao;

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

    const event = {
      summary, description: descricaoCompleta, location: location || '',
      start: { dateTime: startDateTime, timeZone: 'America/Sao_Paulo' },
      end: { dateTime: endDateTime, timeZone: 'America/Sao_Paulo' },
      attendees: attendees || [],
      reminders: { useDefault: false, overrides: [{ method: 'email', minutes: 60 }, { method: 'popup', minutes: 30 }, { method: 'popup', minutes: 10 }] },
      guestsCanModify: true, guestsCanInviteOthers: false, colorId: colorId || '9'
    };

    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}?sendUpdates=${sendUpdates || 'none'}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Erro do Google Calendar:', error);
      return Response.json({ error: 'Erro ao atualizar evento', details: error }, { status: response.status });
    }

    const eventData = await response.json();
    return Response.json({ success: true, eventId: eventData.id, htmlLink: eventData.htmlLink });

  } catch (error) {
    console.error('Erro ao atualizar evento:', error);
    return Response.json({ error: error.message || 'Erro ao atualizar evento' }, { status: 500 });
  }
});