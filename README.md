# Petualangan Krakatau Pintar

Game edukasi sandbox 3D berbahasa Indonesia untuk **Dinar (7 tahun, kelas 2 SD)** dan **Delisha (5 tahun, persiapan SD)**. Jelajahi pulau, temui guru, kumpulkan benda alam, bermain huruf, dan hitung bintang. Dunia dan tiga avatar dibuat secara procedural dengan geometry low-poly; tanpa backend, login, chat, iklan, pembelian, atau aset karakter game lain.

Mode lama **Petualangan Pulau Pintar** tetap tersedia di `/classic/`: 24 level, 120 aktivitas, panel orang tua dengan PIN, batas waktu, TTS, dan progres lama tidak dihapus. [Panduan mode latihan lama](docs/CLASSIC.md). Semua rute dalam panduan lama kini memakai awalan `/classic`; bookmark `/map`, `/play/...`, `/parent`, `/session`, dan `/rest` dialihkan otomatis.

## Menjalankan

Node.js **22.12+** atau 24 LTS, npm, dan browser dengan WebGL 2.

```bash
npm ci
npm run dev
```

Buka alamat yang dicetak Vite. Mulai dari **Mulai Bermain → pilih profil → pilih satu dari tiga avatar → Mulai Petualangan**. Jika port 5173 sedang digunakan, Vite memilih port berikutnya. Untuk menguji perangkat lain di jaringan lokal:

```bash
npm run dev -- --host 0.0.0.0
```

Buka alamat jaringan yang dicetak Vite pada tablet/HP; gunakan landscape. Game tidak membutuhkan secret atau environment variable.

## Build dan deploy Vercel

```bash
npm run build
npm run preview
```

`npm run build` menjalankan TypeScript strict dan membuat output Vite di `dist/`. Import repository ke Vercel, pilih preset **Vite**, install command `npm ci`, build command `npm run build`, output directory `dist`. `vercel.json` sudah menyediakan SPA fallback ke `index.html`, dengan `/assets/` dikecualikan. Tidak ada ketergantungan filesystem lokal atau URL localhost pada kode produksi. Deploy belum dilakukan dalam pekerjaan ini.

React dipatok pada seri **19.2.x** karena peer dependency React Three Fiber yang dipakai belum menerima React 19.3. Gunakan `npm ci` agar versi mengikuti lockfile; jangan menggunakan `--force` atau `--legacy-peer-deps` untuk memaksa upgrade React.

## Kontrol

| Desktop/laptop | Fungsi |
| --- | --- |
| W A S D atau tombol panah | Berjalan mengikuti arah kamera |
| Space | Melompat; bisa melewati/berdiri di batu rendah |
| E atau tombol interaksi di layar | Bicara, ambil benda, buka papan saat berada dalam jarak 2,65 meter |
| Geser mouse pada dunia | Putar kamera |
| Tombol putar kiri/kanan | Alternatif pengaturan kamera |
| Tombol ◎ | Reset kamera |
| Esc / tombol pause | Jeda; progres tidak hilang |
| Klik minimap | Buka peta besar dengan posisi dan tujuan |
| Klik kartu misi / buku | Progres misi dan lencana |

Pada perangkat touch: joystick kiri bawah untuk berjalan, **Lompat** dan **Ambil / bicara** di kanan, serta tombol kamera. Joystick tidak tampil pada desktop dengan pointer presisi. Beralih tab otomatis menjeda permainan. Dialog, peta, kuis, dan menu juga menghentikan simulasi.

## Dunia dan misi

- **Desa Belajar:** rumah sederhana, petunjuk arah, jalan, dan Bu Guru Sains di jalan utama.
- **Pantai Sains:** pasir, laut, pohon palem, dermaga, perahu, batu, daun, dan kerang.
- **Hutan Bahasa:** pepohonan low-poly dan papan huruf.
- **Taman Hitung Bintang:** lima bintang yang dapat dikumpulkan setelah misi huruf.
- **Pusat Sains:** laboratorium, Pak Guru Alam, dan meja eksperimen di teras. Klub Peneliti Kecil terbuka setelah misi sains.
- **Krakatau:** pulau gunung terpisah di utara, kawah hangat dan asap kecil; tidak dapat dimasuki, tanpa ledakan atau bencana.

| Misi | Delisha | Dinar | Hadiah |
| --- | --- | --- | --- |
| Temui Bu Guru Sains | Dialog dua halaman, mulai misi | Dialog dua halaman, mulai misi | 5 bintang + Sahabat Guru |
| Temukan 3 Benda Sains | Kenali daun dari tumbuhan | Mengenal fotosintesis | 1 per benda + 5 dan Peneliti Alam |
| Hutan Huruf | Cocokkan A dengan apel | Susun B-U-K-U dengan mengetuk huruf | 5 + Sahabat Huruf |
| Hitung Bintang | Hitung 5 bintang | 7 + 5 | 1 per bintang + 5 dan Bintang Berhitung |

Empat misi menghasilkan **28 bintang dan 4 lencana**. Benda hilang setelah diambil; hadiah misi dan benda tidak bisa diberikan dua kali. Jawaban salah memunculkan penjelasan dan tombol coba lagi tanpa mengurangi bintang. Jika kuis ditutup sebelum hadiah diambil, buka kembali lewat Bu Guru (sains), papan huruf, atau papan hitung. Posisi awal kembali ke jalan desa saat melanjutkan permainan.

