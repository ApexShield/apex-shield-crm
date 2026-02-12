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
    const body = await req.json();
    const { summary, description, location, attendees, colorId } = body;
    const startDateTime = body.startDateTime || body.start?.dateTime;
    const endDateTime = body.endDateTime || body.end?.dateTime;

    if (!summary || !startDateTime || !endDateTime) {
      return Response.json({ 
        error: 'Campos obrigatórios: summary, startDateTime, endDateTime' 
      }, { status: 400 });
    }

    // Adicionar mensagem padrão na descrição
    const mensagemPadrao = "\n\n⏰ IMPORTANTE: A confirmação deste compromisso ajuda muito na comunicação! Você receberá lembretes automáticos minutos antes do horário para ajudar na sua gestão de tempo.";
    const descricaoCompleta = (description || '') + mensagemPadrao;

    // Obter token OAuth do usuário
    const tokenResponse = await base44.functions.invoke('obterTokenUsuario');

    console.log('Token response status:', tokenResponse.status);
    console.log('Token response data:', JSON.stringify(tokenResponse.data));

    if (tokenResponse.data.needsAuth || tokenResponse.data.error) {
      return Response.json({ 
        error: 'Usuário precisa conectar conta Google',
        needsAuth: true,
        details: tokenResponse.data
      }, { status: 401 });
    }

    const accessToken = tokenResponse.data.access_token;
    console.log('Access token obtido:', accessToken ? 'sim' : 'não');

    // Criar evento no Google Calendar com Google Meet
    const event = {
      summary: summary,
      description: descricaoCompleta,
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
      colorId: colorId || '9',
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
          { method: 'popup', minutes: 30 },
          { method: 'popup', minutes: 10 }
        ]
      },
      guestsCanModify: true,
      guestsCanInviteOthers: false,
      sendUpdates: 'all'
    };

    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1', {
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
    const meetingLink = eventData.hangoutLink || eventData.conferenceData?.entryPoints?.find(e => e.entryPointType === 'video')?.uri;

    return Response.json({ 
      success: true,
      eventId: eventData.id,
      htmlLink: eventData.htmlLink,
      meetingLink: meetingLink,
      message: 'Evento criado com sucesso no Google Calendar'
    });

  } catch (error) {
    console.error('Erro ao criar evento:', error);
    return Response.json({ 
      error: error.message || 'Erro ao criar evento'
    }, { status: 500 });
  }
});