import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const authData = await req.json();

    // Verificar se já existe autenticação para este usuário
    const existingAuth = await base44.entities.UserGoogleAuth.filter({
      user_email: user.email
    });

    if (existingAuth.length > 0) {
      await base44.entities.UserGoogleAuth.update(existingAuth[0].id, authData);
    } else {
      await base44.entities.UserGoogleAuth.create(authData);
    }

    return Response.json({ 
      success: true,
      message: 'Autenticação salva com sucesso'
    });

  } catch (error) {
    console.error('Erro ao salvar token:', error);
    return Response.json({ 
      error: error.message || 'Erro ao salvar autenticação'
    }, { status: 500 });
  }
});