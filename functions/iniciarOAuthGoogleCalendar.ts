import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const CLIENT_ID = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID");
const BASE_URL = Deno.env.get("BASE_URL") || "https://apexshieldcrm.base44.app";
const REDIRECT_URI = `${BASE_URL}/api/functions/callbackOAuthGoogleCalendar`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Gerar URL de autorização OAuth
    const scopes = [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.email'
    ];

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scopes.join(' '))}&` +
      `access_type=offline&` +
      `prompt=consent&` +
      `state=${user.email}`; // Passar email do usuário no state

    return Response.json({ authUrl });
  } catch (error) {
    console.error('Erro ao iniciar OAuth:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});