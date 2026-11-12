-- Pendências técnicas de lançamento (2026-11-12):
--  1) novo aceite dos termos pelo painel quando a versão muda;
--  2) limite de códigos de login por IP (a função pública login-iniciar chama a versão limitada);
--  3) limpeza diária de dados antigos, agendada com pg_cron.

-- ---------------------------------------------------------------------------------------------
-- 1) Aceite dos termos pelo painel
-- ---------------------------------------------------------------------------------------------
create function public.app_aceitar_termos(p_versao text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := app.meu_usuario_id();
begin
  if v_uid is null then raise exception 'sem_cadastro'; end if;
  if p_versao is null or p_versao !~ '^v[0-9]{1,3}-[0-9]{4}-[0-9]{2}$' then
    return jsonb_build_object('ok', false, 'motivo', 'versao_invalida');
  end if;
  perform public.registrar_consentimento(v_uid, p_versao, 'painel', false);
  return jsonb_build_object('ok', true);
end $$;

revoke execute on function public.app_aceitar_termos(text) from public, anon;
grant execute on function public.app_aceitar_termos(text) to authenticated, service_role;

-- ---------------------------------------------------------------------------------------------
-- 2) Limite de login por IP: no máximo 20 códigos a cada 10 minutos por endereço.
--    Só o hash do IP fica guardado (com o mesmo segredo do convite), por 1 dia.
-- ---------------------------------------------------------------------------------------------
create table public.login_iniciar_ips (
  ip_hash text not null,
  em timestamptz not null default now()
);
create index login_iniciar_ips_idx on public.login_iniciar_ips (ip_hash, em desc);
alter table public.login_iniciar_ips enable row level security;
revoke all on public.login_iniciar_ips from anon, authenticated;

create function public.login_iniciar_limitado(p_ip text) returns jsonb
language plpgsql set search_path = '' as $$
declare v_hash text; v_n integer;
begin
  -- Sem IP conhecido não dá para limitar; melhor deixar entrar do que barrar quem é legítimo.
  if p_ip is null or btrim(p_ip) = '' then return public.login_iniciar(); end if;
  v_hash := encode(sha256(convert_to('ip|' || btrim(p_ip) || '|' ||
            (select valor from public.segredos_app where chave = 'pepper_convite'), 'UTF8')), 'hex');
  delete from public.login_iniciar_ips where em < now() - interval '1 day';
  select count(*) into v_n from public.login_iniciar_ips where ip_hash = v_hash and em > now() - interval '10 minutes';
  if v_n >= 20 then return jsonb_build_object('erro', 'muitas_tentativas'); end if;
  insert into public.login_iniciar_ips (ip_hash) values (v_hash);
  return public.login_iniciar();
end $$;

revoke execute on function public.login_iniciar_limitado(text) from public, anon, authenticated;
grant execute on function public.login_iniciar_limitado(text) to service_role;

-- ---------------------------------------------------------------------------------------------
-- 3) Limpeza diária. Mesma função de antes, com mais itens.
-- ---------------------------------------------------------------------------------------------
create or replace function public.limpar_dados_antigos() returns jsonb
language plpgsql set search_path = '' as $$
declare v_msg integer; v_conv integer; v_ips integer; v_log integer; v_conv_grupo integer;
begin
  delete from public.mensagens_entrada where recebida_em < now() - interval '90 days';
  get diagnostics v_msg = row_count;
  delete from public.conversa_mensagens where created_at < now() - interval '7 days';
  get diagnostics v_conv = row_count;
  delete from public.login_iniciar_ips where em < now() - interval '1 day';
  get diagnostics v_ips = row_count;
  delete from public.login_sessoes where expira_em < now() - interval '1 day';
  delete from public.login_falhas where em < now() - interval '1 day';
  get diagnostics v_log = row_count;
  -- Convites do grupo que venceram ou foram cancelados há mais de 30 dias (os aceitos ficam como registro).
  delete from public.grupo_convites
   where status in ('pendente', 'cancelado') and coalesce(expira_em, criado_em) < now() - interval '30 days';
  get diagnostics v_conv_grupo = row_count;
  return jsonb_build_object('mensagens_removidas', v_msg, 'conversas_removidas', v_conv,
                            'ips_removidos', v_ips, 'login_falhas_removidas', v_log, 'convites_removidos', v_conv_grupo);
end $$;

-- Agenda todo dia às 06:15 UTC (03:15 em Brasília). Trocar o horário = rodar de novo com o mesmo nome.
create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule('limpar-dados-antigos', '15 6 * * *', $$select public.limpar_dados_antigos()$$);
