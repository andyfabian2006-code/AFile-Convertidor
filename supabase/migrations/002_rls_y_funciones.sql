alter table contact_messages enable row level security;
alter table consent_logs enable row level security;
alter table conversion_stats enable row level security;

-- consent_logs: la web solo puede insertar (no leer)
create policy "anon puede insertar consentimiento"
  on consent_logs for insert to anon
  with check (char_length(policy_version) <= 20);

-- contact_messages y conversion_stats: SIN políticas a propósito.
-- contact_messages se escribe solo desde la Netlify Function (secret key).
-- conversion_stats se escribe solo con esta función:
create or replace function increment_conversion(p_type text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_type is null or char_length(p_type) > 30 or p_type !~ '^[a-z0-9-]+$' then
    raise exception 'tipo inválido';
  end if;

  insert into conversion_stats (conversion_type, conversion_date, count)
  values (p_type, current_date, 1)
  on conflict (conversion_type, conversion_date)
  do update set count = conversion_stats.count + 1;
end;
$$;

revoke all on function increment_conversion(text) from public;
grant execute on function increment_conversion(text) to anon;
revoke execute on function increment_conversion(text) from authenticated;
