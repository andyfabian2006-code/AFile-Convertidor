import { Resend } from 'resend';
import { corsHeaders, checkRateLimit } from './utils.js';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed', headers: corsHeaders };
  }

  const clientIp = event.headers['x-nf-client-connection-ip'] || 'unknown';

  // Rate Limiting: 2 mensajes por IP cada 24 horas (86400 segundos)
  const allowed = await checkRateLimit(clientIp, 'contact', 2, 86400);
  if (!allowed) {
    return { 
      statusCode: 429, 
      body: JSON.stringify({ error: 'Has alcanzado el límite de mensajes permitidos. Intenta mañana.' }), 
      headers: corsHeaders 
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { name, email, message, 'cf-turnstile-response': turnstileToken } = body;

    // 1. Validaciones básicas
    if (!name || !email || !message || !turnstileToken) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Faltan campos obligatorios' }), headers: corsHeaders };
    }

    if (message.length > 2000) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Mensaje demasiado largo' }), headers: corsHeaders };
    }

    // 2. Verificar Turnstile
    if (process.env.TURNSTILE_SECRET_KEY) {
      const turnstileRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `secret=${process.env.TURNSTILE_SECRET_KEY}&response=${turnstileToken}&remoteip=${clientIp}`
      });
      
      const turnstileOutcome = await turnstileRes.json();
      if (!turnstileOutcome.success) {
        return { statusCode: 403, body: JSON.stringify({ error: 'Fallo la verificación anti-spam (Turnstile)' }), headers: corsHeaders };
      }
    } else {
      console.warn('TURNSTILE_SECRET_KEY missing. Skipping captcha verification.');
    }

    // 3. Enviar Correo usando Resend
    if (!process.env.RESEND_API_KEY || !process.env.CONTACT_TO_EMAIL) {
      console.warn('Resend env vars missing. Correo no enviado.');
      return { statusCode: 200, body: JSON.stringify({ success: true, mocked: true }), headers: corsHeaders };
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    
    // Configurar encabezados seguros y contenido
    const emailData = {
      from: 'AFile Contacto <onboarding@resend.dev>', // Usar resend.dev para pruebas si no hay dominio verificado
      to: process.env.CONTACT_TO_EMAIL,
      reply_to: email,
      subject: `Nuevo mensaje de ${name.substring(0, 50)}`,
      text: `Nombre: ${name}\nEmail: ${email}\n\nMensaje:\n${message}`
    };

    const { error } = await resend.emails.send(emailData);

    if (error) {
      console.error('Resend Error:', error);
      return { statusCode: 500, body: JSON.stringify({ error: 'Error enviando el correo' }), headers: corsHeaders };
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ success: true })
    };

  } catch (e) {
    console.error('Contact Function Error:', e);
    return { statusCode: 500, body: JSON.stringify({ error: 'Error interno del servidor' }), headers: corsHeaders };
  }
};
