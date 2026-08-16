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
    
    // Usar o subdomínio da app para o redirect, não app.base44.com
    const REDIRECT_URI = `https://app--apex-shield-crm--69587402a43b69a04695a178.base44.app/api/apps/${BASE44_APP_ID}/functions/callbackOAuthGoogle`;
    
    const scopes = [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/userinfo.email'
    ];

    // Generate a cryptographic nonce tied to the user
    const nonce = crypto.randomUUID();
    const statePayload = JSON.stringify({ email: user.email, nonce });
    const stateEncoded = btoa(statePayload);

    // Store the nonce temporarily so the callback can verify it
    const existingAuth = await base44.asServiceRole.entities.UserGoogleAuth.filter({ user_email: user.email });
    if (existingAuth.length > 0) {
      await base44.asServiceRole.entities.UserGoogleAuth.update(existingAuth[0].id, { oauth_nonce: nonce });
    } else {
      await base44.asServiceRole.entities.UserGoogleAuth.create({ user_email: user.email, google_email: '', access_token: '', oauth_nonce: nonce });
    }

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scopes.join(' '))}&` +
      `access_type=offline&` +
      `prompt=consent&` +
      `state=${encodeURIComponent(stateEncoded)}`;

    return Response.json({ authUrl });

  } catch (error) {
    console.error('Erro ao iniciar OAuth:', error);
    return Response.json({ 
      error: error.message || 'Erro ao iniciar autenticação' 
    }, { status: 500 });
  }
});