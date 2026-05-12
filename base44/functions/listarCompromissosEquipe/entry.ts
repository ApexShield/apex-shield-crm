import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { corretor_email } = await req.json();
    const tipo = user.tipo_hierarquia;

    // Only leaders can fetch other users' compromissos
    if (tipo !== 'LiderUnidade' && tipo !== 'LiderAgencia' && user.role !== 'admin') {
      return Response.json({ error: 'Sem permissão' }, { status: 403 });
    }

    // Get team members based on hierarchy
    const allUsers = await base44.asServiceRole.entities.User.list();
    let teamEmails = [];

    if (user.role === 'admin') {
      // Admin sees all
      teamEmails = allUsers.map(u => u.email);
    } else if (tipo === 'LiderAgencia') {
      // Líder de Agência: all users in the same agencia
      teamEmails = allUsers
        .filter(u => u.agencia_id === user.agencia_id)
        .map(u => u.email);
    } else if (tipo === 'LiderUnidade') {
      // Líder de Unidade: all users in the same unidade
      teamEmails = allUsers
        .filter(u => u.unidade_id === user.unidade_id)
        .map(u => u.email);
    }

    // Build team members list for selector
    const teamMembers = allUsers
      .filter(u => teamEmails.includes(u.email))
      .map(u => ({ email: u.email, full_name: u.full_name, tipo_hierarquia: u.tipo_hierarquia }));

    // If a specific corretor is requested, fetch their compromissos
    if (corretor_email) {
      if (!teamEmails.includes(corretor_email)) {
        return Response.json({ error: 'Corretor não pertence à sua equipe' }, { status: 403 });
      }
      
      const allCompromissos = await base44.asServiceRole.entities.Compromisso.list('-data_inicio', 2000);
      const corretorCompromissos = allCompromissos.filter(c => 
        c.created_by === corretor_email || c.owner_email === corretor_email
      );
      
      return Response.json({ compromissos: corretorCompromissos, teamMembers });
    }

    return Response.json({ compromissos: [], teamMembers });
  } catch (error) {
    console.error('Erro listarCompromissosEquipe:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});