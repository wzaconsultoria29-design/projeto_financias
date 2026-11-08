-- Plano e pagamentos (desenho de 2026-11-07).
--  * solicitacoes_plano: o pedido de assinar um plano ("Assinar o Family"). Enquanto o pagamento online não existe, o pedido
--    só fica registrado; ele NÃO troca o plano de ninguém. A troca real vem com o gateway de pagamento.
--  * pagamentos: o histórico de cobranças da pessoa (hoje vazio; o gateway vai preenchendo).
-- As tabelas não têm acesso direto para clientes; a leitura e o pedido passam pelas funções abaixo.

create table public.solicitacoes_plano (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios (id) on delete cascade,
  plano_id uuid not null references public.planos (id),
  status text not null default 'pendente' check (status in ('pendente', 'atendida', 'cancelada')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Um pedido pendente por pessoa: pedir outro plano troca o pedido, não cria um segundo.
create unique index solicitacoes_plano_pendente_uq on public.solicitacoes_plano (usuario_id) where status = 'pendente';

create table public.pagamentos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios (id) on delete cascade,
  assinatura_id uuid references public.assinaturas (id) on delete set null,
  descricao text not null,
  valor_centavos integer not null check (valor_centavos >= 0),
  status text not null check (status in ('pago', 'pendente', 'falhou', 'reembolsado')),
  gateway text,
  gateway_pagamento_id text,
  pago_em timestamptz,
  created_at timestamptz not null default now()
);
create index pagamentos_usuario_idx on public.pagamentos (usuario_id, created_at desc);
create unique index pagamentos_gateway_uq on public.pagamentos (gateway, gateway_pagamento_id) where gateway_pagamento_id is not null;

alter table public.solicitacoes_plano enable row level security;
alter table public.pagamentos enable row level security;
revoke all on table public.solicitacoes_plano, public.pagamentos from anon, authenticated;

create trigger solicitacoes_plano_updated before update on public.solicitacoes_plano
  for each row execute function app.set_updated_at();

-- Tudo que a página "Plano e pagamentos" mostra, em uma chamada.
create function public.app_plano_e_pagamentos() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := app.meu_usuario_id();
  v_atual text; v_planos jsonb; v_sol jsonb; v_pag jsonb;
begin
  if v_uid is null then raise exception 'sem_cadastro'; end if;
  select p.codigo into v_atual from public.assinaturas a join public.planos p on p.id = a.plano_id
   where a.usuario_id = v_uid and a.status in ('trial', 'ativa', 'inadimplente') limit 1;
  select coalesce(jsonb_agg(jsonb_build_object('codigo', codigo, 'nome', nome, 'preco_centavos', preco_centavos,
           'mensagens_limite', mensagens_limite, 'membros_max', membros_max) order by ordem), '[]'::jsonb)
    into v_planos from public.planos where ativo;
  select jsonb_build_object('codigo', p.codigo, 'nome', p.nome, 'criado_em', s.created_at) into v_sol
    from public.solicitacoes_plano s join public.planos p on p.id = s.plano_id
   where s.usuario_id = v_uid and s.status = 'pendente';
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'data', coalesce(pago_em, created_at), 'descricao', descricao,
           'valor_centavos', valor_centavos, 'status', status) order by coalesce(pago_em, created_at) desc), '[]'::jsonb)
    into v_pag from (select * from public.pagamentos where usuario_id = v_uid order by coalesce(pago_em, created_at) desc limit 24) x;
  return jsonb_build_object('atual', v_atual, 'planos', v_planos, 'solicitacao', v_sol, 'pagamentos', v_pag);
end $$;

-- Pede a assinatura de um plano. Não troca o plano: só registra o pedido (um por pessoa; pedir outro troca o pedido).
create function public.app_solicitar_plano(p_codigo text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := app.meu_usuario_id();
  v_plano public.planos%rowtype; v_atual text;
begin
  if v_uid is null then raise exception 'sem_cadastro'; end if;
  select * into v_plano from public.planos where codigo = p_codigo and ativo;
  if not found or v_plano.preco_centavos <= 0 then return jsonb_build_object('ok', false, 'motivo', 'plano_invalido'); end if;
  select p.codigo into v_atual from public.assinaturas a join public.planos p on p.id = a.plano_id
   where a.usuario_id = v_uid and a.status = 'ativa' limit 1;
  if v_atual = v_plano.codigo then return jsonb_build_object('ok', false, 'motivo', 'ja_no_plano'); end if;
  update public.solicitacoes_plano set plano_id = v_plano.id where usuario_id = v_uid and status = 'pendente';
  if not found then
    insert into public.solicitacoes_plano (usuario_id, plano_id) values (v_uid, v_plano.id);
  end if;
  return jsonb_build_object('ok', true, 'codigo', v_plano.codigo, 'nome', v_plano.nome);
end $$;

create function public.app_cancelar_pedido_plano() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := app.meu_usuario_id(); v_n integer;
begin
  if v_uid is null then raise exception 'sem_cadastro'; end if;
  update public.solicitacoes_plano set status = 'cancelada' where usuario_id = v_uid and status = 'pendente';
  get diagnostics v_n = row_count;
  if v_n = 0 then return jsonb_build_object('ok', false, 'motivo', 'nao_encontrado'); end if;
  return jsonb_build_object('ok', true);
end $$;

revoke execute on function public.app_plano_e_pagamentos(), public.app_solicitar_plano(text), public.app_cancelar_pedido_plano() from public, anon;
grant execute on function public.app_plano_e_pagamentos(), public.app_solicitar_plano(text), public.app_cancelar_pedido_plano() to authenticated, service_role;
