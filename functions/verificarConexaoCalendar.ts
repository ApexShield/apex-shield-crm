import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verificar autenticação
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Tentar obter token de acesso do Google Calendar
    try {
      const accessToken = await base44.asServiceRole.connectors.getAccessToken("googlecalendar");
      
      if (!accessToken) {
        return Response.json({ 
          connected: false,
          message: 'Google Calendar não conectado'
        });
      }

      // Testar se o token é válido fazendo uma requisição simples
      const testResponse = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!testResponse.ok) {
        return Response.json({ 
          connected: false,
          message: 'Token expirado ou inválido'
        });
      }

      return Response.json({ 
        connected: true,
        message: 'Google Calendar conectado com sucesso'
      });

    } catch (error) {
      console.error('Erro ao verificar conexão:', error);
      return Response.json({ 
        connected: false,
        message: 'Google Calendar não conectado',
        error: error.message
      });
    }

  } catch (error) {
    console.error('Erro geral:', error);
    return Response.json({ 
      error: error.message || 'Erro ao verificar conexão'
    }, { status: 500 });
  }
});