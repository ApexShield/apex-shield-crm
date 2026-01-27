import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const redirectUri = `${new URL(req.url).origin}/api/googleAuthCallback`;

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', 'https://www.googleapis.com/auth/calendar.events email');
    authUrl.searchParams.append('access_type', 'offline');
    authUrl.searchParams.append('prompt', 'consent');
    authUrl.searchParams.append('state', user.email);

    return Response.json({ authUrl: authUrl.toString() });
  } catch (error) {
    console.error('Erro ao iniciar auth:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});