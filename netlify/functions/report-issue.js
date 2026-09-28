import { corsHeaders } from './utils.js';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  // Solo aceptar peticiones POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Método no permitido' })
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { email, message } = body;

    if (!message) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'El mensaje es requerido' })
      };
    }

    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.error('Faltan credenciales de Telegram en las variables de entorno.');
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Error de configuración del servidor' })
      };
    }

    // Formatear el mensaje
    const text = `🚨 <b>NUEVO REPORTE EN AFILE</b> 🚨\n\n` +
                 `<b>Mensaje:</b>\n${message}\n\n` +
                 `<b>Contacto:</b> ${email || 'Anónimo'}`;

    // Enviar a Telegram
    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: text,
        parse_mode: 'HTML'
      })
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      console.error('Error desde Telegram:', data);
      throw new Error(data.description || 'Error enviando mensaje a Telegram');
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ success: true })
    };

  } catch (error) {
    console.error('Error en report-issue:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Error interno del servidor' })
    };
  }
};
