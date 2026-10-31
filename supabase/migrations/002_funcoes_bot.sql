create or replace function public.normalizar_telefone(p text) returns text
language plpgsql immutable set search_path = '' as $$
declare d text := regexp_replace(coalesce(p, ''), '\D', '', 'g');
begin
  if length(d) in (10, 11) then d := '55' || d; end if;
  if length(d) = 12 and d like '55%' and substr(d, 5, 1) ~ '[6-9]' then
    d := substr(d, 1, 4) || '9' || substr(d, 5);
  end if;
  return d;
end $$;

-- Cadastro vindo da landing (chamado só pela Edge Function / service_role)
create or replace function public.cadastrar_usuario(p_nome text, p_email text, p_telefone text, p_origem text default 'landing')
returns jsonb language plpgsql set search_path = '' as $$
declare
  v_tel text := public.normalizar_telefone(p_telefone);
  v_uid uuid; v_plano uuid; v_cod text; v_verificado timestamptz;
begin
  if v_tel !~ '^55[0-9]{2}9[0-9]{8}$' then
    raise exception 'telefone_invalido' using errcode = '22023';
  end if;

  insert into public.usuarios (telefone, nome, email, origem)
  values (v_tel, nullif(trim(p_nome), ''), nullif(lower(trim(p_email)), ''), p_origem)
  on conflict (telefone) do update
    set nome = coalesce(public.usuarios.nome, excluded.nome),
        email = coalesce(public.usuarios.email, excluded.email),
        deleted_at = null
  returning id, telefone_verificado_em into v_uid, v_verificado;

  select id into v_plano from public.planos where codigo = 'trial';
  insert into public.assinaturas (usuario_id, plano_id, status) values (v_uid, v_plano, 'trial')
  on conflict do nothing;

  if v_verificado is null then
    v_cod := upper(substr(md5(gen_random_uuid()::text), 1, 6));
    insert into public.ativacoes (codigo, usuario_id) values (v_cod, v_uid);
  end if;

  return jsonb_build_object('usuario_id', v_uid, 'telefone', v_tel,
                            'codigo_ativacao', v_cod, 'ja_verificado', v_verificado is not null);
end $$;

-- Confirma o número quando o usuário manda "ATIVAR CODIGO" do próprio WhatsApp
create or replace function public.ativar_por_codigo(p_codigo text, p_telefone text)
returns jsonb language plpgsql set search_path = '' as $$
declare
  v_tel text := public.normalizar_telefone(p_telefone);
  v_cod text := upper(trim(regexp_replace(coalesce(p_codigo, ''), '^\s*ATIVAR[\s#:-]*', '', 'i')));
  v_uid uuid;
begin
  select a.usuario_id into v_uid
  from public.ativacoes a join public.usuarios u on u.id = a.usuario_id
  where a.codigo = v_cod and a.consumido_em is null and a.expira_em > now() and u.telefone = v_tel;
  if not found then
    return jsonb_build_object('ok', false, 'motivo', 'codigo_invalido_ou_telefone_diferente');
  end if;
  update public.ativacoes set consumido_em = now() where codigo = v_cod;
  update public.usuarios
     set telefone_verificado_em = coalesce(telefone_verificado_em, now()),
         status = case when status = 'pendente' then 'trial' else status end
   where id = v_uid;
  return jsonb_build_object('ok', true, 'usuario_id', v_uid);
end $$;

-- Uma chamada resolve: usuário, plano, cota e bloqueio (cria trial se for número novo)
create or replace function public.verificar_acesso(p_telefone text, p_criar boolean default true)
returns jsonb language plpgsql set search_path = '' as $$
declare
  v_tel text := public.normalizar_telefone(p_telefone);
  v_u public.usuarios%rowtype;
  v_a public.assinaturas%rowtype;
  v_p public.planos%rowtype;
  v_usadas integer := 0; v_limite integer;
  v_bloq boolean := false; v_motivo text;
begin
  select * into v_u from public.usuarios where telefone = v_tel and deleted_at is null;
  if not found then
    if not p_criar or v_tel !~ '^[0-9]{10,15}$' then
      return jsonb_build_object('existe', false);
    end if;
    insert into public.usuarios (telefone, status, origem, telefone_verificado_em)
    values (v_tel, 'trial', 'whatsapp', now())
    on conflict (telefone) do update set deleted_at = null
    returning * into v_u;
  end if;

  -- mensagem recebida do próprio número comprova a posse da linha
  if v_u.telefone_verificado_em is null then
    update public.usuarios
       set telefone_verificado_em = now(),
           status = case when status = 'pendente' then 'trial' else status end
     where id = v_u.id;
    select * into v_u from public.usuarios where id = v_u.id;
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
    'existe', true, 'usuario_id', v_u.id, 'telefone', v_u.telefone, 'nome', v_u.nome,
    'status', v_u.status, 'assinatura_id', v_a.id,
    'plano_codigo', v_p.codigo, 'plano_nome', v_p.nome,
    'limite', v_limite, 'usadas', v_usadas,
    'restantes', case when v_limite is null then null else greatest(v_limite - v_usadas, 0) end,
    'bloqueado', v_bloq, 'motivo', v_motivo,
    'primeiro_acesso', v_u.boas_vindas_em is null);
