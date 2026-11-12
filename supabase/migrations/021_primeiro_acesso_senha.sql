-- Primeiro acesso ao painel e login com senha (desenho aprovado em 2026-11-12, maquetes docs/mockups/2026-11-12).
--  * objetivo: o que a pessoa quer resolver primeiro (muda o destaque do painel);
--  * primeiro_acesso_em: quando ela terminou (ou pulou) o primeiro acesso; nulo = ainda mostra as telas;
--  * senha_definida_em: quando criou a senha (a senha em si fica só no Supabase Auth, nunca aqui).
-- A senha e o e-mail de login são gravados pela função de borda senha-definir (Auth admin) e registrados aqui por senha_registrada.

alter table public.usuarios
  add column objetivo text check (objetivo is null or objetivo in ('dia_a_dia', 'guardar', 'aperto', 'familia')),
  add column primeiro_acesso_em timestamptz,
  add column senha_definida_em timestamptz;

-- Mesma leitura de antes, com objetivo, primeiro acesso e se já tem senha.
create or replace function public.app_minha_conta() returns jsonb
language plpgsql stable set search_path = '' as $$
declare
  v_u public.usuarios%rowtype; v_a public.assinaturas%rowtype; v_p public.planos%rowtype; v_uso integer := 0;
begin
  select * into v_u from public.usuarios where id = app.meu_usuario_id();
  if not found then raise exception 'sem_cadastro'; end if;
  select * into v_a from public.assinaturas
   where usuario_id = v_u.id and status in ('trial', 'ativa', 'inadimplente');
  if found then
    select * into v_p from public.planos where id = v_a.plano_id;
    select mensagens into v_uso from public.uso_periodo
     where assinatura_id = v_a.id and periodo_inicio = v_a.periodo_inicio;
    v_uso := coalesce(v_uso, 0);
  end if;
  return jsonb_build_object(
    'nome', v_u.nome, 'email', v_u.email,
    'telefone_mascarado', '+' || substr(v_u.telefone, 1, 2) || ' ' || substr(v_u.telefone, 3, 2) || ' *****-' || right(v_u.telefone, 4),
    'renda_mensal', v_u.renda_mensal, 'custo_vida_mensal', v_u.custo_vida_mensal,
    'objetivo', v_u.objetivo,
    'primeiro_acesso_concluido', v_u.primeiro_acesso_em is not null,
    'tem_senha', v_u.senha_definida_em is not null,
    'plano', case when v_p.id is null then null else jsonb_build_object('codigo', v_p.codigo, 'nome', v_p.nome,
               'preco_centavos', v_p.preco_centavos, 'mensagens_limite', v_p.mensagens_limite, 'membros_max', v_p.membros_max) end,
    'assinatura', case when v_a.id is null then null else jsonb_build_object('status', v_a.status,
               'periodo_inicio', v_a.periodo_inicio, 'periodo_fim', v_a.periodo_fim) end,
    'uso', jsonb_build_object('mensagens', v_uso, 'limite', v_p.mensagens_limite,
               'restantes', case when v_p.mensagens_limite is null then null else greatest(v_p.mensagens_limite - v_uso, 0) end),
    'consentimento', jsonb_build_object('em', v_u.consentimento_em, 'versao', v_u.consentimento_versao));
end $$;

create function public.app_salvar_objetivo(p_objetivo text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := app.meu_usuario_id();
begin
  if v_uid is null then raise exception 'sem_cadastro'; end if;
  if p_objetivo is null or p_objetivo not in ('dia_a_dia', 'guardar', 'aperto', 'familia') then
    return jsonb_build_object('ok', false, 'motivo', 'objetivo_invalido');
  end if;
  update public.usuarios set objetivo = p_objetivo where id = v_uid;
  return jsonb_build_object('ok', true);
end $$;

-- Renda mensal sozinha (o primeiro acesso não pede o nome de novo). Nula limpa o campo.
create function public.app_salvar_renda(p_renda numeric) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := app.meu_usuario_id();
begin
  if v_uid is null then raise exception 'sem_cadastro'; end if;
  if p_renda is not null and (p_renda < 0 or p_renda > 100000000) then
    return jsonb_build_object('ok', false, 'motivo', 'renda_invalida');
  end if;
  update public.usuarios set renda_mensal = round(p_renda, 2) where id = v_uid;
  return jsonb_build_object('ok', true);
end $$;

-- Marca o primeiro acesso como feito (vale também para quem pulou). Chamar de novo não muda a data.
create function public.app_concluir_primeiro_acesso() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := app.meu_usuario_id();
begin
  if v_uid is null then raise exception 'sem_cadastro'; end if;
  update public.usuarios set primeiro_acesso_em = coalesce(primeiro_acesso_em, now()) where id = v_uid;
  return jsonb_build_object('ok', true);
end $$;

-- Só o servidor: depois que o Auth gravou e-mail e senha, registra o e-mail de login e a data.
create function public.senha_registrada(p_usuario_id uuid, p_email text) returns jsonb
language plpgsql set search_path = '' as $$
begin
  update public.usuarios set email = lower(btrim(p_email)), senha_definida_em = now() where id = p_usuario_id;
  return jsonb_build_object('ok', found);
end $$;

revoke execute on function public.app_salvar_objetivo(text), public.app_salvar_renda(numeric), public.app_concluir_primeiro_acesso() from public, anon;
grant execute on function public.app_salvar_objetivo(text), public.app_salvar_renda(numeric), public.app_concluir_primeiro_acesso() to authenticated, service_role;
revoke execute on function public.senha_registrada(uuid, text) from public, anon, authenticated;
grant execute on function public.senha_registrada(uuid, text) to service_role;
