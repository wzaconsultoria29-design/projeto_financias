-- Funções do painel (app_*): só para clientes logados (authenticated). Leituras respeitam o RLS;
-- escritas são SECURITY DEFINER com checagem de dono (app.meu_usuario_id()).
-- ATENÇÃO: migrações futuras que revoguem permissões em massa devem excluir proname like 'app\_%'.

create function public.app_visao_geral(p_de date, p_ate date) returns jsonb
language plpgsql stable set search_path = '' as $$
declare
  v_uid uuid := app.meu_usuario_id();
  v_hoje date := (now() at time zone 'America/Sao_Paulo')::date;
  v_dias integer; v_ant_de date; v_ant_ate date;
  v_desp numeric; v_rec numeric; v_qtd integer; v_ant_desp numeric; v_ant_rec numeric;
  v_serie jsonb; v_cat jsonb; v_maiores jsonb; v_proj jsonb := null; v_var numeric := null;
  v_dm integer; v_dd integer;
begin
  if v_uid is null then raise exception 'sem_cadastro'; end if;
  if p_de is null or p_ate is null or p_ate < p_de or p_ate - p_de > 3660 then
    raise exception 'periodo_invalido';
  end if;
  v_dias := p_ate - p_de + 1;
  v_ant_ate := p_de - 1;
  v_ant_de := v_ant_ate - (v_dias - 1);

  select coalesce(sum(valor) filter (where tipo = 'despesa'), 0),
         coalesce(sum(valor) filter (where tipo = 'receita'), 0), count(*)
    into v_desp, v_rec, v_qtd
    from public.lancamentos
   where usuario_id = v_uid and deleted_at is null and data_lancamento between p_de and p_ate;

  select coalesce(sum(valor) filter (where tipo = 'despesa'), 0),
         coalesce(sum(valor) filter (where tipo = 'receita'), 0)
    into v_ant_desp, v_ant_rec
    from public.lancamentos
   where usuario_id = v_uid and deleted_at is null and data_lancamento between v_ant_de and v_ant_ate;

  select jsonb_agg(jsonb_build_object('data', d.dia, 'despesas', coalesce(x.desp, 0),
                                      'receitas', coalesce(x.rec, 0)) order by d.dia)
    into v_serie
    from (select g::date as dia from generate_series(p_de::timestamp, p_ate::timestamp, interval '1 day') g) d
    left join (select data_lancamento,
                      sum(valor) filter (where tipo = 'despesa') as desp,
                      sum(valor) filter (where tipo = 'receita') as rec
                 from public.lancamentos
                where usuario_id = v_uid and deleted_at is null and data_lancamento between p_de and p_ate
                group by data_lancamento) x on x.data_lancamento = d.dia;

  select coalesce(jsonb_agg(jsonb_build_object('categoria', z.c, 'total', z.t, 'qtd', z.q,
                    'pct', case when v_desp > 0 then round(z.t / v_desp * 100, 1) else 0 end) order by z.t desc), '[]'::jsonb)
    into v_cat
    from (select coalesce(categoria, 'Outros') as c, sum(valor) as t, count(*) as q
            from public.lancamentos
           where usuario_id = v_uid and deleted_at is null and tipo = 'despesa' and data_lancamento between p_de and p_ate
           group by 1) z;

  select coalesce(jsonb_agg(to_jsonb(m) order by m.valor desc, m.data desc), '[]'::jsonb)
    into v_maiores
    from (select id, data_lancamento as data, categoria, descricao, valor
            from public.lancamentos
           where usuario_id = v_uid and deleted_at is null and tipo = 'despesa' and data_lancamento between p_de and p_ate
           order by valor desc, data_lancamento desc limit 5) m;

  if v_ant_desp > 0 then
    v_var := round((v_desp - v_ant_desp) / v_ant_desp * 100, 1);
  end if;

  if p_de = date_trunc('month', v_hoje::timestamp)::date and p_ate = v_hoje then
    v_dd := extract(day from v_hoje)::integer;
    v_dm := extract(day from (date_trunc('month', v_hoje::timestamp) + interval '1 month' - interval '1 day'))::integer;
    v_proj := jsonb_build_object('previsto', round(v_desp / v_dd * v_dm, 2), 'dias_decorridos', v_dd, 'dias_no_mes', v_dm);
  end if;

  return jsonb_build_object(
    'periodo', jsonb_build_object('de', p_de, 'ate', p_ate, 'dias', v_dias),
    'totais', jsonb_build_object('despesas', v_desp, 'receitas', v_rec, 'saldo', v_rec - v_desp, 'quantidade', v_qtd),
    'anterior', jsonb_build_object('de', v_ant_de, 'ate', v_ant_ate, 'despesas', v_ant_desp, 'receitas', v_ant_rec),
    'variacao_despesas_pct', v_var,
    'serie_diaria', coalesce(v_serie, '[]'::jsonb),
    'por_categoria', v_cat,
    'maiores', v_maiores,
    'projecao_mes', v_proj);
