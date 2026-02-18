import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accessToken = await base44.asServiceRole.connectors.getAccessToken("googlecalendar");

    const allCompromissos = await base44.entities.Compromisso.list('-data_inicio', 500);
    const compromissos = allCompromissos.filter(c => c.email_enviado && !c.convidado_confirmou && c.google_event_id && c.email_participante);

    if (compromissos.length === 0) {
      return Response.json({ success: true, message: 'Nenhum compromisso pendente de confirmação', confirmed: 0 });
    }

    let confirmed = 0;
    let declined = 0;

    for (const comp of compromissos) {
      const eventUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${comp.google_event_id}`;
      const eventRes = await fetch(eventUrl, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (!eventRes.ok) continue;

      const eventData = await eventRes.json();
      if (!eventData.attendees || eventData.attendees.length === 0) continue;

      const participantEmail = comp.email_participante.toLowerCase().trim();
      const attendee = eventData.attendees.find(a => a.email && a.email.toLowerCase().trim() === participantEmail);
      if (!attendee) continue;

      if (attendee.responseStatus === 'accepted') {
        await base44.entities.Compromisso.update(comp.id, { convidado_confirmou: true });
        confirmed++;
      } else if (attendee.responseStatus === 'declined') {
        declined++;
      }
    }

    return Response.json({
      success: true,
      confirmed,
      declined,
      totalPending: compromissos.length,
      message: confirmed > 0 || declined > 0
        ? `${confirmed} confirmado(s), ${declined} recusado(s)`
        : 'Nenhuma nova resposta encontrada nos convites do Google Calendar'
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});