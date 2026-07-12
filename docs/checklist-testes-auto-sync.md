# Checklist de testes manuais — Auto-sync (JPR TESTE)

Tudo aqui é no **JPR TESTE** — não toca na produção. Objetivo: confirmar que o sync
rápido (~10s) funciona e não dá problema ao subir pro banco.

## Preparação (uma vez)
- [ ] Rodar `npm run dev:test` e abrir o PriceGo no navegador
- [ ] Logar (`sealstoree2020@example.com` + a senha de teste) e ir na tela de **produtos/inventário**
- [ ] Abrir a **planilha** numa aba
- [ ] Abrir o editor do **Apps Script** (pra checar o "Registro de execução" quando precisar)
- [ ] Deixar um cronômetro à mão (celular serve)

> Dica: como a tela atualiza sozinha a cada 5s, dá pra deixar ela aberta olhando — não
> precisa dar F5. Se quiser forçar na hora, voltar o foco pra aba do PriceGo também atualiza.

---

## Testes

### 1. Fluxo básico (edição simples)
- [ ] Mudar o **preço** de um produto na planilha
- [ ] **Esperado:** em ~10s o preço novo aparece sozinho na tela, sem clicar em nada

### 2. Velocidade (cronômetro)
- [ ] Zerar o cronômetro no momento que terminar de editar a célula
- [ ] **Esperado:** o preço reflete na tela em ~10-13s (anota quanto deu)

### 3. Rajada de edições (debounce)
- [ ] Editar 3-4 células diferentes rapidinho, uma atrás da outra
- [ ] **Esperado:** todas as mudanças aparecem **juntas** (~10s depois da última), não uma de cada vez
- [ ] Conferir no "Registro de execução": deve ter **poucos** "Sync OK" (idealmente 1), não um por célula

### 4. Editar durante o sync (não perder edição)
- [ ] Editar uma célula, esperar uns 4s, e editar outra célula bem rápido (no meio do processo)
- [ ] **Esperado:** as **duas** mudanças acabam refletindo (nenhuma some)

### 5. Adicionar produto
- [ ] Adicionar uma linha nova (produto novo) na planilha
- [ ] **Esperado:** o produto novo aparece no inventário em ~10s

### 6. Excluir produto
- [ ] Apagar uma linha na planilha
- [ ] **Esperado:** o produto some do inventário em ~10s

### 7. Excluir + adicionar na mesma sessão
- [ ] Numa mesma leva, apagar um produto e adicionar outro
- [ ] **Esperado:** os dois refletem juntos — o inventário fica **idêntico** à planilha

### 8. Nunca fica vazio (atomicidade)
- [ ] Logo depois de editar (durante o sync), ficar olhando/atualizando a tela algumas vezes
- [ ] **Esperado:** a lista **nunca** aparece vazia — mostra ou a lista antiga ou a nova, nunca em branco

### 9. Botão manual (fallback)
- [ ] Clicar em **"Atualizar Preço"** no app
- [ ] **Esperado:** força o sync na hora, funciona normal

### 10. Registro de execução (erros/cota)
- [ ] Depois de fazer os testes acima, abrir o "Registro de execução" do Apps Script
- [ ] **Esperado:** só "Sync OK", **sem erro** e **sem aviso de cota**

### 11. (Opcional) Duas pessoas editando junto
- [ ] Se conseguir uma 2ª pessoa, os dois editam ao mesmo tempo
- [ ] **Esperado:** não embola, o resultado final bate com a planilha

---

## Se algo der errado
Anota **o que você fez** e **o que apareceu no "Registro de execução"** do Apps Script
(a mensagem de erro). Com isso dá pra investigar rápido.

## Observação
Se em algum teste o tempo/comportamento não te agradar, lembra que dá pra:
- Ajustar o debounce (`DEBOUNCE_MS` no `.gs`) — mais/menos que 5s
- Ajustar o refresh da tela (`refetchInterval` no front) — hoje 5s
- Ou voltar pro design conservador de 1 min (documentado no `auto-sync-plan.md`, Fase 2)
