-- Acesso compartilhado do plano Family (desenho de 2026-11-07): o titular reúne até 4 pessoas em um grupo por convite.
-- Cada pessoa tem o próprio cadastro, login e WhatsApp. Por enquanto o grupo só junta as pessoas: cada uma continua vendo
-- só os próprios lançamentos e usando a própria cota. A visão compartilhada dos valores é uma etapa à parte.
--
-- Segurança: as tabelas não têm acesso direto para clientes (só as funções abaixo, que escrevem como SECURITY DEFINER);
-- o código do convite aparece uma única vez, para quem o gera, e é guardado só como hash (com o mesmo pepper do bot).

create table public.grupos (
  id uuid primary key default gen_random_uuid(),
  titular_id uuid not null unique references public.usuarios (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.grupo_membros (
  grupo_id uuid not null references public.grupos (id) on delete cascade,
  usuario_id uuid not null unique references public.usuarios (id) on delete cascade,
  papel text not null check (papel in ('titular', 'membro')),
  entrou_em timestamptz not null default now(),
  primary key (grupo_id, usuario_id)
);

create table public.grupo_convites (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid not null references public.grupos (id) on delete cascade,
  codigo_hash text not null unique,
  status text not null default 'pendente' check (status in ('pendente', 'aceito', 'cancelado')),
  criado_em timestamptz not null default now(),
  expira_em timestamptz not null,
  aceito_por uuid references public.usuarios (id) on delete set null,
  aceito_em timestamptz
);
create index grupo_convites_grupo_idx on public.grupo_convites (grupo_id, status);

alter table public.grupos enable row level security;
alter table public.grupo_membros enable row level security;
alter table public.grupo_convites enable row level security;
revoke all on table public.grupos, public.grupo_membros, public.grupo_convites from anon, authenticated;

create function app.hash_convite(p_codigo text) returns text
language sql stable set search_path = '' as $$
  select encode(sha256(convert_to('grupo|' || upper(btrim(p_codigo)) || '|' ||
         (select valor from public.segredos_app where chave = 'pepper_convite'), 'UTF8')), 'hex');
$$;
revoke execute on function app.hash_convite(text) from public, anon, authenticated;

create function app.limite_family(p_uid uuid) returns integer
language sql stable set search_path = '' as $$
  select p.membros_max
    from public.assinaturas a join public.planos p on p.id = a.plano_id
   where a.usuario_id = p_uid and a.status in ('trial', 'ativa', 'inadimplente') and p.codigo = 'family'
   limit 1;
$$;
revoke execute on function app.limite_family(uuid) from public, anon, authenticated;

create function public.app_grupo() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := app.meu_usuario_id();
  v_proprio integer; v_g public.grupos%rowtype; v_limite integer; v_membros jsonb; v_convites jsonb := '[]'::jsonb;
begin
  if v_uid is null then raise exception 'sem_cadastro'; end if;
  v_proprio := app.limite_family(v_uid);
  select g.* into v_g from public.grupos g join public.grupo_membros m on m.grupo_id = g.id where m.usuario_id = v_uid;
  if not found then
    return jsonb_build_object('elegivel', v_proprio is not null, 'limite', v_proprio, 'papel', null,
                              'titular_nome', null, 'membros', '[]'::jsonb, 'convites', '[]'::jsonb);
  end if;
  v_limite := coalesce(app.limite_family(v_g.titular_id), v_proprio);
  select coalesce(jsonb_agg(jsonb_build_object('usuario_id', m.usuario_id, 'nome', u.nome, 'papel', m.papel,
           'entrou_em', m.entrou_em, 'eu', m.usuario_id = v_uid) order by (m.papel = 'titular') desc, m.entrou_em), '[]'::jsonb)
    into v_membros
    from public.grupo_membros m join public.usuarios u on u.id = m.usuario_id where m.grupo_id = v_g.id;
  if v_g.titular_id = v_uid then
    select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'criado_em', c.criado_em, 'expira_em', c.expira_em) order by c.criado_em), '[]'::jsonb)
      into v_convites from public.grupo_convites c
     where c.grupo_id = v_g.id and c.status = 'pendente' and c.expira_em > now();
  end if;
  return jsonb_build_object('elegivel', v_proprio is not null, 'limite', v_limite,
    'papel', case when v_g.titular_id = v_uid then 'titular' else 'membro' end,
    'titular_nome', (select nome from public.usuarios where id = v_g.titular_id),
    'membros', v_membros, 'convites', v_convites);
end $$;

create function public.app_criar_convite() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := app.meu_usuario_id();
  v_limite integer; v_gid uuid; v_ocupadas integer; v_codigo text := '';
  v_alfabeto constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_bytes bytea; v_exp timestamptz := now() + interval '7 days'; i integer;
