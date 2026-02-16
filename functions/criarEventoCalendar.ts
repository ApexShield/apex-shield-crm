import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

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

    const accessToken = await base44.asServiceRole.connectors.getAccessToken("googlecalendar");

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
      },
      guestsCanModify: true,
      guestsCanInviteOthers: false
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