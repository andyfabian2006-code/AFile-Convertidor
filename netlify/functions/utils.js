import { Redis } from '@upstash/redis';

export const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

/**
 * Basic Rate Limiting usando Upstash Redis
 * @param {string} ip - Dirección IP del cliente
 * @param {string} action - Nombre de la acción (ej. 'contact', 'stats')
 * @param {number} limit - Límite de peticiones
 * @param {number} windowSeconds - Ventana de tiempo en segundos
 * @returns {Promise<boolean>} - true si se permite la petición, false si excede el límite
 */
export async function checkRateLimit(ip, action, limit, windowSeconds) {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.warn('Upstash no configurado, omitiendo Rate Limit');
    return true; 
  }

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  const key = `rate-limit:${action}:${ip}`;
  
  try {
    const current = await redis.incr(key);
    
    if (current === 1) {
      await redis.expire(key, windowSeconds);
    }
    
    return current <= limit;
  } catch (e) {
    console.error('Error verificando Rate Limit:', e);
    // Si falla Redis, fallamos de forma segura permitiendo el tráfico para no bloquear usuarios
    return true;
  }
}
