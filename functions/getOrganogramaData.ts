import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use service role to fetch all users (bypasses RLS)
    const allUsers = await base44.asServiceRole.entities.User.list();
    
    // Map users to safe data (no sensitive fields)
    const safeUsers = allUsers.map(u => ({
      id: u.id,
      email: u.email,
      full_name: u.full_name,
      role: u.role,
      tipo_hierarquia: u.tipo_hierarquia,
      lider_id: u.lider_id,
      lider_email: u.lider_email,
      lider_nome: u.lider_nome,
      agencia_id: u.agencia_id,
      agencia_nome: u.agencia_nome,
      unidade_id: u.unidade_id,
      unidade_nome: u.unidade_nome,
    }));

    return Response.json({ users: safeUsers });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});