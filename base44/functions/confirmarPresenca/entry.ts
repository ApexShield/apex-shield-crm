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

    // Validate that the compromisso exists and only allow confirm/refuse actions
    const comp = await base44.asServiceRole.entities.Compromisso.get(compromisso_id);
    if (!comp) {
      return new Response(renderHTML('Erro', 'Compromisso não encontrado.', 'error'), {
        status: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    if (action !== 'confirmar' && action !== 'recusar') {
      return new Response(renderHTML('Erro', 'Ação inválida.', 'error'), {
        status: 400,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    const confirmou = action === 'confirmar';
    const recusou = action === 'recusar';
    await base44.asServiceRole.entities.Compromisso.update(compromisso_id, {
      convidado_confirmou: confirmou,
      convidado_recusou: recusou
    });

    const titulo = confirmou ? 'Presença Confirmada!' : 'Resposta Registrada';
    const mensagem = confirmou
      ? 'Obrigado por confirmar sua presença! Estamos ansiosos para te encontrar. Você receberá um lembrete antes do compromisso.'
      : 'Sua resposta foi registrada com sucesso. Obrigado por nos informar. Caso mude de ideia, entre em contato com o organizador.';
    const tipo = confirmou ? 'success' : 'info';

    return new Response(renderHTML(titulo, mensagem, tipo), {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(renderHTML('Erro', 'Ocorreu um erro ao processar sua resposta. Por favor, tente novamente mais tarde.', 'error'), {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
});

function renderHTML(titulo, mensagem, tipo) {
  const configs = {
    success: { gradient: 'linear-gradient(135deg, #059669, #10b981)', icon: '✅', accent: '#059669' },
    info: { gradient: 'linear-gradient(135deg, #4f46e5, #7c3aed)', icon: '📋', accent: '#4f46e5' },
    error: { gradient: 'linear-gradient(135deg, #dc2626, #ef4444)', icon: '⚠️', accent: '#dc2626' }
  };
  const c = configs[tipo] || configs.info;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titulo} - APEX SHIELD CRM</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%); display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
    .card { background: white; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.1); max-width: 480px; width: 100%; overflow: hidden; text-align: center; }
    .header { background: ${c.gradient}; padding: 48px 32px 40px; position: relative; }
    .header::after { content: ''; position: absolute; bottom: -1px; left: 0; right: 0; height: 24px; background: white; border-radius: 24px 24px 0 0; }
    .icon-wrap { width: 80px; height: 80px; background: rgba(255,255,255,0.2); backdrop-filter: blur(10px); border-radius: 20px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; border: 2px solid rgba(255,255,255,0.3); }
    .icon-wrap span { font-size: 36px; }
    .header h1 { color: white; font-size: 22px; font-weight: 800; letter-spacing: -0.02em; }
    .body { padding: 24px 32px 32px; }
    .body p { color: #475569; font-size: 15px; line-height: 1.7; }
    .divider { width: 48px; height: 3px; background: ${c.accent}; border-radius: 2px; margin: 24px auto; opacity: 0.3; }
    .footer { padding: 20px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; }
    .footer-logo { display: flex; align-items: center; justify-content: center; gap: 8px; }
    .footer-dot { width: 8px; height: 8px; background: ${c.accent}; border-radius: 50%; }
    .footer p { color: #94a3b8; font-size: 11px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="icon-wrap"><span>${c.icon}</span></div>
      <h1>${titulo}</h1>
    </div>
    <div class="body">
      <p>${mensagem}</p>
      <div class="divider"></div>
      <p style="font-size:13px;color:#94a3b8;">Esta é uma mensagem automática do APEX SHIELD CRM.</p>
    </div>
    <div class="footer">
      <div class="footer-logo">
        <div class="footer-dot"></div>
        <p>APEX SHIELD CRM</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}