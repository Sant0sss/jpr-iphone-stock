# Auto-Sync Planilha → Sistema (PriceGo)

Estudo de viabilidade e plano de implementação para sincronizar automaticamente a
planilha de preços do Google Sheets com o inventário da aplicação, eliminando o
clique manual em "Atualizar Preço".

Branch: `feat/planilha-auto-sync`

---

## 1. Veredito de viabilidade

**✅ Viável, de baixo esforço, com uma correção obrigatória antes de ligar.**

A parte pesada já existe e funciona: a Edge Function
[`google-sheet-sync`](../supabase/functions/google-sheet-sync/index.ts) já autentica
no Google (service account via Google Cloud), lê a planilha inteira e grava na tabela
`produtos`. Hoje isso só roda quando alguém clica no botão em
[`PriceUploader.tsx`](../src/components/PriceUploader.tsx). Automatizar = fechar dois
elos que faltam, não construir do zero.

### A cadeia tem 3 elos

| Elo | Existe hoje? | Para automatizar |
|-----|-------------|-----------------|
| Planilha → Banco (ler + gravar) | ✅ Pronto e testado | — |
| **Gatilho** (hoje é o clique manual) | ❌ Manual | Apps Script na planilha |
| Banco → Tela (refresh) | ⚠️ Só no F5/foco | `refetchInterval` no React Query |

---

## 2. Como o dado é escrito no banco: delete + insert (atômico), NÃO upsert

O modelo é **espelho exato da planilha**: a cada sync a tabela `produtos` é
reconstruída para ficar idêntica à planilha naquele momento.

```
Dentro de UMA transação:
  DELETE tudo de produtos
  INSERT todas as linhas atuais da planilha
```

### Por que NÃO upsert
- **Não trata remoção:** a pessoa também *tira* itens da planilha. Upsert só
  insere/atualiza — itens removidos ficariam como fantasmas no banco.
- **Falta chave única:** a chave natural (produto + cor + armazenamento + revendedor)
  tem colunas todas *nullable*; o Postgres trata cada NULL como distinto, o que quebra
  o `onConflict` e geraria duplicatas. A tabela não tem constraint única hoje.

Como a planilha é lida inteira a cada sync, reconstruir do zero reflete adições,
edições **e remoções** de uma vez, sem lógica de "o que sumiu" e sem duplicata.

---

## 3. As 4 fases

### Fase 1 🔴 — Correção atômica (PRÉ-REQUISITO, obrigatória)

**Problema:** hoje o `delete` e o `insert` são duas chamadas HTTP separadas
([google-sheet-sync linhas 211-220](../supabase/functions/google-sheet-sync/index.ts#L211-L220)).
Entre elas a tabela `produtos` fica **vazia por um instante**. O banco é **compartilhado
com a loja em produção** — um cliente que carregue a loja nesse instante vê catálogo
vazio. Hoje é raro (clique manual); automatizado, o risco cresce.

**Solução:** mover o `delete + insert` para uma função Postgres (RPC)
`sync_produtos(records jsonb)` que roda os dois comandos numa **transação única**
(`SECURITY DEFINER`, ignora RLS). Leitores veem ou o estado antigo completo, ou o novo
completo — nunca vazio.

**Mudanças:**
- Nova migration `supabase/migrations/2026XXXX_sync_produtos_rpc.sql`.
- Editar a Edge Function: trocar as duas chamadas por `supabaseClient.rpc('sync_produtos', { records })`.

**Independente do resto — pode ir primeiro. Já melhora a segurança mesmo sem automação.**

### Fase 2 🟡 — Gatilho automático: Planilha → Banco (Apps Script + debounce)

Script anexado à planilha (Google Apps Script). Design com debounce embutido,
latência de ~1 min:
- `onEdit` (gatilho **instalável** — o simples não pode chamar URL externa) só marca
  uma flag `pendente` no `PropertiesService`.
- Gatilho **por tempo (1 min)** lê a flag; se pendente, faz `UrlFetchApp` → POST na
  Edge Function e limpa a flag. Uma sessão de edição vira **1 sync**.
- `LockService` para evitar syncs concorrentes.

**Autenticação do POST é com o Supabase, não com o Google Cloud:** anon key (que já é
um JWT válido) + um segredo compartilhado no header. A service account do Google Cloud
continua só na leitura da planilha, dentro da Edge Function. O Apps Script roda sob a
conta Google de quem instala o trigger.

**Mudanças:**
- Script `.gs` (fora do repo) + passo-a-passo de instalar os 2 triggers.
- Editar a Edge Function para aceitar um `x-sync-secret` opcional (hardening).

### Fase 3 🟢 — Tela atualiza sozinha: Banco → UI

Hoje [`ProductList`](../src/components/ProductList.tsx#L16-L27) e
[`ProductSearchBar`](../src/components/pricing/ProductSearchBar.tsx#L36-L44) usam React
Query sem refresh automático (só atualiza no F5/foco).

**Solução:** `refetchInterval: 30000` + `refetchOnWindowFocus: true` nessas queries
(ou como default no `QueryClient` em [`App.tsx`](../src/App.tsx#L20)).

**Por que não Supabase Realtime:** como o sync reescreve a tabela inteira, o Realtime
dispararia uma tempestade de eventos por sync. Polling de 30s é mais leve e o dado já
muda no máx. a cada 1 min.

### Fase 4 — Botão manual vira fallback

Manter o "Atualizar Preço" ([`PriceUploader.tsx`](../src/components/PriceUploader.tsx))
como "forçar sync agora". Nenhuma mudança destrutiva.

---

## 4. Decisões técnicas (alternativas descartadas)

- **Upsert:** descartado — não trata remoções + colunas-chave nullable sem constraint única.
- **`pg_cron` (agendador no banco):** descartado como principal — reprocessaria a
  planilha inteira a cada 1 min pra sempre (~1.440 reescritas/dia no banco de produção
  mesmo sem edição). Fica como *alternativa* se não quisermos mexer no Apps Script.
- **Supabase Realtime para a tela:** descartado — tempestade de eventos a cada full-replace.

---

## 5. Contexto / restrições

- **Latência definida: ~1 min.** A planilha é editada ~1x/dia por uma pessoa (adiciona
  e remove itens). "Tempo real de segundos" seria desperdício e mais risco.
- **Banco compartilhado com produção** (loja + dev no mesmo projeto Supabase). Redeploy
  da Edge Function deve ser feito **fora do horário de pico**. Migration é aditiva.
- **`onEdit` simples do Apps Script não pode chamar URL externa** — por isso trigger
  instalável + timer.
- A tabela `produtos` não tem migration de criação no repo (existe direto no Supabase),
  sem constraint única. Tem colunas extras (`economia`, `sku`, `total`…) que o sync não
  preenche.

---

## 6. Risco e ordem de execução

| Fase | O que muda | Risco | Cutover fora do horário? |
|------|-----------|-------|--------------------------|
| 1 | Migration + Edge Function | Baixo (torna mais seguro) | Deploy da function sim; migration aditiva |
| 2 | Apps Script (fora do repo) + Edge Function | Baixo | Não |
| 3 | Front (2 queries) | Nenhum | Não |
| 4 | Nada | Nenhum | — |

**Fase 1 é obrigatória antes de automatizar** — não dá pra automatizar um sync que
pisca vazio contra o banco da loja.

**Resumo das mudanças concretas:** 1 migration SQL nova + ~2 linhas na Edge Function +
2 linhas no front + 1 script Apps Script (fora do repo).
