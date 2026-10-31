-- LGPD: prova de consentimento, acesso/portabilidade e eliminação dos dados do titular.
alter table public.usuarios drop constraint if exists usuarios_status_check;
alter table public.usuarios add constraint usuarios_status_check
  check (status in ('pendente','trial','ativo','inadimplente','bloqueado','cancelado','excluido'));
alter table public.usuarios add column if not exists consentimento_em timestamptz;
alter table public.usuarios add column if not exists consentimento_versao text;

create table public.consentimentos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  tipo text not null check (tipo in ('termos','privacidade','marketing')),
  versao text not null,
  origem text not null check (origem in ('landing','whatsapp','painel')),
  aceito_em timestamptz not null default now(),
  revogado_em timestamptz
);
create index consentimentos_usuario_idx on public.consentimentos (usuario_id);
alter table public.consentimentos enable row level security;
revoke all on public.consentimentos from anon, authenticated;

create function public.registrar_consentimento(
  p_usuario_id uuid, p_versao text, p_origem text default 'whatsapp', p_marketing boolean default false)
returns jsonb language plpgsql set search_path = '' as $$
begin
  insert into public.consentimentos (usuario_id, tipo, versao, origem)
  select p_usuario_id, t, p_versao, p_origem from unnest(array['termos', 'privacidade']) as t;
  if p_marketing then
    insert into public.consentimentos (usuario_id, tipo, versao, origem) values (p_usuario_id, 'marketing', p_versao, p_origem);
  end if;
  update public.usuarios set consentimento_em = now(), consentimento_versao = p_versao where id = p_usuario_id;
  return jsonb_build_object('ok', true);
end $$;

-- Cópia dos dados do titular (acesso e portabilidade)
create function public.exportar_dados(p_usuario_id uuid) returns jsonb
language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'gerado_em', now(),
    'titular', (select jsonb_build_object('nome', u.nome, 'email', u.email, 'telefone', u.telefone, 'status', u.status,
                  'cadastrado_em', u.created_at, 'consentimento_em', u.consentimento_em, 'consentimento_versao', u.consentimento_versao)
                from public.usuarios u where u.id = p_usuario_id),
    'assinaturas', (select coalesce(jsonb_agg(jsonb_build_object('plano', pl.nome, 'status', a.status,
                      'inicio', a.periodo_inicio, 'fim', a.periodo_fim)), '[]'::jsonb)
                    from public.assinaturas a join public.planos pl on pl.id = a.plano_id where a.usuario_id = p_usuario_id),
    'lancamentos', (select coalesce(jsonb_agg(jsonb_build_object('data', l.data_lancamento, 'tipo', l.tipo, 'valor', l.valor,
                      'categoria', l.categoria, 'subcategoria', l.subcategoria, 'descricao', l.descricao,
                      'metodo_pagamento', l.metodo_pagamento, 'parcelas', l.parcelas, 'registrado_em', l.created_at)
                      order by l.data_lancamento), '[]'::jsonb)
                    from public.lancamentos l where l.usuario_id = p_usuario_id and l.deleted_at is null),
    'consentimentos', (select coalesce(jsonb_agg(jsonb_build_object('tipo', c.tipo, 'versao', c.versao,
                         'origem', c.origem, 'aceito_em', c.aceito_em, 'revogado_em', c.revogado_em)), '[]'::jsonb)
                       from public.consentimentos c where c.usuario_id = p_usuario_id),
    'uso', (select coalesce(jsonb_agg(jsonb_build_object('periodo_inicio', up.periodo_inicio, 'mensagens', up.mensagens)), '[]'::jsonb)
            from public.uso_periodo up where up.usuario_id = p_usuario_id));
$$;

-- Eliminação: apaga lançamentos, conversas e logs; anonimiza o cadastro.
-- Mantém só o mínimo exigido por obrigação legal/fiscal (assinaturas, eventos de pagamento, prova de consentimento).
create function public.excluir_dados(p_usuario_id uuid) returns jsonb
language plpgsql set search_path = '' as $$
declare v_tel text; v_l integer; v_c integer;
begin
  select telefone into v_tel from public.usuarios where id = p_usuario_id and status <> 'excluido';
  if not found then return jsonb_build_object('ok', false); end if;
  delete from public.lancamentos where usuario_id = p_usuario_id;
  get diagnostics v_l = row_count;
  delete from public.conversa_mensagens where usuario_id = p_usuario_id;
  get diagnostics v_c = row_count;
  delete from public.ativacoes where usuario_id = p_usuario_id;
  delete from public.uso_periodo where usuario_id = p_usuario_id;
  delete from public.mensagens_entrada where usuario_id = p_usuario_id or telefone = v_tel;
  update public.assinaturas
     set status = case when status in ('trial', 'ativa', 'inadimplente') then 'cancelada' else status end,
         periodo_fim = coalesce(periodo_fim, now())
   where usuario_id = p_usuario_id;
  update public.usuarios
     set telefone = '0' || substr(regexp_replace(id::text, '\D', '', 'g') || '000000000000', 1, 12),
         nome = null, email = null, auth_user_id = null, boas_vindas_em = null,
         status = 'excluido', deleted_at = now()
   where id = p_usuario_id;
  return jsonb_build_object('ok', true, 'lancamentos_removidos', v_l, 'conversas_removidas', v_c);
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
