import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verificar autenticação
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se há token de acesso
    const accessToken = await base44.asServiceRole.connectors.getAccessToken("googlecalendar");
    
    if (!accessToken) {
      return Response.json({ 
        connected: false,
        message: 'Google Calendar não está conectado'
      });
    }

    // Testar se o token é válido
    const testResponse = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!testResponse.ok) {
      return Response.json({ 
        connected: false,
        message: 'Token inválido ou expirado'
      });
    }

    return Response.json({ 
      connected: true,
      message: 'Google Calendar conectado'
    });

  } catch (error) {
    console.error('Erro geral:', error);
    return Response.json({ 
      error: error.message || 'Erro ao verificar conexão'
    }, { status: 500 });
  }
});