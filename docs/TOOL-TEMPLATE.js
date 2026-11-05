/*! MDMG tool: nama-tool-anda v1.0.0
   Salin file ini ke dist/tools/nama-tool-anda.js, ubah nama, lalu buat tag rilis baru.
   Di postingan:  <div data-mdmg-tool="nama-tool-anda"></div>
*/
MDMG.register('nama-tool-anda', function (root, M) {
  var ui = M.ui, el = M.util.el;

  // 1) Buat kontrol
  var input = el('textarea');
  input.setAttribute('aria-label', 'Masukan');
  var status = ui.status(root);              // area pesan (aksesibel)
  var out = el('textarea'); out.readOnly = true; out.setAttribute('aria-label', 'Hasil');

  // 2) Logika
  var run = ui.button('Proses', true, function () {
    if (!input.value.trim()) { status.set('Isi terlebih dahulu.', 'error'); return; }
    out.value = input.value.toUpperCase();   // ganti dengan logika Anda
    status.set('Selesai.', 'ok');
  });

  // 3) Susun tampilan
  root.insertBefore(ui.field('Masukan', input), status);
  root.insertBefore(run, status);
  root.insertBefore(ui.field('Hasil', out), status);

  // Pembantu yang tersedia: M.util.fmtBytes, M.util.download(blob, nama),
  // M.util.loadBitmap(file), M.ui.dropzone({...}), M.ui.select([...]), M.ui.stat('Label')
});
