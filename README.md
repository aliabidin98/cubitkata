# 🎮 Cubit Kata - Game AR Edukasi

Game edukasi interaktif berbasis **Augmented Reality (AR Hand-Tracking)** menggunakan kamera webcam untuk mendeteksi gestur cubitan jari (ibu jari + telunjuk 👌) secara real-time, serta mendukung input **Mouse & Layar Sentuh**.

---

## 🚀 Cara Deploy ke GitHub Pages (Otomatis & Tanpa Blank)

Proyek ini telah dikonfigurasi dengan:
1. `base: './'` pada `vite.config.ts` sehingga seluruh aset JavaScript & CSS dimuat secara relatif (`./assets/...`), **menghilangkan masalah layar putih/blank** pada subdomain `https://<username>.github.io/<repo-name>/`.
2. Otomatisasi generate `dist/404.html` agar routing dan refresh halaman pada GitHub Pages tetap berjalan mulus.
3. Alur kerja **GitHub Actions** siap pakai di `.github/workflows/deploy.yml`.

### Langkah-langkah Deploy:
1. **Push proyek ke GitHub**:
   ```bash
   git add .
   git commit -m "Siap deploy ke GitHub Pages"
   git push origin main
   ```
2. Buka repository Anda di GitHub, lalu klik menu **Settings** > **Pages** (di bilah samping kiri).
3. Pada bagian **Build and deployment** > **Source**, pilih opsi:
   👉 **GitHub Actions**
4. Selesai! GitHub Actions akan otomatis meng-compile dan mempublikasikan aplikasi Anda secara langsung. Tautan web publik akan tampil di tab *Actions* atau halaman *Settings > Pages*.

---

## 💻 Menjalankan Secara Lokal (Development)

Pastikan Node.js (v18+) telah terpasang di komputer Anda:

```bash
# 1. Pasang dependensi
npm install

# 2. Jalankan server lokal
npm run dev
```

Buka peramban di `http://localhost:3000`.

Untuk membangun bundle statis produksi:
```bash
npm run build
```
Hasil build akan berada di folder `dist/` dan siap diunggah ke hosting statis mana pun (GitHub Pages, Vercel, Netlify, cPanel, dll).

---

## 🔑 Informasi Akses & Mode Permainan

- **Kode Versi Penuh:** `CUBITOKE`
  - Membuka Mode Mandiri (Solo), Mode Tanding 2 Pemain (Battle Split-Screen), dan Menu Kelola Soal (Ekspor/Impor Excel).
- **Mode Demo:**
  - Dapat langsung dimainkan tanpa kode aktivasi (hanya Mode 1 Pemain / Solo).

---

## 👨‍💻 Profil Pengembang & Media Sosial

- **Pengembang:** M. Nur Ali Abidin, S.Pd
- **Instagram:** [@aliabidin988](https://instagram.com/aliabidin988)
- **TikTok:** [@aliabidin98](https://tiktok.com/@aliabidin98)
