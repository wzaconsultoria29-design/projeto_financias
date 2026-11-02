-- Cadastro completo obrigatório e bot fechado (desenho de 2026-11-02).
--  1. O bot nunca cria conta: verificar_acesso não insere mais usuários nem confirma o número por "qualquer mensagem".
--  2. Só "ATIVAR <código>" conecta o WhatsApp, e é nesse momento que o teste de 7 dias começa.
--  3. cadastrar_usuario exige nome, e-mail válido, celular com DDD e aceite; e-mail único; reivindicação de número com prazo de 48 h.
--  4. NÃO FUI EU cancela um cadastro pendente; bot_convite limita o convite a 1 por hora por número (guardando só um hash).
-- Esta migração também traz de volta ao repositório as versões de cadastrar_usuario, ativar_por_codigo e
-- verificar_acesso que já estavam ativas no banco (o repositório estava defasado).

alter table public.usuarios
  add column if not exists email_verificado_em timestamptz,
  add column if not exists cadastro_em timestamptz not null default now();

-- E-mail único (sem diferenciar maiúsculas) entre cadastros ativos. Cadastros antigos sem e-mail continuam válidos.
create unique index if not exists usuarios_email_uq on public.usuarios (lower(email)) where email is not null and deleted_at is null;

-- ---------- convites do bot (anti-laço), sem guardar o número ----------
create table if not exists public.segredos_app (chave text primary key, valor text not null);
alter table public.segredos_app enable row level security;
revoke all on public.segredos_app from anon, authenticated;
insert into public.segredos_app (chave, valor)
values ('pepper_convite', replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''))
on conflict (chave) do nothing;

create table if not exists public.bot_convites (
  telefone_hash text primary key,
  ultimo_em timestamptz not null default now()
);
alter table public.bot_convites enable row level security;
revoke all on public.bot_convites from anon, authenticated;

create or replace function public.bot_convite(p_telefone text) returns jsonb
language plpgsql set search_path = '' as $$
declare v_tel text := public.normalizar_telefone(p_telefone); v_pep text; v_h text; v_ult timestamptz;
begin
  if v_tel !~ '^[0-9]{10,15}$' then return jsonb_build_object('enviar', false); end if;
  select valor into v_pep from public.segredos_app where chave = 'pepper_convite';
  v_h := encode(sha256(convert_to(v_tel || '|' || v_pep, 'UTF8')), 'hex');
  delete from public.bot_convites where ultimo_em < now() - interval '24 hours';
  select ultimo_em into v_ult from public.bot_convites where telefone_hash = v_h for update;
  if found and v_ult > now() - interval '1 hour' then
    return jsonb_build_object('enviar', false);
  end if;
  insert into public.bot_convites (telefone_hash, ultimo_em) values (v_h, now())
  on conflict (telefone_hash) do update set ultimo_em = now();
  return jsonb_build_object('enviar', true);
end $$;

-- ---------- cadastro ----------
create or replace function public.cadastrar_usuario(
  p_nome text, p_email text, p_telefone text, p_origem text default 'landing',
  p_aceite boolean default false, p_versao text default null, p_marketing boolean default false)
returns jsonb language plpgsql set search_path = '' as $$
declare
  v_tel text := public.normalizar_telefone(p_telefone);
  v_nome text := regexp_replace(trim(coalesce(p_nome, '')), '\s+', ' ', 'g');
  v_email text := lower(trim(coalesce(p_email, '')));
  v_u public.usuarios%rowtype;
  v_cod text;
