-- Perfil da conta (desenho de 2026-11-07): renda mensal e custo de vida mensal, e o nome editável.
-- Os dois valores deixam a leitura do painel mais precisa e não são compartilhados com ninguém.
-- Mesmo padrão das funções app_*: escrita só por função SECURITY DEFINER, executável só por cliente logado.

alter table public.usuarios
  add column renda_mensal numeric(12, 2) check (renda_mensal is null or (renda_mensal >= 0 and renda_mensal <= 100000000)),
  add column custo_vida_mensal numeric(12, 2) check (custo_vida_mensal is null or (custo_vida_mensal >= 0 and custo_vida_mensal <= 100000000));

-- Mesma função de antes, com os dois campos novos na resposta.
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
    'plano', case when v_p.id is null then null else jsonb_build_object('codigo', v_p.codigo, 'nome', v_p.nome,
               'preco_centavos', v_p.preco_centavos, 'mensagens_limite', v_p.mensagens_limite, 'membros_max', v_p.membros_max) end,
    'assinatura', case when v_a.id is null then null else jsonb_build_object('status', v_a.status,
               'periodo_inicio', v_a.periodo_inicio, 'periodo_fim', v_a.periodo_fim) end,
    'uso', jsonb_build_object('mensagens', v_uso, 'limite', v_p.mensagens_limite,
               'restantes', case when v_p.mensagens_limite is null then null else greatest(v_p.mensagens_limite - v_uso, 0) end),
    'consentimento', jsonb_build_object('em', v_u.consentimento_em, 'versao', v_u.consentimento_versao));
end $$;

-- Salva nome, renda e custo de vida da própria pessoa. Renda e custo nulos limpam o campo.
create function public.app_salvar_perfil(p_nome text, p_renda numeric, p_custo numeric) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := app.meu_usuario_id();
  v_nome text := btrim(coalesce(p_nome, ''));
begin
  if v_uid is null then raise exception 'sem_cadastro'; end if;
  if char_length(v_nome) < 2 or char_length(v_nome) > 80 then
    return jsonb_build_object('ok', false, 'motivo', 'nome_invalido');
  end if;
  if p_renda is not null and (p_renda < 0 or p_renda > 100000000) then
    return jsonb_build_object('ok', false, 'motivo', 'renda_invalida');
  end if;
  if p_custo is not null and (p_custo < 0 or p_custo > 100000000) then
    return jsonb_build_object('ok', false, 'motivo', 'custo_invalido');
  end if;
  update public.usuarios
     set nome = v_nome, renda_mensal = round(p_renda, 2), custo_vida_mensal = round(p_custo, 2)
   where id = v_uid;
  return jsonb_build_object('ok', true);
end $$;

revoke execute on function public.app_salvar_perfil(text, numeric, numeric) from public, anon;
grant execute on function public.app_salvar_perfil(text, numeric, numeric) to authenticated, service_role;
