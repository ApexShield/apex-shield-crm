import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Usar o conector OAuth do app (Google Calendar)
    try {
      const accessToken = await base44.asServiceRole.connectors.getAccessToken("googlecalendar");
      
      // Testar se o token funciona
      const testResponse = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (testResponse.ok) {
        const calendarData = await testResponse.json();
        return Response.json({ 
          connected: true,
          google_email: calendarData.id || 'Conectado',
          message: 'Google Calendar conectado via conector'
        });
      } else {
        return Response.json({ 
          connected: false,
          needsAuth: true,
          message: 'Erro ao acessar Google Calendar. Reconecte o conector.'
        });
      }
    } catch (connectorError) {
      console.error('Erro ao obter token do conector:', connectorError.message);
      return Response.json({ 
        connected: false,
        needsAuth: true,
        message: 'Google Calendar não conectado. Solicite ao administrador que conecte o conector.'
      });
    }
  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});