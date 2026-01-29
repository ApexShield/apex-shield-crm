import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar autenticação do usuário
    const auths = await base44.asServiceRole.entities.UserGoogleAuth.filter({
      user_email: user.email
    });

    if (auths.length === 0) {
      return Response.json({ 
        connected: false,
        message: 'Usuário não conectou conta Google'
      });
    }

    const auth = auths[0];
    const tokenExpiry = new Date(auth.token_expiry);
    const now = new Date();

    return Response.json({
      connected: true,
      google_email: auth.google_email,
      expired: tokenExpiry < now,
      expiry: auth.token_expiry
    });

  } catch (error) {
    console.error('Erro ao verificar conexão:', error);
    return Response.json({ 
      error: error.message || 'Erro ao verificar conexão' 
    }, { status: 500 });
  }
});