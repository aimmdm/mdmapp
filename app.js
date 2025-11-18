// ====== KONFIGURASI ======
const BLOG_URL = 'https://marilmudotmarepengtools.blogspot.com';
const SITE_NAME = 'Marilmu Dot Marepeng';
const PAGE_SIZE = 10;

// ====== ELEMEN DOM ======
const appEl = document.getElementById('app');
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const installBtn = document.getElementById('install-btn');

// ====== UTIL ======
function formatDate(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return '';
  return d.toLocaleDateString('id-ID', { year:'numeric', month:'long', day:'numeric' });
}

// JSONP loader: tambahkan alt=json-in-script&callback=CB
function jsonp(url) {
  return new Promise((resolve, reject) => {
    const cb = 'cb_' + Math.random().toString(36).slice(2);
    const sep = url.includes('?') ? '&' : '?';
    const s = document.createElement('script');

    const cleanup = () => {
      try { delete window[cb]; } catch {}
      s.remove();
    };

    window[cb] = (data) => { cleanup(); resolve(data); };
    s.onerror = () => { cleanup(); reject(new Error('JSONP error')); };
    s.src = `${url}${sep}alt=json-in-script&callback=${cb}`;
    document.body.appendChild(s);
  });
}

function stripScriptsAndDangerousAttrs(html) {
  if (!html) return '';
  // Hapus <script>...</script>
  let clean = html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
  // Hapus inline event handler on*
  clean = clean.replace(/\son[a-z]+\s*=\s*(['"]).*?\1/gi, '');
  return clean;
}

function getPostIdFromEntry(entry) {
  const t = entry?.id?.$t || '';
  const m = t.match(/post-(\d+)/);
  return m ? m[1] : null;
}

function extractThumbnail(entry, contentHTML) {
  const mThumb = entry['media$thumbnail'] && entry['media$thumbnail'].url;
  if (mThumb) return mThumb.replace(/\/s72\-c\//, '/s400/'); // besar
  const m = (contentHTML || '').match(/<img[^>]+src="([^"]+)"/i);
  return m ? m[1] : '';
}

function parseEntries(feedObj) {
  const entries = feedObj?.feed?.entry || [];
  return entries.map(e => {
    const title = e.title?.$t || '(tanpa judul)';
    const content = e.content?.$t || e.summary?.$t || '';
    const link = (e.link || []).find(l => l.rel === 'alternate')?.href || '#';
    const labels = (e.category || []).map(c => c.term);
    const id = getPostIdFromEntry(e);
    const published = e.published?.$t || '';
    const thumb = extractThumbnail(e, content);
    return { id, title, content, link, labels, published, thumb };
  });
}

async function fetchList({ page=1, label=null, q=null }) {
  let endpoint = `${BLOG_URL}/feeds/posts/default`;
  if (label) endpoint = `${BLOG_URL}/feeds/posts/default/-/${encodeURIComponent(label)}`;
  const start = (page - 1) * PAGE_SIZE + 1;
  const params = [`max-results=${PAGE_SIZE}`, `start-index=${start}`];
  if (q) params.push(`q=${encodeURIComponent(q)}`);
  const url = `${endpoint}?${params.join('&')}`;
  const data = await jsonp(url);
  const items = parseEntries(data);
  const total = Number(data?.feed?.['openSearch$totalResults']?.$t || items.length);
  return { items, total };
}

async function fetchPostById(postId) {
  const url = `${BLOG_URL}/feeds/posts/default/${postId}`;
  const data = await jsonp(url);
  const e = data?.entry || data?.feed?.entry?.[0];
  if (!e) throw new Error('Post tidak ditemukan');
  const [post] = parseEntries({ feed: { entry: [e] } });
  return post;
}

function setTitle(suffix) {
  document.title = suffix ? `${suffix} — ${SITE_NAME}` : SITE_NAME;
}

function showLoading() {
  appEl.innerHTML = '<p class="loading">Memuat…</p>';
}

function showError(msg) {
  appEl.innerHTML = `<div class="error">Terjadi kesalahan: ${msg}</div>`;
}

// ====== RENDER ======
function renderList({ items, page, total, routeBase }) {
  appEl.innerHTML = '';
  if (!items.length) {
    appEl.innerHTML = '<p class="empty">Tidak ada posting.</p>';
    return;
  }

  items.forEach(p => {
    const card = document.createElement('article');
    card.className = 'card';
    const img = p.thumb ? `<img loading="lazy" src="${p.thumb}" alt="" style="width:100%;border-radius:8px;margin-bottom:8px;">` : '';
    const labelsHTML = p.labels.map(l => `<a class="badge" href="#/label/${encodeURIComponent(l)}">${l}</a>`).join('');
    card.innerHTML = `
      ${img}
      <h3><a href="#/post/${p.id}">${p.title}</a></h3>
      <div class="meta">${formatDate(p.published)}</div>
      <div class="excerpt">${stripScriptsAndDangerousAttrs(p.content).replace(/<[^>]+>/g,' ').slice(0,160)}...</div>
      <div class="badges">${labelsHTML}</div>
    `;
    appEl.appendChild(card);
  });

  // Pager
  const pager = document.createElement('div');
  pager.className = 'pager';
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const prev = document.createElement('button');
  const next = document.createElement('button');
  prev.textContent = '‹ Sebelumnya';
  next.textContent = 'Berikutnya ›';
  prev.disabled = page <= 1;
  next.disabled = page >= pages;
  prev.onclick = () => navigate(`${routeBase}?page=${page-1}`);
  next.onclick = () => navigate(`${routeBase}?page=${page+1}`);
  pager.append(prev, next);
  appEl.appendChild(pager);
}

function renderPost(post) {
  appEl.innerHTML = '';
  const el = document.createElement('article');
  el.className = 'card';
  const labelsHTML = post.labels.map(l => `<a class="badge" href="#/label/${encodeURIComponent(l)}">${l}</a>`).join('');
  const safe = stripScriptsAndDangerousAttrs(post.content);
  el.innerHTML = `
    <h2>${post.title}</h2>
    <div class="meta">${formatDate(post.published)}</div>
    <div class="post-content">${safe}</div>
    <div class="badges">${labelsHTML}</div>
    <div class="pager" style="justify-content:flex-start;gap:8px">
      <button onclick="history.back()">‹ Kembali</button>
      <a class="badge" href="${post.link}" target="_blank" rel="noopener">Buka di Blogger ↗</a>
    </div>
  `;
  appEl.appendChild(el);
}

// ====== ROUTER ======
function parseHash() {
  const h = location.hash.replace(/^#/, '');
  const [path, queryStr] = h.split('?');
  const qs = Object.fromEntries(new URLSearchParams(queryStr || ''));
  const seg = (path || '').split('/').filter(Boolean);
  return { seg, qs };
}

function navigate(hash) { location.hash = hash; }

async function router() {
  try {
    const { seg, qs } = parseHash();
    const page = Number(qs.page || 1);

    // Home: #/ atau kosong
    if (seg.length === 0 || seg[0] === '') {
      setTitle('Beranda');
      showLoading();
      const { items, total } = await fetchList({ page });
      renderList({ items, page, total, routeBase: '#/' });
      return;
    }
    // Label: #/label/NamaLabel
    if (seg[0] === 'label' && seg[1]) {
      const label = decodeURIComponent(seg[1]);
      setTitle(`Label: ${label}`);
      showLoading();
      const { items, total } = await fetchList({ page, label });
      renderList({ items, page, total, routeBase: `#/label/${encodeURIComponent(label)}` });
      return;
    }
    // Search: #/search/keyword
    if (seg[0] === 'search' && seg[1]) {
      const q = decodeURIComponent(seg[1]);
      setTitle(`Cari: ${q}`);
      showLoading();
      const { items, total } = await fetchList({ page, q });
      renderList({ items, page, total, routeBase: `#/search/${encodeURIComponent(q)}` });
      return;
    }
    // Post: #/post/POST_ID
    if (seg[0] === 'post' && seg[1]) {
      const id = seg[1];
      setTitle('Memuat…');
      showLoading();
      const post = await fetchPostById(id);
      setTitle(post.title);
      renderPost(post);
      return;
    }

    // Fallback → Home
    navigate('#/');
  } catch (err) {
    console.error(err);
    showError(err.message || 'Gagal memuat data.');
  }
}

// Pencarian
searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const q = searchInput.value.trim();
  if (!q) return;
  navigate(`#/search/${encodeURIComponent(q)}`);
});

// Router events
window.addEventListener('hashchange', router);
window.addEventListener('load', router);

// ====== TOMBOL INSTALL PWA ======
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.style.display = 'inline-block';
  installBtn.onclick = async () => {
    installBtn.disabled = true;
    try {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    } finally {
      deferredPrompt = null;
      installBtn.style.display = 'none';
    }
  };
});
window.addEventListener('appinstalled', () => {
  installBtn.style.display = 'none';
});
if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
  installBtn.style.display = 'none';
}
