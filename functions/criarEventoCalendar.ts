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

    const { summary, description, startDateTime, endDateTime, location, attendees, colorId } = await req.json();

    if (!summary || !startDateTime || !endDateTime) {
      return Response.json({ error: 'Campos obrigatórios: summary, startDateTime, endDateTime' }, { status: 400 });
    }

    // Tentar token do próprio usuário primeiro
    const userToken = await getUserCalendarToken(base44, user);
    
    let accessToken;
    if (userToken) {
      accessToken = userToken.access_token;
    } else {
      accessToken = await base44.asServiceRole.connectors.getAccessToken("googlecalendar");
    }

    let formattedStart = startDateTime;
    let formattedEnd = endDateTime;
    if (!formattedStart.includes('+') && !formattedStart.includes('-', 10) && !formattedStart.endsWith('Z')) {
      formattedStart += '-03:00';
    }
    if (!formattedEnd.includes('+') && !formattedEnd.includes('-', 10) && !formattedEnd.endsWith('Z')) {
      formattedEnd += '-03:00';
    }

    const event = {
      summary,
      description: description || '',
      location: location || '',
      start: { dateTime: formattedStart, timeZone: 'America/Sao_Paulo' },
      end: { dateTime: formattedEnd, timeZone: 'America/Sao_Paulo' },
      attendees: attendees || [],
      colorId: colorId || '7',
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' }
        }
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 60 },
          { method: 'popup', minutes: 30 }
        ]
      }
    };

    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Calendar error:', errorText);
      return Response.json({ error: 'Erro ao criar evento', details: errorText }, { status: response.status });
    }

    const eventData = await response.json();
    const meetingLink = eventData.hangoutLink || eventData.conferenceData?.entryPoints?.find(e => e.entryPointType === 'video')?.uri;

    return Response.json({
      success: true,
      eventId: eventData.id,
      htmlLink: eventData.htmlLink,
      meetingLink: meetingLink
    });
  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});