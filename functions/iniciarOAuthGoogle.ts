import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const CLIENT_ID = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID");
    const BASE44_APP_ID = Deno.env.get("BASE44_APP_ID");
    // URI fixa usando o domínio Deno Deploy que já está cadastrado no Google Console
    const REDIRECT_URI = `https://early-seal-52-tv1vz1fde145.deno.dev/api/apps/${BASE44_APP_ID}/functions/callbackOAuthGoogle`;
    
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
      `state=${encodeURIComponent(user.email)}`;

    return Response.json({ authUrl });

  } catch (error) {
    console.error('Erro ao iniciar OAuth:', error);
    return Response.json({ 
      error: error.message || 'Erro ao iniciar autenticação' 
    }, { status: 500 });
  }
});