-- Categorias que o cliente realmente usa (o bot cria categorias livres), para o filtro e o formulário do painel.
create function public.app_categorias() returns jsonb
language sql stable set search_path = '' as $$
  select coalesce(jsonb_agg(t.c order by t.c), '[]'::jsonb)
    from (select distinct trim(l.categoria) as c
            from public.lancamentos l
           where l.usuario_id = app.meu_usuario_id()
             and l.deleted_at is null
             and nullif(trim(l.categoria), '') is not null) t
$$;

revoke execute on function public.app_categorias() from public, anon;
grant execute on function public.app_categorias() to authenticated, service_role;
