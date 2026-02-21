import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Buscar token individual do usuário
    const CLIENT_ID = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID");
    const CLIENT_SECRET = Deno.env.get("google_oauth_client_secret");
    
    const auths = await base44.asServiceRole.entities.UserGoogleAuth.filter({ user_email: user.email });
    if (auths.length === 0) {
      return Response.json({ success: false, error: 'Google Calendar não conectado. Conecte sua conta primeiro.', needsUserAuth: true });
    }
    
    let auth = auths[0];
    let accessToken = auth.access_token;
    const tokenExpiry = new Date(auth.token_expiry);
    
    if (tokenExpiry <= new Date() && auth.refresh_token) {
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
        return Response.json({ success: false, error: 'Falha ao renovar token Google. Reconecte sua conta.', needsUserAuth: true });
      }
    }

    // Get recent compromissos (last 100) and filter in memory
    const allCompromissos = await base44.entities.Compromisso.list('-created_date', 100);

    // Filter: has email_participante and not confirmed
    const pendingConfirmation = allCompromissos.filter(c => {
      const email = c.email_participante;
      return email && String(email).trim().length > 0 && c.convidado_confirmou !== true;
    });

    console.log('Total fetched:', allCompromissos.length, 'Pending:', pendingConfirmation.length);

    if (pendingConfirmation.length === 0) {
      return Response.json({ success: true, message: 'Nenhum compromisso pendente de confirmação', confirmed: 0 });
    }

    const withGoogleId = pendingConfirmation.filter(c => c.google_event_id);
    const withoutGoogleId = pendingConfirmation.filter(c => !c.google_event_id);

    let confirmed = 0;
    let declined = 0;
    let synced = 0;

    // For those WITHOUT google_event_id: search Google Calendar to link them
    for (const comp of withoutGoogleId) {
      try {
        const startDate = new Date(comp.data_inicio);
        if (isNaN(startDate.getTime())) continue;

        const timeMin = new Date(startDate.getTime() - 300000).toISOString();
        const timeMax = new Date(startDate.getTime() + 7200000).toISOString();

        const searchUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&maxResults=10`;
        const searchRes = await fetch(searchUrl, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (!searchRes.ok) continue;
        const searchData = await searchRes.json();
        const events = searchData.items || [];

        const participantEmail = comp.email_participante.toLowerCase().trim();
        const matchingEvent = events.find(evt => {
          const attendeeMatch = evt.attendees?.some(a => 
            a.email && a.email.toLowerCase().trim() === participantEmail
          );
          if (attendeeMatch) return true;
          // Fallback: match by title
          if (evt.summary && comp.titulo) {
            return evt.summary.toLowerCase().includes(comp.titulo.toLowerCase().substring(0, 8));
          }
          return false;
        });

        if (matchingEvent) {
          await base44.entities.Compromisso.update(comp.id, { google_event_id: matchingEvent.id });
          synced++;

          const attendee = matchingEvent.attendees?.find(a => 
            a.email && a.email.toLowerCase().trim() === participantEmail
          );
          if (attendee?.responseStatus === 'accepted') {
            await base44.entities.Compromisso.update(comp.id, { convidado_confirmou: true });
            confirmed++;
          } else if (attendee?.responseStatus === 'declined') {
            declined++;
          }
        }
      } catch (err) {
        console.error(`Error searching event for ${comp.id}:`, err.message);
      }
    }

    // For those WITH google_event_id: check attendee status
    for (const comp of withGoogleId) {
      try {
        const eventUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${comp.google_event_id}`;
        const eventRes = await fetch(eventUrl, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (!eventRes.ok) continue;
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
        } else if (attendee.responseStatus === 'declined') {
          declined++;
        }
      } catch (err) {
        console.error(`Error checking event ${comp.google_event_id}:`, err.message);
      }
    }

    const parts = [];
    if (confirmed > 0) parts.push(`${confirmed} confirmado(s)`);
    if (declined > 0) parts.push(`${declined} recusado(s)`);
    if (synced > 0) parts.push(`${synced} evento(s) vinculado(s)`);

    return Response.json({
      success: true,
      confirmed,
      declined,
      synced,
      totalPending: pendingConfirmation.length,
      withGoogleId: withGoogleId.length,
      withoutGoogleId: withoutGoogleId.length,
      message: parts.length > 0 ? parts.join(', ') : 'Nenhuma nova resposta encontrada'
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});