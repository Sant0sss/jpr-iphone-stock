# Auto-Sync Planilha → Sistema (PriceGo)

Estudo de viabilidade e plano de implementação para sincronizar automaticamente a
planilha de preços do Google Sheets com o inventário da aplicação, eliminando o
clique manual em "Atualizar Preço".

Branch: `feat/planilha-auto-sync`

---

## 0. Status (atualizado em 2026-07-04)

**✅ Implementado, revisado e testado ponta a ponta no banco de teste (JPR TESTE). Produção ainda NÃO tocada — falta o cutover (ver seção 7).**

| Fase | Status |
|------|--------|
| 1 — RPC atômica `sync_produtos` (+ guard anti-esvaziamento) | ✅ feito e testado |
| 2 — Gatilho Apps Script (onEdit rápido c/ debounce ~5s + timer fallback) | ✅ instalado e testado (apontando pro JPR TESTE) |
| 3 — `refetchInterval: 5000` na tela | ✅ feito |
| 4 — Botão manual vira fallback | ✅ (nada a mudar) |
| Code-review | ✅ feito; achados corrigidos (race do debounce + guard da RPC) |

**Latência: ~10s ponta a ponta** (debounce ~5s no `onEdit` + refetch 5s na tela). Config
rápida liberada porque é **sistema interno** (~3 funcionários; só 2 editam) — carga irrelevante.

Ambiente de teste: projeto Supabase **JPR TESTE** (`dckdmtxvtfypxbjxjqrb`), cópia do
schema de produção. App alterna com `npm run dev` (prod) / `npm run dev:test` (teste).

Artefatos entregues:
- Migration [`20260704_sync_produtos_rpc.sql`](../supabase/migrations/20260704_sync_produtos_rpc.sql)
- Edge Function [`google-sheet-sync`](../supabase/functions/google-sheet-sync/index.ts) usando a RPC
- Front: `refetchInterval` em [`ProductList`](../src/components/ProductList.tsx) e [`ProductSearchBar`](../src/components/pricing/ProductSearchBar.tsx)
- Gatilho [`apps-script-sync-trigger.gs`](apps-script-sync-trigger.gs)

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

### Fase 1 🔴 — Correção atômica (PRÉ-REQUISITO, obrigatória) — ✅ FEITO

