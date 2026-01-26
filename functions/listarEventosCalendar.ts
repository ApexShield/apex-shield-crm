import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verificar autenticação
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Obter parâmetros da requisição
    const { dataInicio, dataFim } = await req.json();

    // Obter token de acesso do Google Calendar
    const accessToken = await base44.asServiceRole.connectors.getAccessToken("googlecalendar");

    // Buscar eventos do Google Calendar
    const timeMin = dataInicio ? new Date(dataInicio).toISOString() : new Date().toISOString();
    const timeMax = dataFim ? new Date(dataFim).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Erro do Google Calendar:', error);
      return Response.json({ 
        error: 'Erro ao buscar eventos do Google Calendar',
        details: error
      }, { status: response.status });
    }

    const data = await response.json();

    // Formatar eventos para o formato do CRM
    const eventos = (data.items || []).map(event => ({
      id: event.id,
      titulo: event.summary || 'Sem título',
      descricao: event.description || '',
      data_inicio: event.start.dateTime || event.start.date,
      data_fim: event.end.dateTime || event.end.date,
      endereco: event.location || '',
      cor: '#4285F4', // Cor padrão do Google Calendar (azul)
      tipo: 'google_calendar',
      origem: 'Google Calendar',
      htmlLink: event.htmlLink
    }));

    return Response.json({ 
      success: true,
      eventos: eventos,
      total: eventos.length
    });

  } catch (error) {
    console.error('Erro ao listar eventos:', error);
    return Response.json({ 
      error: error.message || 'Erro ao listar eventos'
    }, { status: 500 });
  }
});