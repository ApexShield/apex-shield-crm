import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Autenticar usuário
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Obter token do Google Drive
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googledrive');

    const formData = await req.formData();
    const file = formData.get('file');
    const clienteNome = formData.get('clienteNome') || 'Cliente';
    const clienteId = formData.get('clienteId');

    if (!file) {
      return Response.json({ error: 'Arquivo não fornecido' }, { status: 400 });
    }

    // Converter arquivo para ArrayBuffer
    const fileBuffer = await file.arrayBuffer();
    const fileName = file.name || 'contrato.pdf';
    
    // Nome do arquivo no Drive
    const driveFileName = `Contrato - ${clienteNome} - ${new Date().toISOString().split('T')[0]}.pdf`;

    // Criar metadata do arquivo
    const metadata = {
      name: driveFileName,
      mimeType: file.type || 'application/pdf',
      description: `Contrato do cliente ${clienteNome} (ID: ${clienteId || 'N/A'})`
    };

    // Upload multipart para o Google Drive
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelim = `\r\n--${boundary}--`;

    const multipartRequestBody = 
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${file.type || 'application/pdf'}\r\n` +
      'Content-Transfer-Encoding: base64\r\n\r\n' +
      btoa(String.fromCharCode(...new Uint8Array(fileBuffer))) +
      closeDelim;

    // Upload para o Google Drive
    const uploadResponse = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`
        },
        body: multipartRequestBody
      }
    );

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text();
      console.error('Erro ao fazer upload para o Drive:', error);
      return Response.json({ 
        success: false, 
        error: 'Erro ao fazer upload para o Google Drive' 
      }, { status: 500 });
    }

    const driveFile = await uploadResponse.json();

    // Tornar o arquivo acessível via link (opcional - comentado por segurança)
    // await fetch(`https://www.googleapis.com/drive/v3/files/${driveFile.id}/permissions`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${accessToken}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     role: 'reader',
    //     type: 'anyone'
    //   })
    // });

    return Response.json({
      success: true,
      fileId: driveFile.id,
      fileName: driveFile.name,
      webViewLink: `https://drive.google.com/file/d/${driveFile.id}/view`,
      mimeType: driveFile.mimeType
    });

  } catch (error) {
    console.error('Erro ao fazer upload de contrato:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});