**Problema:** hoje o `delete` e o `insert` são duas chamadas HTTP separadas
([google-sheet-sync linhas 211-220](../supabase/functions/google-sheet-sync/index.ts#L211-L220)).
Entre elas a tabela `produtos` fica **vazia por um instante**. O banco é **compartilhado
com o sistema interno em produção** — um funcionário que abrir a tela nesse instante vê
a lista vazia. Hoje é raro (clique manual); automatizado, o risco cresce.

**Solução:** mover o `delete + insert` para uma função Postgres (RPC)
`sync_produtos(records jsonb)` que roda os dois comandos numa **transação única**
(`SECURITY DEFINER`, ignora RLS). Leitores veem ou o estado antigo completo, ou o novo
completo — nunca vazio.

**Mudanças:**
- Nova migration `supabase/migrations/2026XXXX_sync_produtos_rpc.sql`.
- Editar a Edge Function: trocar as duas chamadas por `supabaseClient.rpc('sync_produtos', { records })`.

**Independente do resto — pode ir primeiro. Já melhora a segurança mesmo sem automação.**

### Fase 2 🟡 — Gatilho automático: Planilha → Banco (Apps Script + debounce) — ✅ FEITO

Script anexado à planilha (Google Apps Script). **Design rápido (latência ~5-8s)**,
adotado porque o sistema é interno (só ~3 funcionários; apenas 2 editam a planilha),
então a carga extra é irrelevante:
- `onEdit` (gatilho **instalável** — o simples não pode chamar URL externa) marca uma
  flag com carimbo, espera um **debounce curto (`Utilities.sleep`, ~5s)** e — se ninguém
  editou depois — chama a Edge Function **na hora**. Uma rajada de edições vira **1 sync**.
- Gatilho **por tempo (1 min)** vira **rede de segurança**: se algum `onEdit` falhar,
  ele pega a flag pendente no próximo minuto.
- `LockService` para evitar syncs concorrentes; compare-and-clear pra não perder uma
  edição que chegue durante o sync.

> Alternativa conservadora (se um dia o volume de edição crescer): trocar o debounce do
> `onEdit` por *só marcar a flag* e deixar o timer de 1 min fazer o sync — latência sobe
> pra ~1 min, mas some qualquer risco de "tempestade de syncs".

**Autenticação do POST é com o Supabase, não com o Google Cloud:** anon key (que já é
um JWT válido) + um segredo compartilhado no header. A service account do Google Cloud
continua só na leitura da planilha, dentro da Edge Function. O Apps Script roda sob a
conta Google de quem instala o trigger.

**Mudanças:**
- Script `.gs` (fora do repo) + passo-a-passo de instalar os 2 triggers.
- Editar a Edge Function para aceitar um `x-sync-secret` opcional (hardening).

### Fase 3 🟢 — Tela atualiza sozinha: Banco → UI — ✅ FEITO

Hoje [`ProductList`](../src/components/ProductList.tsx#L16-L27) e
[`ProductSearchBar`](../src/components/pricing/ProductSearchBar.tsx#L36-L44) usam React
Query sem refresh automático (só atualiza no F5/foco).

**Solução:** `refetchInterval: 5000` + `refetchOnWindowFocus: true` nessas queries.
Ficou em **5s** (não 30s) porque o sistema é interno com ~3 usuários — o custo de polling
é irrelevante — e assim a tela acompanha o sync rápido (~5-8s), dando **~10s ponta a ponta**.

**Por que não Supabase Realtime:** como o sync reescreve a tabela inteira, o Realtime
dispararia uma tempestade de eventos por sync. Polling é mais simples; com poucos usuários
internos, a carga não é problema. (Se um dia crescer, dá pra usar Realtime como *sinal*
p/ 1 refetch, em vez de baixar mais o intervalo.)

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

- **Sistema INTERNO** (não é loja pública): só ~3 funcionários têm acesso (gerente, chefe,
  vendedor); apenas o chefe e o gerente editam a planilha, o vendedor só consulta. Por isso
  a carga é baixíssima e a config rápida (~10s) foi liberada sem preocupação.
- **Latência escolhida: ~10s ponta a ponta** (debounce ~5s no `onEdit` + refetch 5s na tela).
  Como o sistema é interno e pouco acessado, o "rápido" não custa carga relevante.
- **Banco compartilhado com produção** (sistema interno + dev no mesmo projeto Supabase).
  Redeploy da Edge Function e cutover devem ser **fora do horário de trabalho** (pra não
  atrapalhar os funcionários que dependem do sistema). Migration é aditiva.
- **`onEdit` simples do Apps Script não pode chamar URL externa** — por isso trigger
  instalável (que faz o POST) + timer de 1 min como rede de segurança.
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
pisca vazio contra o banco que o sistema interno usa em produção.

**Resumo das mudanças concretas:** 1 migration SQL nova + ~2 linhas na Edge Function +
2 linhas no front + 1 script Apps Script (fora do repo).

---

## 7. Checklist de cutover para PRODUÇÃO

Tudo abaixo já foi validado no JPR TESTE. A produção (`uutfdyqzjlehcchrdgro`) só é
tocada aqui. **Fazer fora do horário de trabalho** (pra não atrapalhar os funcionários).

### 7.1 — Isolar a entrega (git)
A branch `feat/planilha-auto-sync` está empilhada sobre a `feat/admin-auditoria`
(painel admin **inacabado**). Não mergear ela direto — arrastaria o admin + o
login-por-e-mail pra produção. A `main` hoje usa **login hardcoded**; manter assim.

1. `git fetch origin`
2. Criar branch nova a partir de `origin/main` (que já tem o Seal Care & Shield e o login hardcoded)
3. Trazer **só** os commits de auto-sync (cherry-pick) — não tocam em nenhum arquivo do admin, então aplicam limpo
4. Deixar de fora o que é só apoio de teste: `.env.dbtest`, `supabase/schema-prod.sql`, script `dev:test` (opcional)
5. Abrir PR dessa branch → QA testa com o login que o sistema já usa (hardcoded) → aprova

### 7.2 — Banco de produção
6. Aplicar a migration `20260704_sync_produtos_rpc.sql` no banco de prod (aditiva: só cria a função `sync_produtos`, não altera tabelas/dados)

### 7.3 — Edge Function de produção
7. Deploy da `google-sheet-sync` no projeto de prod:
   `npx supabase functions deploy google-sheet-sync --project-ref uutfdyqzjlehcchrdgro`
   (o secret `GOOGLE_SERVICE_ACCOUNT_JSON` já existe em prod; a função só passou a chamar a RPC)

### 7.4 — Front
8. Deploy do front (o `refetchInterval: 5000` já está no código; `client.ts` cai no fallback de prod sem `.env`)

### 7.5 — Gatilho (Apps Script)
9. No editor do Apps Script da planilha, no `autoSync.gs`, trocar o `CONFIG`:
   - `FUNCTION_URL` → `https://uutfdyqzjlehcchrdgro.supabase.co/functions/v1/google-sheet-sync`
   - `ANON_KEY` → a anon key de **produção**
10. Reinstalar sob a conta certa (idealmente a **dona da planilha**, p/ a automação não depender de conta pessoal) — rodar `installTriggers` uma vez
11. Testar com `syncNow` e validar que `produtos` de prod atualizou

### 7.6 — Pós-cutover
12. Editar uma célula da planilha e confirmar o sync automático (~5-8s) contra prod
13. Confirmar no sistema interno que a lista atualiza sozinha em ~10s (Fase 3)
