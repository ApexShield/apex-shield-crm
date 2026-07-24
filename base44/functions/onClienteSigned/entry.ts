import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { data, event } = body;

    if (!data) {
      return Response.json({ error: 'No client data provided' }, { status: 400 });
    }

    const response = await fetch('https://guga-guru-2f7fb938.base44.app/functions/clientSignedFlow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    return Response.json({ 
      success: true, 
      cliente_id: event?.entity_id,
      external_response: result 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});