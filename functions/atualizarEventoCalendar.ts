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
    const { eventId, summary, description, startDateTime, endDateTime, location, attendees, colorId } = await req.json();

    if (!eventId || !summary || !startDateTime || !endDateTime) {
      return Response.json({ 
        error: 'Campos obrigatórios: eventId, summary, startDateTime, endDateTime' 
      }, { status: 400 });
    }

    // Adicionar mensagem padrão na descrição se não existir
    const mensagemPadrao = "⏰ IMPORTANTE: A confirmação deste compromisso ajuda muito na comunicação! Você receberá lembretes automáticos minutos antes do horário para ajudar na sua gestão de tempo.";
    const descricaoAtual = description || '';
    const descricaoCompleta = descricaoAtual.includes('⏰ IMPORTANTE') ? descricaoAtual : descricaoAtual + "\n\n" + mensagemPadrao;

    // Obter token de acesso
    const accessToken = await base44.asServiceRole.connectors.getAccessToken("googlecalendar");
    
    if (!accessToken) {
      return Response.json({ error: 'Google Calendar não está conectado' }, { status: 403 });
    }

    // Atualizar evento no Google Calendar com lembretes
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
      sendUpdates: 'all',
      colorId: colorId || '9'
    };

    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
      method: 'PATCH',
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
        error: 'Erro ao atualizar evento no Google Calendar',
        details: error
      }, { status: response.status });
    }

    const eventData = await response.json();

    return Response.json({ 
      success: true,
      eventId: eventData.id,
      htmlLink: eventData.htmlLink,
      message: 'Evento atualizado com sucesso no Google Calendar'
    });

  } catch (error) {
    console.error('Erro ao atualizar evento:', error);
    return Response.json({ 
      error: error.message || 'Erro ao atualizar evento'
    }, { status: 500 });
  }
});