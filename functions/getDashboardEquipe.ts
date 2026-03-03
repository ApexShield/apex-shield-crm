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

    // Get all users to build hierarchy
    const allUsers = await base44.asServiceRole.entities.User.list();
    
    // Get all dashboard records for the year using service role
    const allRecords = await base44.asServiceRole.entities.DashboardDiario.filter({ ano }, "-data", 5000);

    let result = {};

    if (tipoHierarquia === "LiderAgencia" && user.agencia_id) {
      // Líder de Agência: see all units and brokers under their agency
      const unidades = await base44.asServiceRole.entities.Unidade.filter({ agencia_id: user.agencia_id });
      
      // Find unit leaders
      const unitLeaderEmails = unidades.map(u => u.lider_unidade_email).filter(Boolean);
      
      // Find all users in agency units (brokers under unit leaders)
      const usersInAgency = allUsers.filter(u => 
        u.agencia_id === user.agencia_id && u.email !== user.email
      );

      // Group by unit
      const unitMap = {};
      for (const unidade of unidades) {
        const unitUsers = usersInAgency.filter(u => u.unidade_id === unidade.id);
        const unitEmails = unitUsers.map(u => u.email);
        // Also include the unit leader
        if (unidade.lider_unidade_email) unitEmails.push(unidade.lider_unidade_email);
        
        const unitRecords = allRecords.filter(r => unitEmails.includes(r.created_by));
        
        // Individual breakdown
        const membros = {};
        for (const u of unitUsers) {
          const userRecords = allRecords.filter(r => r.created_by === u.email);
          if (userRecords.length > 0) {
            membros[u.email] = {
              nome: u.full_name || u.email,
              email: u.email,
              tipo: u.tipo_hierarquia || "UsuarioVIP",
              records: userRecords
            };
          }
        }
        // Add unit leader if they have records
        if (unidade.lider_unidade_email) {
          const liderUser = allUsers.find(u => u.email === unidade.lider_unidade_email);
          const liderRecords = allRecords.filter(r => r.created_by === unidade.lider_unidade_email);
          if (liderRecords.length > 0 && liderUser) {
            membros[liderUser.email] = {
              nome: liderUser.full_name || liderUser.email,
              email: liderUser.email,
              tipo: "LiderUnidade",
              records: liderRecords
            };
          }
        }

        unitMap[unidade.id] = {
          id: unidade.id,
          nome: unidade.nome,
          lider_nome: unidade.lider_unidade_nome || "Sem líder",
          lider_email: unidade.lider_unidade_email,
          totalRecords: unitRecords,
          membros
        };
      }

      result = {
        tipo: "LiderAgencia",
        agencia_nome: user.agencia_nome,
        unidades: unitMap,
        meus_dados: allRecords.filter(r => r.created_by === user.email)
      };

    } else if (tipoHierarquia === "LiderUnidade" && user.unidade_id) {
      // Líder de Unidade: see all brokers in their unit
      const usersInUnit = allUsers.filter(u => 
        u.unidade_id === user.unidade_id && u.email !== user.email
      );

      const membros = {};
      for (const u of usersInUnit) {
        const userRecords = allRecords.filter(r => r.created_by === u.email);
        if (userRecords.length > 0) {
          membros[u.email] = {
            nome: u.full_name || u.email,
            email: u.email,
            tipo: u.tipo_hierarquia || "UsuarioVIP",
            records: userRecords
          };
        }
      }

      const allUnitEmails = [...usersInUnit.map(u => u.email), user.email];
      const totalRecords = allRecords.filter(r => allUnitEmails.includes(r.created_by));

      result = {
        tipo: "LiderUnidade",
        unidade_nome: user.unidade_nome,
        totalRecords,
        membros,
        meus_dados: allRecords.filter(r => r.created_by === user.email)
      };

    } else {
      // Corretor or no hierarchy: only own data
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