end $$;

create or replace function public.marcar_boas_vindas(p_usuario_id uuid) returns void
language sql set search_path = '' as $$
  update public.usuarios set boas_vindas_em = now() where id = p_usuario_id and boas_vindas_em is null;
$$;

-- Consome cota e acumula custo; avisa uma única vez ao cruzar 80%
create or replace function public.registrar_uso(
  p_usuario_id uuid, p_tipo_msg text default 'texto', p_acao text default 'outro',
  p_tokens_in bigint default 0, p_tokens_out bigint default 0, p_custo_usd numeric default 0)
returns jsonb language plpgsql set search_path = '' as $$
declare
  v_a public.assinaturas%rowtype; v_limite integer; v_uso public.uso_periodo%rowtype; v_alerta boolean := false;
begin
  select * into v_a from public.assinaturas
   where usuario_id = p_usuario_id and status in ('trial', 'ativa', 'inadimplente');
  if not found then return jsonb_build_object('ok', false); end if;
  select mensagens_limite into v_limite from public.planos where id = v_a.plano_id;

  insert into public.uso_periodo as up
    (assinatura_id, usuario_id, periodo_inicio, mensagens, lancamentos, consultas, audios, imagens,
     tokens_entrada, tokens_saida, custo_usd)
  values (v_a.id, p_usuario_id, v_a.periodo_inicio, 1,
          (p_acao = 'lancamento')::int, (p_acao = 'consulta')::int,
          (p_tipo_msg = 'audio')::int, (p_tipo_msg = 'imagem')::int,
          coalesce(p_tokens_in, 0), coalesce(p_tokens_out, 0), coalesce(p_custo_usd, 0))
  on conflict (assinatura_id, periodo_inicio) do update set
    mensagens = up.mensagens + 1,
    lancamentos = up.lancamentos + excluded.lancamentos,
    consultas = up.consultas + excluded.consultas,
    audios = up.audios + excluded.audios,
    imagens = up.imagens + excluded.imagens,
    tokens_entrada = up.tokens_entrada + excluded.tokens_entrada,
    tokens_saida = up.tokens_saida + excluded.tokens_saida,
    custo_usd = up.custo_usd + excluded.custo_usd
  returning * into v_uso;

  if v_limite is not null and v_uso.mensagens >= floor(v_limite * 0.8)
     and v_uso.mensagens < v_limite and v_uso.alerta_80_em is null then
    update public.uso_periodo set alerta_80_em = now() where id = v_uso.id;
    v_alerta := true;
  end if;

  return jsonb_build_object('ok', true, 'usadas', v_uso.mensagens, 'limite', v_limite,
    'restantes', case when v_limite is null then null else greatest(v_limite - v_uso.mensagens, 0) end,
    'alerta_80', v_alerta);
end $$;

-- Grava lançamento validando e normalizando o JSON que vem do agente
create or replace function public.registrar_lancamento(
  p_usuario_id uuid, p_dados jsonb, p_mensagem_id text default null, p_origem text default 'texto')
returns jsonb language plpgsql set search_path = '' as $$
declare
  v_tipo text := lower(p_dados->>'tipo');
  v_valor numeric; v_data date; v_metodo text; v_gasto text; v_parcelas smallint;
  v_tags text[]; v_l public.lancamentos%rowtype;
