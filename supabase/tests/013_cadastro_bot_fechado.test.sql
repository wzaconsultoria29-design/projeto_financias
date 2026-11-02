-- Teste da migração 013 (cadastro completo e bot fechado). Rodar com execute_sql; termina com erro proposital (desfaz tudo).
-- Sucesso = saída com "FALHAS: 0". Para um ensaio antes de aplicar, rode a migração e este bloco na mesma chamada.
do $$
declare
  t1 text := '5511977780001'; t2 text := '5511977780002'; t3 text := '5511977780003';
  r jsonb; out text := ''; falhas int; n1 int; n2 int; v_id uuid; v_cod text; v_cod_velho text;
  u public.usuarios%rowtype; a public.assinaturas%rowtype; v_h text;
begin
  -- 1. o bot não cria conta para número desconhecido, mesmo pedindo para criar
  select count(*) into n1 from public.usuarios;
  r := public.verificar_acesso(t1, true);
  select count(*) into n2 from public.usuarios;
  out := out || case when r->>'existe' = 'false' and n1 = n2 then 'PASS número desconhecido não gera conta' else 'FAIL desconhecido: ' || r::text end || E'\n';

  -- 2. cadastro incompleto ou inválido é recusado no banco
  begin perform public.cadastrar_usuario(' ', 'a@exemplo.com', t1, 'landing', true, 'v1'); out := out || E'FAIL aceitou nome vazio\n';
  exception when others then out := out || case when sqlerrm = 'nome_invalido' then E'PASS recusa nome vazio\n' else 'FAIL nome: ' || sqlerrm || E'\n' end; end;
  begin perform public.cadastrar_usuario('Maria', 'sem-arroba', t1, 'landing', true, 'v1'); out := out || E'FAIL aceitou e-mail inválido\n';
  exception when others then out := out || case when sqlerrm = 'email_invalido' then E'PASS recusa e-mail inválido\n' else 'FAIL email: ' || sqlerrm || E'\n' end; end;
  begin perform public.cadastrar_usuario('Maria', 'a@exemplo.com', t1, 'landing', false, 'v1'); out := out || E'FAIL aceitou sem aceite\n';
  exception when others then out := out || case when sqlerrm = 'aceite_obrigatorio' then E'PASS recusa sem aceite\n' else 'FAIL aceite: ' || sqlerrm || E'\n' end; end;
  begin perform public.cadastrar_usuario('Maria', 'a@exemplo.com', '(11) 3333-4444', 'landing', true, 'v1'); out := out || E'FAIL aceitou telefone fixo\n';
  exception when others then out := out || case when sqlerrm = 'telefone_invalido' then E'PASS recusa telefone fixo\n' else 'FAIL telefone: ' || sqlerrm || E'\n' end; end;

  -- 3. cadastro válido: guarda e-mail em minúsculas, cria código, NÃO cria assinatura nem conecta
  r := public.cadastrar_usuario('  Maria   Silva ', 'Maria@Exemplo.com', '(11) 97778-0001', 'landing', true, 'v1-2026-10', false);
  v_id := (r->>'usuario_id')::uuid; v_cod_velho := r->>'codigo_ativacao';
  select * into u from public.usuarios where id = v_id;
  out := out || case when v_cod_velho is not null and u.email = 'maria@exemplo.com' and u.nome = 'Maria Silva'
      and u.telefone_verificado_em is null and u.consentimento_em is not null
      and not exists (select 1 from public.assinaturas where usuario_id = v_id)
      then E'PASS cadastro válido grava dados, aceite e código, sem assinatura\n' else 'FAIL cadastro: ' || r::text || E'\n' end;

  -- 4. número cadastrado mas não conectado: o bot enxerga, mas fica bloqueado e nada é confirmado por mensagem
  r := public.verificar_acesso(t1, true);
  select * into u from public.usuarios where id = v_id;
  out := out || case when r->>'existe' = 'true' and r->>'conectado' = 'false' and r->>'bloqueado' = 'true'
      and r->>'motivo' = 'nao_conectado' and u.telefone_verificado_em is null
      then E'PASS pendente fica bloqueado e não é conectado por mensagem\n' else 'FAIL pendente: ' || r::text || E'\n' end;

  -- 5. e-mail único
  begin perform public.cadastrar_usuario('Outra', 'MARIA@exemplo.com', t2, 'landing', true, 'v1'); out := out || E'FAIL aceitou e-mail repetido\n';
  exception when others then out := out || case when sqlerrm = 'email_em_uso' then E'PASS e-mail único\n' else 'FAIL email_uso: ' || sqlerrm || E'\n' end; end;

  -- 6. número pendente de outra pessoa dentro de 48 h
  begin perform public.cadastrar_usuario('Intruso', 'intruso@exemplo.com', t1, 'landing', true, 'v1'); out := out || E'FAIL número em cadastro foi tomado\n';
  exception when others then out := out || case when sqlerrm = 'numero_em_cadastro' then E'PASS número pendente protegido por 48 h\n' else 'FAIL numero: ' || sqlerrm || E'\n' end; end;

  -- 7. mesmo e-mail de novo: gera código novo e invalida o antigo
  r := public.cadastrar_usuario('Maria Silva', 'maria@exemplo.com', t1, 'landing', true, 'v1-2026-10', false);
  v_cod := r->>'codigo_ativacao';
  out := out || case when v_cod is not null and v_cod <> v_cod_velho
      and (public.ativar_por_codigo(v_cod_velho, t1)->>'ok') = 'false'
      then E'PASS novo código invalida o anterior\n' else E'FAIL código antigo ainda vale\n' end;

  -- 8. depois de 48 h o novo cadastro assume o número
  update public.usuarios set cadastro_em = now() - interval '3 days' where id = v_id;
  r := public.cadastrar_usuario('Dono Real', 'dono@exemplo.com', t1, 'landing', true, 'v1-2026-10', false);
  select * into u from public.usuarios where id = v_id;
  out := out || case when u.email = 'dono@exemplo.com' and u.nome = 'Dono Real' and u.cadastro_em > now() - interval '1 minute'
      then E'PASS após 48 h o número muda de dono\n' else 'FAIL assumir número: ' || u.email || E'\n' end;
  v_cod := r->>'codigo_ativacao';

  -- 9. ATIVAR só vale com o número certo
  out := out || case when (public.ativar_por_codigo(v_cod, t2)->>'ok') = 'false'
      then E'PASS ATIVAR de outro número é recusado\n' else E'FAIL ATIVAR aceitou outro número\n' end;

  -- 10. ATIVAR certo conecta e começa o teste de 7 dias agora
  r := public.ativar_por_codigo('ATIVAR ' || v_cod, t1);
  select * into u from public.usuarios where id = v_id;
  select * into a from public.assinaturas where usuario_id = v_id and status = 'trial';
  out := out || case when r->>'ok' = 'true' and u.telefone_verificado_em is not null and a.id is not null
      and a.periodo_inicio > now() - interval '1 minute'
      and a.periodo_fim between now() + interval '6 days 23 hours' and now() + interval '7 days 1 hour'
      then E'PASS conexão libera o bot e inicia 7 dias\n' else 'FAIL ativar: ' || r::text || ' fim=' || coalesce(a.periodo_fim::text, 'nulo') || E'\n' end;

  -- 11. conectado: o bot atende
  r := public.verificar_acesso(t1, false);
  out := out || case when r->>'conectado' = 'true' and r->>'bloqueado' = 'false' and r->>'plano_codigo' = 'trial'
      then E'PASS conectado é atendido\n' else 'FAIL conectado: ' || r::text || E'\n' end;

  -- 12. novo cadastro com o número de quem já está conectado não mexe em nada
  r := public.cadastrar_usuario('Hacker', 'hacker@exemplo.com', t1, 'landing', true, 'v1');
  select * into u from public.usuarios where id = v_id;
  out := out || case when r->>'ja_verificado' = 'true' and u.nome = 'Dono Real' and u.email = 'dono@exemplo.com'
      then E'PASS cliente conectado não é sobrescrito\n' else 'FAIL sobrescreveu: ' || r::text || E'\n' end;

  -- 13. NÃO FUI EU: cancela o pendente e apaga os dados; não cancela cliente conectado
  r := public.cadastrar_usuario('Pendente', 'pendente@exemplo.com', t3, 'landing', true, 'v1');
  v_id := (r->>'usuario_id')::uuid;
  r := public.cancelar_cadastro_pendente(t3);
  select * into u from public.usuarios where id = v_id;
  out := out || case when r->>'ok' = 'true' and u.nome is null and u.email is null and u.deleted_at is not null
      then E'PASS NÃO FUI EU cancela e anonimiza o pendente\n' else 'FAIL cancelar: ' || r::text || E'\n' end;
  out := out || case when (public.cancelar_cadastro_pendente(t1)->>'ok') = 'false'
      then E'PASS NÃO FUI EU não atinge cliente conectado\n' else E'FAIL cancelou cliente conectado\n' end;

  -- 14. novo cadastro do número cancelado começa do zero
  r := public.cadastrar_usuario('Ana', 'ana@exemplo.com', t3, 'landing', true, 'v1');
  select * into u from public.usuarios where id = v_id;
  out := out || case when u.nome = 'Ana' and u.email = 'ana@exemplo.com' and u.deleted_at is null and u.telefone_verificado_em is null
      then E'PASS número cancelado recomeça sem herdar dados\n' else 'FAIL recomeço: ' || u.nome || E'\n' end;

  -- 15. convites: 1 por hora por número e sem guardar o número
  out := out || case when (public.bot_convite('5511900000099')->>'enviar') = 'true' and (public.bot_convite('5511900000099')->>'enviar') = 'false'
      then E'PASS convite só uma vez por hora\n' else E'FAIL limite de convite\n' end;
  select telefone_hash into v_h from public.bot_convites limit 1;
  out := out || case when length(v_h) = 64 and not exists (select 1 from public.bot_convites where telefone_hash like '%5511900000099%')
      then E'PASS convite guarda só o hash\n' else E'FAIL convite guarda o número\n' end;
  update public.bot_convites set ultimo_em = now() - interval '2 hours';
  out := out || case when (public.bot_convite('5511900000099')->>'enviar') = 'true'
      then E'PASS convite volta depois de 1 hora\n' else E'FAIL convite não voltou\n' end;

  -- 16. só o service_role executa essas funções
  out := out || case when not exists (
        select 1 from unnest(array['public.bot_convite(text)', 'public.cadastrar_usuario(text,text,text,text,boolean,text,boolean)',
          'public.ativar_por_codigo(text,text)', 'public.cancelar_cadastro_pendente(text)', 'public.verificar_acesso(text,boolean)']) f
         where has_function_privilege('anon', f::regprocedure, 'execute') or has_function_privilege('authenticated', f::regprocedure, 'execute'))
      then E'PASS anon e authenticated não executam\n' else E'FAIL permissões abertas\n' end;

  select count(*) into falhas from regexp_matches(out, 'FAIL', 'g');
  raise exception E'\n%FALHAS: %', out, falhas;
end $$;
