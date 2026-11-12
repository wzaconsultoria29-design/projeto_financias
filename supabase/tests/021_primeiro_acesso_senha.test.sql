-- Teste da migração 021: objetivo, renda, primeiro acesso e registro da senha.
-- Rodar com execute_sql depois da migração (ou na mesma chamada, para ensaio); termina com erro proposital (desfaz tudo).
-- Sucesso = saída com "FALHAS: 0".
do $$
declare
  a_auth uuid := gen_random_uuid(); b_auth uuid := gen_random_uuid(); c_auth uuid := gen_random_uuid();
  a uuid := gen_random_uuid(); b uuid := gen_random_uuid();
  r jsonb; out text := ''; falhas int; v_obj text; v_renda numeric; v_em timestamptz; v_em2 timestamptz; v_email text;
begin
  insert into auth.users (id, instance_id, aud, role, email) values
    (a_auth, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'a_pa21@exemplo.invalid'),
    (b_auth, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'b_pa21@exemplo.invalid'),
    (c_auth, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'c_pa21@exemplo.invalid');
  insert into public.usuarios (id, auth_user_id, telefone, nome, email, status, consentimento_em) values
    (a, a_auth, '5511966621001', 'Ana', 'ana@exemplo.com', 'trial', now()),
    (b, b_auth, '5511966621002', 'Beto', 'beto@exemplo.com', 'trial', now());

  perform set_config('request.jwt.claims', json_build_object('sub', a_auth, 'role', 'authenticated')::text, true);
  set local role authenticated;

  r := public.app_minha_conta();
  out := out || case when r->'objetivo' = 'null'::jsonb and (r->>'primeiro_acesso_concluido')::boolean = false and (r->>'tem_senha')::boolean = false
      then E'PASS conta nova: sem objetivo, primeiro acesso por fazer e sem senha\n' else 'FAIL conta nova: ' || r::text || E'\n' end;
  out := out || case when r->>'nome' = 'Ana' and r ? 'plano' and r ? 'uso' and r ? 'consentimento' and r ? 'renda_mensal'
      then E'PASS a leitura da conta continua com os campos de antes\n' else 'FAIL campos antigos: ' || r::text || E'\n' end;

  r := public.app_salvar_objetivo('guardar');
  out := out || case when (r->>'ok')::boolean then E'PASS salvar objetivo devolve ok\n' else 'FAIL objetivo: ' || r::text || E'\n' end;
  r := public.app_salvar_objetivo('ficar_rico');
  out := out || case when r->>'motivo' = 'objetivo_invalido' then E'PASS objetivo fora da lista é recusado\n' else 'FAIL objetivo inválido: ' || r::text || E'\n' end;
  r := public.app_salvar_objetivo(null);
  out := out || case when r->>'motivo' = 'objetivo_invalido' then E'PASS objetivo nulo é recusado\n' else 'FAIL objetivo nulo: ' || r::text || E'\n' end;

  r := public.app_salvar_renda(4500.555);
  out := out || case when (r->>'ok')::boolean then E'PASS salvar renda devolve ok\n' else 'FAIL renda: ' || r::text || E'\n' end;
  r := public.app_salvar_renda(-1);
  out := out || case when r->>'motivo' = 'renda_invalida' then E'PASS renda negativa é recusada\n' else 'FAIL renda negativa: ' || r::text || E'\n' end;

  r := public.app_concluir_primeiro_acesso();
  r := public.app_minha_conta();
  out := out || case when r->>'objetivo' = 'guardar' and (r->>'renda_mensal')::numeric = 4500.56 and (r->>'primeiro_acesso_concluido')::boolean
      then E'PASS a conta mostra objetivo, renda arredondada e primeiro acesso feito\n' else 'FAIL leitura: ' || r::text || E'\n' end;

  reset role;
  select primeiro_acesso_em into v_em from public.usuarios where id = a;
  set local role authenticated;
  perform pg_sleep(0.01);
  r := public.app_concluir_primeiro_acesso();
  reset role;
  select primeiro_acesso_em into v_em2 from public.usuarios where id = a;
  out := out || case when v_em = v_em2 then E'PASS concluir de novo não muda a data do primeiro acesso\n' else E'FAIL data mudou\n' end;

  -- isolamento
  select objetivo, renda_mensal into v_obj, v_renda from public.usuarios where id = b;
  out := out || case when v_obj is null and v_renda is null then E'PASS os dados de uma pessoa não mexem na outra\n' else E'FAIL isolamento\n' end;

  -- registro da senha (servidor)
  r := public.senha_registrada(a, '  Ana.Nova@Exemplo.com ');
  select email into v_email from public.usuarios where id = a;
  out := out || case when (r->>'ok')::boolean and v_email = 'ana.nova@exemplo.com' then E'PASS registrar a senha grava o e-mail de login em minúsculas\n' else 'FAIL registro: ' || r::text || ' ' || coalesce(v_email, '?') || E'\n' end;
  perform set_config('request.jwt.claims', json_build_object('sub', a_auth, 'role', 'authenticated')::text, true);
  set local role authenticated;
  r := public.app_minha_conta();
  out := out || case when (r->>'tem_senha')::boolean and r->>'email' = 'ana.nova@exemplo.com' then E'PASS a conta passa a dizer que tem senha\n' else 'FAIL tem senha: ' || r::text || E'\n' end;

  -- sem cadastro
  perform set_config('request.jwt.claims', json_build_object('sub', c_auth, 'role', 'authenticated')::text, true);
  begin perform public.app_salvar_objetivo('guardar'); out := out || E'FAIL salvou sem cadastro\n';
  exception when others then out := out || case when sqlerrm = 'sem_cadastro' then E'PASS login sem cadastro recebe sem_cadastro\n' else 'FAIL sem cadastro: ' || sqlerrm || E'\n' end; end;
  begin perform public.senha_registrada(a, 'x@y.com'); out := out || E'FAIL cliente registrou senha\n';
  exception when insufficient_privilege then out := out || E'PASS cliente logado não registra senha direto no banco\n'; end;
  reset role;

  out := out || case when has_function_privilege('authenticated', 'public.app_salvar_objetivo(text)'::regprocedure, 'execute')
      and not has_function_privilege('anon', 'public.app_salvar_objetivo(text)'::regprocedure, 'execute')
      and not has_function_privilege('anon', 'public.app_concluir_primeiro_acesso()'::regprocedure, 'execute')
      and not has_function_privilege('authenticated', 'public.senha_registrada(uuid,text)'::regprocedure, 'execute')
      then E'PASS permissões: cliente logado só nas funções app_; registro de senha só no servidor\n' else E'FAIL permissões\n' end;

  select count(*) into falhas from regexp_matches(out, 'FAIL', 'g');
  raise exception E'\n%FALHAS: %', out, falhas;
end $$;
