import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Autenticar usuário
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Pegar dados do payload
    const { event, data } = await req.json();
    
    if (!data?.email || !data?.nome) {
      return Response.json({ 
        success: false, 
        error: 'Email ou nome do lead não fornecido' 
      }, { status: 400 });
    }

    // Obter token do Gmail
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('gmail');

    // Construir email em formato RFC 2822
    const emailContent = [
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `To: ${data.email}`,
      `Subject: =?utf-8?B?${btoa('Bem-vindo(a) à APEX SHIELD! 🎉')}?=`,
      '',
      `<html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 10px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Bem-vindo(a)!</h1>
            </div>
            
            <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="font-size: 18px; color: #1f2937;">Olá <strong>${data.nome}</strong>,</p>
              
              <p style="font-size: 16px; color: #4b5563;">
                É um prazer enorme ter você conosco na <strong>APEX SHIELD</strong>! 
              </p>
              
              <p style="font-size: 16px; color: #4b5563;">
                Estamos aqui para ajudá-lo(a) a encontrar as melhores soluções em seguros, 
                com atendimento personalizado e o compromisso de cuidar do que é mais importante para você.
              </p>
              
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #1f2937; margin-top: 0;">📞 Próximos Passos</h3>
                <p style="margin: 10px 0; color: #4b5563;">
                  ✅ Em breve, nossa equipe entrará em contato para entender melhor suas necessidades
                </p>
                <p style="margin: 10px 0; color: #4b5563;">
                  ✅ Vamos apresentar as melhores opções personalizadas para você
                </p>
                <p style="margin: 10px 0; color: #4b5563;">
                  ✅ Conte conosco para esclarecer qualquer dúvida
                </p>
              </div>
              
              <p style="font-size: 16px; color: #4b5563;">
                Se precisar de algo antes do nosso contato, não hesite em nos chamar!
              </p>
              
              <p style="font-size: 16px; color: #4b5563; margin-top: 30px;">
                Atenciosamente,<br>
                <strong style="color: #667eea;">Equipe APEX SHIELD</strong>
              </p>
            </div>
            
            <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
              <p>Este é um email automático. Por favor, não responda.</p>
            </div>
          </div>
        </body>
      </html>`
    ].join('\r\n');

    // Codificar em base64 URL-safe
    const encodedEmail = btoa(emailContent)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Enviar email via Gmail API
    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        raw: encodedEmail
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Erro ao enviar email via Gmail:', error);
      return Response.json({ 
        success: false, 
        error: 'Erro ao enviar email via Gmail' 
      }, { status: 500 });
    }

    const result = await response.json();

    return Response.json({ 
      success: true, 
      messageId: result.id,
      leadEmail: data.email,
      leadNome: data.nome
    });

  } catch (error) {
    console.error('Erro ao enviar email de boas-vindas:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});