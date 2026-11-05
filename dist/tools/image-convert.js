/*! MDMG tool: image-convert v1.0.0 | semua proses berjalan di browser, berkas tidak diunggah */
MDMG.register('image-convert', function (root, M) {
  var ui = M.ui, el = M.util.el, U = M.util;
  var fmt = ui.select([['image/png', 'PNG'], ['image/jpeg', 'JPG'], ['image/webp', 'WebP']], 'image/png');
  var status = ui.status(root), list = el('ul', 'mdmg-list');
  var EXT = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };
  function one(file) {
    var li = el('li', 'mdmg-item'), info = el('div'), name = el('b', '', file.name), meta = el('small', '', 'Memproses...');
    info.appendChild(name); info.appendChild(meta); li.appendChild(info); list.insertBefore(li, list.firstChild);
    return U.loadBitmap(file).then(function (bmp) {
      var s = U.size(bmp), c = el('canvas'); c.width = s.w; c.height = s.h;
      var ctx = c.getContext('2d');
      if (fmt.value === 'image/jpeg') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); }
      ctx.drawImage(bmp, 0, 0); if (bmp.close) bmp.close();
      return U.toBlob(c, fmt.value, 0.92).then(function (blob) {
        meta.textContent = U.fmtBytes(file.size) + ' \u2192 ' + U.fmtBytes(blob.size) + ' \u00b7 ' + s.w + '\u00d7' + s.h;
        var fname = U.baseName(file.name) + '.' + EXT[fmt.value];
        li.appendChild(ui.button('Unduh ' + EXT[fmt.value].toUpperCase(), true, function () { U.download(blob, fname); }));
      });
    }).catch(function (e) { meta.textContent = e.message || 'Gagal memproses'; meta.style.color = '#b91c1c'; });
  }
  var drop = ui.dropzone({ accept: 'image/*', multiple: true, title: 'Pilih gambar', hint: 'Ubah format JPG, PNG, atau WebP. Diproses di perangkat Anda.', onFiles: function (files) {
    status.set('Mengonversi ' + files.length + ' gambar...');
    files.reduce(function (p, f) { return p.then(function () { return one(f); }); }, Promise.resolve()).then(function () { status.set('Selesai.', 'ok'); });
  } });
  var grid = el('div', 'mdmg-grid'); grid.appendChild(ui.field('Ubah ke format', fmt));
  root.insertBefore(drop, status); root.insertBefore(grid, status); root.appendChild(list);
});
