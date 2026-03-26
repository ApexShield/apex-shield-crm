import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Try listing without filter to see ALL records this user can see
    const allData = await base44.entities.DashboardDiario.list('-data', 5);
    
    // Also try filter with ano
    const filtered = await base44.entities.DashboardDiario.filter({ ano: 2026 }, '-data', 5);
    
    return Response.json({ 
      user_email: user.email,
      all_count: allData.length,
      all_sample: allData.length > 0 ? allData[0] : null,
      all_keys: allData.length > 0 ? Object.keys(allData[0]) : [],
      filtered_count: filtered.length,
      filtered_sample: filtered.length > 0 ? filtered[0] : null,
      has_semana: allData.length > 0 ? ('semana' in allData[0]) : false,
      has_dia_semana: allData.length > 0 ? ('dia_semana' in allData[0]) : false,
      semana_value: allData.length > 0 ? allData[0].semana : null,
      dia_semana_value: allData.length > 0 ? allData[0].dia_semana : null,
      typeof_semana: allData.length > 0 ? typeof allData[0].semana : null,
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});