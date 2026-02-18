import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accessToken = await base44.asServiceRole.connectors.getAccessToken("googlecalendar");

    // Get all compromissos with email_participante that haven't been confirmed yet
    // Use asServiceRole to see ALL users' compromissos, not just the current user's
    const allCompromissos = await base44.asServiceRole.entities.Compromisso.list('-data_inicio', 500);
    
    console.log('Total compromissos found:', allCompromissos.length);
    
    // Filter: has email participant and not yet confirmed
    // Don't require email_enviado - just check if there's an email participant
    const pendingConfirmation = allCompromissos.filter(c => {
      const hasEmail = c.email_participante && c.email_participante.trim().length > 0;
      const notConfirmed = c.convidado_confirmou !== true;
      return hasEmail && notConfirmed;
    });

    console.log('Pending confirmation count:', pendingConfirmation.length);
    if (pendingConfirmation.length > 0) {
      console.log('Sample pending:', JSON.stringify({
        id: pendingConfirmation[0].id,
        email: pendingConfirmation[0].email_participante,
        google_event_id: pendingConfirmation[0].google_event_id,
        email_enviado: pendingConfirmation[0].email_enviado,
        convidado_confirmou: pendingConfirmation[0].convidado_confirmou
      }));
    }

    if (pendingConfirmation.length === 0) {
      return Response.json({ success: true, message: 'Nenhum compromisso pendente de confirmação', confirmed: 0, totalChecked: allCompromissos.length });
    }

    // Separate: those with google_event_id and those without
    const withGoogleId = pendingConfirmation.filter(c => c.google_event_id);
    const withoutGoogleId = pendingConfirmation.filter(c => !c.google_event_id);

    let confirmed = 0;
    let declined = 0;
    let synced = 0;

    // For compromissos WITHOUT google_event_id, try to find matching events in Google Calendar
    // and link them
    for (const comp of withoutGoogleId) {
      try {
        const startDate = new Date(comp.data_inicio);
        const endDate = new Date(comp.data_fim);
        if (isNaN(startDate.getTime())) continue;

        const timeMin = new Date(startDate.getTime() - 60000).toISOString(); // 1 min before
        const timeMax = new Date(endDate.getTime() + 60000).toISOString(); // 1 min after

        const searchUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&maxResults=10`;
        const searchRes = await fetch(searchUrl, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (!searchRes.ok) continue;

        const searchData = await searchRes.json();
        const events = searchData.items || [];

        // Try to match by title or attendee email
        const participantEmail = comp.email_participante.toLowerCase().trim();
        const matchingEvent = events.find(evt => {
          // Match by title
          const titleMatch = evt.summary && comp.titulo && 
            evt.summary.toLowerCase().includes(comp.titulo.toLowerCase().substring(0, 10));
          // Match by attendee
          const attendeeMatch = evt.attendees?.some(a => 
            a.email && a.email.toLowerCase().trim() === participantEmail
          );
          return titleMatch || attendeeMatch;
        });

        if (matchingEvent) {
          // Link the google_event_id to the compromisso
          await base44.entities.Compromisso.update(comp.id, { google_event_id: matchingEvent.id });
          synced++;

          // Also check confirmation status
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
        console.error(`Error searching for event matching compromisso ${comp.id}:`, err);
      }
    }

    // For compromissos WITH google_event_id, check attendee status directly
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
        console.error(`Error checking event ${comp.google_event_id}:`, err);
      }
    }

    const parts = [];
    if (confirmed > 0) parts.push(`${confirmed} confirmado(s)`);
    if (declined > 0) parts.push(`${declined} recusado(s)`);
    if (synced > 0) parts.push(`${synced} evento(s) vinculado(s) ao Google Calendar`);

    return Response.json({
      success: true,
      confirmed,
      declined,
      synced,
      totalPending: pendingConfirmation.length,
      withGoogleId: withGoogleId.length,
      withoutGoogleId: withoutGoogleId.length,
      message: parts.length > 0 ? parts.join(', ') : 'Nenhuma nova resposta encontrada nos convites do Google Calendar'
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});