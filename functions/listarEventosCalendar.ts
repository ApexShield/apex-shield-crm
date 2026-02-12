import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

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

    // Obter token diretamente
    const auths = await base44.asServiceRole.entities.UserGoogleAuth.filter({ user_email: user.email });
    if (!auths || auths.length === 0) {
      return Response.json({ error: 'Usuário precisa conectar conta Google', needsAuth: true }, { status: 401 });
    }

    let accessToken = auths[0].access_token;
    const tokenExpiry = new Date(auths[0].token_expiry);
    if (tokenExpiry < new Date() && auths[0].refresh_token) {
      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: Deno.env.get("GOOGLE_OAUTH_CLIENT_ID"),
          client_secret: Deno.env.get("google_oauth_client_secret"),
          refresh_token: auths[0].refresh_token,
          grant_type: 'refresh_token'
        })
      });
      if (!refreshResponse.ok) {
        return Response.json({ error: 'Token expirado. Reconecte Google.', needsAuth: true }, { status: 401 });
      }
      const newTokens = await refreshResponse.json();
      await base44.asServiceRole.entities.UserGoogleAuth.update(auths[0].id, {
        access_token: newTokens.access_token,
        token_expiry: new Date(Date.now() + (newTokens.expires_in * 1000)).toISOString()
      });
      accessToken = newTokens.access_token;
    }

    const calendarUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
      `timeMin=${encodeURIComponent(dataInicio)}&timeMax=${encodeURIComponent(dataFim)}&singleEvents=true&orderBy=startTime`;

    const calendarResponse = await fetch(calendarUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!calendarResponse.ok) {
      const error = await calendarResponse.text();
      console.error('Erro ao buscar eventos:', error);
      return Response.json({ success: false, error: 'Erro ao buscar eventos', details: error }, { status: calendarResponse.status });
    }

    const calendarData = await calendarResponse.json();

    const colorMap = {
      "1": "#0891b2", "2": "#10b981", "3": "#8b5cf6", "4": "#ec4899",
      "5": "#fbbf24", "6": "#f97316", "7": "#0891b2", "8": "#6b7280",
      "9": "#0891b2", "10": "#10b981", "11": "#ef4444"
    };

    const eventos = (calendarData.items || []).map(event => {
      const hexColor = colorMap[event.colorId || '9'] || '#0891b2';
      const attendees = event.attendees || [];
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
        participantes: attendees.map(att => ({ email: att.email, nome: att.displayName || att.email, status: att.responseStatus })),
        confirmado: attendees.some(att => att.responseStatus === 'accepted'),
        total_participantes: attendees.length,
        htmlLink: event.htmlLink
      };
    });

    return Response.json({ success: true, eventos, total: eventos.length });

  } catch (error) {
    console.error('Erro ao listar eventos:', error);
    return Response.json({ success: false, error: error.message || 'Erro ao listar eventos' }, { status: 500 });
  }
});