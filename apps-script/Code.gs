/**
 * MDMG Backend v1.0.0 (Google Apps Script) - OPSIONAL
 * Fungsi: (1) menerima "Laporkan Masalah", (2) menghitung tool paling sering dibuka.
 * Tidak menyimpan data pribadi: hanya URL tool, judul, dan pesan yang diketik pengunjung.
 *
 * CARA PAKAI: lihat apps-script/README.md
 */
var APP = {
  VERSION: '1.0.0',
  // GANTI dengan domain blog Anda (tanpa garis miring di akhir)
  ALLOWED_ORIGINS: ['https://www.mainilmu.pro', 'https://mainilmu.pro'],
  // Opsional: isi email Anda untuk menerima notifikasi tiap ada laporan (kosongkan bila tidak mau)
  NOTIFY_EMAIL: '',
  MAX_MSG: 600,
  MAX_TITLE: 120,
  REPORT_LIMIT_PER_HOUR: 30,   // batas global laporan per jam (anti spam)
  HIT_LIMIT_PER_MINUTE: 120,   // batas global hit per menit
  TOP_CACHE_SECONDS: 300
};

/* ===== Jalankan SEKALI dari editor: pilih fungsi setup lalu Run ===== */
function setup() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('SHEET_ID');
  var ss = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.create('MDMG Backend Data');
  props.setProperty('SHEET_ID', ss.getId());
  ensureSheet_(ss, 'reports', ['Waktu', 'Tool', 'URL', 'Jenis', 'Pesan', 'Email']);
  ensureSheet_(ss, 'hits', ['URL', 'Judul', 'Hits', 'Terakhir']);
  var def = ss.getSheetByName('Sheet1');
  if (def && ss.getSheets().length > 1) ss.deleteSheet(def);
  Logger.log('Spreadsheet siap: ' + ss.getUrl());
  return ss.getUrl();
}

/* ===== Endpoint ===== */
function doPost(e) {
  try {
    var raw = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
    if (raw.length > 4000) return json_({ ok: false, error: 'too_large' });
    var data = JSON.parse(raw);
    if (!originOk_(data.o)) return json_({ ok: false, error: 'origin' });
    if (data.a === 'report') return json_(handleReport_(data));
    if (data.a === 'hit') return json_(handleHit_(data));
    return json_({ ok: false, error: 'action' });
  } catch (err) {
    return json_({ ok: false, error: 'bad_request' });
  }
}

function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.a === 'top') {
    var n = Math.min(20, Math.max(1, parseInt(p.n, 10) || 8));
    return json_({ ok: true, items: top_(n) });
  }
  return json_({ ok: true, version: APP.VERSION });
}

/* ===== Penanganan ===== */
function handleReport_(d) {
  if (!limit_('report', 3600, APP.REPORT_LIMIT_PER_HOUR)) return { ok: false, error: 'rate' };
  var msg = clean_(d.m, APP.MAX_MSG);
  if (msg.length < 5) return { ok: false, error: 'short' };
  var url = urlOk_(d.u) ? d.u : '';
  var row = [new Date(), cell_(clean_(d.t, APP.MAX_TITLE)), cell_(url), cell_(clean_(d.k, 40)), cell_(msg), cell_(clean_(d.e, 120))];
  sheet_('reports').appendRow(row);
  var to = APP.NOTIFY_EMAIL || PropertiesService.getScriptProperties().getProperty('NOTIFY_EMAIL');
  if (to) {
    try {
      MailApp.sendEmail(to, '[MDMG] Laporan: ' + (row[1] || 'tool'), 'Tool: ' + row[1] + '\nURL: ' + row[2] + '\nJenis: ' + row[3] + '\n\n' + msg + '\n\nEmail: ' + row[5]);
    } catch (err) { /* kuota email habis: abaikan, data tetap tersimpan */ }
  }
  return { ok: true };
}

function handleHit_(d) {
  if (!urlOk_(d.u)) return { ok: false, error: 'url' };
  if (!limit_('hit', 60, APP.HIT_LIMIT_PER_MINUTE)) return { ok: false, error: 'rate' };
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(8000)) return { ok: false, error: 'busy' };
  try {
    var sh = sheet_('hits'), last = sh.getLastRow(), title = clean_(d.t, APP.MAX_TITLE), now = new Date(), found = 0;
    if (last > 1) {
      var urls = sh.getRange(2, 1, last - 1, 1).getValues();
      for (var i = 0; i < urls.length; i++) { if (urls[i][0] === d.u) { found = i + 2; break; } }
    }
    if (found) {
      var cur = Number(sh.getRange(found, 3).getValue()) || 0;
      sh.getRange(found, 2, 1, 3).setValues([[cell_(title) || sh.getRange(found, 2).getValue(), cur + 1, now]]);
    } else {
      sh.appendRow([d.u, cell_(title), 1, now]);
    }
    CacheService.getScriptCache().remove('top');
  } finally {
    lock.releaseLock();
  }
  return { ok: true };
}

function top_(n) {
  var cache = CacheService.getScriptCache(), hit = cache.get('top');
  var all;
  if (hit) {
    all = JSON.parse(hit);
  } else {
    var sh = sheet_('hits'), last = sh.getLastRow();
    all = [];
    if (last > 1) {
      var vals = sh.getRange(2, 1, last - 1, 3).getValues();
      vals.forEach(function (r) { if (r[0] && r[1]) all.push({ u: String(r[0]), t: String(r[1]), h: Number(r[2]) || 0 }); });
      all.sort(function (a, b) { return b.h - a.h; });
      all = all.slice(0, 20);
    }
    cache.put('top', JSON.stringify(all), APP.TOP_CACHE_SECONDS);
  }
  return all.slice(0, n);
}

/* ===== Util ===== */
function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
function originOk_(o) { return APP.ALLOWED_ORIGINS.indexOf(String(o || '')) > -1; }
function urlOk_(u) {
  u = String(u || '');
  return APP.ALLOWED_ORIGINS.some(function (o) { return u.indexOf(o + '/') === 0; }) && u.length <= 300;
}
function clean_(s, max) { return String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max); }
// Cegah "formula injection" di Google Sheets
function cell_(s) { s = String(s || ''); return /^[=+\-@]/.test(s) ? "'" + s : s; }
function limit_(name, seconds, max) {
  var cache = CacheService.getScriptCache(), key = 'rl_' + name + '_' + Math.floor(Date.now() / (seconds * 1000));
  var n = Number(cache.get(key)) || 0;
  if (n >= max) return false;
  cache.put(key, String(n + 1), seconds + 5);
  return true;
}
function sheet_(name) {
  var id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  if (!id) throw new Error('Jalankan setup() terlebih dahulu');
  return SpreadsheetApp.openById(id).getSheetByName(name);
}
function ensureSheet_(ss, name, headers) {
  var sh = ss.getSheetByName(name) || ss.insertSheet(name);
  if (sh.getLastRow() === 0) sh.appendRow(headers);
  return sh;
}
