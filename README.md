# 🎮 Cubit Kata - Game AR Edukasi

Game edukasi interaktif berbasis **Augmented Reality (AR Hand-Tracking)** menggunakan kamera webcam untuk mendeteksi gestur cubitan jari (ibu jari + telunjuk 👌) secara real-time, serta mendukung input **Mouse & Layar Sentuh**.

---

## 🚀 Panduan Deploy ke GitHub Pages (100% Anti-Blank & Lancar)

Aplikasi ini sudah dioptimalkan agar dapat dijalankan dan di-deploy ke GitHub Pages tanpa kendala layar putih (*blank screen*). Anda dapat memilih salah satu dari **2 cara mudah** berikut:

---

### Cara 1: Menggunakan GitHub Actions (Sangat Disarankan - Otomatis)

1. **Push kode ke GitHub**:
   ```bash
   git add .
   git commit -m "Deploy Cubit Kata ke GitHub Pages"
   git push origin main
   ```
2. Buka repositori Anda di GitHub.
3. Klik tab **Settings** (Pengaturan) di bilah atas.
4. Pilih menu **Pages** di kolom sebelah kiri.
5. Pada bagian **Build and deployment** > **Source**, pilih opsi:
   👉 **GitHub Actions**
6. Selesai! GitHub Actions akan otomatis mengompilasi dan menerbitkan website Anda. Alamat tautan web dapat dilihat di menu **Pages** tersebut.

---

### Cara 2: Menggunakan Folder `/docs` (Langsung & Tanpa Perlu Setup Actions)

Di dalam repositori ini, folder `/docs` sudah berisi file bundle web statis siap pakai.
1. Buka repositori Anda di GitHub > **Settings** > **Pages**.
2. Pada **Source**, pilih **Deploy from a branch**.
3. Pada **Branch**, pilih `main` dan pilih folder:
   👉 **/docs**
4. Klik tombol **Save**.
5. Website akan langsung aktif dalam beberapa detik tanpa perlu proses kompilasi ulang!

---

### 🛡️ Solusi Masalah Layar Putih (Blank Screen) yang Telah Diterapkan:
1. **Lockfile & Peer Dependency Fixed:** Memperbaiki versi `esbuild` dan menyertakan `package-lock.json` sehingga alur kerja GitHub Actions tidak gagal saat tahap instalasi dependensi.
2. **Trailing Slash Auto-Normalizer:** Skrip otomatis di `index.html` yang memastikan URL repositori GitHub Pages selalu memiliki garis miring akhir (`/`), mencegah kegagalan aset relatif (`./assets/...`).
3. **Safe Storage & Fallback Splash:** Proteksi *error boundary* dan *splash loader* bertema Cubit Kata agar tidak terjadi layar kosong saat inisialisasi aplikasi.
4. **Non-blocking MediaPipe:** Pemuatan pustaka deteksi tangan MediaPipe secara `defer` dengan deteksi kesiapan otomatis, serta *graceful fallback* ke mode mouse/layar sentuh jika kamera belum aktif.

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

Untuk membuat bundle produksi mandiri:
```bash
npm run build
```
File hasil build akan otomatis tersimpan di folder `dist/` dan `docs/`.

---

## 🔑 Akses & Fitur Permainan

- **Kode Aktivasi Versi Penuh:** `CUBITOKE`
  - Membuka Mode Mandiri (Solo), Mode Tanding 2 Pemain (Battle Split-Screen), dan Menu Terpadu Kelola Bank Soal (Impor/Ekspor Excel).
- **Mode Demo:**
  - Dapat langsung dimainkan tanpa kode aktivasi (khusus Mode 1 Pemain / Solo).

---

## 👨‍💻 Profil Pengembang & Media Sosial

- **Pengembang:** M. Nur Ali Abidin, S.Pd
- **Instagram:** [@aliabidin988](https://instagram.com/aliabidin988)
- **TikTok:** [@aliabidin98](https://tiktok.com/@aliabidin98)
