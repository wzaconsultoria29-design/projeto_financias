-- O bot registra o número de toda mensagem que recebe (reservar_mensagem) para evitar duplicatas.
-- Para quem não é cliente, o desenho promete não guardar nada pessoal: o n8n chama esta função
-- logo depois de decidir que o remetente é desconhecido (ou tem só cadastro pendente) e o registro some.
create or replace function public.descartar_mensagem(p_canal text, p_mensagem_id text) returns jsonb
language plpgsql set search_path = '' as $$
declare v_n integer;
begin
  delete from public.mensagens_entrada
   where canal = coalesce(p_canal, 'whatsapp') and mensagem_id = p_mensagem_id;
  get diagnostics v_n = row_count;
  return jsonb_build_object('apagadas', v_n);
end $$;

revoke execute on function public.descartar_mensagem(text, text) from public, anon, authenticated;
grant execute on function public.descartar_mensagem(text, text) to service_role;
