-- Teste da migração 020: cobranças e ativação do plano pelo Mercado Pago.
-- Rodar com execute_sql depois da migração (ou na mesma chamada, para ensaio); termina com erro proposital (desfaz tudo).
-- Sucesso = saída com "FALHAS: 0".
do $$
declare
  a_auth uuid := gen_random_uuid(); b_auth uuid := gen_random_uuid(); c_auth uuid := gen_random_uuid(); d_auth uuid := gen_random_uuid();
  a uuid := gen_random_uuid(); b uuid := gen_random_uuid(); c uuid := gen_random_uuid(); d uuid := gen_random_uuid();
  p_trial uuid; p_ess uuid; p_fam uuid;
  r jsonb; out text := ''; falhas int; n int; i int;
  cob1 uuid; cob2 uuid; cob3 uuid; cob4 uuid; ass_antiga uuid; ass_nova uuid; fim_antigo timestamptz; fim_novo timestamptz;
  v_status text; v_plano text; v_pag_status text; v_fim timestamptz; v_ini timestamptz; v_ass_status text;
begin
  insert into auth.users (id, instance_id, aud, role, email) values
    (a_auth, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'a_cob20@exemplo.invalid'),
    (b_auth, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'b_cob20@exemplo.invalid'),
    (c_auth, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'c_cob20@exemplo.invalid'),
    (d_auth, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'd_cob20@exemplo.invalid');
  -- telefone_verificado_em preenchido: número já conectado ao bot (senão o bot fechado barra antes de olhar o plano)
  insert into public.usuarios (id, auth_user_id, telefone, nome, status, consentimento_em, telefone_verificado_em) values
    (a, a_auth, '5511966620001', 'Ana', 'trial', now(), now()),
    (b, b_auth, '5511966620002', 'Beto', 'ativo', now(), now()),
    (c, c_auth, '5511966620003', 'Carla', 'bloqueado', now(), now()),
    (d, d_auth, '5511966620004', 'Davi', 'ativo', now(), now());
  select id into p_trial from public.planos where codigo = 'trial';
  select id into p_ess from public.planos where codigo = 'essencial';
  select id into p_fam from public.planos where codigo = 'family';
  insert into public.assinaturas (usuario_id, plano_id, status) values (a, p_trial, 'trial');
  insert into public.assinaturas (usuario_id, plano_id, status, periodo_inicio, periodo_fim) values (b, p_ess, 'ativa', now() - interval '20 days', now() + interval '10 days');
  insert into public.assinaturas (usuario_id, plano_id, status, periodo_inicio, periodo_fim) values (d, p_ess, 'ativa', now() - interval '40 days', now() - interval '10 days');
  insert into public.solicitacoes_plano (usuario_id, plano_id) values (a, p_ess);

  -- ------------------------------------------------------------------ abrir cobrança
  r := public.cobranca_criar(a, 'essencial');
  cob1 := (r->>'cobranca_id')::uuid;
  out := out || case when (r->>'ok')::boolean and (r->>'valor_centavos')::int = 1900 and r->>'plano_codigo' = 'essencial' and cob1 is not null
      then E'PASS abrir cobrança do Essencial traz o valor do banco (R$ 19,00)\n' else 'FAIL criar: ' || r::text || E'\n' end;
  r := public.cobranca_criar(a, 'trial');
  out := out || case when r->>'motivo' = 'plano_invalido' then E'PASS plano grátis não gera cobrança\n' else 'FAIL trial: ' || r::text || E'\n' end;
  r := public.cobranca_criar(a, 'inexistente');
  out := out || case when r->>'motivo' = 'plano_invalido' then E'PASS plano que não existe não gera cobrança\n' else 'FAIL inexistente: ' || r::text || E'\n' end;
  r := public.cobranca_criar(c, 'essencial');
  out := out || case when r->>'motivo' = 'usuario_bloqueado' then E'PASS conta bloqueada não abre cobrança\n' else 'FAIL bloqueado: ' || r::text || E'\n' end;
  r := public.cobranca_criar(gen_random_uuid(), 'essencial');
  out := out || case when r->>'motivo' = 'sem_cadastro' then E'PASS usuário que não existe não abre cobrança\n' else 'FAIL sem cadastro: ' || r::text || E'\n' end;
  r := public.cobranca_vincular_preferencia(cob1, 'pref-123');
  out := out || case when (r->>'ok')::boolean then E'PASS a preferência do Mercado Pago fica ligada à cobrança\n' else 'FAIL vincular: ' || r::text || E'\n' end;

  -- ------------------------------------------------------------------ pagamento pendente e recusado não ativam nada
  r := public.cobranca_processar(cob1, 'mp-1', 'pending', 1900);
  select status into v_status from public.cobrancas where id = cob1;
  out := out || case when r->>'acao' = 'pendente' and v_status = 'pendente' then E'PASS pagamento pendente deixa a cobrança pendente\n' else 'FAIL pendente: ' || r::text || E'\n' end;
  r := public.cobranca_processar(cob1, 'mp-1', 'rejected', 1900);
  select status into v_status from public.cobrancas where id = cob1;
  out := out || case when r->>'acao' = 'falhou' and v_status = 'falhou' then E'PASS pagamento recusado marca a cobrança como falha\n' else 'FAIL recusado: ' || r::text || E'\n' end;
  select count(*) into n from public.assinaturas where usuario_id = a and plano_id = p_ess;
  out := out || case when n = 0 then E'PASS recusado e pendente não ativam o plano\n' else E'FAIL ativou sem pagar\n' end;

  -- ------------------------------------------------------------------ valor errado
  r := public.cobranca_criar(a, 'essencial'); cob2 := (r->>'cobranca_id')::uuid;
  r := public.cobranca_processar(cob2, 'mp-fraude', 'approved', 100);
  select status into v_status from public.cobrancas where id = cob2;
  out := out || case when r->>'motivo' = 'valor_divergente' and v_status = 'divergente' then E'PASS valor diferente do preço não ativa o plano\n' else 'FAIL divergente: ' || r::text || E'\n' end;
  r := public.cobranca_processar(cob2, 'mp-fraude2', 'approved', 1900, 'USD');
  out := out || case when r->>'motivo' = 'valor_divergente' then E'PASS moeda diferente de BRL não ativa o plano\n' else 'FAIL moeda: ' || r::text || E'\n' end;
  select count(*) into n from public.pagamentos where usuario_id = a;
  out := out || case when n = 0 then E'PASS pagamento divergente não vira registro de pagamento\n' else E'FAIL pagamento divergente registrado\n' end;

  -- ------------------------------------------------------------------ aprovado: trial -> Essencial
  r := public.cobranca_criar(a, 'essencial'); cob3 := (r->>'cobranca_id')::uuid;
  r := public.cobranca_processar(cob3, 'mp-100', 'approved', 1900);
  out := out || case when (r->>'ok')::boolean and r->>'acao' = 'ativada' then E'PASS aprovado ativa o Essencial\n' else 'FAIL ativar: ' || r::text || E'\n' end;
  select p.codigo, s.status, s.periodo_fim into v_plano, v_ass_status, v_fim
    from public.assinaturas s join public.planos p on p.id = s.plano_id where s.usuario_id = a and s.status = 'ativa';
  out := out || case when v_plano = 'essencial' and v_fim > now() + interval '27 days' and v_fim < now() + interval '32 days'
      then E'PASS a assinatura nova vale 1 mês\n' else 'FAIL assinatura: ' || coalesce(v_plano, '?') || ' ' || coalesce(v_fim::text, '?') || E'\n' end;
  select count(*) into n from public.assinaturas where usuario_id = a and status in ('trial', 'ativa', 'inadimplente');
  out := out || case when n = 1 then E'PASS só uma assinatura vigente (a do trial foi fechada)\n' else 'FAIL vigentes: ' || n || E'\n' end;
  select count(*) into n from public.assinaturas where usuario_id = a and status = 'cancelada';
  out := out || case when n = 1 then E'PASS a assinatura do teste grátis ficou como cancelada\n' else 'FAIL trial não fechado' || E'\n' end;
  select status into v_status from public.usuarios where id = a;
  out := out || case when v_status = 'ativo' then E'PASS a conta passa a ativa\n' else 'FAIL status usuário: ' || v_status || E'\n' end;
  select status into v_pag_status from public.pagamentos where usuario_id = a and gateway_pagamento_id = 'mp-100';
  out := out || case when v_pag_status = 'pago' then E'PASS o pagamento aparece no histórico como pago\n' else 'FAIL pagamento: ' || coalesce(v_pag_status, '?') || E'\n' end;
  select status into v_status from public.solicitacoes_plano where usuario_id = a and plano_id = p_ess;
  out := out || case when v_status = 'atendida' then E'PASS o pedido de plano fica atendido\n' else 'FAIL pedido: ' || coalesce(v_status, '?') || E'\n' end;
  select status into v_status from public.cobrancas where id = cob3;
  out := out || case when v_status = 'paga' then E'PASS a cobrança fica paga\n' else 'FAIL cobrança: ' || v_status || E'\n' end;

  -- o mesmo aviso do Mercado Pago chegando de novo não ativa duas vezes
  r := public.cobranca_processar(cob3, 'mp-100', 'approved', 1900);
  select count(*) into n from public.pagamentos where gateway_pagamento_id = 'mp-100';
  out := out || case when r->>'acao' = 'ja_processado' and n = 1 then E'PASS aviso repetido não duplica o pagamento\n' else 'FAIL repetido: ' || r::text || E'\n' end;
  select count(*) into n from public.assinaturas where usuario_id = a and status = 'ativa';
  out := out || case when n = 1 then E'PASS aviso repetido não duplica a assinatura\n' else E'FAIL assinatura duplicada\n' end;
  r := public.cobranca_processar(cob3, 'mp-100', 'rejected', 1900);
  select status into v_status from public.cobrancas where id = cob3;
  out := out || case when v_status = 'paga' then E'PASS um aviso de recusa tardio não desfaz a cobrança paga\n' else 'FAIL recusa tardia: ' || v_status || E'\n' end;

  -- o bot enxerga o plano novo e libera
  r := public.verificar_acesso('5511966620001', false);
  out := out || case when r->>'plano_codigo' = 'essencial' and not (r->>'bloqueado')::boolean and (r->>'limite')::int = 300
      then E'PASS o bot reconhece o Essencial com 300 mensagens e sem bloqueio\n' else 'FAIL bot: ' || r::text || E'\n' end;

  -- ------------------------------------------------------------------ renovação antes de vencer (conta b: Essencial até daqui a 10 dias)
  select id, periodo_fim into ass_antiga, fim_antigo from public.assinaturas where usuario_id = b and status = 'ativa';
  r := public.cobranca_criar(b, 'essencial'); cob4 := (r->>'cobranca_id')::uuid;
  r := public.cobranca_processar(cob4, 'mp-200', 'approved', 1900);
  select id, periodo_fim, periodo_inicio into ass_nova, fim_novo, v_ini from public.assinaturas where usuario_id = b and status = 'ativa';
  out := out || case when r->>'acao' = 'renovada' and ass_nova = ass_antiga then E'PASS renovar antes de vencer mantém a mesma assinatura\n' else 'FAIL renovação: ' || r::text || E'\n' end;
  out := out || case when fim_novo > fim_antigo + interval '27 days' and fim_novo < fim_antigo + interval '32 days'
      then E'PASS a renovação soma 1 mês ao fim (os dias que sobravam não se perdem)\n' else 'FAIL fim renovado: ' || fim_antigo || ' -> ' || fim_novo || E'\n' end;
  out := out || case when v_ini > now() - interval '1 minute' then E'PASS a renovação começa uma cota nova\n' else E'FAIL cota na renovação\n' end;

  -- ------------------------------------------------------------------ período vencido (conta d: venceu há 10 dias) pagando o mesmo plano
  r := public.cobranca_criar(d, 'essencial');
  r := public.cobranca_processar((r->>'cobranca_id')::uuid, 'mp-300', 'approved', 1900);
  select count(*) into n from public.assinaturas where usuario_id = d and status = 'ativa' and periodo_fim > now();
  out := out || case when r->>'acao' = 'ativada' and n = 1 then E'PASS pagar com o período vencido abre uma assinatura nova de 1 mês\n' else 'FAIL vencido: ' || r::text || E'\n' end;

  -- ------------------------------------------------------------------ troca de plano: Essencial -> Family
  r := public.cobranca_criar(a, 'family');
  r := public.cobranca_processar((r->>'cobranca_id')::uuid, 'mp-400', 'approved', 3900);
  select p.codigo into v_plano from public.assinaturas s join public.planos p on p.id = s.plano_id where s.usuario_id = a and s.status = 'ativa';
  out := out || case when r->>'acao' = 'ativada' and v_plano = 'family' then E'PASS pagar o Family troca o plano para Family\n' else 'FAIL upgrade: ' || r::text || ' ' || coalesce(v_plano, '?') || E'\n' end;
  select count(*) into n from public.assinaturas where usuario_id = a and status in ('trial', 'ativa', 'inadimplente');
  out := out || case when n = 1 then E'PASS depois da troca continua uma só assinatura vigente\n' else 'FAIL vigentes após troca: ' || n || E'\n' end;
  r := public.verificar_acesso('5511966620001', false);
  out := out || case when r->>'plano_codigo' = 'family' and (r->>'limite')::int = 800 then E'PASS o bot passa a reconhecer o Family com 800 mensagens\n' else 'FAIL bot Family: ' || r::text || E'\n' end;

  -- ------------------------------------------------------------------ reembolso
  r := public.cobranca_processar(cob3, 'mp-100', 'refunded', 1900);
  select status into v_pag_status from public.pagamentos where gateway_pagamento_id = 'mp-100';
  select status into v_status from public.cobrancas where id = cob3;
  out := out || case when r->>'acao' = 'reembolso_registrado' and v_pag_status = 'reembolsado' and v_status = 'reembolsada'
      then E'PASS reembolso aparece no histórico como reembolsado\n' else 'FAIL reembolso: ' || r::text || E'\n' end;
  select count(*) into n from public.assinaturas where usuario_id = a and status = 'ativa';
  out := out || case when n = 1 then E'PASS reembolso não corta o plano sozinho (fica para revisão)\n' else E'FAIL plano cortado\n' end;

  -- ------------------------------------------------------------------ casos de borda
  r := public.cobranca_processar(gen_random_uuid(), 'mp-x', 'approved', 1900);
  out := out || case when r->>'motivo' = 'cobranca_inexistente' then E'PASS cobrança que não existe é recusada\n' else 'FAIL inexistente: ' || r::text || E'\n' end;
  r := public.cobranca_processar(cob3, 'mp-x', 'algo_novo', 1900);
  out := out || case when r->>'acao' = 'ignorado' then E'PASS status desconhecido é ignorado sem erro\n' else 'FAIL desconhecido: ' || r::text || E'\n' end;
  -- conta bloqueada que pagou: o plano é registrado, mas o status bloqueado não é desfeito
  insert into public.cobrancas (usuario_id, plano_id, valor_centavos) values (c, p_ess, 1900) returning id into cob1;
  r := public.cobranca_processar(cob1, 'mp-blq', 'approved', 1900);
  select status into v_status from public.usuarios where id = c;
  out := out || case when v_status = 'bloqueado' then E'PASS pagamento não desbloqueia conta bloqueada\n' else 'FAIL bloqueio: ' || v_status || E'\n' end;

  -- ------------------------------------------------------------------ limite diário
  for i in 1..30 loop
    r := public.cobranca_criar(b, 'essencial');
    exit when not (r->>'ok')::boolean;
  end loop;
  out := out || case when r->>'motivo' = 'muitas_cobrancas' then E'PASS passando de 20 cobranças no dia, novas são barradas\n' else 'FAIL limite diário: ' || r::text || E'\n' end;

  -- ------------------------------------------------------------------ permissões
  perform set_config('request.jwt.claims', json_build_object('sub', a_auth, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin perform public.cobranca_processar(cob3, 'mp-x', 'approved', 1900); out := out || E'FAIL cliente chamou cobranca_processar\n';
  exception when insufficient_privilege then out := out || E'PASS cliente logado não ativa plano por conta própria\n'; end;
  begin perform public.cobranca_criar(a, 'family'); out := out || E'FAIL cliente chamou cobranca_criar\n';
  exception when insufficient_privilege then out := out || E'PASS cliente logado não abre cobrança direto no banco\n'; end;
  begin perform count(*) from public.cobrancas; out := out || E'FAIL cliente leu cobrancas\n';
  exception when insufficient_privilege then out := out || E'PASS a tabela de cobranças não tem acesso direto\n'; end;
  -- o histórico que a pessoa vê vem da função app e mostra o pagamento aprovado
  r := public.app_plano_e_pagamentos();
  out := out || case when jsonb_array_length(r->'pagamentos') >= 2 and r->>'atual' = 'family' then E'PASS a tela de plano mostra o plano novo e os pagamentos\n' else 'FAIL tela: ' || r::text || E'\n' end;
  reset role;

  select count(*) into falhas from regexp_matches(out, 'FAIL', 'g');
  raise exception E'\n%FALHAS: %', out, falhas;
end $$;
