-- Teste das funções do painel (app_*). Rodar com execute_sql; termina com erro proposital (desfaz tudo).
-- Sucesso = saída com "FALHAS: 0".
do $$
declare
  a_auth uuid := gen_random_uuid(); b_auth uuid := gen_random_uuid(); c_auth uuid := gen_random_uuid();
  a uuid := gen_random_uuid(); b uuid := gen_random_uuid();
  b_lanc uuid := gen_random_uuid(); pl uuid; a_ass uuid;
  r jsonb; r2 jsonb; novo uuid; hoje date := (now() at time zone 'America/Sao_Paulo')::date;
  out text := ''; falhas int; erro text;
begin
  insert into auth.users (id, instance_id, aud, role, email) values
    (a_auth, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'a_painel@exemplo.invalid'),
    (b_auth, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'b_painel@exemplo.invalid'),
    (c_auth, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'c_painel@exemplo.invalid');
  insert into public.usuarios (id, auth_user_id, telefone, nome, status, consentimento_em) values
    (a, a_auth, '5511966660001', 'Ana', 'trial', now()), (b, b_auth, '5511966660002', 'Beto', 'trial', now());
  select id into pl from public.planos where codigo = 'trial';
  insert into public.assinaturas (usuario_id, plano_id, status) values (a, pl, 'trial') returning id into a_ass;
  insert into public.uso_periodo (assinatura_id, usuario_id, periodo_inicio, mensagens)
    select id, a, periodo_inicio, 3 from public.assinaturas where id = a_ass;
  insert into public.lancamentos (usuario_id, tipo, valor, data_lancamento, categoria, descricao) values
    (a, 'despesa', 10, '2026-10-02', 'Alimentação', 'Mercado'),
    (a, 'despesa', 20, '2026-10-03', 'Transporte', 'Uber'),
    (a, 'receita', 100, '2026-10-03', 'Renda', 'Salário'),
    (a, 'despesa', 5, '2026-10-31', 'Alimentação', 'Padaria'),
    (a, 'despesa', 50, '2026-09-30', 'Lazer', 'Antigo');
  insert into public.lancamentos (usuario_id, tipo, valor, data_lancamento, categoria, descricao, deleted_at) values
    (a, 'despesa', 7, '2026-10-02', 'Outros', 'Apagado', now());
  insert into public.lancamentos (id, usuario_id, tipo, valor, data_lancamento, categoria, descricao) values
    (b_lanc, b, 'despesa', 99, '2026-10-02', 'Alimentação', 'B1');

  -- Cliente A logado
  perform set_config('request.jwt.claims', json_build_object('sub', a_auth, 'role', 'authenticated')::text, true);
  set local role authenticated;

  r := public.app_visao_geral('2026-10-01', '2026-10-31');
  out := out || case when (r->'totais'->>'despesas')::numeric = 35 and (r->'totais'->>'receitas')::numeric = 100
        and (r->'totais'->>'saldo')::numeric = 65 and (r->'totais'->>'quantidade')::int = 4
        then 'PASS totais do mês (sem lançamento apagado nem do outro cliente)' else 'FAIL totais: ' || (r->'totais')::text end || E'\n';
  out := out || case when jsonb_array_length(r->'serie_diaria') = 31 and (r->'serie_diaria'->0->>'data') = '2026-10-01'
        and (r->'serie_diaria'->0->>'despesas')::numeric = 0 and (r->'serie_diaria'->2->>'despesas')::numeric = 20
        and (r->'serie_diaria'->2->>'receitas')::numeric = 100 and (r->'serie_diaria'->30->>'despesas')::numeric = 5
        then 'PASS série diária completa (31 dias, zeros incluídos, 31/10 dentro de outubro)' else 'FAIL série diária' end || E'\n';
  out := out || case when (select sum((x->>'pct')::numeric) from jsonb_array_elements(r->'por_categoria') x) between 99.5 and 100.5
        and (r->'por_categoria'->0->>'categoria') = 'Transporte' then 'PASS categorias somam ~100% e vêm ordenadas' else 'FAIL categorias: ' || (r->'por_categoria')::text end || E'\n';
  out := out || case when (r->'anterior'->>'despesas')::numeric = 50 and (r->'anterior'->>'de') = '2026-08-31'
        and (r->'anterior'->>'ate') = '2026-09-30' and (r->>'variacao_despesas_pct')::numeric = -30
        then 'PASS comparação com o período anterior (-30%)' else 'FAIL anterior: ' || (r->'anterior')::text || ' var=' || coalesce(r->>'variacao_despesas_pct','null') end || E'\n';
  out := out || case when jsonb_array_length(r->'maiores') = 3 and (r->'maiores'->0->>'descricao') = 'Uber'
        then 'PASS maiores gastos (só despesas)' else 'FAIL maiores: ' || (r->'maiores')::text end || E'\n';

  r2 := public.app_visao_geral('2025-01-01', '2025-01-07');
  out := out || case when (r2->'totais'->>'despesas')::numeric = 0 and jsonb_array_length(r2->'serie_diaria') = 7
        and jsonb_array_length(r2->'por_categoria') = 0 and jsonb_array_length(r2->'maiores') = 0
        and (r2->'variacao_despesas_pct') = 'null'::jsonb and (r2->'projecao_mes') = 'null'::jsonb
        then 'PASS período vazio (zeros, sem NaN, variação e projeção nulas)' else 'FAIL vazio: ' || r2::text end || E'\n';
  r2 := public.app_visao_geral('2026-11-01', '2026-11-30');
  out := out || case when (r2->'totais'->>'despesas')::numeric = 0 then 'PASS 31/10 não vaza para novembro' else 'FAIL novembro' end || E'\n';
  r2 := public.app_visao_geral(date_trunc('month', hoje::timestamp)::date, hoje);
  out := out || case when (r2->'projecao_mes') <> 'null'::jsonb and (r2->'projecao_mes'->>'dias_decorridos')::int = extract(day from hoje)::int
        then 'PASS projeção só no mês corrente' else 'FAIL projeção: ' || (r2->'projecao_mes')::text end || E'\n';

  r := public.app_lancamentos('2026-10-01', '2026-10-31', null, null, 20, 0);
  out := out || case when (r->>'total')::int = 4 and jsonb_array_length(r->'itens') = 4 and (r->'itens'->0->>'data') = '2026-10-31'
        and r::text not like '%B1%' and r::text not like '%Apagado%' then 'PASS lista (4 itens, mais recente primeiro, sem apagado nem do outro)' else 'FAIL lista: ' || r::text end || E'\n';
  r := public.app_lancamentos('2026-10-01', '2026-10-31', 'Transporte', null, 20, 0);
  out := out || case when (r->>'total')::int = 1 and (r->'itens'->0->>'descricao') = 'Uber' then 'PASS filtro por categoria' else 'FAIL categoria' end || E'\n';
  r := public.app_lancamentos(null, null, null, 'MERC', 20, 0);
  out := out || case when (r->>'total')::int = 1 and (r->'itens'->0->>'descricao') = 'Mercado' then 'PASS busca sem diferenciar maiúsculas' else 'FAIL busca: ' || r::text end || E'\n';
  r := public.app_lancamentos(null, null, null, '%', 20, 0);
  out := out || case when (r->>'total')::int = 0 then 'PASS curinga % tratado como texto' else 'FAIL curinga: ' || r::text end || E'\n';
  r := public.app_lancamentos('2026-10-01', '2026-10-31', null, null, 2, 2);
  out := out || case when (r->>'total')::int = 4 and jsonb_array_length(r->'itens') = 2 then 'PASS paginação' else 'FAIL paginação' end || E'\n';

  r := public.app_salvar_lancamento(null, '{"tipo":"despesa","valor":12.5,"data":"2026-10-15","categoria":"Lazer","descricao":"Cinema"}'::jsonb);
  out := out || case when r->>'ok' = 'true' then 'PASS criar lançamento' else 'FAIL criar: ' || r::text end || E'\n';
  novo := (r->>'id')::uuid;
  r := public.app_salvar_lancamento(novo, '{"valor":15,"descricao":"Cinema 2"}'::jsonb);
  out := out || case when r->>'ok' = 'true' and (select valor from public.lancamentos where id = novo) = 15 then 'PASS editar o próprio lançamento' else 'FAIL editar: ' || r::text end || E'\n';
  r := public.app_salvar_lancamento(b_lanc, '{"valor":1}'::jsonb);
  out := out || case when r->>'ok' = 'false' then 'PASS não edita lançamento de outro cliente' else 'FAIL editou do outro' end || E'\n';
  r := public.app_salvar_lancamento(null, '{"tipo":"despesa","valor":-5}'::jsonb);
  out := out || case when r->>'ok' = 'false' then 'PASS valor inválido recusado' else 'FAIL valor inválido' end || E'\n';
  r := public.app_salvar_lancamento(null, '{"tipo":"despesa","valor":5,"data":"2999-01-01"}'::jsonb);
  out := out || case when r->>'ok' = 'false' then 'PASS data futura recusada' else 'FAIL data futura' end || E'\n';
  r := public.app_excluir_lancamento(b_lanc);
  out := out || case when r->>'ok' = 'false' then 'PASS não exclui lançamento de outro cliente' else 'FAIL excluiu do outro' end || E'\n';
  r := public.app_excluir_lancamento(novo);
  out := out || case when r->>'ok' = 'true' then 'PASS excluir o próprio lançamento' else 'FAIL excluir' end || E'\n';

  r := public.app_minha_conta();
  out := out || case when r->'plano'->>'codigo' = 'trial' and (r->'uso'->>'mensagens')::int = 3 and (r->'uso'->>'limite')::int = 50
        and (r->'uso'->>'restantes')::int = 47 and r->>'telefone_mascarado' like '%*%0001' and r::text not like '%5511966660001%'
        then 'PASS minha conta (plano, uso e telefone mascarado)' else 'FAIL conta: ' || r::text end || E'\n';
  reset role;

  -- A exclusão do B continua intacta
  out := out || case when (select deleted_at from public.lancamentos where id = b_lanc) is null then 'PASS lançamento do B intacto' else 'FAIL B alterado' end || E'\n';

  -- Cliente B não vê nada do A
  perform set_config('request.jwt.claims', json_build_object('sub', b_auth, 'role', 'authenticated')::text, true);
  set local role authenticated;
  r := public.app_visao_geral('2026-10-01', '2026-10-31');
  out := out || case when (r->'totais'->>'despesas')::numeric = 99 and (r->'totais'->>'quantidade')::int = 1 then 'PASS cliente B só vê o próprio (99)' else 'FAIL isolamento B: ' || (r->'totais')::text end || E'\n';
  reset role;

  -- Login válido sem cadastro de usuário no app
  perform set_config('request.jwt.claims', json_build_object('sub', c_auth, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    perform public.app_visao_geral('2026-10-01', '2026-10-31');
    out := out || 'FAIL sem cadastro deveria falhar' || E'\n';
  exception when others then
    out := out || case when sqlerrm = 'sem_cadastro' then 'PASS login sem cadastro recebe erro claro' else 'FAIL erro: ' || sqlerrm end || E'\n';
  end;
  reset role;

  out := out || case when not has_function_privilege('anon', 'public.app_visao_geral(date,date)', 'execute')
        and has_function_privilege('authenticated', 'public.app_visao_geral(date,date)', 'execute')
        and not has_function_privilege('anon', 'public.app_minha_conta()', 'execute')
        then 'PASS permissões (anon não executa; authenticated sim)' else 'FAIL permissões' end || E'\n';

  falhas := (length(out) - length(replace(out, 'FAIL', ''))) / 4;
  raise exception E'\n%FALHAS: %', out, falhas;
end $$;
