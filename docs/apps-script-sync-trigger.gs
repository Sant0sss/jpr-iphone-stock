/**
 * Auto-sync (Fase 2) — Gatilho da planilha → Edge Function do Supabase.
 *
 * Cole este código no editor de Apps Script da planilha
 * (Extensões → Apps Script), ajuste o bloco CONFIG e rode installTriggers() UMA vez.
 *
 * Design RÁPIDO (latência ~5-8s), conforme docs/auto-sync-plan.md. Adotado porque é
 * sistema INTERNO (poucos usuários; só 2 pessoas editam), então a carga é irrelevante:
 *   - onSheetEdit (gatilho INSTALÁVEL) marca a flag, espera um debounce curto (~5s) e —
 *     se ninguém editou depois — chama a Edge Function na hora. Rajada de edições = 1 sync.
 *   - flushPendingSync (gatilho POR TEMPO, 1 min) vira REDE DE SEGURANÇA: se algum
 *     onSheetEdit falhar, ele pega a flag pendente no próximo minuto.
 *   - LockService evita dois syncs concorrentes; compare-and-clear não perde edição
 *     que chegue durante o sync.
 *
 * Obs: o onEdit *simples* não pode fazer requisição externa — por isso é INSTALÁVEL.
 * Se um dia o volume de edição crescer, dá pra voltar ao conservador (onEdit só marca
 * a flag; o timer de 1 min faz o sync) — latência sobe pra ~1 min, sem risco de storm.
 */

// ===================== CONFIG (ajuste aqui) =====================
var CONFIG = {
  // URL da Edge Function. TESTE (JPR TESTE):
  FUNCTION_URL: 'https://dckdmtxvtfypxbjxjqrb.supabase.co/functions/v1/google-sheet-sync',
  // Para PRODUÇÃO, troque para:
  // FUNCTION_URL: 'https://uutfdyqzjlehcchrdgro.supabase.co/functions/v1/google-sheet-sync',

  // anon key do MESMO projeto da FUNCTION_URL acima. (anon do JPR TESTE)
  ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRja2RtdHh2dGZ5cHhianhqcXJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxNzY5MjMsImV4cCI6MjA5ODc1MjkyM30.r-xjOE6AXcbqkkIW997E_BSBl4of_VxmuMQ9iEuMVo0',

  // Identificação da planilha/aba (mesmos valores do .env do app).
  SHEET_ID: '1Lp6PWjl-q5KJsOnZHIbzEWREG0KYnEVM21vacW85Wew',
  SHEET_TITLE: 'Tabela de Preço - 2026',

  // Opcional (hardening): se um dia a Edge Function passar a exigir x-sync-secret,
  // ponha o mesmo valor aqui. Deixe '' enquanto a função não exigir.
  SYNC_SECRET: '',
};
// ===============================================================

var PROP_PENDING = 'syncPending';

// Debounce do onEdit: sincroniza ~DEBOUNCE_MS após a ÚLTIMA edição (a espera reinicia
// a cada edição, agrupando uma rajada em 1 sync). Ajuste à vontade.
var DEBOUNCE_MS = 5000; // 5s

/**
 * Gatilho INSTALÁVEL de edição (design principal, rápido): marca pendente, espera o
 * debounce e — se ninguém editou depois — sincroniza na hora (~5-8s), sem esperar o timer.
 * (instalado por installTriggers)
 */
function onSheetEdit(e) {
  var props = PropertiesService.getScriptProperties();
  var stamp = String(Date.now());
  props.setProperty(PROP_PENDING, stamp);   // marca pendente com o carimbo desta edição
  Utilities.sleep(DEBOUNCE_MS);             // debounce: agrupa uma rajada de edições
  // só sincroniza se ninguém editou depois de mim nesse meio tempo
  if (props.getProperty(PROP_PENDING) === stamp) {
    flushPendingSync();
  }
}

/**
 * Gatilho POR TEMPO (a cada 1 min) — REDE DE SEGURANÇA. No fluxo normal o onSheetEdit
 * já sincroniza em ~5s; este aqui só entra em ação se aquele falhar (pega a flag que
 * ficou pendente). Também é chamado pelo onSheetEdit pra fazer o POST em si.
 * (instalado por installTriggers)
 */
function flushPendingSync() {
  var props = PropertiesService.getScriptProperties();
  // Captura o valor da flag AGORA. Se uma edição chegar durante o sync, ela grava
  // um valor novo — e aí NÃO apagamos, pra não perder essa edição (compare-and-clear).
  var pending = props.getProperty(PROP_PENDING);
  if (!pending) return; // nada mudou desde o último sync

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return; // outro sync em andamento; tenta no próximo minuto

  try {
    var res = UrlFetchApp.fetch(CONFIG.FUNCTION_URL, {
      method: 'post',
      contentType: 'application/json',
      headers: buildHeaders_(),
      payload: JSON.stringify({ sheetId: CONFIG.SHEET_ID, sheetTitle: CONFIG.SHEET_TITLE }),
      muteHttpExceptions: true,
    });

    var code = res.getResponseCode();
    var body = res.getContentText();
    if (code >= 200 && code < 300) {
      // Só limpa se ninguém editou durante o sync. Se a flag mudou, deixa pendente
      // pra o próximo minuto sincronizar a edição que chegou no meio.
      if (props.getProperty(PROP_PENDING) === pending) props.deleteProperty(PROP_PENDING);
      Logger.log('Sync OK: ' + body);
    } else {
      // Mantém a flag para tentar de novo no próximo minuto.
      Logger.log('Sync FALHOU (' + code + '): ' + body);
    }
  } catch (err) {
    Logger.log('Sync ERRO: ' + err);
  } finally {
    lock.releaseLock();
  }
}

function buildHeaders_() {
  var h = {
    'Authorization': 'Bearer ' + CONFIG.ANON_KEY,
    'apikey': CONFIG.ANON_KEY,
  };
  if (CONFIG.SYNC_SECRET) h['x-sync-secret'] = CONFIG.SYNC_SECRET;
  return h;
}

/**
 * Rode UMA vez (menu de função → Run). Instala os dois gatilhos e remove
 * duplicados se você rodar de novo. Vai pedir autorização na primeira vez.
 */
function installTriggers() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  // limpa gatilhos antigos deste script para não duplicar
  ScriptApp.getProjectTriggers().forEach(function (t) {
    var fn = t.getHandlerFunction();
    if (fn === 'onSheetEdit' || fn === 'flushPendingSync') ScriptApp.deleteTrigger(t);
  });

  ScriptApp.newTrigger('onSheetEdit').forSpreadsheet(ss).onEdit().create();
  ScriptApp.newTrigger('flushPendingSync').timeBased().everyMinutes(1).create();

  Logger.log('Gatilhos instalados: onSheetEdit (edição) + flushPendingSync (1 min).');
}

/** Utilitário: força um sync agora, ignorando a flag (para testar). */
function syncNow() {
  PropertiesService.getScriptProperties().setProperty(PROP_PENDING, String(Date.now()));
  flushPendingSync();
}
