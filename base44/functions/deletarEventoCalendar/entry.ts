import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const CONNECTOR_ID = '6a02b60d6f5e1f53c2e11c6e';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { eventId } = await req.json();
    if (!eventId) {
      return Response.json({ error: 'Campo obrigatório: eventId' }, { status: 400 });
    }

    // Usar app user connector — cada usuário usa sua própria conta Google
    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CONNECTOR_ID);

    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}?sendUpdates=all`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!response.ok && response.status !== 404) {
      const errorText = await response.text();
      console.error('Google Calendar error:', errorText);
      return Response.json({ error: 'Erro ao deletar evento', details: errorText }, { status: response.status });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});