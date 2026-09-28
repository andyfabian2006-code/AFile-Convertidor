# Convertidor de Archivos (100% Client-Side)

## Base de Datos (Supabase)
Esta plataforma no guarda archivos del usuario. Sólo almacena:
1. Mensajes del formulario de contacto.
2. Logs anónimos de consentimiento de cookies.
3. Estadísticas anónimas de conversiones.

### Configuración SQL (Migraciones)
Los scripts SQL en la carpeta `/supabase/migrations` están listos para ejecutarse manualmente en el SQL Editor de tu proyecto de Supabase. Deben ejecutarse en el siguiente orden:

1. `001_esquema_inicial.sql` (Crea las tablas)
2. `002_rls_y_funciones.sql` (Configura la seguridad y crea la función RPC de conteo)
3. `003_retencion_opcional.sql` (Opcional: configura un cron job para eliminar mensajes de contacto cada 30 días)

## Variables de Entorno
Renombra `.env.example` a `.env` y llena los valores.
- `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`: Usados por la app frontend (client-side).
- `SUPABASE_URL` y `SUPABASE_SECRET_KEY`: Usados EXCLUSIVAMENTE por las funciones de Netlify. Nunca las expongas al frontend.
- `TURNSTILE_SECRET_KEY`: Tu clave secreta de Cloudflare Turnstile.
- `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`: Para el rate-limiting del formulario.
- `RESEND_API_KEY`: Para recibir correos cuando alguien usa el formulario de contacto.
