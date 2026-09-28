import { createClient } from '@supabase/supabase-js';
import { corsHeaders, checkRateLimit } from './utils.js';

export const handler = async (event) => {
  // Manejo de preflight CORS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed', headers: corsHeaders };
  }

  const clientIp = event.headers['x-nf-client-connection-ip'] || 'unknown';

  // Rate Limiting: 100 registros por IP cada 15 minutos (900 segundos)
  const allowed = await checkRateLimit(clientIp, 'stats', 100, 900);
  if (!allowed) {
    return { statusCode: 429, body: 'Too Many Requests', headers: corsHeaders };
  }

  try {
    const body = JSON.parse(event.body);
    const { type } = body;

    // Validación estricta del payload
    if (!type || typeof type !== 'string' || !/^[a-z0-9]+-to-[a-z0-9]+$/.test(type)) {
      return { statusCode: 400, body: 'Invalid type format', headers: corsHeaders };
    }

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
      console.warn('Supabase env vars missing. Ignorando stats de forma segura.');
      return { statusCode: 200, body: JSON.stringify({ success: true, mocked: true }), headers: corsHeaders };
    }

    // Inicializar Supabase usando la llave secreta (Service Role)
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { error } = await supabase.rpc('increment_conversion', { p_type: type });

    if (error) {
      console.error('Supabase RPC Error:', error);
      return { statusCode: 500, body: 'Database Error', headers: corsHeaders };
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ success: true })
    };

  } catch (e) {
    console.error('Stats Function Error:', e);
    return { statusCode: 500, body: 'Internal Server Error', headers: corsHeaders };
  }
};
