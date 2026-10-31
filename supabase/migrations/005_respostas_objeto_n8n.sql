-- O n8n expande listas em vários itens e embrulha booleanos; respostas viram sempre um objeto.
drop function if exists public.reservar_mensagem(text, text, text, text);
create function public.reservar_mensagem(p_canal text, p_mensagem_id text, p_telefone text, p_tipo text default 'texto')
returns jsonb language plpgsql set search_path = '' as $$
declare v_n integer;
begin
  insert into public.mensagens_entrada (canal, mensagem_id, telefone, tipo)
  values (coalesce(p_canal, 'whatsapp'), p_mensagem_id, p_telefone,
          case when p_tipo in ('texto','audio','imagem') then p_tipo else 'outro' end)
  on conflict do nothing;
  get diagnostics v_n = row_count;
  return jsonb_build_object('nova', v_n > 0);
end $$;

drop function if exists public.obter_conversa(uuid, integer);
create function public.obter_conversa(p_usuario_id uuid, p_limite integer default 6)
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'quantidade', count(*),
    'historico', coalesce(string_agg(
      (case t.papel when 'user' then 'Usuário: ' else 'Gastômetro: ' end) || t.conteudo, E'\n' order by t.id), ''))
  from (select id, papel, conteudo from public.conversa_mensagens
        where usuario_id = p_usuario_id and created_at > now() - interval '12 hours'
        order by id desc
        limit least(greatest(coalesce(p_limite, 6), 1), 20)) t;
$$;

-- Ativação pelo WhatsApp já conta como boas-vindas (o bot responde com o guia de uso)
create or replace function public.ativar_por_codigo(p_codigo text, p_telefone text)
returns jsonb language plpgsql set search_path = '' as $$
declare
  v_tel text := public.normalizar_telefone(p_telefone);
  v_cod text := upper(trim(regexp_replace(coalesce(p_codigo, ''), '^\s*ATIVAR[\s#:-]*', '', 'i')));
  v_uid uuid; v_nome text;
begin
  select a.usuario_id, u.nome into v_uid, v_nome
  from public.ativacoes a join public.usuarios u on u.id = a.usuario_id
  where a.codigo = v_cod and a.consumido_em is null and a.expira_em > now() and u.telefone = v_tel;
  if not found then
    return jsonb_build_object('ok', false, 'motivo', 'codigo_invalido_ou_telefone_diferente');
  end if;
  update public.ativacoes set consumido_em = now() where codigo = v_cod;
  update public.usuarios
     set telefone_verificado_em = coalesce(telefone_verificado_em, now()),
         boas_vindas_em = coalesce(boas_vindas_em, now()),
         status = case when status = 'pendente' then 'trial' else status end
   where id = v_uid;
  return jsonb_build_object('ok', true, 'usuario_id', v_uid, 'nome', v_nome);
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
