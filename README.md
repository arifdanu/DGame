# Petualangan Pulau Pintar

Game edukasi berbahasa Indonesia untuk Dinar (7 tahun) dan Delisha (5 tahun). Bersama Kiko, anak menjelajahi empat pulau untuk menyalakan mercusuar persahabatan. React + Vite + TypeScript strict, tanpa backend, akun online, API berbayar, atau environment variable wajib.

## Jalankan lokal

Gunakan Node.js 22.12+ atau Node.js 24 LTS dan npm.

```bash
npm ci
npm run dev
```

Buka alamat lokal yang dicetak Vite. Pada kunjungan pertama orang tua membuat PIN enam digit, lalu memilih profil. Tidak ada PIN default. Pengaturan awal 15 menit per profil per hari.

```bash
npm run build
npm run preview
```

Output produksi ada di `dist`. Jangan membuka `index.html` melalui `file://`; Web Crypto dan Web Locks memerlukan localhost atau HTTPS.

## Pengujian

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Playwright memakai **Google Chrome yang sudah terpasang** secara default. Alternatif di komputer atau CI yang belum memiliki Chrome:

```bash
npx playwright install chromium
PLAYWRIGHT_CHANNEL=chromium npm run test:e2e
```

Tes membuat profil dan PIN sintetis di konteks browser terisolasi. Tidak memakai progres atau PIN keluarga. Waktu diuji dengan mock clock; tidak perlu menunggu 15 menit. Rincian hasil aktual terdapat di `docs/PROGRESS.md`. Screenshot tampilan terdapat di `docs/` setelah tes visual dijalankan. Laporan HTML dan trace kegagalan berada di `playwright-report/` dan `test-results/` (diabaikan Git).

## Isi dan struktur

- `src/content/levels.ts`: 24 level, 120 aktivitas; 12 ide aktivitas offline.
- `src/content/branches.ts`: kelanjutan cerita sesuai tindakan di Desa Kebaikan.
- `src/types.ts`: model profil, aktivitas, sesi, dan progres.
- `src/engine/`: penilaian, solusi terbimbing, unlock, lencana, statistik, PIN dan timer.
- `src/storage/`: penyimpanan berversi, validasi struktur, dan peringatan kegagalan.
- `src/hooks/`: penguncian tab, waktu aktif, TTS, state browser, API WebMCP opsional.
- `src/components/`: komponen visual, PIN, dan interaksi reusable.
- `src/pages/`: setup, profil, peta, permainan, penutup sesi, kegiatan offline, panel orang tua.
- `public/assets/`: ilustrasi lokal. Asal aset dan prompt ada di `docs/ASSETS.md`.
- `tests/`, `e2e/`: pengujian unit/komponen dan browser.

Untuk menambah level, gunakan fungsi `add` pada bank konten. Setiap aktivitas wajib memiliki instruksi, adegan, data interaksi, petunjuk, penjelasan, tujuan, profil, tingkat, dan ID stabil. Engine mendukung pilihan, cerita bercabang, urutan ketuk, hitung objek, keypad dengan kelompok visual, dan grid. Pilihan cerita memerlukan kelanjutan untuk setiap jawaban. Hindari mengganti ID yang sudah dipakai karena progres merujuk pada ID tersebut. Tambahkan kunci dan kasus uji, lalu jalankan seluruh pemeriksaan.

## Progres dan batas bermain

Semua pulau terbuka; level 2 dan 3 terbuka bertahap. Satu level terdiri atas lima aktivitas. Setelah dua kesalahan, contoh terbimbing tampil dan harus diakui sebelum lanjut. Tidak ada nyawa, penalti, hadiah kecepatan, leaderboard, iklan, atau pembelian.

Satu lencana tetap per level, termasuk bila level diulang. Sesi maksimal tiga penyelesaian level (pengulangan juga dihitung), lalu penutup wajib dengan tombol **Selesai & Istirahat**. Tidak ada sesi baru otomatis. Progres per aktivitas tersimpan saat berinteraksi; waktu tersimpan setiap detik, pada perubahan visibilitas, `pagehide`, dan keluar dari permainan. Waktu berjalan hanya saat layar permainan terlihat, aktif, tutorial ditutup, dan tidak dijeda. Hari dihitung dalam zona **Asia/Jakarta**; jatah harian 10/15/20/30 menit berlaku lintas sesi, refresh, dan pergantian profil.

Satu profil hanya dapat membuka permainan di satu tab menggunakan Web Locks. Browser tanpa Web Locks diminta diperbarui; aplikasi tidak mencoba mekanisme penguncian yang rentan balapan. Semua data mutasi membaca penyimpanan terbaru agar pembaruan profil berbeda tidak memakai snapshot lama. Jika penyimpanan gagal, peringatan tampil dan sesi dipertahankan dalam memori; menutup tab saat itu dapat kehilangan perubahan yang belum tersimpan.

Statistik menyimpan percobaan, bantuan, benar pertama, dan terbimbing secara terpisah. Akurasi memakai aktivitas selesai sebagai penyebut; terbimbing tidak dihitung benar mandiri. Panel menunjukkan penyelesaian pertama setiap aktivitas; pengulangan tidak menimpa hasil pertama atau menggandakan lencana. Aktivitas yang belum selesai tetap tercatat dalam jumlah bantuan dan percobaan. Durasi dihitung per profil dan per pulau; level selesai, akurasi, percobaan, dan bantuan ditampilkan per kemampuan.

## PIN dan keterbatasan penyimpanan lokal

