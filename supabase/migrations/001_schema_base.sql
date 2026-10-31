create schema if not exists app;

alter default privileges for role postgres in schema public revoke execute on functions from anon, authenticated;

create or replace function app.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;

-- Planos (leitura pública para a landing)
create table public.planos (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nome text not null,
  descricao text,
  preco_centavos integer not null default 0 check (preco_centavos >= 0),
  mensagens_limite integer check (mensagens_limite is null or mensagens_limite > 0),
  ciclo text not null default 'mensal' check (ciclo in ('unico','mensal')),
  ordem smallint not null default 0,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.planos (codigo, nome, descricao, preco_centavos, mensagens_limite, ciclo, ordem) values
  ('trial',   'Trial',   '30 mensagens para experimentar',          0,    30,  'unico',  0),
  ('solo',    'Solo',    '150 mensagens por mês para uma pessoa',   1990, 150, 'mensal', 1),
  ('familia', 'Família', '500 mensagens por mês para a família',    4490, 500, 'mensal', 2);

-- Usuários (identidade = telefone do WhatsApp)
create table public.usuarios (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  telefone text not null unique check (telefone ~ '^[0-9]{10,15}$'),
  nome text,
  email text,
  telefone_verificado_em timestamptz,
  boas_vindas_em timestamptz,
  status text not null default 'pendente'
    check (status in ('pendente','trial','ativo','inadimplente','bloqueado','cancelado')),
  origem text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create unique index usuarios_email_uq on public.usuarios (lower(email)) where email is not null and deleted_at is null;

-- Assinaturas (uma vigente por usuário)
create table public.assinaturas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  plano_id uuid not null references public.planos(id),
  status text not null default 'ativa'
    check (status in ('trial','ativa','inadimplente','cancelada','expirada')),
  gateway text,
  gateway_customer_id text,
  gateway_subscription_id text,
  periodo_inicio timestamptz not null default now(),
  periodo_fim timestamptz,
  cancelar_no_fim boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index assinaturas_vigente_uq on public.assinaturas (usuario_id) where status in ('trial','ativa','inadimplente');
create unique index assinaturas_gateway_uq on public.assinaturas (gateway, gateway_subscription_id) where gateway_subscription_id is not null;
create index assinaturas_usuario_idx on public.assinaturas (usuario_id);
create index assinaturas_plano_idx on public.assinaturas (plano_id);

-- Uso por período de cobrança (cota + custo por cliente)
create table public.uso_periodo (
  id uuid primary key default gen_random_uuid(),
  assinatura_id uuid not null references public.assinaturas(id) on delete cascade,
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  periodo_inicio timestamptz not null,
  mensagens integer not null default 0,
  lancamentos integer not null default 0,
  consultas integer not null default 0,
  audios integer not null default 0,
  imagens integer not null default 0,
  tokens_entrada bigint not null default 0,
  tokens_saida bigint not null default 0,
  custo_usd numeric(12,6) not null default 0,
  alerta_80_em timestamptz,
  unique (assinatura_id, periodo_inicio)
);
create index uso_periodo_usuario_idx on public.uso_periodo (usuario_id);

-- Lançamentos financeiros
create table public.lancamentos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  tipo text not null check (tipo in ('despesa','receita')),
  valor numeric(14,2) not null check (valor > 0),
  moeda text not null default 'BRL',
  data_lancamento date not null default ((now() at time zone 'America/Sao_Paulo')::date),
  categoria text,
  subcategoria text,
  descricao text,
  metodo_pagamento text check (metodo_pagamento in ('pix','débito','crédito','dinheiro','transferência','outro')),
  parcelas smallint not null default 1 check (parcelas >= 1),
  recorrente boolean not null default false,
  tipo_gasto text check (tipo_gasto in ('essencial','supérfluo','investimento')),
  tags text[] not null default '{}',
  origem text not null default 'texto' check (origem in ('texto','audio','imagem','painel')),
  mensagem_id text,
  codigo text not null default upper(substr(md5(gen_random_uuid()::text), 1, 6)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create unique index lancamentos_codigo_uq on public.lancamentos (usuario_id, codigo);
create index lancamentos_usuario_data_idx on public.lancamentos (usuario_id, data_lancamento desc) where deleted_at is null;
create index lancamentos_usuario_categoria_idx on public.lancamentos (usuario_id, categoria) where deleted_at is null;

-- Deduplicação e log de mensagens recebidas (qualquer provedor)
create table public.mensagens_entrada (
  canal text not null default 'whatsapp',
  mensagem_id text not null,
  usuario_id uuid references public.usuarios(id) on delete set null,
  telefone text,
  tipo text check (tipo in ('texto','audio','imagem','outro')),
  status text not null default 'recebida'
    check (status in ('recebida','processada','erro','ignorada','bloqueada')),
  erro text,
  recebida_em timestamptz not null default now(),
  processada_em timestamptz,
  primary key (canal, mensagem_id)
);
create index mensagens_entrada_usuario_idx on public.mensagens_entrada (usuario_id, recebida_em desc);

-- Memória curta da conversa do agente
create table public.conversa_mensagens (
  id bigint generated always as identity primary key,
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  papel text not null check (papel in ('user','assistant')),
  conteudo text not null,
  created_at timestamptz not null default now()
);
create index conversa_usuario_idx on public.conversa_mensagens (usuario_id, id desc);

-- Eventos do gateway de pagamento (idempotência)
create table public.eventos_pagamento (
  gateway text not null,
  evento_id text not null,
  tipo text,
  payload jsonb,
  processado_em timestamptz,
  created_at timestamptz not null default now(),
  primary key (gateway, evento_id)
);

-- Códigos de ativação (usuário prova o número mandando o código pelo WhatsApp)
create table public.ativacoes (
  codigo text primary key,
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  expira_em timestamptz not null default (now() + interval '2 days'),
  consumido_em timestamptz,
  created_at timestamptz not null default now()
);
create index ativacoes_usuario_idx on public.ativacoes (usuario_id);

create trigger usuarios_updated before update on public.usuarios for each row execute function app.set_updated_at();
create trigger assinaturas_updated before update on public.assinaturas for each row execute function app.set_updated_at();
create trigger lancamentos_updated before update on public.lancamentos for each row execute function app.set_updated_at();
