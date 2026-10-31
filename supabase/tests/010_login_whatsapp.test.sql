-- Teste do login pelo WhatsApp. Rodar com execute_sql; termina com erro proposital (desfaz tudo).
-- Sucesso = saída com "FALHAS: 0".
do $$
declare
  a uuid := gen_random_uuid(); b uuid := gen_random_uuid(); c uuid := gen_random_uuid();
  s jsonb; s2 jsonb; r jsonb; sid uuid; sid2 uuid; cod text; cod2 text;
  out text := ''; falhas int := 0; i int;
begin
  insert into public.usuarios (id, telefone, nome, status, consentimento_em) values
    (a, '5511944440001', 'Ana', 'trial', now()), (c, '5511944440003', 'Caio', 'trial', now());
  insert into public.usuarios (id, telefone, status) values (b, '5511944440002', 'trial');

  s := public.login_iniciar(); cod := s->>'codigo'; sid := (s->>'sessao_id')::uuid;
  if cod ~ '^[0-9]{6}$' then out := out || 'PASS código de 6 dígitos' || E'\n';
  else out := out || 'FAIL código de 6 dígitos: ' || cod || E'\n'; falhas := falhas + 1; end if;

  r := public.login_confirmar('000000', '5511944440001');
  if r->>'motivo' = 'codigo_invalido' then out := out || 'PASS código inexistente' || E'\n';
  else out := out || 'FAIL código inexistente: ' || r::text || E'\n'; falhas := falhas + 1; end if;

  r := public.login_confirmar(cod, '5511999990000');
  if r->>'motivo' = 'sem_cadastro' then out := out || 'PASS telefone sem cadastro' || E'\n';
  else out := out || 'FAIL telefone sem cadastro: ' || r::text || E'\n'; falhas := falhas + 1; end if;

  r := public.login_confirmar(cod, '5511944440002');
  if r->>'motivo' = 'sem_aceite' then out := out || 'PASS usuário sem aceite' || E'\n';
  else out := out || 'FAIL usuário sem aceite: ' || r::text || E'\n'; falhas := falhas + 1; end if;

  r := public.login_confirmar(cod, '(11) 94444-0001');
  if r->>'ok' = 'true' and r->>'nome' = 'Ana' then out := out || 'PASS confirmação válida (telefone formatado)' || E'\n';
  else out := out || 'FAIL confirmação válida: ' || r::text || E'\n'; falhas := falhas + 1; end if;

  r := public.login_consumir(sid);
  if r->>'estado' = 'ok' and (r->>'usuario_id')::uuid = a then out := out || 'PASS consumir devolve o usuário' || E'\n';
  else out := out || 'FAIL consumir: ' || r::text || E'\n'; falhas := falhas + 1; end if;

  r := public.login_consumir(sid);
  if r->>'estado' = 'expirado' then out := out || 'PASS código de uso único' || E'\n';
  else out := out || 'FAIL uso único: ' || r::text || E'\n'; falhas := falhas + 1; end if;

  insert into public.login_sessoes (codigo, expira_em) values ('123456', now() - interval '1 minute');
  r := public.login_confirmar('123456', '5511944440001');
  if r->>'motivo' = 'expirado' then out := out || 'PASS código expirado' || E'\n';
  else out := out || 'FAIL código expirado: ' || r::text || E'\n'; falhas := falhas + 1; end if;

  s2 := public.login_iniciar(); cod2 := s2->>'codigo'; sid2 := (s2->>'sessao_id')::uuid;
  r := public.login_consumir(sid2);
  if r->>'estado' = 'pendente' then out := out || 'PASS sessão pendente' || E'\n';
  else out := out || 'FAIL sessão pendente: ' || r::text || E'\n'; falhas := falhas + 1; end if;

  for i in 1..5 loop perform public.login_confirmar('000001', '5511944440003'); end loop;
  r := public.login_confirmar(cod2, '5511944440003');
  if r->>'motivo' = 'muitas_tentativas' then out := out || 'PASS bloqueio após 5 falhas' || E'\n';
  else out := out || 'FAIL bloqueio após 5 falhas: ' || r::text || E'\n'; falhas := falhas + 1; end if;

  if not has_function_privilege('anon', 'public.login_iniciar()', 'execute')
     and not has_function_privilege('authenticated', 'public.login_confirmar(text,text)', 'execute')
     and not has_function_privilege('anon', 'public.login_consumir(uuid)', 'execute') then
    out := out || 'PASS funções só para service_role' || E'\n';
  else out := out || 'FAIL funções expostas' || E'\n'; falhas := falhas + 1; end if;

  raise exception E'\n%FALHAS: %', out, falhas;
end $$;