begin
  if v_tipo is null or v_tipo not in ('despesa', 'receita') then
    raise exception 'tipo_invalido' using errcode = '22023';
  end if;
  begin v_valor := (p_dados->>'valor')::numeric; exception when others then v_valor := null; end;
  if v_valor is null or v_valor <= 0 then
    raise exception 'valor_invalido' using errcode = '22023';
  end if;
  begin v_data := (p_dados->>'data')::date; exception when others then v_data := null; end;
  v_data := coalesce(v_data, (now() at time zone 'America/Sao_Paulo')::date);

  v_metodo := lower(p_dados->>'metodo_pagamento');
  if v_metodo is not null and v_metodo not in ('pix','débito','crédito','dinheiro','transferência','outro') then
    v_metodo := 'outro';
  end if;
  v_gasto := lower(p_dados->>'tipo_gasto');
  if v_gasto is not null and v_gasto not in ('essencial','supérfluo','investimento') then v_gasto := null; end if;
  v_parcelas := case when (p_dados->>'parcelas') ~ '^[0-9]{1,3}$'
                     then greatest(1, (p_dados->>'parcelas')::smallint) else 1 end;
  v_tags := case when jsonb_typeof(p_dados->'tags') = 'array'
                 then array(select jsonb_array_elements_text(p_dados->'tags')) else '{}'::text[] end;

  insert into public.lancamentos
    (usuario_id, tipo, valor, moeda, data_lancamento, categoria, subcategoria, descricao,
     metodo_pagamento, parcelas, recorrente, tipo_gasto, tags, origem, mensagem_id)
  values
    (p_usuario_id, v_tipo, v_valor, coalesce(nullif(p_dados->>'moeda', ''), 'BRL'), v_data,
     nullif(p_dados->>'categoria', ''), nullif(p_dados->>'subcategoria', ''), nullif(p_dados->>'descricao', ''),
     v_metodo, v_parcelas, coalesce((p_dados->>'recorrente') in ('true', 't', '1'), false),
     v_gasto, v_tags, coalesce(p_origem, 'texto'), p_mensagem_id)
  returning * into v_l;

  return jsonb_build_object('id', v_l.id, 'codigo', 'DEL#' || v_l.codigo, 'tipo', v_l.tipo,
    'valor', v_l.valor, 'data', v_l.data_lancamento, 'categoria', v_l.categoria,
    'subcategoria', v_l.subcategoria, 'descricao', v_l.descricao,
    'metodo_pagamento', v_l.metodo_pagamento, 'parcelas', v_l.parcelas);
end $$;

-- Apaga (soft delete) apenas lançamento do próprio usuário
create or replace function public.apagar_lancamento(p_usuario_id uuid, p_codigo text)
returns jsonb language plpgsql set search_path = '' as $$
declare
  v_cod text := upper(regexp_replace(trim(coalesce(p_codigo, '')), '^DEL#', '', 'i'));
  v_l public.lancamentos%rowtype;
begin
  update public.lancamentos set deleted_at = now()
   where usuario_id = p_usuario_id and codigo = v_cod and deleted_at is null
  returning * into v_l;
  if not found then return jsonb_build_object('ok', false); end if;
  return jsonb_build_object('ok', true, 'tipo', v_l.tipo, 'valor', v_l.valor, 'descricao', v_l.descricao);
end $$;

-- Resumo agregado no banco: o modelo só redige, não soma
create or replace function public.resumo_periodo(p_usuario_id uuid, p_de date, p_ate date)
returns jsonb language plpgsql stable set search_path = '' as $$
declare v_tot jsonb; v_cat jsonb; v_maior jsonb;
begin
  select jsonb_build_object(
    'de', p_de, 'ate', p_ate,
    'total_despesas', coalesce(sum(valor) filter (where tipo = 'despesa'), 0),
    'total_receitas', coalesce(sum(valor) filter (where tipo = 'receita'), 0),
    'saldo', coalesce(sum(case when tipo = 'receita' then valor else -valor end), 0),
    'quantidade', count(*))
  into v_tot
  from public.lancamentos
  where usuario_id = p_usuario_id and deleted_at is null and data_lancamento between p_de and p_ate;

  select coalesce(jsonb_agg(x order by x.total desc), '[]'::jsonb) into v_cat
  from (select tipo, coalesce(categoria, 'Outros') as categoria, sum(valor) as total, count(*) as qtd
        from public.lancamentos
        where usuario_id = p_usuario_id and deleted_at is null and data_lancamento between p_de and p_ate
        group by 1, 2) x;

  select to_jsonb(m) into v_maior
  from (select data_lancamento as data, categoria, descricao, valor
        from public.lancamentos
        where usuario_id = p_usuario_id and deleted_at is null and tipo = 'despesa'
          and data_lancamento between p_de and p_ate
        order by valor desc limit 1) m;

  return v_tot || jsonb_build_object('por_categoria', v_cat, 'maior_despesa', v_maior);
end $$;

create or replace function public.ultimos_lancamentos(p_usuario_id uuid, p_limite integer default 10)
returns jsonb language sql stable set search_path = '' as $$
  select coalesce(jsonb_agg(to_jsonb(l)), '[]'::jsonb)
  from (select 'DEL#' || codigo as codigo, tipo, valor, categoria, descricao, data_lancamento as data
        from public.lancamentos
        where usuario_id = p_usuario_id and deleted_at is null
        order by created_at desc
        limit least(greatest(coalesce(p_limite, 10), 1), 50)) l;
$$;

-- Funções do bot: só o service_role (n8n / Edge Functions) pode executar
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
