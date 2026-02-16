import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);

    let compromisso_id, action;

    // Support both GET (from email links) and POST
    if (req.method === 'GET') {
      compromisso_id = url.searchParams.get('id');
      action = url.searchParams.get('action');
    } else {
      const body = await req.json();
      compromisso_id = body.compromisso_id;
      action = body.action;
    }

    if (!compromisso_id || !action) {
      return new Response(renderHTML('Erro', 'Link inválido. Parâmetros ausentes.', 'error'), {
        status: 400,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    // Use service role since the participant is not a logged-in user
    const confirmou = action === 'confirmar';
    await base44.asServiceRole.entities.Compromisso.update(compromisso_id, {
      convidado_confirmou: confirmou
    });

    const titulo = confirmou ? 'Presença Confirmada! ✅' : 'Presença Recusada';
    const mensagem = confirmou
      ? 'Obrigado por confirmar sua presença! Nos vemos em breve.'
      : 'Sua resposta foi registrada. Obrigado por nos informar.';
    const tipo = confirmou ? 'success' : 'info';

    return new Response(renderHTML(titulo, mensagem, tipo), {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(renderHTML('Erro', 'Ocorreu um erro ao processar sua resposta. Tente novamente.', 'error'), {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
});

function renderHTML(titulo, mensagem, tipo) {
  const colors = {
    success: { bg: '#10b981', icon: '✅' },
    info: { bg: '#6366f1', icon: '📋' },
    error: { bg: '#ef4444', icon: '❌' }
  };
  const c = colors[tipo] || colors.info;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titulo} - APEX SHIELD CRM</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f1f5f9; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
    .card { background: white; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.1); max-width: 480px; width: 100%; overflow: hidden; text-align: center; }
    .header { background: ${c.bg}; padding: 40px 30px; }
    .header .icon { font-size: 48px; margin-bottom: 12px; }
    .header h1 { color: white; font-size: 24px; font-weight: 700; }
    .body { padding: 30px; }
    .body p { color: #475569; font-size: 16px; line-height: 1.6; }
    .footer { padding: 20px 30px; background: #f8fafc; border-top: 1px solid #e2e8f0; }
    .footer p { color: #94a3b8; font-size: 12px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="icon">${c.icon}</div>
      <h1>${titulo}</h1>
    </div>
    <div class="body">
      <p>${mensagem}</p>
    </div>
    <div class="footer">
      <p>APEX SHIELD CRM - Gestão Profissional</p>
    </div>
  </div>
</body>
</html>`;
}