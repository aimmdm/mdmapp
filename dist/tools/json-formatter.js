/*! MDMG tool: json-formatter v1.0.0 */
MDMG.register('json-formatter', function (root, M) {
  var ui = M.ui, el = M.util.el;
  var input = el('textarea'); input.placeholder = '{"contoh":"tempel JSON di sini"}'; input.setAttribute('aria-label', 'Masukan JSON'); input.spellcheck = false;
  var output = el('textarea'); output.readOnly = true; output.setAttribute('aria-label', 'Hasil JSON'); output.spellcheck = false;
  var status = ui.status(root);
  function parse() {
    try { return JSON.parse(input.value); }
    catch (e) { status.set('JSON tidak valid: ' + e.message, 'error'); output.value = ''; return undefined; }
  }
  function run(fn, okMsg) {
    if (!input.value.trim()) { status.set('Masukkan JSON terlebih dahulu.', 'error'); return; }
    var v = parse(); if (v === undefined) return;
    output.value = fn(v); status.set(okMsg, 'ok');
  }
  var row = el('div', 'mdmg-row');
  row.appendChild(ui.button('Rapikan', true, function () { run(function (v) { return JSON.stringify(v, null, 2); }, 'JSON valid dan berhasil dirapikan.'); }));
  row.appendChild(ui.button('Ringkas', false, function () { run(function (v) { return JSON.stringify(v); }, 'JSON valid dan berhasil diringkas.'); }));
  row.appendChild(ui.button('Salin Hasil', false, function () {
    if (!output.value) { status.set('Belum ada hasil untuk disalin.', 'error'); return; }
    if (navigator.clipboard) navigator.clipboard.writeText(output.value).then(function () { status.set('Hasil disalin.', 'ok'); });
  }));
  row.appendChild(ui.button('Hapus', false, function () { input.value = ''; output.value = ''; status.set(''); input.focus(); }));
  var grid = el('div', 'mdmg-grid'); grid.style.gridTemplateColumns = 'repeat(auto-fit,minmax(260px,1fr))';
  grid.appendChild(ui.field('Masukan', input)); grid.appendChild(ui.field('Hasil', output));
  root.insertBefore(grid, status); root.insertBefore(row, status);
});
