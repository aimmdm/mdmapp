# Backend Google Apps Script (opsional)

Panduan langkah demi langkah ada di `../README.md` bagian 5.

Uji logika tanpa akun Google (memakai tiruan layanan Google):

```
node apps-script/test/gas-mock-test.cjs
```

Catatan: pengujian ini memverifikasi logika kode, bukan perilaku server Google. Setelah Deploy, selalu uji URL `/exec` di browser.
