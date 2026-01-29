import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verificar autenticação
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Obter parâmetros
    const { dataInicio, dataFim } = await req.json();

    if (!dataInicio || !dataFim) {
      return Response.json({ 
        error: 'Campos obrigatórios: dataInicio, dataFim' 
      }, { status: 400 });
    }

    // Obter token OAuth do usuário
    const tokenResponse = await base44.functions.invoke('obterTokenUsuario');
    
    if (tokenResponse.data.needsAuth || tokenResponse.data.error) {
      return Response.json({ 
        error: 'Usuário precisa conectar conta Google',
        needsAuth: true
      }, { status: 401 });
    }
    
    const accessToken = tokenResponse.data.access_token;

    // Buscar eventos no Google Calendar
    const calendarUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
      `timeMin=${encodeURIComponent(dataInicio)}&` +
      `timeMax=${encodeURIComponent(dataFim)}&` +
      `singleEvents=true&` +
      `orderBy=startTime`;

    const calendarResponse = await fetch(calendarUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!calendarResponse.ok) {
      const error = await calendarResponse.text();
      console.error('Erro ao buscar eventos:', error);
      return Response.json({ 
        success: false, 
        error: 'Erro ao buscar eventos do Google Calendar',
        details: error
      }, { status: calendarResponse.status });
    }

    const calendarData = await calendarResponse.json();

    // Mapear cores do Google Calendar para cores hexadecimais
    const colorMap = {
      "1": "#0891b2",  // Lavender -> Azul Pavão
      "2": "#10b981",  // Sage -> Manjericão
      "3": "#8b5cf6",  // Grape -> Mirtilo
      "4": "#ec4899",  // Flamingo -> Flamingo
      "5": "#fbbf24",  // Banana -> Amarelo Banana
      "6": "#f97316",  // Tangerine -> Tangerina
      "7": "#0891b2",  // Peacock -> Azul Pavão
      "8": "#6b7280",  // Graphite -> Cinza
      "9": "#0891b2",  // Blueberry -> Azul Pavão
      "10": "#10b981", // Basil -> Manjericão
      "11": "#ef4444"  // Tomato -> Vermelho
    };

    // Transformar eventos do Google Calendar para formato do CRM
    const eventos = (calendarData.items || []).map(event => {
      const colorId = event.colorId || '9';
      const hexColor = colorMap[colorId] || '#0891b2';
      
      // Extrair informações dos participantes
      const attendees = event.attendees || [];
      const participantes = attendees.map(att => ({
        email: att.email,
        nome: att.displayName || att.email,
        status: att.responseStatus // 'accepted', 'declined', 'tentative', 'needsAction'
      }));

      // Verificar se alguém confirmou
      const confirmado = attendees.some(att => att.responseStatus === 'accepted');
      const totalParticipantes = attendees.length;

      return {
        id: event.id,
        titulo: event.summary || 'Sem título',
        descricao: event.description || '',
        data_inicio: event.start?.dateTime || event.start?.date,
        data_fim: event.end?.dateTime || event.end?.date,
        cor: hexColor,
        modalidade: event.location === 'Online' ? 'online' : 'presencial',
        endereco: event.location || '',
        meeting_link: event.hangoutLink || event.conferenceData?.entryPoints?.find(e => e.entryPointType === 'video')?.uri || '',
        participantes: participantes,
        confirmado: confirmado,
        total_participantes: totalParticipantes,
        htmlLink: event.htmlLink
      };
    });

    return Response.json({ 
      success: true, 
      eventos: eventos,
      total: eventos.length
    });

  } catch (error) {
    console.error('Erro ao listar eventos:', error);
    return Response.json({ 
      success: false, 
      error: error.message || 'Erro ao listar eventos'
    }, { status: 500 });
  }
});