import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Testa o conector do Gmail
    let gmailOk = false;
    try {
      const gmailToken = await base44.asServiceRole.connectors.getAccessToken("gmail");
      if (gmailToken) {
        const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
          headers: { 'Authorization': `Bearer ${gmailToken}` }
        });
        gmailOk = res.ok;
      }
    } catch (e) {
      console.error('Gmail check failed:', e.message);
    }

    // Testa o conector do Google Calendar
    let calendarOk = false;
    try {
      const calToken = await base44.asServiceRole.connectors.getAccessToken("googlecalendar");
      if (calToken) {
        const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary', {
          headers: { 'Authorization': `Bearer ${calToken}` }
        });
        calendarOk = res.ok;
      }
    } catch (e) {
      console.error('Calendar check failed:', e.message);
    }

    return Response.json({ gmail: gmailOk, calendar: calendarOk });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});