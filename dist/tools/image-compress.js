/*! MDMG tool: image-compress v1.0.0 | semua proses berjalan di browser, berkas tidak diunggah */
MDMG.register('image-compress', function (root, M) {
  var ui = M.ui, el = M.util.el, U = M.util;
  var quality = el('input'); quality.type = 'range'; quality.min = '40'; quality.max = '95'; quality.value = '75'; quality.setAttribute('aria-label', 'Kualitas kompresi');
  var qOut = el('small', '', 'Kualitas: 75%');
  quality.addEventListener('input', function () { qOut.textContent = 'Kualitas: ' + quality.value + '%'; });
  var maxW = ui.select([['0', 'Ukuran asli'], ['3840', '3840 px'], ['1920', '1920 px (Full HD)'], ['1280', '1280 px'], ['1024', '1024 px']], '0');
  var fmt = ui.select([['image/jpeg', 'JPEG'], ['image/webp', 'WebP']], 'image/jpeg');
  var status = ui.status(root), list = el('ul', 'mdmg-list');
  function ext(t) { return t === 'image/webp' ? 'webp' : 'jpg'; }
  function one(file) {
    var li = el('li', 'mdmg-item'), info = el('div'), name = el('b', '', file.name), meta = el('small', '', 'Memproses...');
    info.appendChild(name); info.appendChild(meta); li.appendChild(info); list.insertBefore(li, list.firstChild);
    return U.loadBitmap(file).then(function (bmp) {
      var s = U.size(bmp), limit = parseInt(maxW.value, 10), k = limit && s.w > limit ? limit / s.w : 1;
      var c = el('canvas'); c.width = Math.round(s.w * k); c.height = Math.round(s.h * k);
      var ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(bmp, 0, 0, c.width, c.height);
      if (bmp.close) bmp.close();
      return U.toBlob(c, fmt.value, parseInt(quality.value, 10) / 100).then(function (blob) {
        var out = blob.size < file.size ? blob : null;
        var saved = Math.max(0, Math.round((1 - blob.size / file.size) * 100));
        meta.textContent = U.fmtBytes(file.size) + ' \u2192 ' + U.fmtBytes(blob.size) + ' (hemat ' + saved + '%) \u00b7 ' + c.width + '\u00d7' + c.height;
        var fname = U.baseName(file.name) + '-kompres.' + ext(fmt.value);
        li.appendChild(ui.button('Unduh', true, function () { U.download(blob, fname); }));
        if (!out) meta.textContent += ' \u00b7 hasil tidak lebih kecil dari aslinya, coba turunkan kualitas';
      });
    }).catch(function (e) { meta.textContent = e.message || 'Gagal memproses'; meta.style.color = '#b91c1c'; });
  }
  var drop = ui.dropzone({ accept: 'image/*', multiple: true, title: 'Pilih gambar', hint: 'JPG, PNG, WebP, atau seret ke sini. Diproses di perangkat Anda.', onFiles: function (files) {
    status.set('Memproses ' + files.length + ' gambar...');
    files.reduce(function (p, f) { return p.then(function () { return one(f); }); }, Promise.resolve()).then(function () { status.set('Selesai.', 'ok'); });
  } });
  var grid = el('div', 'mdmg-grid');
  var qWrap = el('div', 'mdmg-field'); qWrap.appendChild(el('span', '', 'Kualitas')); qWrap.appendChild(quality); qWrap.appendChild(qOut);
  grid.appendChild(qWrap); grid.appendChild(ui.field('Lebar maksimum', maxW)); grid.appendChild(ui.field('Format hasil', fmt));
  root.insertBefore(drop, status); root.insertBefore(grid, status); root.appendChild(list);
});