begin
  if v_uid is null then raise exception 'sem_cadastro'; end if;
  v_limite := app.limite_family(v_uid);
  if v_limite is null then return jsonb_build_object('ok', false, 'motivo', 'sem_plano_family'); end if;
  if exists (select 1 from public.grupo_membros m join public.grupos g on g.id = m.grupo_id
              where m.usuario_id = v_uid and g.titular_id <> v_uid) then
    return jsonb_build_object('ok', false, 'motivo', 'ja_no_grupo');
  end if;
  select id into v_gid from public.grupos where titular_id = v_uid for update;
  if v_gid is null then
    insert into public.grupos (titular_id) values (v_uid) returning id into v_gid;
    insert into public.grupo_membros (grupo_id, usuario_id, papel) values (v_gid, v_uid, 'titular');
  end if;
  select (select count(*) from public.grupo_membros where grupo_id = v_gid)
       + (select count(*) from public.grupo_convites where grupo_id = v_gid and status = 'pendente' and expira_em > now())
    into v_ocupadas;
  if v_ocupadas >= v_limite then return jsonb_build_object('ok', false, 'motivo', 'limite_atingido'); end if;
  v_bytes := extensions.gen_random_bytes(10);
  for i in 0..9 loop
    v_codigo := v_codigo || substr(v_alfabeto, (get_byte(v_bytes, i) % 32) + 1, 1);
  end loop;
  insert into public.grupo_convites (grupo_id, codigo_hash, expira_em) values (v_gid, app.hash_convite(v_codigo), v_exp);
  return jsonb_build_object('ok', true, 'codigo', v_codigo, 'expira_em', v_exp);
end $$;

create function public.app_cancelar_convite(p_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := app.meu_usuario_id(); v_n integer;
begin
  if v_uid is null then raise exception 'sem_cadastro'; end if;
  update public.grupo_convites c set status = 'cancelado'
   where c.id = p_id and c.status = 'pendente'
     and c.grupo_id = (select id from public.grupos where titular_id = v_uid);
  get diagnostics v_n = row_count;
  if v_n = 0 then return jsonb_build_object('ok', false, 'motivo', 'nao_encontrado'); end if;
  return jsonb_build_object('ok', true);
end $$;

create function public.app_remover_membro(p_usuario_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := app.meu_usuario_id(); v_gid uuid; v_n integer;
begin
  if v_uid is null then raise exception 'sem_cadastro'; end if;
  select id into v_gid from public.grupos where titular_id = v_uid;
  if v_gid is null then return jsonb_build_object('ok', false, 'motivo', 'nao_encontrado'); end if;
  if p_usuario_id = v_uid then return jsonb_build_object('ok', false, 'motivo', 'nao_permitido'); end if;
  delete from public.grupo_membros where grupo_id = v_gid and usuario_id = p_usuario_id;
  get diagnostics v_n = row_count;
  if v_n = 0 then return jsonb_build_object('ok', false, 'motivo', 'nao_encontrado'); end if;
  return jsonb_build_object('ok', true);
end $$;

create function public.app_sair_do_grupo() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := app.meu_usuario_id(); v_n integer;
begin
  if v_uid is null then raise exception 'sem_cadastro'; end if;
  delete from public.grupo_membros m using public.grupos g
   where m.grupo_id = g.id and m.usuario_id = v_uid and g.titular_id <> v_uid;
  get diagnostics v_n = row_count;
  if v_n = 0 then return jsonb_build_object('ok', false, 'motivo', 'nao_permitido'); end if;
  return jsonb_build_object('ok', true);
end $$;

create function public.app_aceitar_convite(p_codigo text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := app.meu_usuario_id();
  v_c public.grupo_convites%rowtype; v_titular uuid; v_limite integer;
begin
  if v_uid is null then raise exception 'sem_cadastro'; end if;
  select c.* into v_c from public.grupo_convites c
   where c.codigo_hash = app.hash_convite(coalesce(p_codigo, '')) and c.status = 'pendente' and c.expira_em > now()
   for update;
  if not found then return jsonb_build_object('ok', false, 'motivo', 'convite_invalido'); end if;
  select titular_id into v_titular from public.grupos where id = v_c.grupo_id;
  if v_titular = v_uid then return jsonb_build_object('ok', false, 'motivo', 'proprio_grupo'); end if;
  if exists (select 1 from public.grupo_membros where usuario_id = v_uid) then
    return jsonb_build_object('ok', false, 'motivo', 'ja_no_grupo');
  end if;
  v_limite := app.limite_family(v_titular);
  if v_limite is null then return jsonb_build_object('ok', false, 'motivo', 'convite_invalido'); end if;
  if (select count(*) from public.grupo_membros where grupo_id = v_c.grupo_id) >= v_limite then
    return jsonb_build_object('ok', false, 'motivo', 'grupo_cheio');
  end if;
  insert into public.grupo_membros (grupo_id, usuario_id, papel) values (v_c.grupo_id, v_uid, 'membro');
  update public.grupo_convites set status = 'aceito', aceito_por = v_uid, aceito_em = now() where id = v_c.id;
  return jsonb_build_object('ok', true, 'titular_nome', (select nome from public.usuarios where id = v_titular));
end $$;

revoke execute on function public.app_grupo(), public.app_criar_convite(), public.app_cancelar_convite(uuid),
  public.app_remover_membro(uuid), public.app_sair_do_grupo(), public.app_aceitar_convite(text) from public, anon;
grant execute on function public.app_grupo(), public.app_criar_convite(), public.app_cancelar_convite(uuid),
  public.app_remover_membro(uuid), public.app_sair_do_grupo(), public.app_aceitar_convite(text) to authenticated, service_role;