end $$;

create function public.app_lancamentos(
  p_de date, p_ate date, p_categoria text, p_busca text, p_limite integer, p_offset integer) returns jsonb
language plpgsql stable set search_path = '' as $$
declare
  v_uid uuid := app.meu_usuario_id();
  v_lim integer := least(greatest(coalesce(p_limite, 20), 1), 200);
  v_off integer := greatest(coalesce(p_offset, 0), 0);
  v_cat text := nullif(trim(coalesce(p_categoria, '')), '');
  v_busca text := nullif(trim(coalesce(p_busca, '')), '');
  v_tot integer; v_itens jsonb;
begin
  if v_uid is null then raise exception 'sem_cadastro'; end if;
  if v_busca is not null then
    v_busca := '%' || replace(replace(replace(v_busca, '\', '\\'), '%', '\%'), '_', '\_') || '%';
  end if;

  select count(*) into v_tot from public.lancamentos l
   where l.usuario_id = v_uid and l.deleted_at is null
     and (p_de is null or l.data_lancamento >= p_de) and (p_ate is null or l.data_lancamento <= p_ate)
     and (v_cat is null or l.categoria = v_cat)
     and (v_busca is null or l.descricao ilike v_busca escape '\' or coalesce(l.categoria, '') ilike v_busca escape '\');

  select coalesce(jsonb_agg(jsonb_build_object('id', t.id, 'data', t.data_lancamento, 'tipo', t.tipo, 'valor', t.valor,
           'categoria', t.categoria, 'subcategoria', t.subcategoria, 'descricao', t.descricao,
           'metodo_pagamento', t.metodo_pagamento, 'origem', t.origem, 'codigo', 'DEL#' || t.codigo)
           order by t.data_lancamento desc, t.created_at desc), '[]'::jsonb)
    into v_itens
    from (select * from public.lancamentos l
           where l.usuario_id = v_uid and l.deleted_at is null
             and (p_de is null or l.data_lancamento >= p_de) and (p_ate is null or l.data_lancamento <= p_ate)
             and (v_cat is null or l.categoria = v_cat)
             and (v_busca is null or l.descricao ilike v_busca escape '\' or coalesce(l.categoria, '') ilike v_busca escape '\')
           order by l.data_lancamento desc, l.created_at desc
           limit v_lim offset v_off) t;

  return jsonb_build_object('total', v_tot, 'itens', v_itens);
end $$;

create function public.app_salvar_lancamento(p_id uuid, p_dados jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := app.meu_usuario_id();
  v_hoje date := (now() at time zone 'America/Sao_Paulo')::date;
  v_r jsonb; v_data date; v_valor numeric; v_tipo text; v_n integer;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'motivo', 'sem_cadastro'); end if;

  if p_id is null then
    begin
      v_r := public.registrar_lancamento(v_uid, p_dados, null, 'painel');
    exception when others then
      return jsonb_build_object('ok', false, 'motivo', sqlerrm);
    end;
    return jsonb_build_object('ok', true, 'id', v_r->>'id', 'codigo', v_r->>'codigo');
  end if;

  begin
    if p_dados ? 'data' then
      v_data := (p_dados->>'data')::date;
      if v_data > v_hoje + 1 then raise exception 'data_futura'; end if;
      if v_data < v_hoje - 1825 then raise exception 'data_muito_antiga'; end if;
    end if;
    if p_dados ? 'valor' then
      v_valor := (p_dados->>'valor')::numeric;
      if v_valor <= 0 then raise exception 'valor_invalido'; end if;
    end if;
    if p_dados ? 'tipo' then
      v_tipo := lower(p_dados->>'tipo');
      if v_tipo not in ('despesa', 'receita') then raise exception 'tipo_invalido'; end if;
    end if;
    update public.lancamentos set
      tipo = coalesce(v_tipo, tipo),
      valor = coalesce(v_valor, valor),
      data_lancamento = coalesce(v_data, data_lancamento),
      categoria = case when p_dados ? 'categoria' then nullif(p_dados->>'categoria', '') else categoria end,
      subcategoria = case when p_dados ? 'subcategoria' then nullif(p_dados->>'subcategoria', '') else subcategoria end,
      descricao = case when p_dados ? 'descricao' then left(nullif(p_dados->>'descricao', ''), 300) else descricao end,
      metodo_pagamento = case when p_dados ? 'metodo_pagamento' then nullif(p_dados->>'metodo_pagamento', '') else metodo_pagamento end
     where id = p_id and usuario_id = v_uid and deleted_at is null;
    get diagnostics v_n = row_count;
  exception when others then
    return jsonb_build_object('ok', false, 'motivo', sqlerrm);
  end;

  if v_n = 0 then return jsonb_build_object('ok', false, 'motivo', 'nao_encontrado'); end if;
  return jsonb_build_object('ok', true, 'id', p_id);
end $$;

create function public.app_excluir_lancamento(p_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := app.meu_usuario_id(); v_n integer;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'motivo', 'sem_cadastro'); end if;
  update public.lancamentos set deleted_at = now()
   where id = p_id and usuario_id = v_uid and deleted_at is null;
  get diagnostics v_n = row_count;
  return jsonb_build_object('ok', v_n > 0);
end $$;

create function public.app_minha_conta() returns jsonb
language plpgsql stable set search_path = '' as $$
declare
  v_u public.usuarios%rowtype; v_a public.assinaturas%rowtype; v_p public.planos%rowtype; v_uso integer := 0;
begin
  select * into v_u from public.usuarios where id = app.meu_usuario_id();
  if not found then raise exception 'sem_cadastro'; end if;
  select * into v_a from public.assinaturas
   where usuario_id = v_u.id and status in ('trial', 'ativa', 'inadimplente');
  if found then
    select * into v_p from public.planos where id = v_a.plano_id;
    select mensagens into v_uso from public.uso_periodo
     where assinatura_id = v_a.id and periodo_inicio = v_a.periodo_inicio;
    v_uso := coalesce(v_uso, 0);
  end if;
  return jsonb_build_object(
    'nome', v_u.nome, 'email', v_u.email,
    'telefone_mascarado', '+' || substr(v_u.telefone, 1, 2) || ' ' || substr(v_u.telefone, 3, 2) || ' *****-' || right(v_u.telefone, 4),
    'plano', case when v_p.id is null then null else jsonb_build_object('codigo', v_p.codigo, 'nome', v_p.nome,
               'preco_centavos', v_p.preco_centavos, 'mensagens_limite', v_p.mensagens_limite, 'membros_max', v_p.membros_max) end,
    'assinatura', case when v_a.id is null then null else jsonb_build_object('status', v_a.status,
               'periodo_inicio', v_a.periodo_inicio, 'periodo_fim', v_a.periodo_fim) end,
    'uso', jsonb_build_object('mensagens', v_uso, 'limite', v_p.mensagens_limite,
               'restantes', case when v_p.mensagens_limite is null then null else greatest(v_p.mensagens_limite - v_uso, 0) end),
    'consentimento', jsonb_build_object('em', v_u.consentimento_em, 'versao', v_u.consentimento_versao));
end $$;

revoke execute on function public.app_visao_geral(date, date),
  public.app_lancamentos(date, date, text, text, integer, integer),
  public.app_salvar_lancamento(uuid, jsonb), public.app_excluir_lancamento(uuid), public.app_minha_conta()
  from public, anon;
grant execute on function public.app_visao_geral(date, date),
  public.app_lancamentos(date, date, text, text, integer, integer),
  public.app_salvar_lancamento(uuid, jsonb), public.app_excluir_lancamento(uuid), public.app_minha_conta()
  to authenticated, service_role;
