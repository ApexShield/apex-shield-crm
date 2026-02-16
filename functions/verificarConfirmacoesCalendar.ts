import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accessToken = await base44.asServiceRole.connectors.getAccessToken("googlecalendar");

    // Get compromissos that have google_event_id and email_participante but not yet confirmed
    const compromissos = await base44.asServiceRole.entities.Compromisso.filter({
      email_enviado: true,
      convidado_confirmou: false
    });

    if (!compromissos || compromissos.length === 0) {
      return Response.json({ success: true, message: 'Nenhum compromisso pendente de confirmação', confirmed: 0 });
    }

    let confirmed = 0;
    let declined = 0;
    const details = [];

    for (const comp of compromissos) {
      if (!comp.google_event_id || !comp.email_participante) continue;

      // Fetch the event from Google Calendar to check attendee response
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

      // Find the participant's attendee entry
      const participantEmail = comp.email_participante.toLowerCase().trim();
      const attendee = eventData.attendees.find(a => 
        a.email && a.email.toLowerCase().trim() === participantEmail
      );

      if (!attendee) continue;

      // responseStatus can be: "needsAction", "declined", "tentative", "accepted"
      if (attendee.responseStatus === 'accepted') {
        await base44.asServiceRole.entities.Compromisso.update(comp.id, { convidado_confirmou: true });
        confirmed++;
        details.push({ id: comp.id, titulo: comp.titulo, email: participantEmail, status: 'accepted' });
      } else if (attendee.responseStatus === 'declined') {
        declined++;
        details.push({ id: comp.id, titulo: comp.titulo, email: participantEmail, status: 'declined' });
      }
      // "needsAction" and "tentative" are ignored (still pending)
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