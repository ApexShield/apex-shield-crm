import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { compromisso_id, action } = await req.json();

    if (!compromisso_id) {
      return Response.json({ error: 'ID do compromisso é obrigatório' }, { status: 400 });
    }

    // Use service role to update since the participant may not be a logged-in user
    await base44.asServiceRole.entities.Compromisso.update(compromisso_id, {
      convidado_confirmou: action === 'confirmar'
    });

    return Response.json({ 
      success: true, 
      message: action === 'confirmar' ? 'Presença confirmada!' : 'Presença recusada.' 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});