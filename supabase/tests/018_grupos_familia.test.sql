-- Teste dos grupos do plano Family (migração 018).
-- Rodar com execute_sql depois da migração (ou na mesma chamada, para ensaio); termina com erro proposital (desfaz tudo).
-- Sucesso = saída com "FALHAS: 0".
do $$
declare
  t_auth uuid := gen_random_uuid(); x_auth uuid := gen_random_uuid(); m1_auth uuid := gen_random_uuid(); m2_auth uuid := gen_random_uuid(); m3_auth uuid := gen_random_uuid();
  t uuid := gen_random_uuid(); x uuid := gen_random_uuid(); m1 uuid := gen_random_uuid(); m2 uuid := gen_random_uuid(); m3 uuid := gen_random_uuid();
  p_trial uuid; p_fam uuid;
  r jsonb; out text := ''; falhas int; c1 text; c2 text; c3 text; id3 uuid; n int; hash_ok int;
begin
  insert into auth.users (id, instance_id, aud, role, email) values
    (t_auth, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 't_grupo18@exemplo.invalid'),
    (x_auth, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'x_grupo18@exemplo.invalid'),
    (m1_auth, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'm1_grupo18@exemplo.invalid'),
    (m2_auth, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'm2_grupo18@exemplo.invalid'),
    (m3_auth, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'm3_grupo18@exemplo.invalid');
  insert into public.usuarios (id, auth_user_id, telefone, nome, email, status, consentimento_em) values
    (t, t_auth, '5511966618001', 'Titular', 't_grupo18@exemplo.invalid', 'ativo', now()),
    (x, x_auth, '5511966618002', 'Sem Family', 'x_grupo18@exemplo.invalid', 'trial', now()),
    (m1, m1_auth, '5511966618003', 'Membro Um', 'm1_grupo18@exemplo.invalid', 'trial', now()),
    (m2, m2_auth, '5511966618004', 'Membro Dois', 'm2_grupo18@exemplo.invalid', 'trial', now()),
    (m3, m3_auth, '5511966618005', 'Membro Tres', 'm3_grupo18@exemplo.invalid', 'trial', now());
  select id into p_trial from public.planos where codigo = 'trial';
  select id into p_fam from public.planos where codigo = 'family';
  insert into public.assinaturas (usuario_id, plano_id, status, periodo_inicio) values (t, p_fam, 'ativa', now());
  insert into public.assinaturas (usuario_id, plano_id, status) values (x, p_trial, 'trial'), (m1, p_trial, 'trial'), (m2, p_trial, 'trial'), (m3, p_trial, 'trial');

  perform set_config('request.jwt.claims', json_build_object('sub', x_auth, 'role', 'authenticated')::text, true);
  set local role authenticated;

  -- quem não tem o Family
  r := public.app_grupo();
  out := out || case when (r->>'elegivel')::boolean = false and r->'papel' = 'null'::jsonb then E'PASS sem Family: não é elegível e não está em grupo\n' else 'FAIL x grupo: ' || r::text || E'\n' end;
  r := public.app_criar_convite();
  out := out || case when r->>'motivo' = 'sem_plano_family' then E'PASS sem Family não gera convite\n' else 'FAIL x convite: ' || r::text || E'\n' end;

  -- o titular
  perform set_config('request.jwt.claims', json_build_object('sub', t_auth, 'role', 'authenticated')::text, true);
  r := public.app_grupo();
  out := out || case when (r->>'elegivel')::boolean and (r->>'limite')::int = 4 and jsonb_array_length(r->'membros') = 0 then E'PASS titular elegível, limite 4, ainda sem grupo\n' else 'FAIL t grupo: ' || r::text || E'\n' end;
  r := public.app_criar_convite(); c1 := r->>'codigo';
  out := out || case when (r->>'ok')::boolean and length(c1) = 10 and c1 ~ '^[A-HJ-NP-Z2-9]{10}$' then E'PASS convite criado com código de 10 caracteres\n' else 'FAIL convite 1: ' || r::text || E'\n' end;
  r := public.app_grupo();
  out := out || case when r->>'papel' = 'titular' and jsonb_array_length(r->'membros') = 1 and r->'membros'->0->>'papel' = 'titular' and jsonb_array_length(r->'convites') = 1
      then E'PASS o grupo nasce com o titular e mostra o convite pendente\n' else 'FAIL grupo criado: ' || r::text || E'\n' end;
  r := public.app_criar_convite(); c2 := r->>'codigo';
  r := public.app_criar_convite(); c3 := r->>'codigo';
  r := public.app_criar_convite();
  out := out || case when r->>'motivo' = 'limite_atingido' then E'PASS titular + 3 convites enchem o limite de 4\n' else 'FAIL limite: ' || r::text || E'\n' end;

  -- o código não fica guardado
  reset role;
  select count(*) into n from public.grupo_convites where codigo_hash in (c1, c2, c3);
  select count(*) into hash_ok from public.grupo_convites where codigo_hash = app.hash_convite(c1);
  out := out || case when n = 0 and hash_ok = 1 then E'PASS só o hash do código fica guardado\n' else E'FAIL hash\n' end;
  set local role authenticated;

  -- quem aceita
  perform set_config('request.jwt.claims', json_build_object('sub', m1_auth, 'role', 'authenticated')::text, true);
  r := public.app_aceitar_convite(lower(c1));
  out := out || case when (r->>'ok')::boolean and r->>'titular_nome' = 'Titular' then E'PASS membro entra com o código (maiúsculas e minúsculas valem)\n' else 'FAIL aceitar: ' || r::text || E'\n' end;
  r := public.app_aceitar_convite(c1);
  out := out || case when r->>'motivo' = 'convite_invalido' then E'PASS o convite vale uma vez só\n' else 'FAIL reuso: ' || r::text || E'\n' end;
  r := public.app_aceitar_convite(c2);
  out := out || case when r->>'motivo' = 'ja_no_grupo' then E'PASS quem já está em um grupo não entra em outro\n' else 'FAIL ja_no_grupo: ' || r::text || E'\n' end;
  r := public.app_aceitar_convite('ABCDEFGHJK');
  out := out || case when r->>'motivo' = 'convite_invalido' then E'PASS código que não existe é recusado\n' else 'FAIL inventado: ' || r::text || E'\n' end;
  r := public.app_grupo();
  out := out || case when r->>'papel' = 'membro' and jsonb_array_length(r->'membros') = 2 and jsonb_array_length(r->'convites') = 0 and r->>'titular_nome' = 'Titular'
      and not (r->'membros'->0 ? 'email') and not (r->'membros'->0 ? 'telefone')
      then E'PASS membro vê o grupo só com nomes, sem convites, e-mails nem telefones\n' else 'FAIL grupo do membro: ' || r::text || E'\n' end;
  r := public.app_criar_convite();
  out := out || case when r->>'motivo' = 'sem_plano_family' then E'PASS membro sem Family não gera convite\n' else 'FAIL membro convida: ' || r::text || E'\n' end;
  r := public.app_cancelar_convite(gen_random_uuid());
  out := out || case when r->>'motivo' = 'nao_encontrado' then E'PASS membro não cancela convites\n' else 'FAIL membro cancela: ' || r::text || E'\n' end;
  r := public.app_remover_membro(t);
  out := out || case when r->>'motivo' = 'nao_encontrado' then E'PASS membro não remove ninguém\n' else 'FAIL membro remove: ' || r::text || E'\n' end;

  -- o titular não entra no próprio convite; convite cancelado e vencido não valem
  perform set_config('request.jwt.claims', json_build_object('sub', t_auth, 'role', 'authenticated')::text, true);
  r := public.app_aceitar_convite(c3);
  out := out || case when r->>'motivo' = 'proprio_grupo' then E'PASS titular não aceita o próprio convite\n' else 'FAIL proprio: ' || r::text || E'\n' end;
  -- acha o convite c3 pelo hash (na mesma transação todos têm a mesma hora, então "o primeiro da lista" seria ambíguo)
  reset role;
  select id into id3 from public.grupo_convites where codigo_hash = app.hash_convite(c3);
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', t_auth, 'role', 'authenticated')::text, true);
  r := public.app_cancelar_convite(id3);
  out := out || case when (r->>'ok')::boolean then E'PASS titular cancela um convite pendente\n' else 'FAIL cancelar: ' || r::text || E'\n' end;
  perform set_config('request.jwt.claims', json_build_object('sub', m2_auth, 'role', 'authenticated')::text, true);
  r := public.app_aceitar_convite(c3);
  out := out || case when r->>'motivo' = 'convite_invalido' then E'PASS convite cancelado não vale\n' else 'FAIL cancelado: ' || r::text || E'\n' end;
  perform set_config('request.jwt.claims', json_build_object('sub', t_auth, 'role', 'authenticated')::text, true);
  r := public.app_criar_convite(); c3 := r->>'codigo';
  out := out || case when (r->>'ok')::boolean then E'PASS vaga liberada pelo cancelamento volta a poder ser usada\n' else 'FAIL vaga: ' || r::text || E'\n' end;
  reset role;
  update public.grupo_convites set expira_em = now() - interval '1 day' where codigo_hash = app.hash_convite(c3);
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', m2_auth, 'role', 'authenticated')::text, true);
  r := public.app_aceitar_convite(c3);
  out := out || case when r->>'motivo' = 'convite_invalido' then E'PASS convite vencido não vale\n' else 'FAIL vencido: ' || r::text || E'\n' end;

  -- grupo cheio: baixa o limite do plano para 2 e tenta passar
  perform set_config('request.jwt.claims', json_build_object('sub', t_auth, 'role', 'authenticated')::text, true);
  reset role;
  update public.planos set membros_max = 2 where codigo = 'family';
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', m2_auth, 'role', 'authenticated')::text, true);
  r := public.app_aceitar_convite(c2);
  out := out || case when r->>'motivo' = 'grupo_cheio' then E'PASS grupo cheio recusa a entrada\n' else 'FAIL grupo cheio: ' || r::text || E'\n' end;
  reset role;
  update public.planos set membros_max = 4 where codigo = 'family';
  set local role authenticated;

  -- remover e sair
  perform set_config('request.jwt.claims', json_build_object('sub', t_auth, 'role', 'authenticated')::text, true);
  r := public.app_remover_membro(t);
  out := out || case when r->>'motivo' = 'nao_permitido' then E'PASS titular não se remove\n' else 'FAIL remover titular: ' || r::text || E'\n' end;
  r := public.app_remover_membro(m3);
  out := out || case when r->>'motivo' = 'nao_encontrado' then E'PASS remover quem não está no grupo não faz nada\n' else 'FAIL remover alheio: ' || r::text || E'\n' end;
  r := public.app_remover_membro(m1);
  out := out || case when (r->>'ok')::boolean then E'PASS titular remove um membro\n' else 'FAIL remover: ' || r::text || E'\n' end;
  perform set_config('request.jwt.claims', json_build_object('sub', m1_auth, 'role', 'authenticated')::text, true);
  r := public.app_grupo();
  out := out || case when r->'papel' = 'null'::jsonb then E'PASS quem foi removido deixa de ver o grupo\n' else 'FAIL pós-remoção: ' || r::text || E'\n' end;
  r := public.app_aceitar_convite(c2);
  r := public.app_sair_do_grupo();
  out := out || case when (r->>'ok')::boolean then E'PASS membro sai do grupo\n' else 'FAIL sair: ' || r::text || E'\n' end;
  perform set_config('request.jwt.claims', json_build_object('sub', t_auth, 'role', 'authenticated')::text, true);
  r := public.app_sair_do_grupo();
  out := out || case when r->>'motivo' = 'nao_permitido' then E'PASS titular não sai do próprio grupo\n' else 'FAIL titular sai: ' || r::text || E'\n' end;

  -- isolamento: quem é de fora não vê nada do grupo
  perform set_config('request.jwt.claims', json_build_object('sub', m3_auth, 'role', 'authenticated')::text, true);
  r := public.app_grupo();
  out := out || case when jsonb_array_length(r->'membros') = 0 and jsonb_array_length(r->'convites') = 0 then E'PASS quem é de fora não vê o grupo\n' else 'FAIL isolamento: ' || r::text || E'\n' end;

  -- login sem cadastro e tabelas fechadas
  begin perform public.app_aceitar_convite(c2); perform set_config('request.jwt.claims', json_build_object('sub', gen_random_uuid(), 'role', 'authenticated')::text, true);
    perform public.app_criar_convite(); out := out || E'FAIL sem cadastro\n';
  exception when others then out := out || case when sqlerrm = 'sem_cadastro' then E'PASS login sem cadastro recebe sem_cadastro\n' else 'FAIL sem cadastro: ' || sqlerrm || E'\n' end; end;
  begin perform count(*) from public.grupo_membros; out := out || E'FAIL leu membros direto\n';
  exception when insufficient_privilege then out := out || E'PASS as tabelas do grupo não têm acesso direto\n'; end;

  reset role;
  out := out || case when has_function_privilege('authenticated', 'public.app_criar_convite()'::regprocedure, 'execute')
      and not has_function_privilege('anon', 'public.app_criar_convite()'::regprocedure, 'execute')
      and not has_function_privilege('anon', 'public.app_aceitar_convite(text)'::regprocedure, 'execute')
      and not has_function_privilege('authenticated', 'app.hash_convite(text)'::regprocedure, 'execute')
      then E'PASS só cliente logado executa; o hash e o limite são internos\n' else E'FAIL permissões\n' end;

  select count(*) into falhas from regexp_matches(out, 'FAIL', 'g');
  raise exception E'\n%FALHAS: %', out, falhas;
end $$;
