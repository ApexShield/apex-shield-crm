import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accessToken = await base44.asServiceRole.connectors.getAccessToken("googlecalendar");

    // Use filter to find compromissos with email_participante that need confirmation checking
    // The service role filter with email_enviado=true will find the right records
    const pendingConfirmation = await base44.asServiceRole.entities.Compromisso.filter(
      { email_enviado: true, convidado_confirmou: false },
      '-created_date',
      100
    );

    console.log('Pending confirmation count:', pendingConfirmation.length);

    if (pendingConfirmation.length === 0) {
      return Response.json({ success: true, message: 'Nenhum compromisso pendente de confirmação', confirmed: 0 });
    }

    // Further filter: must have email_participante
    const withEmail = pendingConfirmation.filter(c => c.email_participante && String(c.email_participante).trim().length > 0);
    console.log('With email:', withEmail.length);

    if (withEmail.length === 0) {
      return Response.json({ success: true, message: 'Nenhum compromisso pendente de confirmação', confirmed: 0 });
    }

    // Separate: those with google_event_id and those without
    const withGoogleId = withEmail.filter(c => c.google_event_id);
    const withoutGoogleId = withEmail.filter(c => !c.google_event_id);

    let confirmed = 0;
    let declined = 0;
    let synced = 0;

    // For compromissos WITHOUT google_event_id, try to find matching events in Google Calendar
    for (const comp of withoutGoogleId) {
      try {
        const startDate = new Date(comp.data_inicio);
        const endDate = new Date(comp.data_fim);
        if (isNaN(startDate.getTime())) continue;

        const timeMin = new Date(startDate.getTime() - 60000).toISOString();
        const timeMax = new Date(endDate.getTime() + 60000).toISOString();

        const searchUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&maxResults=10`;
        const searchRes = await fetch(searchUrl, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (!searchRes.ok) continue;

        const searchData = await searchRes.json();
        const events = searchData.items || [];

        const participantEmail = comp.email_participante.toLowerCase().trim();
        const matchingEvent = events.find(evt => {
          const titleMatch = evt.summary && comp.titulo && 
            evt.summary.toLowerCase().includes(comp.titulo.toLowerCase().substring(0, 10));
          const attendeeMatch = evt.attendees?.some(a => 
            a.email && a.email.toLowerCase().trim() === participantEmail
          );
          return titleMatch || attendeeMatch;
        });

        if (matchingEvent) {
          await base44.asServiceRole.entities.Compromisso.update(comp.id, { google_event_id: matchingEvent.id });
          synced++;

          const attendee = matchingEvent.attendees?.find(a => 
            a.email && a.email.toLowerCase().trim() === participantEmail
          );
          if (attendee?.responseStatus === 'accepted') {
            await base44.asServiceRole.entities.Compromisso.update(comp.id, { convidado_confirmou: true });
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
          await base44.asServiceRole.entities.Compromisso.update(comp.id, { convidado_confirmou: true });
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
      totalPending: withEmail.length,
      withGoogleId: withGoogleId.length,
      withoutGoogleId: withoutGoogleId.length,
      message: parts.length > 0 ? parts.join(', ') : 'Nenhuma nova resposta encontrada nos convites do Google Calendar'
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});