import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Autenticar usuário
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Obter dados do cliente
    const { clienteId, tipoContrato, valorSeguro, vigencia } = await req.json();

    if (!clienteId) {
      return Response.json({ error: 'ID do cliente não fornecido' }, { status: 400 });
    }

    // Buscar dados do cliente
    const cliente = await base44.asServiceRole.entities.Cliente.list();
    const clienteData = cliente.find(c => c.id === clienteId);

    if (!clienteData) {
      return Response.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    // Obter token do Google Docs
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googledocs');

    // Criar documento
    const createResponse = await fetch('https://docs.googleapis.com/v1/documents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: `Contrato - ${clienteData.nome} - ${new Date().toISOString().split('T')[0]}`
      })
    });

    if (!createResponse.ok) {
      const error = await createResponse.text();
      console.error('Erro ao criar documento:', error);
      return Response.json({ 
        success: false, 
        error: 'Erro ao criar documento no Google Docs' 
      }, { status: 500 });
    }

    const doc = await createResponse.json();
    const documentId = doc.documentId;

    // Preparar conteúdo do contrato
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    
    const requests = [
      {
        insertText: {
          location: { index: 1 },
          text: `CONTRATO DE PRESTAÇÃO DE SERVIÇOS - SEGURO DE VIDA\n\n`
        }
      },
      {
        insertText: {
          location: { index: 1 },
          text: `Data: ${dataAtual}\n\n`
        }
      },
      {
        insertText: {
          location: { index: 1 },
          text: `CONTRATANTE:\n`
        }
      },
      {
        insertText: {
          location: { index: 1 },
          text: `Nome: ${clienteData.nome || 'N/A'}\n`
        }
      },
      {
        insertText: {
          location: { index: 1 },
          text: `CPF: ${clienteData.cpf || 'N/A'}\n`
        }
      },
      {
        insertText: {
          location: { index: 1 },
          text: `Email: ${clienteData.email || 'N/A'}\n`
        }
      },
      {
        insertText: {
          location: { index: 1 },
          text: `Telefone: ${clienteData.telefone || 'N/A'}\n`
        }
      },
      {
        insertText: {
          location: { index: 1 },
          text: `Data de Nascimento: ${clienteData.data_nascimento || 'N/A'}\n\n`
        }
      },
      {
        insertText: {
          location: { index: 1 },
          text: `DADOS DO CONTRATO:\n`
        }
      },
      {
        insertText: {
          location: { index: 1 },
          text: `Tipo de Seguro: ${tipoContrato || 'Seguro de Vida'}\n`
        }
      },
      {
        insertText: {
          location: { index: 1 },
          text: `Valor do Seguro: R$ ${valorSeguro || 'A definir'}\n`
        }
      },
      {
        insertText: {
          location: { index: 1 },
          text: `Vigência: ${vigencia || '12 meses'}\n\n`
        }
      },
      {
        insertText: {
          location: { index: 1 },
          text: `CLÁUSULAS:\n\n`
        }
      },
      {
        insertText: {
          location: { index: 1 },
          text: `1. DO OBJETO\n`
        }
      },
      {
        insertText: {
          location: { index: 1 },
          text: `O presente contrato tem por objeto a contratação de seguro de vida para cobertura de riscos conforme especificado na apólice.\n\n`
        }
      },
      {
        insertText: {
          location: { index: 1 },
          text: `2. DAS COBERTURAS\n`
        }
      },
      {
        insertText: {
          location: { index: 1 },
          text: `O seguro contratado oferece as seguintes coberturas:\n- Morte Natural\n- Morte Acidental\n- Invalidez Permanente Total ou Parcial\n- Doenças Graves\n\n`
        }
      },
      {
        insertText: {
          location: { index: 1 },
          text: `3. DO PAGAMENTO\n`
        }
      },
      {
        insertText: {
          location: { index: 1 },
          text: `O pagamento do prêmio será realizado mensalmente, com vencimento no dia 10 de cada mês.\n\n`
        }
      },
      {
        insertText: {
          location: { index: 1 },
          text: `4. DA VIGÊNCIA\n`
        }
      },
      {
        insertText: {
          location: { index: 1 },
          text: `Este contrato tem vigência de ${vigencia || '12 meses'}, podendo ser renovado mediante acordo entre as partes.\n\n`
        }
      },
      {
        insertText: {
          location: { index: 1 },
          text: `5. DO CANCELAMENTO\n`
        }
      },
      {
        insertText: {
          location: { index: 1 },
          text: `O cancelamento poderá ser solicitado pelo contratante a qualquer momento, mediante notificação prévia de 30 dias.\n\n`
        }
      },
      {
        insertText: {
          location: { index: 1 },
          text: `ASSINATURAS:\n\n`
        }
      },
      {
        insertText: {
          location: { index: 1 },
          text: `_________________________________\n`
        }
      },
      {
        insertText: {
          location: { index: 1 },
          text: `${clienteData.nome}\nContratante\n\n`
        }
      },
      {
        insertText: {
          location: { index: 1 },
          text: `_________________________________\n`
        }
      },
      {
        insertText: {
          location: { index: 1 },
          text: `Apex Shield Seguros\nContratada\n`
        }
      }
    ];

    // Aplicar formatação
    const batchUpdateResponse = await fetch(
      `https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ requests: requests.reverse() })
      }
    );

    if (!batchUpdateResponse.ok) {
      const error = await batchUpdateResponse.text();
      console.error('Erro ao atualizar documento:', error);
      return Response.json({ 
        success: false, 
        error: 'Erro ao preencher documento' 
      }, { status: 500 });
    }

    // Formatar título
    await fetch(
      `https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requests: [
            {
              updateTextStyle: {
                range: {
                  startIndex: 1,
                  endIndex: 50
                },
                textStyle: {
                  bold: true,
                  fontSize: {
                    magnitude: 16,
                    unit: 'PT'
                  }
                },
                fields: 'bold,fontSize'
              }
            }
          ]
        })
      }
    );

    return Response.json({
      success: true,
      documentId: documentId,
      documentUrl: `https://docs.google.com/document/d/${documentId}/edit`,
      clienteNome: clienteData.nome,
      message: 'Contrato gerado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao gerar contrato:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});