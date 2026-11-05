/*! MDMG Runtime v1.0.0 | Pustaka kecil untuk tools berbasis browser | tanpa dependensi */
(function (w, d) {
  'use strict';
  if (w.MDMG && w.MDMG.version) return;

  var registry = Object.create(null);

  /* ---------- gaya (memakai variabel warna template, dengan cadangan) ---------- */
  var CSS = [
    '.mdmg-tool{--m-card:var(--card,#fff);--m-bg:var(--bg,#f6f8fc);--m-b:var(--b,#e2e8f0);--m-t1:var(--t1,#0f172a);--m-t2:var(--t2,#475569);--m-p:var(--p,#2563eb);--m-ps:var(--p-soft,#eff6ff);display:grid;gap:16px;color:var(--m-t1);font:inherit}',
    '.mdmg-tool *{box-sizing:border-box}',
    '.mdmg-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}',
    '.mdmg-drop{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;min-height:150px;padding:24px;border:2px dashed var(--m-b);border-radius:16px;background:var(--m-bg);text-align:center;cursor:pointer;transition:border-color .2s,background .2s}',
    '.mdmg-drop:hover,.mdmg-drop.is-over,.mdmg-drop:focus-within{border-color:var(--m-p);background:var(--m-ps)}',
    '.mdmg-drop strong{font-size:16px}.mdmg-drop span{font-size:13.5px;color:var(--m-t2)}',
    '.mdmg-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}',
    '.mdmg-field{display:grid;gap:6px;font-size:14px;font-weight:700}',
    '.mdmg-field small{font-weight:600;color:var(--m-t2)}',
    '.mdmg-tool select,.mdmg-tool input[type=number],.mdmg-tool textarea{width:100%;padding:11px 12px;border:1px solid var(--m-b);border-radius:12px;background:var(--m-card);color:var(--m-t1);font:inherit;font-size:16px}',
    '.mdmg-tool textarea{min-height:200px;resize:vertical;line-height:1.55}',
    '.mdmg-tool input[type=range]{width:100%;accent-color:var(--m-p)}',
    '.mdmg-row{display:flex;flex-wrap:wrap;gap:10px;align-items:center}',
    '.mdmg-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:44px;padding:10px 20px;border-radius:50px;border:1px solid var(--m-b);background:var(--m-card);color:var(--m-t1);font:inherit;font-size:14.5px;font-weight:800;cursor:pointer}',
    '.mdmg-btn:hover{border-color:var(--m-p);color:var(--m-p)}',
    '.mdmg-btn--primary{background:var(--m-p);border-color:var(--m-p);color:#fff}.mdmg-btn--primary:hover{color:#fff;filter:brightness(1.08)}',
    '.mdmg-btn[disabled]{opacity:.55;cursor:not-allowed}',
    '.mdmg-status{min-height:22px;font-size:14px;color:var(--m-t2)}.mdmg-status.is-error{color:#b91c1c}.mdmg-status.is-ok{color:#047857}',
    '.mdmg-list{display:grid;gap:10px;margin:0;padding:0;list-style:none}',
    '.mdmg-item{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;padding:12px 14px;border:1px solid var(--m-b);border-radius:14px;background:var(--m-card)}',
    '.mdmg-item b{display:block;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.mdmg-item small{color:var(--m-t2);font-size:13px}',
    '.mdmg-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px}',
    '.mdmg-stat{padding:14px;border:1px solid var(--m-b);border-radius:14px;background:var(--m-card);text-align:center}',
    '.mdmg-stat b{display:block;font-size:24px;line-height:1.2}.mdmg-stat span{font-size:12.5px;color:var(--m-t2);font-weight:700}',
    '.mdmg-bar{height:8px;border-radius:8px;background:var(--m-b);overflow:hidden}.mdmg-bar i{display:block;height:100%;width:0;background:var(--m-p);transition:width .2s}'
  ].join('\n');

  function injectCss() {
    if (d.getElementById('mdmg-css')) return;
    var s = d.createElement('style'); s.id = 'mdmg-css'; s.textContent = CSS; d.head.appendChild(s);
  }

  /* ---------- util ---------- */
  function el(tag, cls, text) {
    var n = d.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  var util = {
    el: el,
    fmtBytes: function (n) {
      if (!isFinite(n)) return '-';
      var u = ['B', 'KB', 'MB', 'GB'], i = 0;
      while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
      return (i ? n.toFixed(n < 10 ? 2 : 1) : n) + ' ' + u[i];
    },
    baseName: function (name) { return String(name || 'berkas').replace(/\.[^.]+$/, ''); },
    download: function (blob, name) {
      var a = d.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = name; a.rel = 'noopener'; a.hidden = true; a.setAttribute('aria-hidden', 'true'); a.tabIndex = -1; a.textContent = name;
      d.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
    },
    toBlob: function (canvas, type, q) {
      return new Promise(function (res, rej) {
        canvas.toBlob(function (b) { b ? res(b) : rej(new Error('Gagal membuat berkas')); }, type, q);
      });
    },
    loadBitmap: function (file) {
      if (w.createImageBitmap) {
        return w.createImageBitmap(file, { imageOrientation: 'from-image' }).catch(function () { return util.loadViaImg(file); });
      }
      return util.loadViaImg(file);
    },
    loadViaImg: function (file) {
      return new Promise(function (res, rej) {
        var url = URL.createObjectURL(file), img = new Image();
        img.onload = function () { URL.revokeObjectURL(url); res(img); };
        img.onerror = function () { URL.revokeObjectURL(url); rej(new Error('Berkas bukan gambar yang valid')); };
        img.src = url;
      });
    },
    size: function (bmp) { return { w: bmp.width || bmp.naturalWidth, h: bmp.height || bmp.naturalHeight }; }
  };

  /* ---------- komponen UI ---------- */
  var seq = 0;
  var ui = {
    status: function (root) {
      var s = el('p', 'mdmg-status'); s.setAttribute('role', 'status'); s.setAttribute('aria-live', 'polite');
      s.set = function (msg, kind) { s.textContent = msg || ''; s.className = 'mdmg-status' + (kind ? ' is-' + kind : ''); };
      root.appendChild(s); return s;
    },
    dropzone: function (opts) {
      var id = 'mdmg-f' + (++seq), label = el('label', 'mdmg-drop'), input = el('input', 'mdmg-sr');
      input.type = 'file'; input.id = id;
      if (opts.accept) input.accept = opts.accept;
      if (opts.multiple) input.multiple = true;
      label.appendChild(el('strong', '', opts.title || 'Pilih berkas'));
      label.appendChild(el('span', '', opts.hint || 'atau seret dan lepas di sini'));
      label.appendChild(input);
      function take(list) {
        var files = Array.prototype.slice.call(list || []);
        if (opts.accept) {
          var rules = opts.accept.split(',').map(function (x) { return x.trim().toLowerCase(); });
          files = files.filter(function (f) {
            var t = (f.type || '').toLowerCase(), n = f.name.toLowerCase();
            return rules.some(function (r) { return r.slice(-2) === '/*' ? t.indexOf(r.slice(0, -1)) === 0 : (r[0] === '.' ? n.slice(-r.length) === r : t === r); });
          });
        }
        if (files.length) opts.onFiles(files);
      }
      input.addEventListener('change', function () { take(input.files); input.value = ''; });
      ['dragenter', 'dragover'].forEach(function (ev) { label.addEventListener(ev, function (e) { e.preventDefault(); label.classList.add('is-over'); }); });
      ['dragleave', 'drop'].forEach(function (ev) { label.addEventListener(ev, function (e) { e.preventDefault(); label.classList.remove('is-over'); }); });
      label.addEventListener('drop', function (e) { take(e.dataTransfer && e.dataTransfer.files); });
      return label;
    },
    field: function (labelText, control, hint) {
      var wrap = el('label', 'mdmg-field'); wrap.appendChild(el('span', '', labelText)); wrap.appendChild(control);
      if (hint) wrap.appendChild(el('small', '', hint)); return wrap;
    },
    select: function (options, value) {
      var s = el('select');
      options.forEach(function (o) { var op = el('option', '', o[1]); op.value = o[0]; if (o[0] === value) op.selected = true; s.appendChild(op); });
      return s;
    },
    button: function (text, primary, onClick) {
      var b = el('button', 'mdmg-btn' + (primary ? ' mdmg-btn--primary' : ''), text); b.type = 'button';
      if (onClick) b.addEventListener('click', onClick); return b;
    },
    stat: function (label) {
      var box = el('div', 'mdmg-stat'), v = el('b', '', '0'); box.appendChild(v); box.appendChild(el('span', '', label));
      box.set = function (x) { v.textContent = x; }; return box;
    }
  };

  /* ---------- registri ---------- */
  function register(name, init) { registry[name] = init; }
  function mount(node, name) {
    if (!node || node.getAttribute('data-mdmg-mounted') === '1') return false;
    var init = registry[name];
    if (typeof init !== 'function') { node.setAttribute('data-mdmg-error', 'Tool tidak ditemukan: ' + name); return false; }
    injectCss();
    node.setAttribute('data-mdmg-mounted', '1');
    node.classList.add('mdmg-tool');
    node.textContent = '';
    try { init(node, w.MDMG); } catch (e) {
      node.textContent = 'Tool gagal dimuat. Muat ulang halaman atau coba lagi nanti.';
      if (w.console) console.error('[MDMG]', name, e);
    }
    return true;
  }

  w.MDMG = { version: '1.0.0', register: register, mount: mount, util: util, ui: ui };
})(window, document);
