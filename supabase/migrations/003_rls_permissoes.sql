-- Helper privado (fora do schema exposto pela API): id do usuário logado no painel
create or replace function app.meu_usuario_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select id from public.usuarios where auth_user_id = (select auth.uid()) and deleted_at is null;
$$;
revoke execute on function app.meu_usuario_id() from public, anon;
grant usage on schema app to authenticated;
grant execute on function app.meu_usuario_id() to authenticated;

alter table public.planos enable row level security;
alter table public.usuarios enable row level security;
alter table public.assinaturas enable row level security;
alter table public.uso_periodo enable row level security;
alter table public.lancamentos enable row level security;
alter table public.mensagens_entrada enable row level security;
alter table public.conversa_mensagens enable row level security;
alter table public.eventos_pagamento enable row level security;
alter table public.ativacoes enable row level security;

-- Landing lê os planos ativos (preços) sem login
create policy planos_leitura_publica on public.planos
  for select to anon, authenticated using (ativo);

-- Painel do usuário logado: só enxerga os próprios dados
create policy usuarios_proprio on public.usuarios
  for select to authenticated using (id = (select app.meu_usuario_id()));
create policy assinaturas_proprias on public.assinaturas
  for select to authenticated using (usuario_id = (select app.meu_usuario_id()));
create policy uso_proprio on public.uso_periodo
  for select to authenticated using (usuario_id = (select app.meu_usuario_id()));
create policy lancamentos_proprios on public.lancamentos
  for select to authenticated using (usuario_id = (select app.meu_usuario_id()) and deleted_at is null);

-- Tabelas internas: RLS ligado e nenhuma policy = só service_role (n8n) acessa

-- anon não toca em nada além dos planos
revoke all on all tables in schema public from anon;
grant select on public.planos to anon;
-- authenticated só lê (escritas do painel ficam para uma próxima etapa)
revoke insert, update, delete, truncate on all tables in schema public from authenticated;
revoke all on public.mensagens_entrada, public.conversa_mensagens, public.eventos_pagamento, public.ativacoes from authenticated;
