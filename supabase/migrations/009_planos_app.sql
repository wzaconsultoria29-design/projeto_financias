-- Planos do app: Trial 7 dias/50 msgs, Essencial R$19/300, Family R$39/800 (até 4 números)
alter table public.planos add column if not exists membros_max integer not null default 1;
alter table public.planos add column if not exists dias_validade integer;

update public.planos set nome = 'Trial', descricao = '7 dias grátis para experimentar',
  preco_centavos = 0, mensagens_limite = 50, ciclo = 'unico', dias_validade = 7, membros_max = 1, ordem = 0
 where codigo = 'trial';
update public.planos set codigo = 'essencial', nome = 'Essencial', descricao = 'Controle total, todo mês',
  preco_centavos = 1900, mensagens_limite = 300, ciclo = 'mensal', membros_max = 1, ordem = 1
 where codigo = 'solo';
update public.planos set codigo = 'family', nome = 'Family', descricao = 'Para casais e famílias organizadas',
  preco_centavos = 3900, mensagens_limite = 800, ciclo = 'mensal', membros_max = 4, ordem = 2
 where codigo = 'familia';

-- Trial novo ganha data de validade a partir de dias_validade do plano
create or replace function app.preencher_validade_trial() returns trigger
language plpgsql set search_path = '' as $$
declare v_dias integer;
begin
  if new.status = 'trial' and new.periodo_fim is null then
    select dias_validade into v_dias from public.planos where id = new.plano_id;
    if v_dias is not null then
      new.periodo_fim := new.periodo_inicio + make_interval(days => v_dias);
    end if;
  end if;
  return new;
end $$;

drop trigger if exists assinaturas_trial_validade on public.assinaturas;
create trigger assinaturas_trial_validade before insert on public.assinaturas
  for each row execute function app.preencher_validade_trial();

do $$
declare r record;
begin
  for r in select p.oid::regprocedure as sig
           from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.prokind = 'f'
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', r.sig);
    execute format('grant execute on function %s to service_role', r.sig);
  end loop;
end $$;