begin
  if v_tel !~ '^55[0-9]{2}9[0-9]{8}$' then
    raise exception 'telefone_invalido' using errcode = '22023';
  end if;
  if char_length(v_nome) < 2 or char_length(v_nome) > 80 then
    raise exception 'nome_invalido' using errcode = '22023';
  end if;
  if char_length(v_email) > 254 or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]{2,}$' then
    raise exception 'email_invalido' using errcode = '22023';
  end if;
  if p_aceite is not true or coalesce(trim(p_versao), '') = '' then
    raise exception 'aceite_obrigatorio' using errcode = '22023';
  end if;

  if exists (select 1 from public.usuarios where lower(email) = v_email and telefone <> v_tel and deleted_at is null) then
    raise exception 'email_em_uso' using errcode = '22023';
  end if;

  select * into v_u from public.usuarios where telefone = v_tel for update;
  if found and v_u.deleted_at is null then
    -- cliente já conectado: nenhum novo cadastro mexe nos dados dele
    if v_u.telefone_verificado_em is not null then
      return jsonb_build_object('usuario_id', v_u.id, 'telefone', v_tel, 'codigo_ativacao', null, 'ja_verificado', true);
    end if;
    -- cadastro pendente de outra pessoa: vale por 48 h; depois o novo cadastro assume
    if lower(coalesce(v_u.email, '')) <> v_email then
      if v_u.cadastro_em > now() - interval '48 hours' then
        raise exception 'numero_em_cadastro' using errcode = '22023';
      end if;
      update public.usuarios
         set nome = v_nome, email = v_email, email_verificado_em = null, cadastro_em = now(), origem = p_origem
       where id = v_u.id;
    else
      update public.usuarios set nome = v_nome, origem = p_origem where id = v_u.id;
    end if;
    select * into v_u from public.usuarios where id = v_u.id;
  elsif found then
    -- cadastro apagado antes: recomeça do zero, sem herdar nada
    update public.usuarios
       set nome = v_nome, email = v_email, origem = p_origem, deleted_at = null, status = 'pendente',
           telefone_verificado_em = null, email_verificado_em = null, boas_vindas_em = null, cadastro_em = now()
     where id = v_u.id;
    select * into v_u from public.usuarios where id = v_u.id;
  else
    insert into public.usuarios (telefone, nome, email, origem)
    values (v_tel, v_nome, v_email, p_origem) returning * into v_u;
  end if;

  perform public.registrar_consentimento(v_u.id, trim(p_versao), 'landing', coalesce(p_marketing, false));

  -- um código novo invalida os anteriores
  update public.ativacoes set consumido_em = now() where usuario_id = v_u.id and consumido_em is null;
  v_cod := upper(substr(md5(gen_random_uuid()::text), 1, 6));
  insert into public.ativacoes (codigo, usuario_id) values (v_cod, v_u.id);

  return jsonb_build_object('usuario_id', v_u.id, 'telefone', v_tel, 'codigo_ativacao', v_cod, 'ja_verificado', false);
end $$;

-- ---------- conexão do WhatsApp: começa o teste de 7 dias ----------
create or replace function public.ativar_por_codigo(p_codigo text, p_telefone text) returns jsonb
language plpgsql set search_path = '' as $$
declare
  v_tel text := public.normalizar_telefone(p_telefone);
  v_cod text := upper(trim(regexp_replace(coalesce(p_codigo, ''), '^\s*ATIVAR[\s#:-]*', '', 'i')));
  v_uid uuid; v_nome text; v_antes timestamptz;
begin
  select a.usuario_id, u.nome, u.telefone_verificado_em into v_uid, v_nome, v_antes
    from public.ativacoes a join public.usuarios u on u.id = a.usuario_id
   where a.codigo = v_cod and a.consumido_em is null and a.expira_em > now()
     and u.telefone = v_tel and u.deleted_at is null;
  if not found then
    return jsonb_build_object('ok', false, 'motivo', 'codigo_invalido_ou_telefone_diferente');
  end if;
  update public.ativacoes set consumido_em = now() where codigo = v_cod;
  update public.usuarios
     set telefone_verificado_em = coalesce(telefone_verificado_em, now()),
         boas_vindas_em = coalesce(boas_vindas_em, now()),
         status = case when status = 'pendente' then 'trial' else status end
   where id = v_uid;

  if v_antes is null then
    -- primeira conexão: o teste começa agora
    update public.assinaturas a
       set periodo_inicio = now(),
           periodo_fim = now() + make_interval(days => coalesce((select dias_validade from public.planos where id = a.plano_id), 7))
     where a.usuario_id = v_uid and a.status = 'trial';
    if not found then
      insert into public.assinaturas (usuario_id, plano_id, status)
      select v_uid, id, 'trial' from public.planos where codigo = 'trial'
      on conflict do nothing;
    end if;
  end if;
  return jsonb_build_object('ok', true, 'usuario_id', v_uid, 'nome', v_nome);
end $$;

-- ---------- NÃO FUI EU ----------
create or replace function public.cancelar_cadastro_pendente(p_telefone text) returns jsonb
language plpgsql set search_path = '' as $$
declare v_tel text := public.normalizar_telefone(p_telefone); v_uid uuid;
begin
  select id into v_uid from public.usuarios
   where telefone = v_tel and deleted_at is null and telefone_verificado_em is null for update;
  if not found then
    return jsonb_build_object('ok', false, 'motivo', 'nada_pendente');
  end if;
  update public.ativacoes set consumido_em = now() where usuario_id = v_uid and consumido_em is null;
  -- apaga os dados do cadastro para que um novo cadastro do número não herde nada
  update public.usuarios
     set nome = null, email = null, email_verificado_em = null, deleted_at = now(), status = 'pendente'
   where id = v_uid;
  return jsonb_build_object('ok', true);
