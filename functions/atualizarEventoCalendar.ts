import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

async function getUserCalendarToken(base44, userEmail) {
  const auths = await base44.asServiceRole.entities.UserGoogleAuth.filter({
    user_email: userEmail
  });

  if (auths.length === 0) {
    return { error: 'Google Calendar não conectado', needsAuth: true };
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
      return { error: 'Token expirado. Reconecte sua conta Google.', needsAuth: true };
    }

    const newTokens = await refreshResponse.json();
    await base44.asServiceRole.entities.UserGoogleAuth.update(auth.id, {
      access_token: newTokens.access_token,
      token_expiry: new Date(Date.now() + (newTokens.expires_in * 1000)).toISOString()
    });

    return { access_token: newTokens.access_token, google_email: auth.google_email };
  }

  return { access_token: auth.access_token, google_email: auth.google_email };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { eventId, summary, description, startDateTime, endDateTime, location, attendees, colorId } = await req.json();

    if (!eventId || !summary || !startDateTime || !endDateTime) {
      return Response.json({ error: 'Campos obrigatórios: eventId, summary, startDateTime, endDateTime' }, { status: 400 });
    }

    const tokenResult = await getUserCalendarToken(base44, user.email);
    if (tokenResult.error) {
      return Response.json({ error: tokenResult.error, needsAuth: tokenResult.needsAuth }, { status: 401 });
    }
    const accessToken = tokenResult.access_token;

    const event = {
      summary,
      description: description || '',
      location: location || '',
      start: { dateTime: startDateTime, timeZone: 'America/Sao_Paulo' },
      end: { dateTime: endDateTime, timeZone: 'America/Sao_Paulo' },
      attendees: attendees || [],
      colorId: colorId || '7',
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 60 },
          { method: 'popup', minutes: 30 }
        ]
      },
      guestsCanModify: true,
      guestsCanInviteOthers: false
    };

    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}?sendUpdates=all`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Calendar error:', errorText);
      return Response.json({ error: 'Erro ao atualizar evento', details: errorText }, { status: response.status });
    }

    const eventData = await response.json();
    return Response.json({ success: true, eventId: eventData.id, htmlLink: eventData.htmlLink });
  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});