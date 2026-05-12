import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const CONNECTOR_ID = '6a02b60d6f5e1f53c2e11c6e';

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

    // Usar app user connector — cada usuário usa sua própria conta Google
    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CONNECTOR_ID);

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
      }
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