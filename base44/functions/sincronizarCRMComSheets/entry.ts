import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Autenticar usuário
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'admin') {
      return Response.json({ error: 'Acesso restrito a administradores' }, { status: 403 });
    }

    // Obter parâmetros
    const { spreadsheetId } = await req.json();

    // Obter token do Google Sheets
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googlesheets');

    // Buscar clientes do usuário (respeitando RLS)
    const clientes = await base44.entities.Cliente.list('-created_date', 10000);

    // Preparar cabeçalhos
    const headers = [
      'Código',
      'Nome',
      'CPF',
      'Status',
      'Telefone',
      'Email',
      'Empresa',
      'Cargo',
      'Fonte Prospecção',
      'Idade',
      'Profissão',
      'Estado Civil',
      'Plano Saúde',
      'Seguro Vida',
      'Data Cadastro',
      'Criado Por'
    ];

    // Preparar linhas de dados
    const rows = clientes.map(cliente => [
      cliente.codigo || '',
      cliente.nome || '',
      cliente.cpf || '',
      cliente.status || '',
      cliente.telefone || '',
      cliente.email || '',
      cliente.empresa || '',
      cliente.cargo || '',
      cliente.fonte_prospeccao || '',
      cliente.idade || '',
      cliente.profissao || '',
      cliente.estado_civil || '',
      cliente.plano_saude || '',
      cliente.seguro_vida || '',
      cliente.data_cadastro || cliente.created_date?.split('T')[0] || '',
      cliente.created_by || ''
    ]);

    // Adicionar cabeçalhos no início
    const allRows = [headers, ...rows];

    let finalSpreadsheetId = spreadsheetId;
    let spreadsheetUrl;

    // Se não foi fornecido spreadsheetId, criar nova planilha
    if (!spreadsheetId) {
      const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: {
            title: `CRM Apex Shield - ${new Date().toISOString().split('T')[0]}`
          },
          sheets: [{
            properties: {
              title: 'Clientes'
            }
          }]
        })
      });

      if (!createResponse.ok) {
        const error = await createResponse.text();
        console.error('Erro ao criar planilha:', error);
        return Response.json({ 
          success: false, 
          error: 'Erro ao criar planilha no Google Sheets' 
        }, { status: 500 });
      }

      const newSpreadsheet = await createResponse.json();
      finalSpreadsheetId = newSpreadsheet.spreadsheetId;
      spreadsheetUrl = newSpreadsheet.spreadsheetUrl;
    }

    // Limpar dados existentes e escrever novos dados
    const range = 'Clientes!A1';
    const updateResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${finalSpreadsheetId}/values/${range}?valueInputOption=RAW`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: allRows
        })
      }
    );

    if (!updateResponse.ok) {
      const error = await updateResponse.text();
      console.error('Erro ao atualizar planilha:', error);
      return Response.json({ 
        success: false, 
        error: 'Erro ao atualizar dados na planilha' 
      }, { status: 500 });
    }

    // Formatar cabeçalho (negrito e cor de fundo)
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${finalSpreadsheetId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requests: [
            {
              repeatCell: {
                range: {
                  sheetId: 0,
                  startRowIndex: 0,
                  endRowIndex: 1
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: {
                      red: 0.26,
                      green: 0.32,
                      blue: 0.71
                    },
                    textFormat: {
                      foregroundColor: {
                        red: 1.0,
                        green: 1.0,
                        blue: 1.0
                      },
                      bold: true
                    }
                  }
                },
                fields: 'userEnteredFormat(backgroundColor,textFormat)'
              }
            },
            {
              autoResizeDimensions: {
                dimensions: {
                  sheetId: 0,
                  dimension: 'COLUMNS',
                  startIndex: 0,
                  endIndex: headers.length
                }
              }
            }
          ]
        })
      }
    );

    return Response.json({
      success: true,
      spreadsheetId: finalSpreadsheetId,
      spreadsheetUrl: spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${finalSpreadsheetId}`,
      totalClientes: clientes.length,
      message: 'Dados sincronizados com sucesso'
    });

  } catch (error) {
    console.error('Erro ao sincronizar CRM com Sheets:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});