Meja eksperimen menawarkan latihan bergilir: warna, bentuk, hewan, penjumlahan, dan angka sampai 10 untuk Delisha; pengurangan, perkalian dasar, bahasa Inggris, dan membaca kalimat untuk Dinar. Setiap latihan benar memberi 2 bintang; latihan tambahan boleh diulang.

## Progres dan privasi

- Data 3D disimpan pada localStorage **`krakatau-pintar:v1`**, versi 1.
- Menyimpan profil aktif, avatar, misi selesai, benda koleksi, bintang koleksi, jumlah hadiah, lencana, area terbuka, putaran latihan tambahan, dan mute.
- Progres Dinar dan Delisha dipisahkan. Reset meminta konfirmasi dan hanya menghapus progres 3D profil yang dipilih.
- Data mode lama pada **`pulau-pintar:v1`** tetap terpisah dan tidak dimigrasikan atau dihapus.
- Tidak ada kiriman profil ke server, analytics, mikrofon, kamera, atau layanan pihak ketiga.
- Penyimpanan gagal memunculkan peringatan. Data rusak atau versi asing diblokir dan nilai aslinya tidak ditimpa. Untuk pemulihan: salin key tersebut melalui DevTools sebagai cadangan, perbaiki/pulihkan salinan valid, lalu reload. Jangan unggah data keluarga ke repository. Menghapus data situs juga akan menghapus progres.
- Gunakan satu tab 3D untuk satu perangkat; penulisan simultan lintas tab belum dilindungi kunci transaksi.

**PIN, batas harian, dan aturan durasi mode latihan lama berlaku hanya di `/classic/`.** Mode 3D ini belum mengintegrasikan timer/panel tersebut. Tombol panel orang tua diberi label “mode latihan 2D” agar cakupannya jelas.

## Struktur implementasi

```text
src/App.tsx                      Pemilihan mode, lazy loading, redirect bookmark lama
src/LegacyApp.tsx                Router latihan lama dengan basename /classic
src/game/Adventure.tsx          Alur layar, interaksi, dan HUD
src/game/avatars/Avatar.tsx      Tiga avatar, idle/jalan/lompat
src/game/world/                  Terrain, bangunan, gunung, instancing pohon, benda interaktif
src/game/player/                 Kontrol keyboard/drag, kamera, gravitasi dan collision
src/game/missions/progress.ts    State misi, syarat unlock, reward idempotent
src/game/data/                   Profil, avatar, koordinat dunia, bank kuis, tipe
src/game/ui/                     Home/Profile/AvatarScreen, dialog, kuis, peta, touch controls
src/game/utils/                  Validasi localStorage dan suara Web Audio
src/game/game.css                UI responsif, layout landscape, reduced motion UI
src/pages/, content/, engine/    Seluruh fitur latihan lama dipertahankan
```

Untuk menambah misi, tambahkan ID/tipe, data kuis per profil, objek dunia, aturan transisi pada `progress.ts`, dan interaksi. Jangan mengubah ID benda yang sudah tersimpan tanpa migrasi skema. Objek solid dan kamera memakai proxy collision yang sama di `data/world.ts`. Tambahkan pengujian syarat unlock dan hadiah bila aturan berubah.

## Validasi

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Playwright memakai Google Chrome yang terpasang. Alternatif untuk CI:

```bash
npx playwright install chromium
PLAYWRIGHT_CHANNEL=chromium npm run test:e2e
```

Tes browser menggunakan konteks baru dan data sintetis, tidak menyentuh progres keluarga. Suite baru menjalankan perjalanan Dinar melalui gerakan keyboard nyata, semua misi dan hadiah, jawaban salah/coba lagi, reload, pemisahan profil, pencocokan huruf Delisha, reset selektif, serta joystick di viewport landscape. Tes unit memeriksa syarat misi, hadiah ganda, data rusak, collision, dan jarak aman kamera. Hasil aktual dan screenshot dicatat di [laporan 3D](docs/KRAKATAU.md).

## Batasan MVP dan fase berikutnya

- Semua aset 3D berupa geometry procedural; belum ada terrain kompleks, interior laboratorium, berenang, atau naik perahu. Pintu menjelaskan bahwa kegiatan berlangsung di teras.
- Collision memakai lingkaran sederhana, bukan engine fisika penuh. Hati adalah indikator energi dekoratif; tidak berkurang dan tidak ada sistem kalah.
- Efek klik, koleksi, lompat, dan misi selesai dibuat dengan Web Audio. Belum ada musik latar atau narasi lisan di mode 3D. Mute tersedia.
- WebGL 2 dan akselerasi grafis diperlukan; perangkat tanpa dukungan tersebut mendapat pesan dan tautan latihan 2D. Pengujian mobile memakai emulasi Chrome, belum perangkat keluarga nyata atau Safari/Firefox.
- Progres tidak disinkronkan antarperangkat, posisi avatar belum disimpan. Penyimpanan kuis dilakukan pada hadiah; kuis yang belum diselesaikan bisa dibuka kembali.
- Bundle 3D lebih besar daripada UI biasa karena Three.js; Vite dapat menampilkan peringatan ukuran chunk. Rendering memakai geometry sederhana, pohon instanced, satu lampu bayangan, DPR maksimal 1,5, pembatas delta, dan berhenti saat pause.
- Fase berikutnya: uji langsung bersama Dinar/Delisha; sambungkan timer dan panel orang tua ke mode 3D; tambah narasi Indonesia, variasi soal, ekspor/cadangan progres, dan pengujian perangkat touch fisik.
