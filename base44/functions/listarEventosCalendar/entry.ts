import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { dataInicio, dataFim } = await req.json();
    if (!dataInicio || !dataFim) {
      return Response.json({ error: 'Campos obrigatórios: dataInicio, dataFim' }, { status: 400 });
    }

    // Usar app connector nativo — sem OAuth manual
    const { accessToken } = await base44.asServiceRole.connectors.getConnection("googlecalendar");

    const calendarUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
      `timeMin=${encodeURIComponent(dataInicio)}&timeMax=${encodeURIComponent(dataFim)}&singleEvents=true&orderBy=startTime&maxResults=250`;

    const calendarResponse = await fetch(calendarUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!calendarResponse.ok) {
      const error = await calendarResponse.text();
      console.error('Erro ao buscar eventos:', error);
      return Response.json({ success: false, error: 'Erro ao buscar eventos', eventos: [] });
    }

    const calendarData = await calendarResponse.json();

    const colorMap = {
      "1": "#7986cb", "2": "#33b679", "3": "#8e24aa", "4": "#e67c73",
      "5": "#f6bf26", "6": "#f4511e", "7": "#039be5", "8": "#616161",
      "9": "#3f51b5", "10": "#0b8043", "11": "#d50000"
    };

    const eventos = (calendarData.items || []).map(event => {
      const hexColor = colorMap[event.colorId] || '#4285f4';
      const attendees = event.attendees || [];
      return {
        google_event_id: event.id,
        titulo: event.summary || 'Sem título',
        descricao: event.description || '',
        data_inicio: event.start?.dateTime || event.start?.date,
        data_fim: event.end?.dateTime || event.end?.date,
        cor: hexColor,
        endereco: event.location || '',
        meeting_link: event.hangoutLink || event.conferenceData?.entryPoints?.find(e => e.entryPointType === 'video')?.uri || '',
        participantes: attendees.map(att => ({ email: att.email, nome: att.displayName || att.email, status: att.responseStatus })),
        htmlLink: event.htmlLink,
        is_all_day: !event.start?.dateTime,
        source: 'google'
      };
    });

    return Response.json({ success: true, eventos, total: eventos.length });
  } catch (error) {
    console.error('Erro ao listar eventos:', error);
    return Response.json({ success: false, error: error.message, eventos: [] }, { status: 500 });
  }
});