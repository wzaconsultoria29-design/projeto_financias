-- Datas relativas (hoje, ontem, semana, mês...) calculadas no banco, fuso de São Paulo.
-- O modelo só escolhe o nome do período; não calcula datas.
drop function if exists public.resumo_periodo(uuid, date, date);
create function public.resumo_periodo(
  p_usuario_id uuid, p_periodo text default null, p_de text default null, p_ate text default null)
returns jsonb language plpgsql stable set search_path = '' as $$
declare
  v_hoje date := (now() at time zone 'America/Sao_Paulo')::date;
  v_per text := lower(trim(coalesce(p_periodo, '')));
  v_de date; v_ate date; v_tot jsonb; v_cat jsonb; v_maior jsonb;
begin
  if v_per = 'hoje' then v_de := v_hoje; v_ate := v_hoje;
  elsif v_per = 'ontem' then v_de := v_hoje - 1; v_ate := v_hoje - 1;
  elsif v_per = 'semana' then v_de := date_trunc('week', v_hoje::timestamp)::date; v_ate := v_hoje;
  elsif v_per = 'semana_passada' then
    v_de := date_trunc('week', v_hoje::timestamp)::date - 7; v_ate := date_trunc('week', v_hoje::timestamp)::date - 1;
  elsif v_per = 'mes' then v_de := date_trunc('month', v_hoje::timestamp)::date; v_ate := v_hoje;
  elsif v_per = 'mes_passado' then
    v_de := (date_trunc('month', v_hoje::timestamp) - interval '1 month')::date;
    v_ate := date_trunc('month', v_hoje::timestamp)::date - 1;
  elsif v_per = 'ultimos_7_dias' then v_de := v_hoje - 6; v_ate := v_hoje;
  elsif v_per = 'ultimos_30_dias' then v_de := v_hoje - 29; v_ate := v_hoje;
  elsif v_per = 'ano' then v_de := date_trunc('year', v_hoje::timestamp)::date; v_ate := v_hoje;
  else
    begin
      v_de := nullif(trim(coalesce(p_de, '')), '')::date;
      v_ate := nullif(trim(coalesce(p_ate, '')), '')::date;
    exception when others then v_de := null; v_ate := null;
    end;
    if v_de is null or v_ate is null or v_ate < v_de or v_de < v_hoje - 3650 or v_ate > v_hoje + 366 then
      raise exception 'periodo_invalido' using errcode = '22023';
    end if;
  end if;

  select jsonb_build_object(
    'de', v_de, 'ate', v_ate,
    'total_despesas', coalesce(sum(valor) filter (where tipo = 'despesa'), 0),
    'total_receitas', coalesce(sum(valor) filter (where tipo = 'receita'), 0),
    'saldo', coalesce(sum(case when tipo = 'receita' then valor else -valor end), 0),
    'quantidade', count(*))
  into v_tot
  from public.lancamentos
  where usuario_id = p_usuario_id and deleted_at is null and data_lancamento between v_de and v_ate;

  select coalesce(jsonb_agg(x order by x.total desc), '[]'::jsonb) into v_cat
  from (select tipo, coalesce(categoria, 'Outros') as categoria, sum(valor) as total, count(*) as qtd
        from public.lancamentos
        where usuario_id = p_usuario_id and deleted_at is null and data_lancamento between v_de and v_ate
        group by 1, 2) x;

  select to_jsonb(m) into v_maior
  from (select data_lancamento as data, categoria, descricao, valor
        from public.lancamentos
        where usuario_id = p_usuario_id and deleted_at is null and tipo = 'despesa'
          and data_lancamento between v_de and v_ate
        order by valor desc limit 1) m;

  return v_tot || jsonb_build_object('periodo', coalesce(nullif(v_per, ''), 'personalizado'),
                                     'por_categoria', v_cat, 'maior_despesa', v_maior);
end $$;

-- Recusa datas absurdas (futuro ou muito antigas) para o agente corrigir em vez de gravar errado
create or replace function public.registrar_lancamento(
  p_usuario_id uuid, p_dados jsonb, p_mensagem_id text default null, p_origem text default 'texto')
returns jsonb language plpgsql set search_path = '' as $$
declare
  v_hoje date := (now() at time zone 'America/Sao_Paulo')::date;
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
  v_data := coalesce(v_data, v_hoje);
  if v_data > v_hoje + 1 then
    raise exception 'data_futura: use uma data ate hoje (%)', v_hoje using errcode = '22023';
  end if;
  if v_data < v_hoje - 1825 then
    raise exception 'data_muito_antiga: confira o ano (hoje e %)', v_hoje using errcode = '22023';
  end if;

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
