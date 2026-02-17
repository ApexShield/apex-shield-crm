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
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tokenResult = await getUserCalendarToken(base44, user.email);
    if (tokenResult.error) {
      return Response.json({ error: tokenResult.error, needsAuth: tokenResult.needsAuth }, { status: 401 });
    }
    const accessToken = tokenResult.access_token;

    // Get compromissos that have google_event_id and email_participante but not yet confirmed
    // Filter only compromissos created by the current user
    const allCompromissos = await base44.entities.Compromisso.list('-data_inicio', 500);
    const compromissos = allCompromissos.filter(c => c.email_enviado && !c.convidado_confirmou && c.google_event_id && c.email_participante);

    if (compromissos.length === 0) {
      return Response.json({ success: true, message: 'Nenhum compromisso pendente de confirmação', confirmed: 0 });
    }

    let confirmed = 0;
    let declined = 0;
    const details = [];

    for (const comp of compromissos) {
      const eventUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${comp.google_event_id}`;
      const eventRes = await fetch(eventUrl, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (!eventRes.ok) {
        console.error(`Error fetching event ${comp.google_event_id}: ${eventRes.status}`);
        continue;
      }

      const eventData = await eventRes.json();
      
      if (!eventData.attendees || eventData.attendees.length === 0) continue;

      const participantEmail = comp.email_participante.toLowerCase().trim();
      const attendee = eventData.attendees.find(a => 
        a.email && a.email.toLowerCase().trim() === participantEmail
      );

      if (!attendee) continue;

      if (attendee.responseStatus === 'accepted') {
        await base44.entities.Compromisso.update(comp.id, { convidado_confirmou: true });
        confirmed++;
        details.push({ id: comp.id, titulo: comp.titulo, email: participantEmail, status: 'accepted' });
      } else if (attendee.responseStatus === 'declined') {
        declined++;
        details.push({ id: comp.id, titulo: comp.titulo, email: participantEmail, status: 'declined' });
      }
    }

    return Response.json({
      success: true,
      confirmed,
      declined,
      details,
      totalPending: compromissos.length,
      message: confirmed > 0 || declined > 0
        ? `${confirmed} confirmado(s), ${declined} recusado(s)`
        : 'Nenhuma nova resposta encontrada nos convites do Google Calendar'
    });
  } catch (error) {
    console.error('Error checking calendar confirmations:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});