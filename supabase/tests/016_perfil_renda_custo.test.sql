-- Teste de app_salvar_perfil e dos campos novos de app_minha_conta (migração 016).
-- Rodar com execute_sql depois da migração (ou na mesma chamada, para ensaio); termina com erro proposital (desfaz tudo).
-- Sucesso = saída com "FALHAS: 0".
do $$
declare
  a_auth uuid := gen_random_uuid(); b_auth uuid := gen_random_uuid(); c_auth uuid := gen_random_uuid();
  a uuid := gen_random_uuid(); b uuid := gen_random_uuid();
  r jsonb; out text := ''; falhas int; v_nome text; v_renda numeric; v_custo numeric;
begin
  insert into auth.users (id, instance_id, aud, role, email) values
    (a_auth, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'a_perfil16@exemplo.invalid'),
    (b_auth, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'b_perfil16@exemplo.invalid'),
    (c_auth, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'c_perfil16@exemplo.invalid');
  insert into public.usuarios (id, auth_user_id, telefone, nome, status, consentimento_em) values
    (a, a_auth, '5511966616001', 'Ana', 'trial', now()), (b, b_auth, '5511966616002', 'Beto', 'trial', now());

  perform set_config('request.jwt.claims', json_build_object('sub', a_auth, 'role', 'authenticated')::text, true);
  set local role authenticated;

  -- a conta nova começa sem renda nem custo, e a leitura continua funcionando para quem está logado
  r := public.app_minha_conta();
  out := out || case when r->>'nome' = 'Ana' and r->'renda_mensal' = 'null'::jsonb and r->'custo_vida_mensal' = 'null'::jsonb
      then E'PASS conta nova: sem renda nem custo de vida, leitura da conta funciona\n' else 'FAIL conta nova: ' || r::text || E'\n' end;

  r := public.app_salvar_perfil('  Ana Souza  ', 3500.555, 1900);
  out := out || case when (r->>'ok')::boolean then E'PASS salvar perfil devolve ok\n' else 'FAIL salvar: ' || r::text || E'\n' end;
  r := public.app_minha_conta();
  out := out || case when r->>'nome' = 'Ana Souza' and (r->>'renda_mensal')::numeric = 3500.56 and (r->>'custo_vida_mensal')::numeric = 1900
      then E'PASS nome sem espaços sobrando, centavos arredondados e valores lidos de volta\n' else 'FAIL leitura: ' || r::text || E'\n' end;

  -- renda e custo nulos limpam os campos
  r := public.app_salvar_perfil('Ana Souza', null, null);
  r := public.app_minha_conta();
  out := out || case when r->'renda_mensal' = 'null'::jsonb and r->'custo_vida_mensal' = 'null'::jsonb
      then E'PASS valores nulos limpam renda e custo\n' else 'FAIL limpar: ' || r::text || E'\n' end;

  -- validações: nada é gravado quando algo é inválido
  r := public.app_salvar_perfil('A', 100, 100);
  out := out || case when r->>'motivo' = 'nome_invalido' then E'PASS nome curto demais é recusado\n' else 'FAIL nome curto: ' || r::text || E'\n' end;
  r := public.app_salvar_perfil(repeat('x', 81), 100, 100);
  out := out || case when r->>'motivo' = 'nome_invalido' then E'PASS nome longo demais é recusado\n' else 'FAIL nome longo: ' || r::text || E'\n' end;
  r := public.app_salvar_perfil('Ana Souza', -1, 100);
  out := out || case when r->>'motivo' = 'renda_invalida' then E'PASS renda negativa é recusada\n' else 'FAIL renda negativa: ' || r::text || E'\n' end;
  r := public.app_salvar_perfil('Ana Souza', 100000001, 100);
  out := out || case when r->>'motivo' = 'renda_invalida' then E'PASS renda absurda é recusada\n' else 'FAIL renda absurda: ' || r::text || E'\n' end;
  r := public.app_salvar_perfil('Ana Souza', 100, -5);
  out := out || case when r->>'motivo' = 'custo_invalido' then E'PASS custo negativo é recusado\n' else 'FAIL custo negativo: ' || r::text || E'\n' end;

  -- quem está logado mexe só no próprio perfil
  perform public.app_salvar_perfil('Ana Souza', 5000, 2000);
  perform set_config('request.jwt.claims', json_build_object('sub', b_auth, 'role', 'authenticated')::text, true);
  r := public.app_minha_conta();
  out := out || case when r->>'nome' = 'Beto' and r->'renda_mensal' = 'null'::jsonb
      then E'PASS o perfil de outra pessoa não foi tocado\n' else 'FAIL isolamento: ' || r::text || E'\n' end;

  -- login sem cadastro não salva nada
  perform set_config('request.jwt.claims', json_build_object('sub', c_auth, 'role', 'authenticated')::text, true);
  begin perform public.app_salvar_perfil('Carla', 1, 1); out := out || E'FAIL salvou sem cadastro\n';
  exception when others then out := out || case when sqlerrm = 'sem_cadastro' then E'PASS login sem cadastro recebe sem_cadastro\n' else 'FAIL sem cadastro: ' || sqlerrm || E'\n' end; end;

  -- o que ficou gravado, visto de fora
  reset role;
  select nome, renda_mensal, custo_vida_mensal into v_nome, v_renda, v_custo from public.usuarios where id = a;
  out := out || case when v_nome = 'Ana Souza' and v_renda = 5000 and v_custo = 2000
      then E'PASS valores gravados na tabela\n' else E'FAIL gravação\n' end;

  -- permissões
  out := out || case when has_function_privilege('authenticated', 'public.app_salvar_perfil(text,numeric,numeric)'::regprocedure, 'execute')
      and not has_function_privilege('anon', 'public.app_salvar_perfil(text,numeric,numeric)'::regprocedure, 'execute')
      then E'PASS só cliente logado salva o perfil\n' else E'FAIL permissões\n' end;

  select count(*) into falhas from regexp_matches(out, 'FAIL', 'g');
  raise exception E'\n%FALHAS: %', out, falhas;
end $$;
