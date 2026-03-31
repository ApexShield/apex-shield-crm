import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const allClientes = await base44.asServiceRole.entities.Cliente.filter({}, '-created_date', 5000);
    
    // Check which clients have renda filled
    const comRenda = allClientes.filter(c => c.renda);
    // Check which clients have custo_variavel_total filled
    const comCustoVar = allClientes.filter(c => c.custo_variavel_total);
    // Check which clients have custo_mensal_fixo still filled (should be migrated already)
    const comCustoFixo = allClientes.filter(c => c.custo_mensal_fixo);
    // Check custo_outros_fixos
    const comOutrosFixos = allClientes.filter(c => c.custo_outros_fixos);

    return Response.json({
      total: allClientes.length,
      com_renda: comRenda.length,
      renda_samples: comRenda.slice(0, 3).map(c => ({ nome: c.nome, renda: c.renda })),
      com_custo_variavel_total: comCustoVar.length,
      custo_var_samples: comCustoVar.slice(0, 3).map(c => ({ nome: c.nome, custo_variavel_total: c.custo_variavel_total })),
      com_custo_mensal_fixo: comCustoFixo.length,
      custo_fixo_samples: comCustoFixo.slice(0, 3).map(c => ({ nome: c.nome, custo_mensal_fixo: c.custo_mensal_fixo })),
      com_outros_fixos: comOutrosFixos.length,
      outros_fixos_samples: comOutrosFixos.slice(0, 3).map(c => ({ nome: c.nome, custo_outros_fixos: c.custo_outros_fixos })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});