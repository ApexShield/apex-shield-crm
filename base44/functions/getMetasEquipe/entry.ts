import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { ano } = await req.json();
    const tipoHierarquia = user.tipo_hierarquia;

    const allUsers = await base44.asServiceRole.entities.User.list();
    const allMetas = await base44.asServiceRole.entities.Meta.list('-created_date', 5000);
    const allRecords = ano === 'todos' || !ano
      ? await base44.asServiceRole.entities.DashboardDiario.list('-data', 5000)
      : await base44.asServiceRole.entities.DashboardDiario.filter({ ano: parseInt(ano) }, '-data', 5000);

    function getUserField(u, field) {
      if (u[field] !== undefined && u[field] !== null && u[field] !== '') return u[field];
      if (u.data && u.data[field] !== undefined && u.data[field] !== null && u.data[field] !== '') return u.data[field];
      return undefined;
    }

    function findSubordinates(leaderEmail, leaderId) {
      return allUsers.filter(u => {
        if (u.email === leaderEmail) return false;
        const lEmail = u.lider_email || (u.data && u.data.lider_email);
        const lId = u.lider_id || (u.data && u.data.lider_id);
        return (lEmail === leaderEmail || (leaderId && lId === leaderId));
      });
    }

    function findAllDescendants(leaderEmail, leaderId) {
      const directSubs = findSubordinates(leaderEmail, leaderId);
      let all = [...directSubs];
      for (const sub of directSubs) {
        all = all.concat(findAllDescendants(sub.email, sub.id));
      }
      return all;
    }

    function buildMemberData(email, nome, tipo) {
      return {
        email,
        nome,
        tipo,
        metas: allMetas.filter(m => m.created_by === email),
        records: allRecords.filter(r => r.created_by === email),
      };
    }

    let result = {};

    if (tipoHierarquia === "Líder de Agência") {
      const directSubs = findSubordinates(user.email, user.id);
      const unitLeaders = directSubs.filter(u => getUserField(u, 'tipo_hierarquia') === "Líder de Unidade");
      const directBrokers = directSubs.filter(u => getUserField(u, 'tipo_hierarquia') !== "Líder de Unidade");

      const unidades = {};
      for (const leader of unitLeaders) {
        const unitMembers = findSubordinates(leader.email, leader.id);
        const membros = {};

        membros[leader.email] = buildMemberData(leader.email, leader.full_name || leader.email, "Líder de Unidade");
        for (const m of unitMembers) {
          membros[m.email] = buildMemberData(m.email, m.full_name || m.email, getUserField(m, 'tipo_hierarquia') || "Corretor");
        }

        unidades[leader.id] = {
          id: leader.id,
          nome: getUserField(leader, 'unidade_nome') || `Unidade de ${leader.full_name || leader.email}`,
          lider_nome: leader.full_name || leader.email,
          lider_email: leader.email,
          membros,
        };
      }

      if (directBrokers.length > 0) {
        const membros = {};
        for (const b of directBrokers) {
          membros[b.email] = buildMemberData(b.email, b.full_name || b.email, getUserField(b, 'tipo_hierarquia') || "Corretor");
        }
        unidades["direct_brokers"] = {
          id: "direct_brokers",
          nome: "Corretores Diretos",
          lider_nome: user.full_name || user.email,
          lider_email: user.email,
          membros,
        };
      }

      result = {
        tipo: "LiderAgencia",
        agencia_nome: getUserField(user, 'agencia_nome') || "Minha Agência",
        unidades,
        meusDados: buildMemberData(user.email, user.full_name || user.email, "Líder de Agência"),
      };

    } else if (tipoHierarquia === "Líder de Unidade") {
      const subordinates = findSubordinates(user.email, user.id);
      const membros = {};
      for (const u of subordinates) {
        membros[u.email] = buildMemberData(u.email, u.full_name || u.email, getUserField(u, 'tipo_hierarquia') || "Corretor");
      }

      result = {
        tipo: "LiderUnidade",
        unidade_nome: getUserField(user, 'unidade_nome') || "Minha Unidade",
        membros,
        meusDados: buildMemberData(user.email, user.full_name || user.email, "Líder de Unidade"),
      };

    } else {
      result = {
        tipo: "Corretor",
        meusDados: buildMemberData(user.email, user.full_name || user.email, "Corretor"),
      };
    }

    return Response.json(result);
  } catch (error) {
    console.error('getMetasEquipe error:', error.message, error.stack);
    return Response.json({ error: error.message }, { status: 500 });
  }
});