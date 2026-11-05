# MDMG Assets: tools berbasis browser untuk blog Blogger

Paket ini berisi semua yang perlu Anda taruh di GitHub:

| Folder | Isi | Wajib? |
|---|---|---|
| `dist/` | `runtime.js` + tools siap pakai (kompres gambar, konversi gambar, perapi JSON, penghitung kata) | Ya, bila ingin memakai tools dari GitHub |
| `assets/` | Favicon, ikon aplikasi (192/512/maskable), `og-default.png` (1200×630), logo SVG | Disarankan |
| `apps-script/` | Backend Google Apps Script: laporan masalah + tool paling sering dibuka | **Opsional** |
| `scripts/sri.mjs` | Pembuat hash keamanan (SRI) | Opsional |
| `docs/` | Contoh kode untuk postingan dan kerangka membuat tool baru | Referensi |

> Template Blogger Anda **tetap berjalan normal tanpa semua ini**. Pengaturan GitHub dan backend dimatikan secara bawaan (`cdn:''` dan `api:''`). Aktifkan hanya yang Anda butuhkan.

---

## BAGIAN 1. Menaruh file di GitHub

1. Buka **github.com** → daftar/masuk. Aktifkan **verifikasi 2 langkah**: foto profil → *Settings* → *Password and authentication* → *Two-factor authentication*.
2. Klik **+** (kanan atas) → **New repository**.
   - Repository name: `mainilmu-assets` (boleh nama lain, catat untuk nanti).
   - Pilih **Public** (jsDelivr hanya melayani repositori publik).
   - Centang **Add a README file** → **Create repository**.
3. Di halaman repositori: **Add file → Upload files**. Seret **isi** folder paket ini (`dist`, `assets`, `apps-script`, `scripts`, `docs`, `package.json`, `.gitignore`, `README.md`) ke jendela. Struktur folder harus tetap sama. Tunggu semua terunggah → **Commit changes**.
4. Buat rilis (versi) agar file tidak berubah tanpa sengaja:
   - Di halaman repositori klik **Releases** (kolom kanan) → **Create a new release**.
   - **Choose a tag** → ketik `v1.0.0` → *Create new tag*.
   - Release title: `v1.0.0` → **Publish release**.
5. Uji di browser (ganti `USERNAME` dan `NAMA-REPO`):

   ```
   https://cdn.jsdelivr.net/gh/USERNAME/NAMA-REPO@v1.0.0/dist/runtime.js
   ```
   Jika kode JavaScript tampil, GitHub Anda sudah siap. (Bila 404: pastikan repositori Public, tag `v1.0.0` ada, dan jalur file benar. Pertama kali bisa butuh beberapa menit.)

**Memperbarui file nanti:** edit file di GitHub → buat rilis baru `v1.0.1` → ganti `@v1.0.0` menjadi `@v1.0.1` di template. Jangan memakai `@main` untuk situs publik, karena cache-nya bisa sampai 12 jam dan isinya bisa berubah tanpa Anda sadari.

## BAGIAN 2. Menghubungkan ke template Blogger

1. Blogger → **Tema** → ▾ di samping *Sesuaikan* → **Edit HTML**.
2. Tekan **Ctrl+F**, cari `window.MDMG_CFG`.
3. Isi alamat GitHub Anda:

   ```js
   window.MDMG_CFG=window.MDMG_CFG||{
     cdn:'https://cdn.jsdelivr.net/gh/USERNAME/NAMA-REPO@v1.0.0',
     api:'',
     sri:{}
   };
   ```
4. Klik ikon **Simpan** (disket) lalu buka situs Anda.

Alamat yang diterima template hanya: `cdn.jsdelivr.net`, `raw.githack.com`, dan `*.github.io`. Alamat lain diabaikan demi keamanan.

## BAGIAN 3. Memakai tool di postingan

