-- Teste de app_categorias(). Rodar com execute_sql; termina com erro proposital (desfaz tudo).
-- Sucesso = saída com "FALHAS: 0".
do $$
declare
  a_auth uuid := gen_random_uuid(); b_auth uuid := gen_random_uuid();
  a uuid := gen_random_uuid(); b uuid := gen_random_uuid();
  r jsonb; out text := ''; falhas int;
begin
  insert into auth.users (id, instance_id, aud, role, email) values
    (a_auth, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'a_cat@exemplo.invalid'),
    (b_auth, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'b_cat@exemplo.invalid');
  insert into public.usuarios (id, auth_user_id, telefone, nome, status, consentimento_em) values
    (a, a_auth, '5511966670001', 'Ana', 'trial', now()), (b, b_auth, '5511966670002', 'Beto', 'trial', now());
  insert into public.lancamentos (usuario_id, tipo, valor, data_lancamento, categoria) values
    (a, 'despesa', 10, '2026-10-02', 'Alimentação'), (a, 'despesa', 10, '2026-10-03', 'Alimentação'),
    (a, 'despesa', 20, '2026-10-03', ' Cuidados Pessoais '), (a, 'receita', 100, '2026-10-03', 'Renda'),
    (a, 'despesa', 5, '2026-10-04', null), (a, 'despesa', 5, '2026-10-04', '  '),
    (b, 'despesa', 99, '2026-10-02', 'SegredoDoB');
  insert into public.lancamentos (usuario_id, tipo, valor, data_lancamento, categoria, deleted_at) values
    (a, 'despesa', 7, '2026-10-02', 'Apagada', now());

  perform set_config('request.jwt.claims', json_build_object('sub', a_auth, 'role', 'authenticated')::text, true);
  set local role authenticated;
  r := public.app_categorias();
  out := out || case when r = '["Alimentação", "Cuidados Pessoais", "Renda"]'::jsonb
        then 'PASS devolve só as categorias do cliente, sem repetir, sem vazias e sem apagadas'
        else 'FAIL categorias de A: ' || r::text end || E'\n';

  perform set_config('request.jwt.claims', json_build_object('sub', b_auth, 'role', 'authenticated')::text, true);
  r := public.app_categorias();
  out := out || case when r = '["SegredoDoB"]'::jsonb then 'PASS B enxerga só as próprias' else 'FAIL categorias de B: ' || r::text end || E'\n';

  perform set_config('request.jwt.claims', '{}', true);
  set local role anon;
  begin
    perform public.app_categorias();
    out := out || E'FAIL anon executou\n';
  exception when insufficient_privilege then
    out := out || E'PASS anon não executa\n';
  end;

  reset role;
  select count(*) into falhas from regexp_matches(out, 'FAIL', 'g');
  raise exception E'\n%FALHAS: %', out, falhas;
end $$;
