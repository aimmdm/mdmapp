/*! MDMG tool: word-counter v1.0.0 */
MDMG.register('word-counter', function (root, M) {
  var ui = M.ui, el = M.util.el;
  var ta = el('textarea'); ta.placeholder = 'Ketik atau tempel teks Anda di sini...'; ta.setAttribute('aria-label', 'Teks yang dihitung');
  var stats = el('div', 'mdmg-stats'), s = {
    words: ui.stat('Kata'), chars: ui.stat('Karakter'), nospace: ui.stat('Tanpa spasi'),
    sentences: ui.stat('Kalimat'), paragraphs: ui.stat('Paragraf'), read: ui.stat('Menit baca')
  };
  Object.keys(s).forEach(function (k) { stats.appendChild(s[k]); });
  var row = el('div', 'mdmg-row');
  row.appendChild(ui.button('Salin Teks', false, function () {
    if (navigator.clipboard) navigator.clipboard.writeText(ta.value);
  }));
  row.appendChild(ui.button('Hapus', false, function () { ta.value = ''; update(); ta.focus(); }));
  function update() {
    var t = ta.value, trimmed = t.trim();
    var words = trimmed ? trimmed.split(/\s+/).length : 0;
    s.words.set(words);
    s.chars.set(t.length);
    s.nospace.set(t.replace(/\s/g, '').length);
    s.sentences.set(trimmed ? (trimmed.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || []).length : 0);
    s.paragraphs.set(trimmed ? trimmed.split(/\n\s*\n/).filter(function (p) { return p.trim(); }).length : 0);
    s.read.set(words ? Math.max(1, Math.round(words / 200)) : 0);
  }
  ta.addEventListener('input', update);
  root.appendChild(ta); root.appendChild(stats); root.appendChild(row); update();
});
