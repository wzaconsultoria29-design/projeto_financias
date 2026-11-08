-- Teste de app_plano_e_pagamentos, app_solicitar_plano e app_cancelar_pedido_plano (migração 017).
-- Rodar com execute_sql depois da migração (ou na mesma chamada, para ensaio); termina com erro proposital (desfaz tudo).
-- Sucesso = saída com "FALHAS: 0".
do $$
declare
  a_auth uuid := gen_random_uuid(); b_auth uuid := gen_random_uuid(); c_auth uuid := gen_random_uuid();
  a uuid := gen_random_uuid(); b uuid := gen_random_uuid();
  p_trial uuid; p_ess uuid; p_fam uuid;
  r jsonb; out text := ''; falhas int; n int; plano_a text;
begin
  insert into auth.users (id, instance_id, aud, role, email) values
    (a_auth, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'a_plano17@exemplo.invalid'),
    (b_auth, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'b_plano17@exemplo.invalid'),
    (c_auth, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'c_plano17@exemplo.invalid');
  insert into public.usuarios (id, auth_user_id, telefone, nome, status, consentimento_em) values
    (a, a_auth, '5511966617001', 'Ana', 'trial', now()), (b, b_auth, '5511966617002', 'Beto', 'ativo', now());
  select id into p_trial from public.planos where codigo = 'trial';
  select id into p_ess from public.planos where codigo = 'essencial';
  select id into p_fam from public.planos where codigo = 'family';
  insert into public.assinaturas (usuario_id, plano_id, status) values (a, p_trial, 'trial');
  insert into public.assinaturas (usuario_id, plano_id, status, periodo_inicio) values (b, p_ess, 'ativa', now());
  insert into public.pagamentos (usuario_id, descricao, valor_centavos, status, pago_em) values
    (a, 'Essencial, mensalidade', 1900, 'pago', now() - interval '40 days'),
    (a, 'Essencial, mensalidade', 1900, 'pago', now() - interval '10 days'),
    (b, 'Essencial, mensalidade', 1900, 'pago', now() - interval '5 days');

  perform set_config('request.jwt.claims', json_build_object('sub', a_auth, 'role', 'authenticated')::text, true);
  set local role authenticated;

  r := public.app_plano_e_pagamentos();
  out := out || case when r->>'atual' = 'trial' and jsonb_array_length(r->'planos') = 3 and r->'solicitacao' = 'null'::jsonb
      then E'PASS estado inicial: plano atual, os 3 planos, sem pedido\n' else 'FAIL inicial: ' || r::text || E'\n' end;
  out := out || case when jsonb_array_length(r->'pagamentos') = 2 and (r->'pagamentos'->0->>'valor_centavos')::int = 1900
      and (r->'pagamentos'->0->>'data')::timestamptz > (r->'pagamentos'->1->>'data')::timestamptz
      then E'PASS histórico só com os pagamentos da própria pessoa, do mais novo para o mais antigo\n' else 'FAIL pagamentos: ' || (r->'pagamentos')::text || E'\n' end;

  r := public.app_solicitar_plano('family');
  out := out || case when (r->>'ok')::boolean and r->>'codigo' = 'family' then E'PASS pedir o Family registra o pedido\n' else 'FAIL pedir family: ' || r::text || E'\n' end;
  r := public.app_plano_e_pagamentos();
  out := out || case when r->'solicitacao'->>'codigo' = 'family' and r->>'atual' = 'trial'
      then E'PASS o pedido aparece e o plano atual continua o mesmo\n' else 'FAIL pedido visível: ' || r::text || E'\n' end;

  r := public.app_solicitar_plano('essencial');
  r := public.app_plano_e_pagamentos();
  out := out || case when r->'solicitacao'->>'codigo' = 'essencial' then E'PASS pedir outro plano troca o pedido\n' else 'FAIL trocar pedido: ' || r::text || E'\n' end;

  r := public.app_solicitar_plano('trial');
  out := out || case when r->>'motivo' = 'plano_invalido' then E'PASS plano grátis não pode ser pedido\n' else 'FAIL trial: ' || r::text || E'\n' end;
  r := public.app_solicitar_plano('inexistente');
  out := out || case when r->>'motivo' = 'plano_invalido' then E'PASS plano que não existe é recusado\n' else 'FAIL inexistente: ' || r::text || E'\n' end;

  r := public.app_cancelar_pedido_plano();
  out := out || case when (r->>'ok')::boolean then E'PASS cancelar o pedido\n' else 'FAIL cancelar: ' || r::text || E'\n' end;
  r := public.app_cancelar_pedido_plano();
  out := out || case when r->>'motivo' = 'nao_encontrado' then E'PASS sem pedido pendente, nada a cancelar\n' else 'FAIL cancelar de novo: ' || r::text || E'\n' end;

  -- quem já tem o plano não pede o mesmo; pode pedir outro
  perform set_config('request.jwt.claims', json_build_object('sub', b_auth, 'role', 'authenticated')::text, true);
  r := public.app_solicitar_plano('essencial');
  out := out || case when r->>'motivo' = 'ja_no_plano' then E'PASS quem já tem o plano não pede o mesmo\n' else 'FAIL ja_no_plano: ' || r::text || E'\n' end;
  perform public.app_solicitar_plano('family');
  r := public.app_plano_e_pagamentos();
  out := out || case when r->'solicitacao'->>'codigo' = 'family' and jsonb_array_length(r->'pagamentos') = 1
      then E'PASS cada pessoa vê só o próprio pedido e os próprios pagamentos\n' else 'FAIL isolamento: ' || r::text || E'\n' end;

  -- login sem cadastro
  perform set_config('request.jwt.claims', json_build_object('sub', c_auth, 'role', 'authenticated')::text, true);
  begin perform public.app_solicitar_plano('family'); out := out || E'FAIL pediu sem cadastro\n';
  exception when others then out := out || case when sqlerrm = 'sem_cadastro' then E'PASS login sem cadastro recebe sem_cadastro\n' else 'FAIL sem cadastro: ' || sqlerrm || E'\n' end; end;

  -- as tabelas não são lidas direto
  begin perform count(*) from public.pagamentos; out := out || E'FAIL leu pagamentos direto\n';
  exception when insufficient_privilege then out := out || E'PASS pagamentos não têm acesso direto\n'; end;
  begin perform count(*) from public.solicitacoes_plano; out := out || E'FAIL leu pedidos direto\n';
  exception when insufficient_privilege then out := out || E'PASS pedidos não têm acesso direto\n'; end;

  reset role;
  select p.codigo into plano_a from public.assinaturas s join public.planos p on p.id = s.plano_id where s.usuario_id = a and s.status in ('trial', 'ativa');
  select count(*) into n from public.solicitacoes_plano where usuario_id = a and status = 'pendente';
  out := out || case when plano_a = 'trial' and n = 0 then E'PASS nenhum pedido trocou o plano de ninguém\n' else E'FAIL plano trocado\n' end;
  out := out || case when has_function_privilege('authenticated', 'public.app_solicitar_plano(text)'::regprocedure, 'execute')
      and not has_function_privilege('anon', 'public.app_solicitar_plano(text)'::regprocedure, 'execute')
      and not has_function_privilege('anon', 'public.app_plano_e_pagamentos()'::regprocedure, 'execute')
      then E'PASS só cliente logado executa\n' else E'FAIL permissões\n' end;

  select count(*) into falhas from regexp_matches(out, 'FAIL', 'g');
  raise exception E'\n%FALHAS: %', out, falhas;
end $$;
