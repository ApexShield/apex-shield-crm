import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ── Get user's own Google token ──
async function getUserGoogleToken(base44, userEmail) {
  for (const entityName of ['UserGoogleAuth']) {
    const auths = await base44.asServiceRole.entities[entityName].filter({ user_email: userEmail });
    if (auths.length === 0) continue;
    const auth = auths[0];
    const tokenExpiry = new Date(auth.token_expiry);
    if (tokenExpiry > new Date()) {
      return { access_token: auth.access_token, google_email: auth.google_email };
    }
    if (auth.refresh_token) {
      const CLIENT_ID = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID");
      const CLIENT_SECRET = Deno.env.get("google_oauth_client_secret");
      const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, refresh_token: auth.refresh_token, grant_type: 'refresh_token' })
      });
      if (refreshRes.ok) {
        const newTokens = await refreshRes.json();
        await base44.asServiceRole.entities[entityName].update(auth.id, {
          access_token: newTokens.access_token,
          token_expiry: new Date(Date.now() + (newTokens.expires_in * 1000)).toISOString()
        });
        return { access_token: newTokens.access_token, google_email: auth.google_email };
      }
    }
  }
  return null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { event, data } = await req.json();
    
    if (!data?.email || !data?.nome) {
      return Response.json({ success: false, error: 'Email ou nome do lead não fornecido' }, { status: 400 });
    }

    // Get USER'S OWN Google token (not shared connector)
    const userAuth = await getUserGoogleToken(base44, user.email);
    
    if (!userAuth) {
      console.log(`Usuário ${user.email} não tem Google conectado. Usando SendEmail como fallback.`);
      // Fallback: usa SendEmail da plataforma mas com o nome do corretor
      const corretorNome = user.full_name || 'Corretor';
      await base44.integrations.Core.SendEmail({
        from_name: corretorNome,
        to: data.email,
        subject: `Bem-vindo(a)! - ${corretorNome}`,
        body: buildHTML(data.nome, corretorNome, user.email)
      });
      return Response.json({ success: true, method: 'sendEmail_fallback', leadEmail: data.email });
    }

    const accessToken = userAuth.access_token;
    const senderEmail = userAuth.google_email;
    const corretorNome = user.full_name || 'Corretor';
    
    console.log(`Enviando email de boas-vindas via Gmail do usuário: ${senderEmail}`);

    const html = buildHTML(data.nome, corretorNome, senderEmail);
    const subject = `Bem-vindo(a)! - ${corretorNome}`;

    const subjectB64 = btoa(unescape(encodeURIComponent(subject)));
    const bodyB64 = btoa(unescape(encodeURIComponent(html)));
    const mime = `From: "${corretorNome}" <${senderEmail}>\r\nTo: ${data.email}\r\nSubject: =?UTF-8?B?${subjectB64}?=\r\nMIME-Version: 1.0\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n${bodyB64}`;
    const rawBytes = new TextEncoder().encode(mime);
    let bin = '';
    for (let i = 0; i < rawBytes.length; i++) bin += String.fromCharCode(rawBytes[i]);
    const raw = btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Erro ao enviar email via Gmail do usuário:', error);
      return Response.json({ success: false, error: 'Erro ao enviar email via Gmail' }, { status: 500 });
    }

    const result = await response.json();
    console.log('SUCCESS: Email de boas-vindas enviado de', senderEmail, 'para', data.email);

    return Response.json({ success: true, messageId: result.id, leadEmail: data.email, leadNome: data.nome, sentFrom: senderEmail });

  } catch (error) {
    console.error('Erro ao enviar email de boas-vindas:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});

function buildHTML(leadNome, corretorNome, corretorEmail) {
  return `<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 10px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Bem-vindo(a)!</h1>
    </div>
    <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
      <p style="font-size: 18px; color: #1f2937;">Olá <strong>${leadNome}</strong>,</p>
      <p style="font-size: 16px; color: #4b5563;">
        É um prazer enorme ter você conosco! 
      </p>
      <p style="font-size: 16px; color: #4b5563;">
        Estamos aqui para ajudá-lo(a) a encontrar as melhores soluções em seguros, 
        com atendimento personalizado e o compromisso de cuidar do que é mais importante para você.
      </p>
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #1f2937; margin-top: 0;">📞 Próximos Passos</h3>
        <p style="margin: 10px 0; color: #4b5563;">✅ Em breve, entrarei em contato para entender melhor suas necessidades</p>
        <p style="margin: 10px 0; color: #4b5563;">✅ Vou apresentar as melhores opções personalizadas para você</p>
        <p style="margin: 10px 0; color: #4b5563;">✅ Conte comigo para esclarecer qualquer dúvida</p>
      </div>
      <p style="font-size: 16px; color: #4b5563;">Se precisar de algo antes do meu contato, não hesite em me chamar!</p>
      <p style="font-size: 16px; color: #4b5563; margin-top: 30px;">
        Atenciosamente,<br>
        <strong style="color: #667eea;">${corretorNome}</strong><br>
        <span style="color: #94a3b8; font-size: 13px;">${corretorEmail}</span>
      </p>
    </div>
    <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
      <p>Enviado via Apex Shield CRM</p>
    </div>
  </div>
</body></html>`;
}