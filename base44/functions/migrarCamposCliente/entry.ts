import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Fetch all clients using service role to bypass RLS
    const allClientes = await base44.asServiceRole.entities.Cliente.filter({}, '-created_date', 5000);
    console.log(`Total clientes encontrados: ${allClientes.length}`);

    let migradosCustoFixo = 0;
    let migradosRenda = 0;
    let erros = 0;

    for (const cliente of allClientes) {
      const updates = {};

      // Migrar custo_mensal_fixo -> custo_outros_fixos (se custo_mensal_fixo tem valor e custo_outros_fixos está vazio)
      if (cliente.custo_mensal_fixo && !cliente.custo_outros_fixos) {
        updates.custo_outros_fixos = cliente.custo_mensal_fixo;
        migradosCustoFixo++;
      }

      // Migrar custo_variavel_total -> renda (se custo_variavel_total tem valor e renda está vazio)
      // Na verdade, o campo "Renda mensal Estimada" era armazenado em renda - mas pode estar em outro campo antigo
      // Vamos verificar se renda está vazio mas custo_variavel_total tem valor
      if (cliente.custo_variavel_total && !cliente.renda) {
        updates.renda = cliente.custo_variavel_total;
        migradosRenda++;
      }

      if (Object.keys(updates).length > 0) {
        try {
          await base44.asServiceRole.entities.Cliente.update(cliente.id, updates);
        } catch (e) {
          console.error(`Erro ao atualizar cliente ${cliente.id} (${cliente.nome}):`, e.message);
          erros++;
        }
      }
    }

    return Response.json({
      success: true,
      total_clientes: allClientes.length,
      migrados_custo_fixo: migradosCustoFixo,
      migrados_renda: migradosRenda,
      erros
    });
  } catch (error) {
    console.error('Erro na migração:', error.message, error.stack);
    return Response.json({ error: error.message }, { status: 500 });
  }
});