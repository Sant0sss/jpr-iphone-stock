-- Fase 1 do auto-sync: substitui o delete+insert em duas chamadas HTTP separadas
-- (que deixava a tabela `produtos` vazia por um instante) por uma RPC que faz os
-- dois comandos numa ÚNICA transação. Leitores (a loja) veem ou o estado antigo
-- completo, ou o novo completo — nunca vazio.
--
-- Modelo mantido: espelho exato da planilha (delete tudo + insert das linhas atuais).
-- Migration ADITIVA: só cria a função, não altera tabelas nem dados.

create or replace function public.sync_produtos(records jsonb)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted integer;
begin
  -- Proteção: nunca esvaziar a tabela por engano. Se vier lista vazia/nula, aborta
  -- (o objetivo desta função é justamente a tabela NUNCA ficar vazia).
  if records is null or jsonb_typeof(records) <> 'array' or jsonb_array_length(records) = 0 then
    raise exception 'sync_produtos: lista de registros vazia ou inválida — abortando para não esvaziar produtos';
  end if;

  -- Tudo abaixo roda na mesma transação da função: atômico.
  -- `where true`: as conexões do PostgREST rodam com sql_safe_updates=on, que
  -- rejeita DELETE sem WHERE. `true` apaga tudo e satisfaz o guard.
  delete from public.produtos where true;

  insert into public.produtos
    (produto, armazenamento, novo_seminovo, cores, revendedor, custo, preco, atualized_at)
  select
    r->>'produto',
    r->>'armazenamento',
    r->>'novo_seminovo',
    r->>'cores',
    r->>'revendedor',
    r->>'custo',
    r->>'preco',
    nullif(r->>'atualized_at', '')::timestamp
  from jsonb_array_elements(records) as r;

  get diagnostics inserted = row_count;
  return inserted;
end;
$$;

-- A função é SECURITY DEFINER e apaga a tabela inteira: restringe quem pode chamar.
-- A Edge Function invoca com a service_role key, então só ela precisa de execute.
-- Revoga explicitamente de anon/authenticated também: o event trigger do Supabase
-- ("expose new tables") concede execute a eles na criação da função, então revogar
-- só de PUBLIC não basta — precisa nomear os dois papéis.
grant execute on function public.sync_produtos(jsonb) to service_role;
revoke all on function public.sync_produtos(jsonb) from public, anon, authenticated;
