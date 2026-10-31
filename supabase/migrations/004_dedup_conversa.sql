-- Reserva a mensagem (false = já recebida antes, ignorar reenvio do webhook)
-- Observação: a versão de reservar_mensagem e obter_conversa abaixo foi substituída na 005.
create or replace function public.reservar_mensagem(p_canal text, p_mensagem_id text, p_telefone text, p_tipo text default 'texto')
returns boolean language plpgsql set search_path = '' as $$
declare v_n integer;
begin
  insert into public.mensagens_entrada (canal, mensagem_id, telefone, tipo)
  values (coalesce(p_canal, 'whatsapp'), p_mensagem_id, p_telefone,
          case when p_tipo in ('texto','audio','imagem') then p_tipo else 'outro' end)
  on conflict do nothing;
  get diagnostics v_n = row_count;
  return v_n > 0;
end $$;

create or replace function public.finalizar_mensagem(
  p_canal text, p_mensagem_id text, p_status text, p_erro text default null, p_usuario_id uuid default null)
returns void language sql set search_path = '' as $$
  update public.mensagens_entrada
     set status = case when p_status in ('processada','erro','ignorada','bloqueada') then p_status else 'erro' end,
         erro = left(p_erro, 500),
         usuario_id = coalesce(p_usuario_id, usuario_id),
         processada_em = now()
   where canal = coalesce(p_canal, 'whatsapp') and mensagem_id = p_mensagem_id;
$$;

create or replace function public.obter_conversa(p_usuario_id uuid, p_limite integer default 6)
returns jsonb language sql stable set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('papel', t.papel, 'conteudo', t.conteudo) order by t.id), '[]'::jsonb)
  from (select id, papel, conteudo from public.conversa_mensagens
        where usuario_id = p_usuario_id and created_at > now() - interval '12 hours'
        order by id desc
        limit least(greatest(coalesce(p_limite, 6), 1), 20)) t;
$$;

create or replace function public.salvar_conversa(p_usuario_id uuid, p_user text, p_assistant text)
returns void language plpgsql set search_path = '' as $$
begin
  insert into public.conversa_mensagens (usuario_id, papel, conteudo) values
    (p_usuario_id, 'user', left(coalesce(p_user, ''), 2000)),
    (p_usuario_id, 'assistant', left(coalesce(p_assistant, ''), 2000));
  delete from public.conversa_mensagens
   where usuario_id = p_usuario_id
     and id not in (select id from public.conversa_mensagens where usuario_id = p_usuario_id order by id desc limit 30);
end $$;

-- Manutenção (agendar depois, ex.: pg_cron diário)
create or replace function public.limpar_dados_antigos() returns jsonb
language plpgsql set search_path = '' as $$
declare v_msg integer; v_conv integer;
begin
  delete from public.mensagens_entrada where recebida_em < now() - interval '90 days';
  get diagnostics v_msg = row_count;
  delete from public.conversa_mensagens where created_at < now() - interval '7 days';
  get diagnostics v_conv = row_count;
  return jsonb_build_object('mensagens_removidas', v_msg, 'conversas_removidas', v_conv);
end $$;

do $$
declare r record;
begin
  for r in select p.oid::regprocedure as sig
           from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.prokind = 'f'
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', r.sig);
    execute format('grant execute on function %s to service_role', r.sig);
  end loop;
end $$;
