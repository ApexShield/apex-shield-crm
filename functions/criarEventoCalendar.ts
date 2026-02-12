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

    console.log('Dados recebidos:', JSON.stringify({ summary, startDateTime, endDateTime, location }));

    if (!summary || !startDateTime || !endDateTime) {
      return Response.json({ 
        error: 'Campos obrigatórios: summary, startDateTime, endDateTime',
        received: { summary: !!summary, startDateTime: !!startDateTime, endDateTime: !!endDateTime }
      }, { status: 400 });
    }

    // Adicionar mensagem padrão na descrição
    const mensagemPadrao = "\n\n⏰ IMPORTANTE: A confirmação deste compromisso ajuda muito na comunicação!";
    const descricaoCompleta = (description || '') + mensagemPadrao;

    // Obter token OAuth do usuário diretamente do banco
    let accessToken = null;
    try {
      const auths = await base44.asServiceRole.entities.UserGoogleAuth.filter({
        user_email: user.email
      });

      if (!auths || auths.length === 0) {
        return Response.json({ 
          error: 'Usuário precisa conectar conta Google',
          needsAuth: true
        }, { status: 401 });
      }

      const auth = auths[0];
      const tokenExpiry = new Date(auth.token_expiry);
      const now = new Date();

      if (tokenExpiry < now && auth.refresh_token) {
        const CLIENT_ID = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID");
        const CLIENT_SECRET = Deno.env.get("google_oauth_client_secret");

        const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            refresh_token: auth.refresh_token,
            grant_type: 'refresh_token'
          })
        });

        if (!refreshResponse.ok) {
          return Response.json({ 
            error: 'Token expirado. Reconecte sua conta Google.',
            needsAuth: true
          }, { status: 401 });
        }

        const newTokens = await refreshResponse.json();
        await base44.asServiceRole.entities.UserGoogleAuth.update(auth.id, {
          access_token: newTokens.access_token,
          token_expiry: new Date(Date.now() + (newTokens.expires_in * 1000)).toISOString()
        });
        accessToken = newTokens.access_token;
      } else {
        accessToken = auth.access_token;
      }
    } catch (tokenError) {
      console.error('Erro ao obter token:', tokenError);
      return Response.json({ 
        error: 'Erro ao obter token Google: ' + tokenError.message,
        needsAuth: true
      }, { status: 401 });
    }

    if (!accessToken) {
      return Response.json({ 
        error: 'Token de acesso não encontrado',
        needsAuth: true
      }, { status: 401 });
    }

    // Garantir formato ISO correto para as datas
    let formattedStart = startDateTime;
    let formattedEnd = endDateTime;
    
    // Se não tem timezone info, adicionar São Paulo timezone
    if (!formattedStart.includes('+') && !formattedStart.includes('-', 10) && !formattedStart.endsWith('Z')) {
      formattedStart = formattedStart + '-03:00';
    }
    if (!formattedEnd.includes('+') && !formattedEnd.includes('-', 10) && !formattedEnd.endsWith('Z')) {
      formattedEnd = formattedEnd + '-03:00';
    }

    // Criar evento no Google Calendar com Google Meet
    const event = {
      summary: summary,
      description: descricaoCompleta,
      location: location || '',
      start: {
        dateTime: formattedStart,
        timeZone: 'America/Sao_Paulo'
      },
      end: {
        dateTime: formattedEnd,
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

    console.log('Enviando evento para Google Calendar:', JSON.stringify(event));

    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro do Google Calendar:', errorText);
      return Response.json({ 
        error: 'Erro ao criar evento no Google Calendar',
        details: errorText
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
    
    // Se for erro do axios (chamada interna), extrair detalhes
    const statusCode = error.response?.status || 500;
    const errorDetail = error.response?.data?.error || error.message || 'Erro ao criar evento';
    
    return Response.json({ 
      error: typeof errorDetail === 'string' ? errorDetail : JSON.stringify(errorDetail)
    }, { status: statusCode });
  }
});