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
        error: 'Parâmetros dataInicio e dataFim são obrigatórios' 
      }, { status: 400 });
    }

    // Obter token de acesso
    const accessToken = await base44.asServiceRole.connectors.getAccessToken("googlecalendar");
    
    if (!accessToken) {
      return Response.json({ error: 'Google Calendar não está conectado' }, { status: 403 });
    }

    // Buscar eventos do Google Calendar
    const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
    url.searchParams.append('timeMin', dataInicio);
    url.searchParams.append('timeMax', dataFim);
    url.searchParams.append('singleEvents', 'true');
    url.searchParams.append('orderBy', 'startTime');

    const response = await fetch(url.toString(), {
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
    
    // Mapear IDs de cores do Google Calendar para cores hexadecimais
    const getHexColorFromGoogleId = (colorId) => {
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
      return colorMap[colorId] || "#0891b2"; // Default: Azul Pavão
    };
    
    // Formatar eventos para o formato do CRM
    const eventos = (data.items || []).map(event => {
      const start = event.start?.dateTime || event.start?.date;
      const end = event.end?.dateTime || event.end?.date;
      const meetingLink = event.hangoutLink || event.conferenceData?.entryPoints?.find(e => e.entryPointType === 'video')?.uri;
      const cor = getHexColorFromGoogleId(event.colorId);

      // Extrair informações dos participantes
      const attendees = event.attendees || [];
      const participantes = attendees.map(att => ({
        email: att.email,
        nome: att.displayName || att.email,
        status: att.responseStatus || 'needsAction' // accepted, declined, tentative, needsAction
      }));
      
      // Verificar se algum participante confirmou
      const temConfirmacao = attendees.some(att => att.responseStatus === 'accepted');

      return {
        id: event.id,
        titulo: event.summary || 'Sem título',
        descricao: event.description || '',
        data_inicio: start,
        data_fim: end,
        cor: cor,
        meeting_link: meetingLink,
        htmlLink: event.htmlLink,
        origem: 'Google Calendar',
        participantes: participantes,
        total_participantes: participantes.length,
        confirmado: temConfirmacao
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
      error: error.message || 'Erro ao listar eventos'
    }, { status: 500 });
  }
});