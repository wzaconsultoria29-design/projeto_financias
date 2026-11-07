-- Teste de app_painel (migração 015). Rodar com execute_sql depois da migração (ou na mesma chamada, para ensaio);
-- termina com erro proposital (desfaz tudo). Sucesso = saída com "FALHAS: 0".
do $$
declare
  a_auth uuid := gen_random_uuid(); b_auth uuid := gen_random_uuid();
  a uuid := gen_random_uuid(); b uuid := gen_random_uuid();
  r jsonb; out text := ''; falhas int; erro text;
begin
  insert into auth.users (id, instance_id, aud, role, email) values
    (a_auth, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'a_painel15@exemplo.invalid'),
    (b_auth, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'b_painel15@exemplo.invalid');
  insert into public.usuarios (id, auth_user_id, telefone, nome, status, consentimento_em) values
    (a, a_auth, '5511966690001', 'Ana', 'trial', now()), (b, b_auth, '5511966690002', 'Beto', 'trial', now());

  -- Outubro/2026 (A): receitas 3500; despesas 1900
  insert into public.lancamentos (usuario_id, tipo, valor, data_lancamento, categoria, descricao, tipo_gasto, recorrente) values
    (a, 'receita', 3000, '2026-10-05', 'Renda', 'Salário', null, false),
    (a, 'receita', 500,  '2026-10-20', 'Renda', 'Freela', null, false),
    (a, 'despesa', 1000, '2026-10-02', 'Moradia', 'Aluguel', 'essencial', true),
    (a, 'despesa', 300,  '2026-10-03', 'Alimentação', 'Mercado', 'essencial', false),
    (a, 'despesa', 200,  '2026-10-10', 'Alimentação', 'Restaurante', 'supérfluo', false),
    (a, 'despesa', 150,  '2026-10-15', 'Lazer', 'Cinema', 'supérfluo', false),
    (a, 'despesa', 50,   '2026-10-12', 'Assinaturas', 'Netflix', 'supérfluo', true),
    (a, 'despesa', 100,  '2026-10-25', 'Outros', 'Aporte', 'investimento', false),
    (a, 'despesa', 100,  '2026-10-28', 'Transporte', 'Uber', null, false);
  -- Setembro/2026 (A): receitas 3000; despesas 1500. Agosto: 3000 e 1000.
  insert into public.lancamentos (usuario_id, tipo, valor, data_lancamento, categoria, descricao, tipo_gasto) values
    (a, 'receita', 3000, '2026-09-05', 'Renda', 'Salário', null),
    (a, 'despesa', 1000, '2026-09-02', 'Moradia', 'Aluguel', 'essencial'),
    (a, 'despesa', 500,  '2026-09-10', 'Alimentação', 'Mercado', 'essencial'),
    (a, 'receita', 3000, '2026-08-05', 'Renda', 'Salário', null),
    (a, 'despesa', 1000, '2026-08-02', 'Moradia', 'Aluguel', 'essencial');
  -- lançamento apagado não conta; lançamento do outro cliente não aparece
  insert into public.lancamentos (usuario_id, tipo, valor, data_lancamento, categoria, descricao, deleted_at) values
    (a, 'despesa', 999, '2026-10-06', 'Compras', 'Apagado', now());
  insert into public.lancamentos (usuario_id, tipo, valor, data_lancamento, categoria, descricao) values
    (b, 'despesa', 777, '2026-10-06', 'Compras', 'Do outro');

  perform set_config('request.jwt.claims', json_build_object('sub', a_auth, 'role', 'authenticated')::text, true);
  set local role authenticated;

  r := public.app_painel('2026-10-01', '2026-10-31');

  out := out || case when (r->'resumo'->>'receitas')::numeric = 3500 and (r->'resumo'->>'despesas')::numeric = 1900
      and (r->'resumo'->>'saldo')::numeric = 1600 and (r->'resumo'->>'quantidade')::int = 9
      then E'PASS resumo soma só os lançamentos do cliente, sem apagados\n' else 'FAIL resumo: ' || (r->'resumo')::text || E'\n' end;
  out := out || case when (r->'resumo'->>'taxa_poupanca')::numeric = 45.7 and (r->'resumo'->>'media_diaria')::numeric = 61.29
      then E'PASS taxa de poupança e média diária\n' else 'FAIL taxa/média: ' || (r->'resumo')::text || E'\n' end;
  out := out || case when (r->'anterior'->>'despesas')::numeric = 1500 and (r->'anterior'->>'despesas_mesmo_ponto')::numeric = 1500
      and (r->>'variacao_despesas_pct')::numeric = 26.7
      then E'PASS período anterior e variação justa\n' else 'FAIL anterior: ' || (r->'anterior')::text || ' var=' || coalesce(r->>'variacao_despesas_pct', 'nulo') || E'\n' end;
  out := out || case when r->'categorias'->0->>'categoria' = 'Moradia' and (r->'categorias'->0->>'total')::numeric = 1000
      and (r->'categorias'->0->>'pct')::numeric = 52.6 and r->'categorias'->1->>'categoria' = 'Alimentação'
      and (r->'categorias'->1->>'anterior')::numeric = 500
      then E'PASS categorias ordenadas, com participação e valor do mês anterior\n' else 'FAIL categorias: ' || (r->'categorias')::text || E'\n' end;
  out := out || case when (r->'pareto'->>'top3_pct')::numeric = 86.8
      then E'PASS Pareto das 3 maiores\n' else 'FAIL pareto: ' || (r->'pareto')::text || E'\n' end;
  out := out || case when (r->'tipos'->>'essencial')::numeric = 1300 and (r->'tipos'->>'superfluo')::numeric = 400
      and (r->'tipos'->>'investimento')::numeric = 100 and (r->'tipos'->>'sem_tipo')::numeric = 100
      then E'PASS essencial, supérfluo, investimento e sem classificação somam o gasto\n' else 'FAIL tipos: ' || (r->'tipos')::text || E'\n' end;
  out := out || case when (r->'fixos'->>'fixos_total')::numeric = 1050 and (r->'fixos'->>'variaveis_total')::numeric = 850
      and r->'fixos'->'maiores'->0->>'descricao' = 'Aluguel'
      then E'PASS fixos e variáveis\n' else 'FAIL fixos: ' || (r->'fixos')::text || E'\n' end;
  out := out || case when jsonb_array_length(r->'acumulado') = 31 and (r->'acumulado'->30->>'atual')::numeric = 1900
      and (r->'acumulado'->30->>'anterior')::numeric = 1500
      then E'PASS gasto acumulado dia a dia contra o mês anterior\n' else 'FAIL acumulado: ' || coalesce((r->'acumulado'->30)::text, 'nulo') || E'\n' end;
  out := out || case when jsonb_array_length(r->'dia_semana') = 7
      and (select sum((x->>'total')::numeric) from jsonb_array_elements(r->'dia_semana') x) = 1900
      then E'PASS gasto por dia da semana soma o total\n' else 'FAIL dia da semana: ' || (r->'dia_semana')::text || E'\n' end;
  out := out || case when jsonb_array_length(r->'tendencia') = 6 and r->'tendencia'->5->>'mes' = '2026-10-01'
      and (r->'tendencia'->5->>'receitas')::numeric = 3500 and (r->'tendencia'->5->>'despesas')::numeric = 1900
      and (r->'tendencia'->4->>'despesas')::numeric = 1500 and (r->'tendencia'->3->>'despesas')::numeric = 1000
      and (r->'tendencia'->0->>'despesas')::numeric = 0
      then E'PASS tendência de 6 meses, com zeros nos meses vazios\n' else 'FAIL tendência: ' || (r->'tendencia')::text || E'\n' end;
  out := out || case when r->'maiores'->0->>'descricao' = 'Aluguel' and r->'projecao' = 'null'::jsonb
      and (r->>'sem_receita')::boolean = false and (r->>'historico_total')::int = 14
      then E'PASS maiores gastos, sem previsão para mês encerrado, histórico\n' else 'FAIL maiores/projeção: ' || coalesce((r->'projecao')::text, 'nulo') || E'\n' end;

  -- sem renda registrada: o painel avisa, não inventa saldo bom
  r := public.app_painel('2026-09-01', '2026-09-30');
  out := out || case when (r->'resumo'->>'receitas')::numeric = 3000 and (r->>'sem_receita')::boolean = false
      then E'PASS mês com renda não é marcado como sem renda\n' else E'FAIL sem_receita\n' end;
  perform set_config('request.jwt.claims', json_build_object('sub', b_auth, 'role', 'authenticated')::text, true);
  r := public.app_painel('2026-10-01', '2026-10-31');
  out := out || case when (r->'resumo'->>'despesas')::numeric = 777 and (r->'resumo'->>'receitas')::numeric = 0
      and (r->>'sem_receita')::boolean = true and (r->'resumo'->>'taxa_poupanca') is null
      then E'PASS outro cliente enxerga só o dele e é marcado como sem renda (taxa nula)\n' else 'FAIL isolamento: ' || (r->'resumo')::text || E'\n' end;

  -- período sem nada: zeros, sem NaN, listas vazias
  r := public.app_painel('2020-01-01', '2020-01-31');
  out := out || case when (r->'resumo'->>'despesas')::numeric = 0 and (r->'resumo'->>'taxa_poupanca') is null
      and r->'categorias' = '[]'::jsonb and r->'variacao_despesas_pct' = 'null'::jsonb and (r->>'sem_receita')::boolean = false
      and (r->'resumo'->>'media_diaria')::numeric > -1
      then E'PASS período vazio sem divisão por zero\n' else 'FAIL vazio: ' || r::text || E'\n' end;

  -- períodos inválidos
  begin perform public.app_painel('2026-10-31', '2026-10-01'); out := out || E'FAIL aceitou período invertido\n';
  exception when others then out := out || case when sqlerrm = 'periodo_invalido' then E'PASS recusa período invertido\n' else 'FAIL invertido: ' || sqlerrm || E'\n' end; end;
  begin perform public.app_painel('2000-01-01', '2026-10-01'); out := out || E'FAIL aceitou período enorme\n';
  exception when others then out := out || case when sqlerrm = 'periodo_invalido' then E'PASS recusa período enorme\n' else 'FAIL enorme: ' || sqlerrm || E'\n' end; end;

  -- permissões
  reset role;
  out := out || case when has_function_privilege('authenticated', 'public.app_painel(date,date)'::regprocedure, 'execute')
      and not has_function_privilege('anon', 'public.app_painel(date,date)'::regprocedure, 'execute')
      then E'PASS só cliente logado executa\n' else E'FAIL permissões\n' end;

  select count(*) into falhas from regexp_matches(out, 'FAIL', 'g');
  raise exception E'\n%FALHAS: %', out, falhas;
end $$;
