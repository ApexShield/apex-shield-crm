import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Usar app connector nativo — verificar se está conectado
    const { accessToken } = await base44.asServiceRole.connectors.getConnection("googlecalendar");

    // Testar se o token funciona fazendo uma chamada simples
    const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!res.ok) {
      return Response.json({ connected: false, message: 'Erro ao acessar Google Calendar' });
    }

    const calendarInfo = await res.json();

    return Response.json({ 
      connected: true,
      google_email: calendarInfo.id || 'Conectado'
    });
  } catch (error) {
    console.error('Erro ao verificar conexão:', error);
    return Response.json({ connected: false, message: error.message });
  }
});