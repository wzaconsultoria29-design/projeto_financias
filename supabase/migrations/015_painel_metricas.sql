-- Métricas do painel novo (desenho de 2026-11-06). Uma chamada devolve tudo que a Visão geral mostra.
-- Mesmo padrão das funções app_*: só cliente logado (authenticated); leituras respeitam o RLS.

create function public.app_painel(p_de date, p_ate date) returns jsonb
language plpgsql stable set search_path = '' as $$
declare
  v_uid uuid := app.meu_usuario_id();
  v_hoje date := (now() at time zone 'America/Sao_Paulo')::date;
  v_dias integer; v_dec integer; v_ant_de date; v_ant_ate date;
  v_desp numeric; v_rec numeric; v_qtd integer;
  v_ant_desp numeric; v_ant_rec numeric; v_ant_ponto numeric := 0;
  v_var numeric := null; v_taxa numeric := null; v_media numeric := 0;
  v_cat jsonb; v_top3 numeric := null; v_tipos jsonb; v_fixos jsonb; v_acum jsonb := null;
  v_dow jsonb; v_tend jsonb; v_maiores jsonb; v_proj jsonb := null; v_hist integer;
  v_dm integer;
begin
  if v_uid is null then raise exception 'sem_cadastro'; end if;
  if p_de is null or p_ate is null or p_ate < p_de or p_ate - p_de > 3660 then
    raise exception 'periodo_invalido';
  end if;
  v_dias := p_ate - p_de + 1;
  v_dec := greatest(0, least(p_ate, v_hoje) - p_de + 1);
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

  -- comparação justa: o período anterior só até o mesmo ponto (mesmo número de dias já decorridos)
  if v_dec > 0 then
    select coalesce(sum(valor), 0) into v_ant_ponto
      from public.lancamentos
     where usuario_id = v_uid and deleted_at is null and tipo = 'despesa'
       and data_lancamento between v_ant_de and v_ant_de + (v_dec - 1);
  end if;
  if v_ant_ponto > 0 then v_var := round((v_desp - v_ant_ponto) / v_ant_ponto * 100, 1); end if;
  if v_rec > 0 then v_taxa := round((v_rec - v_desp) / v_rec * 100, 1); end if;
  if v_dec > 0 then v_media := round(v_desp / v_dec, 2); end if;

  -- categorias de despesa: as 7 maiores e o resto em "Outras"; cada uma com o total do período anterior
  select coalesce(jsonb_agg(jsonb_build_object('categoria', z.c, 'total', z.t, 'qtd', z.q,
           'pct', case when v_desp > 0 then round(z.t / v_desp * 100, 1) else 0 end,
           'anterior', z.ant) order by z.ordem, z.t desc), '[]'::jsonb)
    into v_cat
    from (
      select c, t, q, ant, case when c = 'Outras' then 1 else 0 end as ordem
        from (
          select case when r.pos <= 7 then r.c else 'Outras' end as c,
                 sum(r.t) as t, sum(r.q) as q, sum(r.ant) as ant
            from (
              select a.c, a.t, a.q, coalesce(b.t, 0) as ant, row_number() over (order by a.t desc, a.c) as pos
                from (select coalesce(categoria, 'Outros') as c, sum(valor) as t, count(*) as q
                        from public.lancamentos
                       where usuario_id = v_uid and deleted_at is null and tipo = 'despesa'
                         and data_lancamento between p_de and p_ate group by 1) a
                left join (select coalesce(categoria, 'Outros') as c, sum(valor) as t
                             from public.lancamentos
                            where usuario_id = v_uid and deleted_at is null and tipo = 'despesa'
                              and data_lancamento between v_ant_de and v_ant_ate group by 1) b on b.c = a.c
            ) r group by 1
        ) g
    ) z;

  select round(sum(t) / nullif(v_desp, 0) * 100, 1) into v_top3
    from (select sum(valor) as t from public.lancamentos
           where usuario_id = v_uid and deleted_at is null and tipo = 'despesa' and data_lancamento between p_de and p_ate
           group by coalesce(categoria, 'Outros') order by 1 desc limit 3) s;

  -- essencial, supérfluo, investimento (o bot grava o tipo do gasto; o que não tem tipo fica à parte)
  select jsonb_build_object(
           'essencial', coalesce(sum(valor) filter (where k = 'essencial'), 0),
           'superfluo', coalesce(sum(valor) filter (where k = 'superfluo'), 0),
           'investimento', coalesce(sum(valor) filter (where k = 'investimento'), 0),
           'sem_tipo', coalesce(sum(valor) filter (where k = 'sem_tipo'), 0))
    into v_tipos
    from (select valor,
                 case lower(translate(coalesce(tipo_gasto, ''), 'éÉúÚ', 'eEuU'))
                   when 'essencial' then 'essencial' when 'superfluo' then 'superfluo'
                   when 'investimento' then 'investimento' else 'sem_tipo' end as k
            from public.lancamentos
           where usuario_id = v_uid and deleted_at is null and tipo = 'despesa' and data_lancamento between p_de and p_ate) t;

  -- fixos (recorrentes e categorias de compromisso) contra variáveis
  select jsonb_build_object(
           'fixos_total', coalesce(sum(valor) filter (where fixo), 0),
           'variaveis_total', coalesce(sum(valor) filter (where not fixo), 0),
           'maiores', coalesce((select jsonb_agg(jsonb_build_object('descricao', m.descricao, 'categoria', m.categoria, 'valor', m.valor) order by m.valor desc)
                                  from (select coalesce(descricao, categoria, 'Sem descrição') as descricao, categoria, valor
                                          from public.lancamentos
                                         where usuario_id = v_uid and deleted_at is null and tipo = 'despesa'
                                           and data_lancamento between p_de and p_ate
                                           and (recorrente is true or categoria in ('Despesas Fixas', 'Moradia', 'Habitação', 'Assinaturas', 'Seguros'))
                                         order by valor desc limit 6) m), '[]'::jsonb))
    into v_fixos
    from (select valor, (recorrente is true or categoria in ('Despesas Fixas', 'Moradia', 'Habitação', 'Assinaturas', 'Seguros')) as fixo
            from public.lancamentos
           where usuario_id = v_uid and deleted_at is null and tipo = 'despesa' and data_lancamento between p_de and p_ate) f;

  -- gasto acumulado dia a dia contra o período anterior (só para períodos de até 62 dias)
  if v_dias <= 62 then
    select jsonb_agg(jsonb_build_object('dia', d.n,
             'atual', case when p_de + (d.n - 1) <= v_hoje then c.atual else null end,
             'anterior', c.ant) order by d.n)
      into v_acum
      from generate_series(1, v_dias) as d(n)
      cross join lateral (
        select coalesce((select sum(valor) from public.lancamentos
                          where usuario_id = v_uid and deleted_at is null and tipo = 'despesa'
                            and data_lancamento between p_de and p_de + (d.n - 1)), 0) as atual,
               coalesce((select sum(valor) from public.lancamentos
                          where usuario_id = v_uid and deleted_at is null and tipo = 'despesa'
                            and data_lancamento between v_ant_de and v_ant_de + (d.n - 1)), 0) as ant) c;
  end if;

  -- gasto por dia da semana (0 = domingo) e quantas vezes cada dia ocorreu até agora
  select jsonb_agg(jsonb_build_object('dow', w.dow, 'total', coalesce(x.t, 0),
           'ocorrencias', (select count(*) from generate_series(p_de::timestamp, least(p_ate, v_hoje)::timestamp, interval '1 day') g
                            where extract(dow from g) = w.dow)) order by w.dow)
    into v_dow
    from generate_series(0, 6) as w(dow)
    left join (select extract(dow from data_lancamento)::integer as dow, sum(valor) as t
                 from public.lancamentos
                where usuario_id = v_uid and deleted_at is null and tipo = 'despesa' and data_lancamento between p_de and p_ate
                group by 1) x on x.dow = w.dow;

  -- tendência: 6 meses terminando no mês do fim do período
  select jsonb_agg(jsonb_build_object('mes', m.mes, 'receitas', coalesce(x.rec, 0), 'despesas', coalesce(x.desp, 0)) order by m.mes)
    into v_tend
    from (select g::date as mes
            from generate_series(date_trunc('month', p_ate::timestamp) - interval '5 months',
                                 date_trunc('month', p_ate::timestamp), interval '1 month') g) m
    left join (select date_trunc('month', data_lancamento)::date as mes,
                      sum(valor) filter (where tipo = 'despesa') as desp,
                      sum(valor) filter (where tipo = 'receita') as rec
                 from public.lancamentos
                where usuario_id = v_uid and deleted_at is null
                  and data_lancamento >= (date_trunc('month', p_ate::timestamp) - interval '5 months')::date
                  and data_lancamento < (date_trunc('month', p_ate::timestamp) + interval '1 month')::date
                group by 1) x on x.mes = m.mes;

  select coalesce(jsonb_agg(to_jsonb(m) order by m.valor desc, m.data desc), '[]'::jsonb)
    into v_maiores
    from (select id, data_lancamento as data, categoria, descricao, valor
            from public.lancamentos
           where usuario_id = v_uid and deleted_at is null and tipo = 'despesa' and data_lancamento between p_de and p_ate
           order by valor desc, data_lancamento desc limit 5) m;

  select count(*) into v_hist from public.lancamentos where usuario_id = v_uid and deleted_at is null;

  -- previsão de fechamento: só para o mês corrente em andamento
  if p_de = date_trunc('month', v_hoje::timestamp)::date and p_ate >= v_hoje and v_dec > 0 then
    v_dm := extract(day from (date_trunc('month', v_hoje::timestamp) + interval '1 month' - interval '1 day'))::integer;
    v_proj := jsonb_build_object('previsto', round(v_desp / v_dec * v_dm, 2), 'dias_decorridos', v_dec, 'dias_no_mes', v_dm);
  end if;

  return jsonb_build_object(
    'periodo', jsonb_build_object('de', p_de, 'ate', p_ate, 'dias', v_dias, 'dias_decorridos', v_dec),
    'resumo', jsonb_build_object('receitas', v_rec, 'despesas', v_desp, 'saldo', v_rec - v_desp,
                                 'taxa_poupanca', v_taxa, 'media_diaria', v_media, 'quantidade', v_qtd),
    'anterior', jsonb_build_object('de', v_ant_de, 'ate', v_ant_ate, 'receitas', v_ant_rec, 'despesas', v_ant_desp,
                                   'despesas_mesmo_ponto', v_ant_ponto),
    'variacao_despesas_pct', v_var,
    'categorias', v_cat,
    'pareto', jsonb_build_object('top3_pct', v_top3),
    'tipos', v_tipos,
    'fixos', v_fixos,
    'acumulado', v_acum,
    'dia_semana', coalesce(v_dow, '[]'::jsonb),
    'tendencia', coalesce(v_tend, '[]'::jsonb),
    'maiores', v_maiores,
    'projecao', v_proj,
    'sem_receita', (v_rec = 0 and v_desp > 0),
    'historico_total', v_hist);
end $$;

revoke execute on function public.app_painel(date, date) from public, anon;
grant execute on function public.app_painel(date, date) to authenticated, service_role;
