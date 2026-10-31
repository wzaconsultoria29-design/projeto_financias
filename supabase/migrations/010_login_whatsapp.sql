-- Login sem senha pelo WhatsApp: o site pede um código; o cliente envia "PAINEL <código>"
-- do próprio número; o bot confirma; o site abre a sessão.
create table public.login_sessoes (
  id uuid primary key default gen_random_uuid(),
  codigo text not null,
  usuario_id uuid references public.usuarios(id) on delete cascade,
  criado_em timestamptz not null default now(),
  expira_em timestamptz not null default (now() + interval '5 minutes'),
  confirmado_em timestamptz,
  consumido_em timestamptz
);
create unique index login_sessoes_codigo_ativo_uq on public.login_sessoes (codigo) where consumido_em is null;
create index login_sessoes_usuario_idx on public.login_sessoes (usuario_id);

create table public.login_falhas (
  telefone text not null,
  em timestamptz not null default now()
);
create index login_falhas_tel_idx on public.login_falhas (telefone, em desc);

alter table public.login_sessoes enable row level security;
alter table public.login_falhas enable row level security;
revoke all on public.login_sessoes, public.login_falhas from anon, authenticated;

create function public.login_iniciar() returns jsonb
language plpgsql set search_path = '' as $$
declare v_cod text; v_id uuid; v_exp timestamptz; v_tent integer := 0;
begin
  delete from public.login_sessoes where expira_em < now() - interval '1 hour';
  delete from public.login_falhas where em < now() - interval '1 day';
  loop
    v_cod := lpad((('x' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))::bit(32)::bigint % 1000000)::text, 6, '0');
    begin
      insert into public.login_sessoes (codigo) values (v_cod) returning id, expira_em into v_id, v_exp;
      exit;
    exception when unique_violation then
      v_tent := v_tent + 1;
      if v_tent > 20 then raise exception 'sem_codigo_livre'; end if;
    end;
  end loop;
  return jsonb_build_object('sessao_id', v_id, 'codigo', v_cod, 'expira_em', v_exp);
end $$;

create function public.login_confirmar(p_codigo text, p_telefone text) returns jsonb
language plpgsql set search_path = '' as $$
declare
  v_tel text := public.normalizar_telefone(p_telefone);
  v_cod text := regexp_replace(coalesce(p_codigo, ''), '\D', '', 'g');
  v_s public.login_sessoes%rowtype;
  v_u public.usuarios%rowtype;
  v_falhas integer;
begin
  select count(*) into v_falhas from public.login_falhas
   where telefone = v_tel and em > now() - interval '10 minutes';
  if v_falhas >= 5 then
    return jsonb_build_object('ok', false, 'motivo', 'muitas_tentativas');
  end if;

  select * into v_s from public.login_sessoes
   where codigo = v_cod and consumido_em is null and confirmado_em is null
   order by criado_em desc limit 1;
  if not found then
    insert into public.login_falhas (telefone) values (v_tel);
    return jsonb_build_object('ok', false, 'motivo', 'codigo_invalido');
  end if;
  if v_s.expira_em < now() then
    insert into public.login_falhas (telefone) values (v_tel);
    return jsonb_build_object('ok', false, 'motivo', 'expirado');
  end if;

  select * into v_u from public.usuarios
   where telefone = v_tel and deleted_at is null and status <> 'excluido';
  if not found then
    return jsonb_build_object('ok', false, 'motivo', 'sem_cadastro');
  end if;
  if v_u.consentimento_em is null then
    return jsonb_build_object('ok', false, 'motivo', 'sem_aceite');
  end if;

  update public.login_sessoes set usuario_id = v_u.id, confirmado_em = now() where id = v_s.id;
  return jsonb_build_object('ok', true, 'nome', v_u.nome);
end $$;

create function public.login_consumir(p_sessao_id uuid) returns jsonb
language plpgsql set search_path = '' as $$
declare v_s public.login_sessoes%rowtype;
begin
  select * into v_s from public.login_sessoes where id = p_sessao_id for update;
  if not found or v_s.consumido_em is not null then
    return jsonb_build_object('estado', 'expirado');
  end if;
  if v_s.confirmado_em is not null then
    if v_s.confirmado_em < now() - interval '5 minutes' then
      return jsonb_build_object('estado', 'expirado');
    end if;
    update public.login_sessoes set consumido_em = now() where id = v_s.id;
    return jsonb_build_object('estado', 'ok', 'usuario_id', v_s.usuario_id);
  end if;
  if v_s.expira_em < now() then
    return jsonb_build_object('estado', 'expirado');
  end if;
  return jsonb_build_object('estado', 'pendente');
end $$;

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