PIN diturunkan dengan **PBKDF2-HMAC-SHA-256**, 210.000 iterasi dan salt acak 16 byte. Yang disimpan hanya salt dan hasil derivasi 32 byte. Setelah lima PIN salah, ada cooldown 30 detik yang bertahan setelah refresh. Akses panel ada dalam memori dan terkunci kembali saat reload, keluar route, atau tab masuk background. Hapus progres memerlukan PIN ulang dan konfirmasi kedua; catatan waktu dan batas harian tidak dihapus oleh tindakan ini.

**PIN dan batas lokal bukan keamanan kuat.** Penghapusan data browser, manipulasi perangkat, atau perangkat lain dapat melewatinya. Data tidak tersinkron, tidak dicadangkan di server, dan bisa hilang jika data situs dibersihkan. Tidak ada bypass pada layar anak dan tidak ada pemulihan PIN lewat email.

Data disimpan pada key `pulau-pintar:v1` dengan `schemaVersion: 1`. Data yang rusak atau versinya tidak dikenali **tidak ditimpa atau dihapus**; permainan diblokir dengan peringatan. Pemulihan dilakukan orang tua/pengelola perangkat:

1. Tutup tab permainan lain. Melalui DevTools → Application/Storage → Local Storage, salin nilai asli key tersebut ke berkas cadangan pribadi.
2. Minta pengembang memeriksa skema dan memperbaiki salinan, atau pulihkan cadangan valid milik browser/profil yang sama. Jangan memasukkan cadangan ke repository.
3. Jika tidak ada cadangan dan orang tua memutuskan memulai ulang, penghapusan data situs melalui pengaturan browser akan menghilangkan seluruh progres dan PIN. Ini tindakan manual di luar game, bukan tombol bypass untuk anak.

## Audio, aksesibilitas, dan privasi

Tombol Dengarkan memakai `speechSynthesis` setelah interaksi pengguna. Suara Indonesia dipilih dari voice perangkat, termasuk pembaruan `voiceschanged`. Jika browser/TTS/suara Indonesia tidak tersedia, pemberitahuan teks tampil; suara tidak dijanjikan pada semua perangkat. Ucapan dibatalkan ketika pindah layar, jeda, mute, atau waktu habis.

Navigasi keyboard, focus visible, dialog modal, tombol minimal 48 px, alternatif ketuk untuk penyusunan, bentuk/simbol selain warna, dan reduced motion tersedia. Semua aset dimuat lokal; font memakai font sistem. Tidak ada mikrofon, kamera, lokasi, chat, analytics, tracking, atau pengiriman profil ke server. Beberapa materi huruf menggunakan simbol emoji perangkat sebagai petunjuk gambar; peta dan karakter menggunakan ilustrasi orisinal lokal.

Materi adalah latihan umum, bukan diagnosis perkembangan, klaim peningkatan IQ, atau materi yang diklaim resmi selaras kurikulum. Sebaiknya dimainkan dengan pendamping, khususnya pada cerita keselamatan dan literasi awal.

## Push ke repository GitHub baru

Tindakan berikut dilakukan sendiri setelah meninjau kode; tugas implementasi ini tidak melakukan push atau deploy.

1. Buat repository GitHub kosong. Jangan unggah localStorage, PIN nyata, berkas cadangan, atau trace pribadi.
2. Dari direktori proyek:

```bash
git status
git add .
git commit -m "Bangun Petualangan Pulau Pintar"
git branch -M main
git remote add origin <URL_REPOSITORY_BARU>
git push -u origin main
```

Jika `origin` sudah ada, periksa `git remote -v` dan gunakan repository tujuan yang benar; jangan menimpa remote tanpa memeriksanya.

## Publish melalui Vercel

1. Di Vercel, pilih **Add New → Project**, lalu import repository GitHub baru.
2. Framework preset **Vite**; install command `npm ci`; build command `npm run build`; output directory `dist`.
3. Gunakan Node.js 22.12+ atau 24. Tidak ada environment variable wajib.
4. Tinjau preview deployment, lalu publish production ketika siap.

`vercel.json` menyediakan SPA fallback ke `/index.html` untuk rute aplikasi, dengan `/assets/` dikecualikan supaya berkas statis tidak diarahkan ke HTML. Konfigurasi mengacu pada [panduan Vite di Vercel](https://vercel.com/docs/frameworks/frontend/vite) dan [rewrites](https://vercel.com/docs/routing/rewrites). Vite preview memeriksa deep link lokal; konfigurasi edge Vercel tetap harus diperiksa setelah deploy.

### Smoke test setelah deploy

- Buka di HP 360 px dan laptop; pastikan peta, Kiko, dan ikon termuat tanpa scroll horizontal.
- Buat PIN baru, pilih Delisha, selesaikan level Angka; refresh dan periksa lencana.
- Pilih Dinar; pastikan soal dan progres berbeda.
- Muat langsung dan refresh `/map`, `/play/dinar-angka-1`, dan `/parent`.
- Pastikan `/assets/islands.png` dan `/assets/kiko.png` memiliki MIME gambar; URL aset yang tidak ada tidak menampilkan aplikasi.
- Buka profil sama di dua tab, pastikan tab kedua diblokir.
- Coba bantuan, dua jawaban salah, dengarkan/mute, jeda, dan keluar/simpan.
- Pastikan panel meminta PIN setelah refresh; periksa batas harian dan penutup tiga level.
- Coba TTS pada perangkat sasaran dan pastikan fallback terlihat jika suara Indonesia tidak tersedia.

## Batasan pengujian

Hasil nyata dan hal yang belum diverifikasi dicatat di `docs/PROGRESS.md`. Production Vercel, Safari/Firefox, pembaca layar, suara Indonesia pada perangkat keluarga, serta uji kegunaan langsung bersama anak memerlukan pemeriksaan lanjutan. API WebMCP eksperimental hanya mengekspos daftar aktivitas offline publik ketika browser mendukungnya; fungsi game tidak bergantung padanya.
