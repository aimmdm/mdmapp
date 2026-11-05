// Membuat hash SRI (Subresource Integrity) untuk file di dist/.
// Jalankan:  node scripts/sri.mjs
// Salin hasilnya ke bagian "sri" pada window.MDMG_CFG di template Blogger.
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const hash = (file) => 'sha384-' + createHash('sha384').update(readFileSync(file)).digest('base64');

const out = { runtime: hash(join(root, 'runtime.js')) };
for (const f of readdirSync(join(root, 'tools')).filter((n) => n.endsWith('.js')).sort()) {
  out[f.replace(/\.js$/, '')] = hash(join(root, 'tools', f));
}
console.log('sri:' + JSON.stringify(out, null, 2) + '\n');
console.log('PENTING: hash berubah setiap isi file berubah. Setelah mengedit file, buat tag baru (mis. v1.0.1), jalankan skrip ini lagi, lalu perbarui cdn dan sri di template.');