end $$;

-- ---------- acesso do bot: nunca cria, nunca confirma por conta própria ----------
create or replace function public.verificar_acesso(p_telefone text, p_criar boolean default false) returns jsonb
language plpgsql set search_path = '' as $$
declare
  v_tel text := public.normalizar_telefone(p_telefone);
  v_u public.usuarios%rowtype;
  v_a public.assinaturas%rowtype;
  v_p public.planos%rowtype;
  v_usadas integer := 0; v_limite integer;
  v_bloq boolean := false; v_motivo text;
begin
  -- p_criar existe só por compatibilidade com o n8n; o bot não cria mais cadastros.
  select * into v_u from public.usuarios where telefone = v_tel and deleted_at is null and status <> 'excluido';
  if not found then
    return jsonb_build_object('existe', false);
  end if;

  -- cadastro feito no site, número ainda não conectado (só "ATIVAR <código>" conecta)
  if v_u.telefone_verificado_em is null then
    return jsonb_build_object('existe', true, 'conectado', false, 'usuario_id', v_u.id, 'nome', v_u.nome,
      'status', v_u.status, 'bloqueado', true, 'motivo', 'nao_conectado',
      'consentimento_ok', v_u.consentimento_em is not null, 'consentimento_versao', v_u.consentimento_versao);
  end if;

  select * into v_a from public.assinaturas
   where usuario_id = v_u.id and status in ('trial', 'ativa', 'inadimplente');
  if not found and v_u.status in ('pendente', 'trial') then
    insert into public.assinaturas (usuario_id, plano_id, status)
    select v_u.id, id, 'trial' from public.planos where codigo = 'trial'
    on conflict do nothing;
    select * into v_a from public.assinaturas
     where usuario_id = v_u.id and status in ('trial', 'ativa', 'inadimplente');
  end if;

  if v_a.id is not null then
    select * into v_p from public.planos where id = v_a.plano_id;
    v_limite := v_p.mensagens_limite;
    select mensagens into v_usadas from public.uso_periodo
     where assinatura_id = v_a.id and periodo_inicio = v_a.periodo_inicio;
    v_usadas := coalesce(v_usadas, 0);
  end if;

  if v_u.status in ('bloqueado', 'cancelado') then
    v_bloq := true; v_motivo := 'status_' || v_u.status;
  elsif v_a.id is null then
    v_bloq := true; v_motivo := 'sem_assinatura';
  elsif v_a.periodo_fim is not null and v_a.periodo_fim +
        (case v_a.status when 'inadimplente' then interval '3 days'
                         when 'ativa' then interval '1 day'
                         else interval '0 days' end) < now() then
    v_bloq := true; v_motivo := 'periodo_expirado';
  elsif v_limite is not null and v_usadas >= v_limite then
    v_bloq := true; v_motivo := 'limite_atingido';
  end if;

  return jsonb_build_object(
    'existe', true, 'conectado', true, 'usuario_id', v_u.id, 'telefone', v_u.telefone, 'nome', v_u.nome,
    'status', v_u.status, 'assinatura_id', v_a.id,
    'plano_codigo', v_p.codigo, 'plano_nome', v_p.nome,
    'limite', v_limite, 'usadas', v_usadas,
    'restantes', case when v_limite is null then null else greatest(v_limite - v_usadas, 0) end,
    'bloqueado', v_bloq, 'motivo', v_motivo,
    'primeiro_acesso', v_u.boas_vindas_em is null,
    'consentimento_ok', v_u.consentimento_em is not null,
    'consentimento_versao', v_u.consentimento_versao);
end $$;

-- mesmas permissões das demais funções do bot: só o service_role executa
do $$
declare r record;
begin
  for r in select p.oid::regprocedure as sig
           from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.prokind = 'f'
             and p.proname in ('bot_convite', 'cadastrar_usuario', 'ativar_por_codigo', 'cancelar_cadastro_pendente', 'verificar_acesso')
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', r.sig);
    execute format('grant execute on function %s to service_role', r.sig);
  end loop;
end $$;
