-- Teste da migração 019: aceite de termos, limite de login por IP e limpeza.
-- Rodar com execute_sql depois da migração (ou na mesma chamada, para ensaio); termina com erro proposital (desfaz tudo).
-- Sucesso = saída com "FALHAS: 0".
do $$
declare
  a_auth uuid := gen_random_uuid(); b_auth uuid := gen_random_uuid(); c_auth uuid := gen_random_uuid();
  a uuid := gen_random_uuid(); b uuid := gen_random_uuid();
  r jsonb; out text := ''; falhas int; n int; i int; v_versao text; v_gid uuid; v_cron int;
  hash_ok int;
begin
  insert into auth.users (id, instance_id, aud, role, email) values
    (a_auth, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'a_term19@exemplo.invalid'),
    (b_auth, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'b_term19@exemplo.invalid'),
    (c_auth, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'c_term19@exemplo.invalid');
  insert into public.usuarios (id, auth_user_id, telefone, nome, status, consentimento_em, consentimento_versao) values
    (a, a_auth, '5511966619001', 'Ana', 'trial', now() - interval '30 days', 'v1-2026-10'),
    (b, b_auth, '5511966619002', 'Beto', 'trial', now(), 'v1-2026-10');

  -- ------------------------------------------------------------------ aceite de termos
  perform set_config('request.jwt.claims', json_build_object('sub', a_auth, 'role', 'authenticated')::text, true);
  set local role authenticated;

  r := public.app_aceitar_termos('v2-2026-12');
  out := out || case when (r->>'ok')::boolean then E'PASS aceitar a nova versão devolve ok\n' else 'FAIL aceitar: ' || r::text || E'\n' end;
  r := public.app_minha_conta();
  out := out || case when r->'consentimento'->>'versao' = 'v2-2026-12' then E'PASS a conta passa a mostrar a versão nova\n' else 'FAIL versão na conta: ' || r::text || E'\n' end;

  r := public.app_aceitar_termos('abc');
  out := out || case when r->>'motivo' = 'versao_invalida' then E'PASS versão mal formada é recusada\n' else 'FAIL versão inválida: ' || r::text || E'\n' end;
  r := public.app_aceitar_termos(null);
  out := out || case when r->>'motivo' = 'versao_invalida' then E'PASS versão nula é recusada\n' else 'FAIL versão nula: ' || r::text || E'\n' end;

  perform set_config('request.jwt.claims', json_build_object('sub', c_auth, 'role', 'authenticated')::text, true);
  begin perform public.app_aceitar_termos('v2-2026-12'); out := out || E'FAIL aceitou sem cadastro\n';
  exception when others then out := out || case when sqlerrm = 'sem_cadastro' then E'PASS login sem cadastro recebe sem_cadastro\n' else 'FAIL sem cadastro: ' || sqlerrm || E'\n' end; end;

  reset role;
  select count(*) into n from public.consentimentos where usuario_id = a and versao = 'v2-2026-12' and origem = 'painel' and tipo in ('termos', 'privacidade');
  out := out || case when n = 2 then E'PASS o aceite fica registrado (termos e privacidade, origem painel)\n' else 'FAIL registro: ' || n || E'\n' end;
  select consentimento_versao into v_versao from public.usuarios where id = b;
  out := out || case when v_versao = 'v1-2026-10' then E'PASS o aceite de uma pessoa não mexe na outra\n' else E'FAIL isolamento\n' end;
  out := out || case when has_function_privilege('authenticated', 'public.app_aceitar_termos(text)'::regprocedure, 'execute')
      and not has_function_privilege('anon', 'public.app_aceitar_termos(text)'::regprocedure, 'execute')
      then E'PASS só cliente logado aceita termos\n' else E'FAIL permissões do aceite\n' end;

  -- ------------------------------------------------------------------ limite de login por IP
  i := 0;
  loop
    i := i + 1;
    r := public.login_iniciar_limitado('203.0.113.7');
    exit when r ? 'erro' or i = 20;
  end loop;
  out := out || case when i = 20 and not (r ? 'erro') and r ? 'sessao_id' then E'PASS 20 códigos em sequência do mesmo IP passam\n' else 'FAIL 20 códigos: i=' || i || ' ' || r::text || E'\n' end;
  r := public.login_iniciar_limitado('203.0.113.7');
  out := out || case when r->>'erro' = 'muitas_tentativas' then E'PASS o 21º código do mesmo IP é barrado\n' else 'FAIL limite: ' || r::text || E'\n' end;
  r := public.login_iniciar_limitado('203.0.113.8');
  out := out || case when r ? 'sessao_id' then E'PASS outro IP não é afetado\n' else 'FAIL outro IP: ' || r::text || E'\n' end;
  r := public.login_iniciar_limitado(null);
  out := out || case when r ? 'sessao_id' then E'PASS sem IP conhecido não barra ninguém\n' else 'FAIL sem IP: ' || r::text || E'\n' end;
  select count(*) into hash_ok from public.login_iniciar_ips where ip_hash like '%203.0.113%';
  out := out || case when hash_ok = 0 then E'PASS o IP não fica guardado em texto, só o hash\n' else E'FAIL IP em texto\n' end;
  update public.login_iniciar_ips set em = now() - interval '11 minutes';
  r := public.login_iniciar_limitado('203.0.113.7');
  out := out || case when r ? 'sessao_id' then E'PASS passados 10 minutos o IP volta a poder pedir\n' else 'FAIL janela: ' || r::text || E'\n' end;
  out := out || case when not has_function_privilege('anon', 'public.login_iniciar_limitado(text)'::regprocedure, 'execute')
      and not has_function_privilege('authenticated', 'public.login_iniciar_limitado(text)'::regprocedure, 'execute')
      and has_function_privilege('service_role', 'public.login_iniciar_limitado(text)'::regprocedure, 'execute')
      then E'PASS só o servidor chama o login limitado\n' else E'FAIL permissões do login limitado\n' end;

  -- ------------------------------------------------------------------ limpeza
  insert into public.grupos (titular_id) values (a) returning id into v_gid;
  insert into public.grupo_convites (grupo_id, codigo_hash, status, criado_em, expira_em) values
    (v_gid, 'h_velho_pendente', 'pendente', now() - interval '60 days', now() - interval '53 days'),
    (v_gid, 'h_velho_cancelado', 'cancelado', now() - interval '60 days', now() - interval '53 days'),
    (v_gid, 'h_velho_aceito', 'aceito', now() - interval '60 days', now() - interval '53 days'),
    (v_gid, 'h_recente_pendente', 'pendente', now(), now() + interval '7 days');
  insert into public.login_iniciar_ips (ip_hash, em) values ('hash_antigo', now() - interval '2 days'), ('hash_novo', now());
  r := public.limpar_dados_antigos();
  out := out || case when (r->>'convites_removidos')::int = 2 and r ? 'ips_removidos' and r ? 'mensagens_removidas' and r ? 'conversas_removidas'
      then E'PASS a limpeza devolve as contagens, inclusive as novas\n' else 'FAIL contagens: ' || r::text || E'\n' end;
  select count(*) into n from public.grupo_convites where codigo_hash in ('h_velho_pendente', 'h_velho_cancelado');
  out := out || case when n = 0 then E'PASS convites vencidos ou cancelados há mais de 30 dias são removidos\n' else E'FAIL convites velhos\n' end;
  select count(*) into n from public.grupo_convites where codigo_hash in ('h_velho_aceito', 'h_recente_pendente');
  out := out || case when n = 2 then E'PASS convite aceito e convite em vigor ficam\n' else E'FAIL convites que deviam ficar\n' end;
  select count(*) into n from public.login_iniciar_ips where ip_hash in ('hash_antigo');
  out := out || case when n = 0 then E'PASS IPs com mais de 1 dia são removidos\n' else E'FAIL ip antigo\n' end;
  select count(*) into n from public.login_iniciar_ips where ip_hash = 'hash_novo';
  out := out || case when n = 1 then E'PASS IP recente fica\n' else E'FAIL ip novo\n' end;

  -- ------------------------------------------------------------------ agendamento
  select count(*) into v_cron from cron.job where jobname = 'limpar-dados-antigos' and schedule = '15 6 * * *' and command like '%limpar_dados_antigos%';
  out := out || case when v_cron = 1 then E'PASS a limpeza está agendada todo dia às 06:15 UTC\n' else E'FAIL agendamento\n' end;

  select count(*) into falhas from regexp_matches(out, 'FAIL', 'g');
  raise exception E'\n%FALHAS: %', out, falhas;
end $$;
