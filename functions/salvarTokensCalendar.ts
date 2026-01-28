import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { google_email, access_token, refresh_token, token_expiry } = await req.json();

    // Verificar se já existe conexão
    const existing = await base44.entities.UserGoogleCalendarAuth.filter({
      user_email: user.email
    });

    if (existing.length > 0) {
      // Atualizar
      await base44.entities.UserGoogleCalendarAuth.update(existing[0].id, {
        google_email,
        access_token,
        refresh_token: refresh_token || existing[0].refresh_token,
        token_expiry,
        connected_at: new Date().toISOString()
      });
    } else {
      // Criar novo
      await base44.entities.UserGoogleCalendarAuth.create({
        user_email: user.email,
        google_email,
        access_token,
        refresh_token,
        token_expiry,
        connected_at: new Date().toISOString()
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Erro ao salvar tokens:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});