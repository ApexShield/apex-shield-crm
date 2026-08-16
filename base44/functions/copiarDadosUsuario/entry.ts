import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Acesso restrito a administradores' }, { status: 403 });
    }
    console.log('User:', user?.email, 'Role:', user?.role);

    const { origem, destino, acao, limite } = await req.json();
    // acao: "backup" | "copiar" | limite: optional max records per entity

    if (!origem || !destino) {
      return Response.json({ error: 'origem e destino são obrigatórios' }, { status: 400 });
    }

    console.log(`Ação: ${acao} | Origem: ${origem} | Destino: ${destino}`);

    // Buscar dados filtrando manualmente por created_by (case insensitive)
    const origemLower = origem.toLowerCase();

    const allClientes = await base44.asServiceRole.entities.Cliente.list('-created_date', 10000);
    const clientes = allClientes.filter(c => c.created_by?.toLowerCase() === origemLower);
    console.log(`Clientes encontrados: ${clientes.length} (de ${allClientes.length} total)`);

    const allCompromissos = await base44.asServiceRole.entities.Compromisso.list('-created_date', 10000);
    const compromissos = allCompromissos.filter(c => c.created_by?.toLowerCase() === origemLower);
    console.log(`Compromissos encontrados: ${compromissos.length}`);

    const allDashboards = await base44.asServiceRole.entities.DashboardDiario.list('-created_date', 10000);
    const dashboards = allDashboards.filter(d => d.created_by?.toLowerCase() === origemLower);
    console.log(`Registros dashboard encontrados: ${dashboards.length}`);

    const allMetas = await base44.asServiceRole.entities.Meta.list('-created_date', 10000);
    const metas = allMetas.filter(m => m.created_by?.toLowerCase() === origemLower);
    console.log(`Metas encontradas: ${metas.length}`);

    const allCampanhas = await base44.asServiceRole.entities.Campanha.list('-created_date', 10000);
    const campanhas = allCampanhas.filter(c => c.created_by?.toLowerCase() === origemLower);
    console.log(`Campanhas encontradas: ${campanhas.length}`);

    const allTransacoes = await base44.asServiceRole.entities.Transacao.list('-created_date', 10000);
    const transacoes = allTransacoes.filter(t => t.created_by?.toLowerCase() === origemLower);
    console.log(`Transações encontradas: ${transacoes.length}`);

    const backup = {
      origem,
      destino,
      data_backup: new Date().toISOString(),
      clientes,
      compromissos,
      dashboards,
      metas,
      campanhas,
      transacoes,
      totais: {
        clientes: clientes.length,
        compromissos: compromissos.length,
        dashboards: dashboards.length,
        metas: metas.length,
        campanhas: campanhas.length,
        transacoes: transacoes.length,
      }
    };

    if (acao === "backup") {
      // Retorna o backup como JSON para download
      return Response.json({
        success: true,
        message: `Backup gerado com sucesso`,
        backup
      });
    }

    if (acao === "copiar") {
      let copiados = { clientes: 0, compromissos: 0, dashboards: 0, metas: 0, campanhas: 0, transacoes: 0 };
      const erros = [];

      // Função para limpar campos internos antes de copiar
      const limpar = (obj) => {
        const { id, created_date, updated_date, created_by, ...rest } = obj;
        return rest;
      };

      const clientesACopiar = limite ? clientes.slice(0, limite) : clientes;
      const compromissosACopiar = limite ? compromissos.slice(0, limite) : compromissos;
      const dashboardsACopiar = limite ? dashboards.slice(0, limite) : dashboards;
      const metasACopiar = limite ? metas.slice(0, limite) : metas;
      const campanhasACopiar = limite ? campanhas.slice(0, limite) : campanhas;
      const transacoesACopiar = limite ? transacoes.slice(0, limite) : transacoes;

      // Copiar clientes
      console.log(`Iniciando cópia de ${clientesACopiar.length} clientes...`);
      for (const c of clientesACopiar) {
        try {
          const dados = limpar(c);
          await base44.entities.Cliente.create(dados);
          copiados.clientes++;
          if (copiados.clientes % 50 === 0) console.log(`Clientes copiados: ${copiados.clientes}/${clientes.length}`);
        } catch (e) {
          erros.push(`Cliente ${c.nome}: ${e.message}`);
        }
      }
      console.log(`Clientes copiados: ${copiados.clientes}`);

      // Copiar compromissos
      console.log(`Iniciando cópia de ${compromissos.length} compromissos...`);
      for (const c of compromissos) {
        try {
          const dados = limpar(c);
          if (dados.owner_email === origem || dados.owner_email === origemLower) {
            dados.owner_email = destino;
          }
          await base44.entities.Compromisso.create(dados);
          copiados.compromissos++;
          if (copiados.compromissos % 100 === 0) console.log(`Compromissos copiados: ${copiados.compromissos}/${compromissos.length}`);
        } catch (e) {
          erros.push(`Compromisso ${c.titulo}: ${e.message}`);
        }
      }
      console.log(`Compromissos copiados: ${copiados.compromissos}`);

      // Copiar dashboards
      console.log(`Iniciando cópia de ${dashboards.length} dashboards...`);
      for (const d of dashboards) {
        try {
          const dados = limpar(d);
          await base44.entities.DashboardDiario.create(dados);
          copiados.dashboards++;
        } catch (e) {
          erros.push(`Dashboard ${d.data}: ${e.message}`);
        }
      }
      console.log(`Dashboards copiados: ${copiados.dashboards}`);

      // Copiar metas
      for (const m of metas) {
        try {
          const dados = limpar(m);
          await base44.entities.Meta.create(dados);
          copiados.metas++;
        } catch (e) {
          erros.push(`Meta ${m.periodo}: ${e.message}`);
        }
      }
      console.log(`Metas copiadas: ${copiados.metas}`);

      // Copiar campanhas
      for (const c of campanhas) {
        try {
          const dados = limpar(c);
          await base44.entities.Campanha.create(dados);
          copiados.campanhas++;
        } catch (e) {
          erros.push(`Campanha ${c.titulo}: ${e.message}`);
        }
      }
      console.log(`Campanhas copiadas: ${copiados.campanhas}`);

      // Copiar transações
      for (const t of transacoes) {
        try {
          const dados = limpar(t);
          await base44.entities.Transacao.create(dados);
          copiados.transacoes++;
        } catch (e) {
          erros.push(`Transação: ${e.message}`);
        }
      }
      console.log(`Transações copiadas: ${copiados.transacoes}`);

      return Response.json({
        success: true,
        message: `Cópia concluída com sucesso!`,
        copiados,
        erros: erros.slice(0, 20),
        total_erros: erros.length,
        backup_incluido: backup.totais
      });
    }

    return Response.json({ error: 'acao deve ser "backup" ou "copiar"' }, { status: 400 });

  } catch (error) {
    console.error('Erro:', error.message, error.stack);
    return Response.json({ error: error.message }, { status: 500 });
  }
});