1. Buat/ubah postingan → ubah editor ke **Tampilan HTML**.
2. Tempel salah satu (lihat `docs/POST-EXAMPLES.html`):

   ```html
   <div data-mdmg-tool="image-compress"></div>
   ```
   Nama yang tersedia: `image-compress`, `image-convert`, `json-formatter`, `word-counter`.
3. Tulis konten asli di sekitar tool (apa fungsinya, cara pakai, 3–5 FAQ, tips; sekitar 400 kata). Ini yang membuat halaman layak diindeks Google dan layak dimonetisasi.
4. Tool dimuat otomatis saat pengunjung menggulir mendekatinya, sehingga skor PageSpeed tidak terbebani.

Tool lama yang sudah ada di postingan Anda **tidak terpengaruh**. Semua tool di paket ini memproses berkas langsung di perangkat pengunjung dan tidak mengunggahnya ke server mana pun.

Membuat tool baru: salin `docs/TOOL-TEMPLATE.js` ke `dist/tools/nama-baru.js`, edit, unggah, buat rilis baru, lalu pakai `data-mdmg-tool="nama-baru"`.

## BAGIAN 4. (Opsional) Hash keamanan SRI

SRI membuat browser menolak file jika isinya berubah dari yang Anda rilis. Berguna jika akun GitHub Anda suatu saat diretas.

1. Pasang Node.js (nodejs.org, versi LTS) → unduh repositori → buka terminal di foldernya.
2. Jalankan `node scripts/sri.mjs`.
3. Salin hasilnya ke template:

   ```js
   sri:{
     "runtime": "sha384-...",
     "image-compress": "sha384-..."
   }
   ```
4. Setiap kali file berubah, hash harus dibuat ulang. Bila hash salah, tool tidak dimuat (tampil pesan galat). Itu perilaku yang benar.

Tanpa Node.js, Anda juga bisa memakai **srihash.org** pada alamat file jsDelivr.

## BAGIAN 5. (Opsional) Backend Google Apps Script

Hanya diperlukan bila Anda ingin: (a) tombol **Laporkan Masalah** mengirim laporan ke Google Sheet Anda, dan (b) baris **Paling Sering Dibuka** di beranda. Tanpa backend, tombol laporan membuka halaman Kontak dan beranda tetap normal.

1. Buka **script.google.com** → **Proyek baru** → ganti nama proyek menjadi `MDMG Backend`.
2. Hapus isi `Code.gs`, tempel isi file `apps-script/Code.gs`.
3. Di bagian atas kode, ubah `ALLOWED_ORIGINS` menjadi alamat blog Anda (contoh: `https://www.mainilmu.pro`).
4. (Opsional) ⚙ **Project Settings** → centang **Show "appsscript.json"** → buka file itu → tempel isi `apps-script/appsscript.json`.
5. Pilih fungsi **setup** di menu atas → **Run**. Beri izin: akan muncul peringatan *Google hasn't verified this app*. Itu normal karena skrip milik Anda sendiri: **Advanced → Go to MDMG Backend (unsafe) → Allow**. Setelah itu skrip membuat Google Sheet `MDMG Backend Data`.
6. (Opsional) Ingin notifikasi email tiap ada laporan? Isi `NOTIFY_EMAIL: 'emailanda@gmail.com'` di bagian atas kode (di bawah `ALLOWED_ORIGINS`). Kosongkan bila tidak ingin.
7. **Deploy → New deployment** → ikon ⚙ pilih **Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone**
   - **Deploy** → salin **Web app URL** (berakhiran `/exec`).
8. Uji: buka URL itu di browser. Harus tampil `{"ok":true,"version":"1.0.0"}`.
9. Tempel ke template, bagian `api`:

   ```js
   api:'https://script.google.com/macros/s/AKfycb.../exec',
   ```
10. Setelah mengubah kode Apps Script di kemudian hari: **Deploy → Manage deployments → ✏ Edit → Version: New version → Deploy** (URL tidak berubah).

