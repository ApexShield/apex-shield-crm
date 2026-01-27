import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verificar autenticação
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar autenticação do usuário
    const authRecords = await base44.asServiceRole.entities.GoogleCalendarAuth.filter({ 
      user_email: user.email 
    });

    if (authRecords.length === 0) {
      return Response.json({ 
        connected: false,
        needsAuth: true,
        message: 'Você precisa autorizar o Google Calendar'
      });
    }

    const authData = authRecords[0];
    
    // Verificar se o token expirou
    if (authData.expires_at && authData.expires_at < Date.now()) {
      return Response.json({ 
        connected: false,
        needsAuth: true,
        message: 'Token expirado. Autorize novamente.'
      });
    }

    // Testar se o token é válido
    const testResponse = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: {
        'Authorization': `Bearer ${authData.access_token}`
      }
    });

    if (!testResponse.ok) {
      return Response.json({ 
        connected: false,
        needsAuth: true,
        message: 'Token inválido. Autorize novamente.'
      });
    }

    return Response.json({ 
      connected: true,
      message: 'Google Calendar conectado'
    });

  } catch (error) {
    console.error('Erro geral:', error);
    return Response.json({ 
      error: error.message || 'Erro ao verificar conexão'
    }, { status: 500 });
  }
});