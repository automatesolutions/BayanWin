/**
 * BayanWin: tell Jev the moment you finish typing a result, so it shows on the site in seconds.
 *
 * Install once in EACH of the 5 results Sheets (Extensions > Apps Script):
 * 1. Paste this file and set JEV_URL to your backend URL.
 * 2. Project Settings > Script properties: add JEV_SHEET_SECRET (same value as on Cloud Run).
 * 3. Run installTrigger() once and allow the permissions it asks for.
 *
 * The script sends only the Sheet ID and the time. Jev reads and checks the row itself,
 * so a wrong secret or a broken row can never publish anything.
 */
const JEV_URL = 'https://YOUR-BACKEND-URL/api/jev/sheet-edited';
const RESULTS_TAB = 'Sheet1';
// Six numbers like 14-38-44-25-52-47. Until the row has these and a date, it's still being typed.
const COMBINATION = /^\s*\d{1,2}(\s*-\s*\d{1,2}){5}\s*$/;

function onResultEdit(e) {
  const sheet = e.range.getSheet();
  if (sheet.getName() !== RESULTS_TAB) return;
  const row = e.range.getLastRow(); // a paste of several rows ends on the newest one
  if (row < 2) return;
  const [, combination, drawDate] = sheet.getRange(row, 1, 1, 5).getDisplayValues()[0];
  if (!COMBINATION.test(combination) || !drawDate) return;

  const secret = PropertiesService.getScriptProperties().getProperty('JEV_SHEET_SECRET');
  const response = UrlFetchApp.fetch(JEV_URL, {
    method: 'post',
    contentType: 'application/json',
    headers: { 'X-Jev-Sheet-Secret': secret },
    payload: JSON.stringify({ sheet_id: e.source.getId(), edited_at: new Date().toISOString() }),
    muteHttpExceptions: true,
  });
  if (response.getResponseCode() >= 300) {
    console.warn('Jev answered ' + response.getResponseCode() + ': ' + response.getContentText().slice(0, 300));
  }
}

/** Run once per Sheet. An installable trigger is needed: simple onEdit triggers can't call URLs. */
function installTrigger() {
  const ss = SpreadsheetApp.getActive();
  ScriptApp.getProjectTriggers()
    .filter((t) => t.getHandlerFunction() === 'onResultEdit')
    .forEach((t) => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('onResultEdit').forSpreadsheet(ss).onEdit().create();
}