**Yang dikirim ke backend:** URL tool, judul tool, dan pesan yang diketik pengunjung (email hanya bila diisi). Perbarui halaman Kebijakan Privasi Anda untuk menyebutnya.

**Batas yang perlu diketahui:**
- Apps Script punya kuota harian dan jeda eksekusi sekitar 1 detik. Cocok untuk ribuan kunjungan per hari, bukan puluhan ribu. Hit dihitung maksimal sekali per tool per sesi.
- Endpoint bersifat publik. Perlindungan yang ada: daftar domain yang diizinkan, batas ukuran pesan, pembatasan laju global, pembersihan teks, dan perlindungan *formula injection* di Sheet. Pemeriksaan domain bukan rahasia dan bisa dipalsukan, jadi jangan menyimpan data sensitif di sini.
- Email notifikasi dibatasi kuota Google (akun gratis sekitar 100 per hari).

## BAGIAN 6. Aset (favicon, ikon, gambar berbagi)

| File | Dipakai untuk |
|---|---|
| `assets/icon-192.png` | **Blogger → Setelan → Dasar → Favicon** (unggah file ini) |
| `assets/og-default.png` | Gambar 1200×630 untuk berbagi. Pasang sebagai gambar unggulan/gambar pertama postingan yang belum punya gambar |
| `assets/icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png` | Cadangan bila nanti Anda menyajikan manifest aplikasi sendiri |
| `assets/logo.svg` | Logo untuk keperluan lain |

Ikon aplikasi untuk fitur **Pasang Aplikasi** di template sudah tertanam langsung di kode, jadi tidak perlu file ini untuk fungsi tersebut.

## BAGIAN 7. Daftar periksa setelah selesai

- [ ] `https://cdn.jsdelivr.net/gh/USERNAME/NAMA-REPO@v1.0.0/dist/runtime.js` terbuka.
- [ ] Halaman dengan tool: F12 → tab **Network** → muncul `runtime.js` dan file tool dengan status **200**; tool tampil.
- [ ] Konsol (F12) tidak ada galat merah.
- [ ] Bila memakai backend: tekan **Laporkan Masalah** → kirim → baris baru muncul di sheet `reports`. Buka satu tool → baris muncul/bertambah di sheet `hits`. Muat ulang beranda → baris **Paling Sering Dibuka** muncul.
- [ ] Uji ulang di PageSpeed Insights (beranda dan satu halaman tool).

## Keamanan (ringkas)

- Aktifkan 2FA GitHub dan Google. Jangan menaruh kata sandi, token, atau kunci API di repositori.
- Pakai tag rilis (`@v1.0.0`), jangan `@main`. Tambahkan SRI bila ingin perlindungan maksimal.
- Peninjauan kode sebelum rilis: Settings → Branches → *Add branch protection rule* untuk `main`.
- Tidak ada kode yang benar-benar bisa disembunyikan dari browser. Yang perlu dirahasiakan harus berada di server, bukan di blog ini.

## Pemecahan masalah

| Gejala | Penyebab umum | Solusi |
|---|---|---|
| Tool tidak tampil, tidak ada galat | `cdn` kosong atau alamat tidak diizinkan | Cek pengaturan `MDMG_CFG`; harus berawalan `https://cdn.jsdelivr.net/` |
| Pesan "Tool gagal dimuat" | 404 pada file, atau hash SRI salah | Buka URL file di browser; buat ulang hash |
| 404 di jsDelivr | Repositori Private, tag belum ada, jalur salah | Jadikan Public, buat rilis, cek jalur `dist/...` |
| Perubahan file tidak muncul | Cache jsDelivr | Buat tag baru (`v1.0.1`) dan ubah `cdn` |
| Laporan tidak masuk ke Sheet | `ALLOWED_ORIGINS` salah, atau deployment belum versi baru | Samakan dengan domain blog; deploy versi baru |
| "Populer" tidak muncul | Belum ada data hit, atau `api` salah | Buka 1–2 tool dulu; cek URL `/exec` |
