import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verificar autenticação
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Obter dados do evento
    const { summary, description, startDateTime, endDateTime, location, attendees } = await req.json();

    if (!summary || !startDateTime || !endDateTime) {
      return Response.json({ 
        error: 'Campos obrigatórios: summary, startDateTime, endDateTime' 
      }, { status: 400 });
    }

    // Obter token de acesso do Google Calendar
    const accessToken = await base44.asServiceRole.connectors.getAccessToken("googlecalendar");

    // Criar evento no Google Calendar
    const event = {
      summary: summary,
      description: description || '',
      location: location || '',
      start: {
        dateTime: startDateTime,
        timeZone: 'America/Sao_Paulo'
      },
      end: {
        dateTime: endDateTime,
        timeZone: 'America/Sao_Paulo'
      },
      attendees: attendees || [],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 30 }
        ]
      }
    };

    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Erro do Google Calendar:', error);
      return Response.json({ 
        error: 'Erro ao criar evento no Google Calendar',
        details: error
      }, { status: response.status });
    }

    const eventData = await response.json();

    return Response.json({ 
      success: true,
      eventId: eventData.id,
      htmlLink: eventData.htmlLink,
      message: 'Evento criado com sucesso no Google Calendar'
    });

  } catch (error) {
    console.error('Erro ao criar evento:', error);
    return Response.json({ 
      error: error.message || 'Erro ao criar evento'
    }, { status: 500 });
  }
});