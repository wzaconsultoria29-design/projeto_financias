-- Pagamento dos planos pelo Mercado Pago (Checkout Pro, pagamento mensal avulso). Desenho de 2026-11-12.
--
-- Fluxo: a função de borda `pagamento-criar` abre uma cobrança aqui e uma preferência no Mercado Pago, que leva a pessoa ao
-- checkout. O Mercado Pago avisa a função `pagamento-webhook`; ela busca o pagamento na API do Mercado Pago (nunca confia no
-- aviso) e chama `cobranca_processar`, que ativa ou renova o plano por 1 mês e registra o pagamento.
--
-- Tudo aqui roda só pelo servidor (service_role). Os dados que a pessoa vê continuam saindo de `app_plano_e_pagamentos`.

create table public.cobrancas (
  id uuid primary key default gen_random_uuid(),  -- vai ao Mercado Pago como external_reference
  usuario_id uuid not null references public.usuarios (id) on delete cascade,
  plano_id uuid not null references public.planos (id),
  valor_centavos integer not null check (valor_centavos > 0),
  status text not null default 'criada' check (status in ('criada', 'pendente', 'paga', 'falhou', 'reembolsada', 'divergente')),
  mp_preference_id text,
  mp_payment_id text,  -- o último pagamento visto (uma preferência pode ter várias tentativas)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index cobrancas_usuario_idx on public.cobrancas (usuario_id, created_at desc);
alter table public.cobrancas enable row level security;
revoke all on public.cobrancas from anon, authenticated;
create trigger cobrancas_updated before update on public.cobrancas
  for each row execute function app.set_updated_at();

-- Abre uma cobrança para o plano pedido. No máximo 20 por pessoa por dia (contra abuso).
create function public.cobranca_criar(p_usuario_id uuid, p_plano text) returns jsonb
language plpgsql set search_path = '' as $$
declare v_u public.usuarios%rowtype; v_p public.planos%rowtype; v_n integer; v_id uuid;
begin
  select * into v_u from public.usuarios where id = p_usuario_id;
  if not found then return jsonb_build_object('ok', false, 'motivo', 'sem_cadastro'); end if;
  if v_u.status in ('bloqueado', 'cancelado', 'excluido') then return jsonb_build_object('ok', false, 'motivo', 'usuario_bloqueado'); end if;
  select * into v_p from public.planos where codigo = p_plano and ativo;
  if not found or v_p.preco_centavos <= 0 then return jsonb_build_object('ok', false, 'motivo', 'plano_invalido'); end if;
  select count(*) into v_n from public.cobrancas where usuario_id = p_usuario_id and created_at > now() - interval '1 day';
  if v_n >= 20 then return jsonb_build_object('ok', false, 'motivo', 'muitas_cobrancas'); end if;
  insert into public.cobrancas (usuario_id, plano_id, valor_centavos) values (p_usuario_id, v_p.id, v_p.preco_centavos) returning id into v_id;
  return jsonb_build_object('ok', true, 'cobranca_id', v_id, 'valor_centavos', v_p.preco_centavos,
                            'plano_codigo', v_p.codigo, 'plano_nome', v_p.nome);
end $$;

create function public.cobranca_vincular_preferencia(p_cobranca_id uuid, p_preferencia text) returns jsonb
language plpgsql set search_path = '' as $$
begin
  update public.cobrancas set mp_preference_id = p_preferencia where id = p_cobranca_id;
  return jsonb_build_object('ok', found);
end $$;

-- Aplica o que o Mercado Pago informou sobre um pagamento. Pode ser chamada várias vezes para o mesmo pagamento (é idempotente).
--  approved            -> ativa ou renova o plano por 1 mês, registra o pagamento, dá o pedido de plano por atendido
--  refunded/charged_back -> marca o pagamento como reembolsado (o plano NÃO é cortado sozinho: fica para revisão)
--  rejected/cancelled  -> cobrança falhou (nunca desfaz uma cobrança já paga)
--  pending/in_process  -> cobrança pendente
create function public.cobranca_processar(
  p_cobranca_id uuid, p_mp_payment_id text, p_status text, p_valor_centavos integer, p_moeda text default 'BRL')
returns jsonb language plpgsql set search_path = '' as $$
declare
  v_c public.cobrancas%rowtype; v_p public.planos%rowtype; v_a public.assinaturas%rowtype; v_ass uuid; v_n integer; v_acao text;
begin
  select * into v_c from public.cobrancas where id = p_cobranca_id for update;
  if not found then return jsonb_build_object('ok', false, 'motivo', 'cobranca_inexistente'); end if;
  select * into v_p from public.planos where id = v_c.plano_id;

  if p_status = 'approved' then
    if p_moeda is distinct from 'BRL' or p_valor_centavos is distinct from v_c.valor_centavos then
      update public.cobrancas set status = 'divergente', mp_payment_id = p_mp_payment_id where id = v_c.id;
      return jsonb_build_object('ok', false, 'motivo', 'valor_divergente');
    end if;
    -- Idempotência: o mesmo pagamento nunca ativa duas vezes.
    insert into public.pagamentos (usuario_id, descricao, valor_centavos, status, gateway, gateway_pagamento_id, pago_em)
    values (v_c.usuario_id, v_p.nome || ', mensalidade', v_c.valor_centavos, 'pago', 'mercadopago', p_mp_payment_id, now())
    on conflict (gateway, gateway_pagamento_id) where gateway_pagamento_id is not null do nothing;
    get diagnostics v_n = row_count;
    if v_n = 0 then return jsonb_build_object('ok', true, 'acao', 'ja_processado'); end if;

    select * into v_a from public.assinaturas
     where usuario_id = v_c.usuario_id and status in ('trial', 'ativa', 'inadimplente') for update;
    if found and v_a.plano_id = v_c.plano_id and v_a.status = 'ativa' and v_a.periodo_fim is not null and v_a.periodo_fim > now() then
      -- Renovação antes do vencimento: soma 1 mês ao fim e começa uma cota nova.
      update public.assinaturas
         set periodo_inicio = now(), periodo_fim = v_a.periodo_fim + interval '1 month', gateway = 'mercadopago', cancelar_no_fim = false
       where id = v_a.id;
      v_ass := v_a.id; v_acao := 'renovada';
    else
      -- Primeira assinatura paga, troca de plano ou período já vencido: fecha a antiga e abre uma de 1 mês.
      if found then update public.assinaturas set status = 'cancelada' where id = v_a.id; end if;
      insert into public.assinaturas (usuario_id, plano_id, status, gateway, periodo_inicio, periodo_fim)
      values (v_c.usuario_id, v_c.plano_id, 'ativa', 'mercadopago', now(), now() + interval '1 month') returning id into v_ass;
      v_acao := 'ativada';
    end if;
    update public.pagamentos set assinatura_id = v_ass where gateway = 'mercadopago' and gateway_pagamento_id = p_mp_payment_id;
    update public.usuarios set status = 'ativo' where id = v_c.usuario_id and status in ('pendente', 'trial', 'inadimplente');
    update public.solicitacoes_plano set status = 'atendida' where usuario_id = v_c.usuario_id and plano_id = v_c.plano_id and status = 'pendente';
    update public.cobrancas set status = 'paga', mp_payment_id = p_mp_payment_id where id = v_c.id;
    return jsonb_build_object('ok', true, 'acao', v_acao);

  elsif p_status in ('refunded', 'charged_back') then
    update public.pagamentos set status = 'reembolsado' where gateway = 'mercadopago' and gateway_pagamento_id = p_mp_payment_id;
    update public.cobrancas set status = 'reembolsada', mp_payment_id = p_mp_payment_id where id = v_c.id;
    return jsonb_build_object('ok', true, 'acao', 'reembolso_registrado');

  elsif p_status in ('rejected', 'cancelled') then
    update public.cobrancas set status = 'falhou', mp_payment_id = p_mp_payment_id where id = v_c.id and status <> 'paga';
    return jsonb_build_object('ok', true, 'acao', 'falhou');

  elsif p_status in ('pending', 'in_process', 'authorized', 'in_mediation') then
    update public.cobrancas set status = 'pendente', mp_payment_id = p_mp_payment_id where id = v_c.id and status in ('criada', 'pendente');
    return jsonb_build_object('ok', true, 'acao', 'pendente');
  end if;

  return jsonb_build_object('ok', true, 'acao', 'ignorado');
end $$;

revoke execute on function public.cobranca_criar(uuid, text), public.cobranca_vincular_preferencia(uuid, text),
  public.cobranca_processar(uuid, text, text, integer, text) from public, anon, authenticated;
grant execute on function public.cobranca_criar(uuid, text), public.cobranca_vincular_preferencia(uuid, text),
  public.cobranca_processar(uuid, text, text, integer, text) to service_role;
