import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get all clients with policy data
    const clientes = await base44.asServiceRole.entities.Cliente.filter({}, '-created_date', 5000);
    
    const hoje = new Date();
    const em7dias = new Date(hoje);
    em7dias.setDate(em7dias.getDate() + 7);
    
    const mesAniv = em7dias.getMonth() + 1; // 1-12
    const diaAniv = em7dias.getDate();
    
    const notificados = [];

    for (const cliente of clientes) {
      const dataImpl = cliente.dados_apolice?.data_implantacao;
      if (!dataImpl) continue;

      // Parse date (YYYY-MM-DD)
      const parts = dataImpl.split('-');
      if (parts.length !== 3) continue;
      
      const mesImplantacao = parseInt(parts[1]);
      const diaImplantacao = parseInt(parts[2]);
      
      // Check if 7 days from now is the anniversary
      if (mesImplantacao === mesAniv && diaImplantacao === diaAniv) {
        const anosDesdeImplantacao = hoje.getFullYear() - parseInt(parts[0]);
        const corretorEmail = cliente.created_by;
        
        if (!corretorEmail) continue;
        
        // Send email notification to the corretor
        const dataAnivFormatada = `${String(diaAniv).padStart(2, '0')}/${String(mesAniv).padStart(2, '0')}`;
        
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: corretorEmail,
          subject: `🔔 Aniversário de Apólice em 7 dias - ${cliente.nome}`,
          body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 20px; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 20px;">🎂 Aniversário de Apólice</h1>
            </div>
            <div style="background: #f8fafc; padding: 20px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
              <p style="color: #334155; font-size: 14px;">Olá!</p>
              <p style="color: #334155; font-size: 14px;">A apólice do cliente <strong>${cliente.nome}</strong> fará aniversário de <strong>${anosDesdeImplantacao} ano(s)</strong> no dia <strong>${dataAnivFormatada}</strong>.</p>
              <p style="color: #334155; font-size: 14px;">Produto: <strong>${cliente.dados_apolice?.produto || 'Não informado'}</strong></p>
              <p style="color: #334155; font-size: 14px;">Aproveite para entrar em contato e reforçar o relacionamento!</p>
              ${cliente.telefone ? `<p style="color: #334155; font-size: 14px;">📱 Telefone: <strong>${cliente.telefone}</strong></p>` : ''}
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;">
              <p style="color: #94a3b8; font-size: 12px;">APEX SHIELD CRM - Lembrete automático</p>
            </div>
          </div>`
        });

        notificados.push({ nome: cliente.nome, data_implantacao: dataImpl, corretor: corretorEmail });
        console.log(`Notificação enviada para ${corretorEmail} sobre aniversário de apólice de ${cliente.nome}`);
      }
    }

    console.log(`Total de notificações enviadas: ${notificados.length}`);
    return Response.json({ 
      success: true, 
      notificados: notificados.length,
      detalhes: notificados 
    });
  } catch (error) {
    console.error('Erro ao verificar aniversários de apólice:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});