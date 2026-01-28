import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar se usuário tem Google Calendar conectado
    const connections = await base44.asServiceRole.entities.UserGoogleCalendarAuth.filter({
      user_email: user.email
    });

    if (connections.length === 0) {
      return Response.json({ 
        connected: false,
        message: 'Google Calendar não conectado'
      });
    }

    const connection = connections[0];
    
    // Verificar se token ainda é válido
    const tokenExpiry = new Date(connection.token_expiry);
    const now = new Date();
    
    if (tokenExpiry < now) {
      // Token expirado - precisa renovar
      return Response.json({ 
        connected: false,
        expired: true,
        message: 'Token expirado, reconecte sua conta'
      });
    }

    return Response.json({ 
      connected: true,
      google_email: connection.google_email,
      connected_at: connection.connected_at
    });
  } catch (error) {
    console.error('Erro ao verificar conexão:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});