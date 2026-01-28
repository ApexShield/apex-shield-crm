import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verificar autenticação
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Obter ID do evento
    const { eventId } = await req.json();

    if (!eventId) {
      return Response.json({ 
        error: 'Campo obrigatório: eventId' 
      }, { status: 400 });
    }

    // Obter token de acesso
    const accessToken = await base44.asServiceRole.connectors.getAccessToken("googlecalendar");
    
    if (!accessToken) {
      return Response.json({ error: 'Google Calendar não está conectado' }, { status: 403 });
    }

    // Deletar evento no Google Calendar
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Erro do Google Calendar:', error);
      return Response.json({ 
        error: 'Erro ao deletar evento no Google Calendar',
        details: error
      }, { status: response.status });
    }

    return Response.json({ 
      success: true,
      message: 'Evento deletado com sucesso no Google Calendar'
    });

  } catch (error) {
    console.error('Erro ao deletar evento:', error);
    return Response.json({ 
      error: error.message || 'Erro ao deletar evento'
    }, { status: 500 });
  }
});