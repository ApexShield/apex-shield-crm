import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const { nome, username, comentario, palavra_gatilho, prioridade, fonte } = await req.json();

    const novoLead = await base44.asServiceRole.entities.Cliente.create({
      nome: nome || `Lead Instagram (@${username})`,
      status: "Novo",
      fonte_prospeccao: fonte || "Marketing de Conteúdo - Instagram",
      data_cadastro: new Date().toISOString().split("T")[0],
      data_contato: new Date().toISOString().split("T")[0],
      observacoes: [{
        data: new Date().toLocaleDateString("pt-BR"),
        texto: `Lead capturado automaticamente. Perfil: @${username || "desconhecido"} | Comentário: "${comentario || ""}" | Palavra-gatilho: ${palavra_gatilho || ""} | Prioridade: ${prioridade || "normal"}`
      }],
      historico_status: [{
        de: "",
        para: "Novo",
        data: new Date().toLocaleDateString("pt-BR")
      }]
    });

    return Response.json({ success: true, lead_id: novoLead.id, lead: novoLead });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}