import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ano } = await req.json();
    const tipoHierarquia = user.tipo_hierarquia;

    const allUsers = await base44.asServiceRole.entities.User.list();
    const allRecords = await base44.asServiceRole.entities.DashboardDiario.filter({ ano }, "-data", 5000);

    // Helper: find all subordinates recursively using lider_email/lider_id
    function findSubordinates(leaderEmail, leaderId) {
      return allUsers.filter(u => 
        u.email !== leaderEmail && 
        (u.lider_email === leaderEmail || (leaderId && u.lider_id === leaderId))
      );
    }

    // Helper: find ALL descendants recursively (subordinates of subordinates)
    function findAllDescendants(leaderEmail, leaderId) {
      const directSubs = findSubordinates(leaderEmail, leaderId);
      let all = [...directSubs];
      for (const sub of directSubs) {
        const subSubs = findAllDescendants(sub.email, sub.id);
        all = all.concat(subSubs);
      }
      return all;
    }

    let result = {};

    if (tipoHierarquia === "Líder de Agência") {
      // Find all direct subordinates (Líderes de Unidade)
      const directSubs = findSubordinates(user.email, user.id);
      const unitLeaders = directSubs.filter(u => u.tipo_hierarquia === "Líder de Unidade");
      const directBrokers = directSubs.filter(u => u.tipo_hierarquia !== "Líder de Unidade");

      // Build units from unit leaders
      const unidades = {};
      for (const leader of unitLeaders) {
        const unitMembers = findSubordinates(leader.email, leader.id);
        const allUnitEmails = [leader.email, ...unitMembers.map(u => u.email)];
        const unitRecords = allRecords.filter(r => allUnitEmails.includes(r.created_by));

        const membros = {};
        // Add unit leader
        const leaderRecords = allRecords.filter(r => r.created_by === leader.email);
        membros[leader.email] = {
          nome: leader.full_name || leader.email,
          email: leader.email,
          tipo: "LiderUnidade",
          records: leaderRecords
        };
        // Add unit members
        for (const m of unitMembers) {
          const memberRecords = allRecords.filter(r => r.created_by === m.email);
          membros[m.email] = {
            nome: m.full_name || m.email,
            email: m.email,
            tipo: m.tipo_hierarquia || "Corretor",
            records: memberRecords
          };
        }

        unidades[leader.id] = {
          id: leader.id,
          nome: leader.unidade_nome || `Unidade de ${leader.full_name || leader.email}`,
          lider_nome: leader.full_name || leader.email,
          lider_email: leader.email,
          totalRecords: unitRecords,
          membros
        };
      }

      // Direct brokers not under any unit leader
      if (directBrokers.length > 0) {
        const brokerEmails = directBrokers.map(u => u.email);
        const brokerRecords = allRecords.filter(r => brokerEmails.includes(r.created_by));
        const membros = {};
        for (const b of directBrokers) {
          const bRecords = allRecords.filter(r => r.created_by === b.email);
          membros[b.email] = {
            nome: b.full_name || b.email,
            email: b.email,
            tipo: b.tipo_hierarquia || "Corretor",
            records: bRecords
          };
        }
        unidades["direct_brokers"] = {
          id: "direct_brokers",
          nome: "Corretores Diretos",
          lider_nome: user.full_name || user.email,
          lider_email: user.email,
          totalRecords: brokerRecords,
          membros
        };
      }

      // All descendant emails for total
      const allDescendants = findAllDescendants(user.email, user.id);
      const allTeamEmails = [user.email, ...allDescendants.map(u => u.email)];
      const allTeamRecords = allRecords.filter(r => allTeamEmails.includes(r.created_by));

      result = {
        tipo: "LiderAgencia",
        agencia_nome: user.agencia_nome || "Minha Agência",
        unidades,
        totalRecords: allTeamRecords,
        meus_dados: allRecords.filter(r => r.created_by === user.email)
      };

    } else if (tipoHierarquia === "Líder de Unidade") {
      // Find all direct subordinates (corretores)
      const subordinates = findSubordinates(user.email, user.id);

      const membros = {};
      for (const u of subordinates) {
        const userRecords = allRecords.filter(r => r.created_by === u.email);
        membros[u.email] = {
          nome: u.full_name || u.email,
          email: u.email,
          tipo: u.tipo_hierarquia || "Corretor",
          records: userRecords
        };
      }

      const allUnitEmails = [user.email, ...subordinates.map(u => u.email)];
      const totalRecords = allRecords.filter(r => allUnitEmails.includes(r.created_by));

      result = {
        tipo: "LiderUnidade",
        unidade_nome: user.unidade_nome || "Minha Unidade",
        totalRecords,
        membros,
        meus_dados: allRecords.filter(r => r.created_by === user.email)
      };

    } else {
      result = {
        tipo: "Corretor",
        meus_dados: allRecords.filter(r => r.created_by === user.email)
      };
    }

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});