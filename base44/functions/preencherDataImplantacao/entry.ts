import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const clienteIds = body.cliente_ids || []; // optional: process specific clients

    // Get clients
    let clientes;
    if (clienteIds.length > 0) {
      // Process specific clients
      const allClientes = await base44.entities.Cliente.filter({}, '-created_date', 5000);
      clientes = allClientes.filter(c => clienteIds.includes(c.id));
    } else {
      // Process all clients without data_implantacao that have documents
      const allClientes = await base44.entities.Cliente.filter({}, '-created_date', 5000);
      clientes = allClientes.filter(c => {
        const temDocumentos = c.documentos && c.documentos.length > 0;
        const semDataImplantacao = !c.dados_apolice?.data_implantacao;
        return temDocumentos && semDataImplantacao;
      });
    }

    console.log(`Processando ${clientes.length} clientes...`);

    const resultados = [];
    let sucesso = 0;
    let erro = 0;
    let semDoc = 0;

    for (const cliente of clientes) {
      try {
        const docs = cliente.documentos || [];
        if (docs.length === 0) {
          semDoc++;
          resultados.push({ nome: cliente.nome, status: 'sem_documentos' });
          continue;
        }

        // Find the policy document (PDF preferred)
        let docUrl = null;
        // Priority: look for PDF files first, then any file
        const pdfDoc = docs.find(d => d.nome?.toLowerCase().includes('.pdf') || d.url?.toLowerCase().includes('.pdf'));
        if (pdfDoc) {
          docUrl = pdfDoc.url;
        } else {
          // Try the first document
          docUrl = docs[0].url;
        }

        if (!docUrl) {
          semDoc++;
          resultados.push({ nome: cliente.nome, status: 'url_invalida' });
          continue;
        }

        console.log(`Extraindo data de ${cliente.nome} - Doc: ${docUrl}`);

        // Extract date from document
        const schema = {
          type: "object",
          properties: {
            data_inicio_vigencia: {
              type: "string",
              description: "Data de início de vigência da apólice no formato DD/MM/YYYY. Pode aparecer como 'Início de Vigência', 'Data de Emissão', 'Vigência a partir de', 'Data da Proposta' ou similar. Busque a data mais relevante que indique quando o seguro começou a valer."
            }
          }
        };

        const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
          file_url: docUrl,
          json_schema: schema
        });

        if (result.status === "success" && result.output?.data_inicio_vigencia) {
          const rawDate = result.output.data_inicio_vigencia;
          
          // Convert DD/MM/YYYY to YYYY-MM-DD
          let isoDate = "";
          const match = rawDate.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/);
          if (match) {
            isoDate = `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
          } else if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
            isoDate = rawDate;
          }

          if (isoDate) {
            // Update the client's dados_apolice with data_implantacao
            const dadosApolice = cliente.dados_apolice || {};
            dadosApolice.data_implantacao = isoDate;
            
            await base44.entities.Cliente.update(cliente.id, {
              dados_apolice: dadosApolice
            });
            
            sucesso++;
            resultados.push({ nome: cliente.nome, status: 'sucesso', data: isoDate });
            console.log(`✅ ${cliente.nome}: ${isoDate}`);
          } else {
            erro++;
            resultados.push({ nome: cliente.nome, status: 'data_invalida', raw: rawDate });
            console.log(`❌ ${cliente.nome}: data inválida - ${rawDate}`);
          }
        } else {
          erro++;
          resultados.push({ nome: cliente.nome, status: 'nao_encontrada', details: result.details });
          console.log(`❌ ${cliente.nome}: data não encontrada`);
        }
      } catch (clienteError) {
        erro++;
        resultados.push({ nome: cliente.nome, status: 'erro', message: clienteError.message });
        console.error(`Erro ao processar ${cliente.nome}:`, clienteError.message);
      }
    }

    console.log(`Concluído: ${sucesso} sucesso, ${erro} erros, ${semDoc} sem documentos`);
    
    return Response.json({
      success: true,
      total: clientes.length,
      sucesso,
      erro,
      sem_documentos: semDoc,
      resultados
    });
  } catch (error) {
    console.error('Erro geral:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});