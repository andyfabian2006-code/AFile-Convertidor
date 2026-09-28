-- OPCIONAL: requiere activar pg_cron en Database > Extensions
select cron.schedule(
  'borrar-mensajes-vencidos',
  '0 3 * * *',
  $$ delete from contact_messages where expires_at < now() $$
);
