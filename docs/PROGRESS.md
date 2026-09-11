# Status akhir — 11 September 2026

Implementasi selesai di workspace. Tidak ada push, publish, atau deployment.

## Fitur selesai

- [x] Alur setup → profil → peta → misi → aktivitas → hasil → penutup → kegiatan offline.
- [x] Dinar dan Delisha, avatar pilihan, empat pulau terbuka, unlock level bertahap.
- [x] 24 level / 120 aktivitas, cerita bercabang, kelompok visual, keypad, susun ketuk, hitung objek, grid; 12 kartu offline.
- [x] PIN PBKDF2 bersalt, cooldown, panel terkunci, perubahan PIN, penghapusan dengan PIN ulang dan konfirmasi kedua.
- [x] Progres terpisah, bantuan/terbimbing/percobaan pertama, lencana idempotent, maksimum tiga penyelesaian per sesi termasuk pengulangan.
- [x] Batas harian Asia/Jakarta, pause/background, persist berkala dan saat keluar, Web Locks untuk satu profil per tab.
- [x] Durasi dan statistik per kemampuan; batas, waktu, progres dan sesi tersimpan berversi; data rusak dipertahankan.
- [x] Ilustrasi lokal, keyboard, dialog, TTS fallback, reduced motion, CSS 360 px, panel mobile tanpa tabel melebar.
- [x] README Indonesia, sumber aset, konfigurasi SPA Vercel.

## Hasil pemeriksaan nyata

| Pemeriksaan                               | Hasil                                                                                                                   |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `npm ci` dari lockfile                    | Lulus; 265 paket dipasang ulang                                                                                         |
| Audit dependensi saat clean install       | 0 vulnerabilities                                                                                                       |
| `npm run lint`                            | Lulus                                                                                                                   |
| `npm run typecheck`                       | Lulus                                                                                                                   |
| `npm test`                                | 47/47 unit dan komponen lulus                                                                                           |
| `npm run build`                           | Lulus; output `dist`; JS sekitar 352 kB / 112 kB gzip                                                                   |
| Playwright dengan Google Chrome terpasang | Seluruh 36 skenario telah lulus: 34 pada suite penuh final, 2 pada uji ulang terarah setelah perbaikan penantian di tes |
| Semua level                               | 24/24 dimainkan, semua 120 aktivitas diselesaikan lewat UI                                                              |
| Deep link dan refresh                     | `/map`, `/play/:levelId`, `/parent` lulus di server lokal                                                               |
| Visual                                    | Desktop 1366 px, mobile 360 px, peta/permainan/panel; tidak ada scroll horizontal dokumen                               |
| Browser runtime                           | Tidak ada page error pada alur setup/misi dan pemeriksaan visual; agent-browser awal juga tidak melaporkan error        |

Tes mencakup konten/kunci, unlock/idempotensi, progres terpisah, statistik terbimbing, timer Jakarta, pause/resume/refresh/day rollover/batas habis, PIN/cooldown, storage rusak/tidak tersedia, TTS tidak tersedia/tanpa voice Indonesia. E2E juga mencakup background (event visibilitas disimulasikan), sesi tiga level, dua tab, perubahan PIN/batas, serta penghapusan progres.

Dua perbaikan tes terakhir: menunggu activity screen sebelum memeriksa tutorial; menunggu pesan PIN tersimpan sebelum reload. Clock dibekukan saat pengujian waktu agar klik tidak menambahkan milidetik nyata. Tidak ada pengujian yang menunggu 15 menit sungguhan.

Chromium khusus Playwright belum diunduh karena unduhan tidak disetujui. Pengujian memakai Google Chrome yang sudah terpasang; `PLAYWRIGHT_CHANNEL=chromium` tetap tersedia untuk lingkungan lain yang memasang Chromium sendiri.

## Bukti visual

- `setup-desktop.png`
- `map-1366.png`
- `map-360.png`
- `play-360.png`
- `parent-360.png`

Semua screenshot menggunakan data uji sintetis, bukan PIN/progres keluarga.

## Batasan dan pemeriksaan lanjutan

- Production Vercel belum dipublish atau diuji. Konfigurasi rewrite mengikuti dokumentasi; lakukan checklist smoke test README setelah deploy.
- Safari/Firefox, pembaca layar, TTS Indonesia pada perangkat keluarga, dan uji kegunaan bersama anak belum dilakukan.
- WebMCP adalah tambahan opsional untuk membaca 12 aktivitas offline publik. Browser standar tanpa API ini tetap berfungsi. Registrasi native WebMCP belum diverifikasi dalam lingkungan pendukung.
- Data hanya di browser ini; PIN dan batas lokal bisa dilewati dengan menghapus data atau memanipulasi perangkat. Tidak ada sinkronisasi atau backup server.
- Waktu disimpan tiap detik. Penutupan proses browser secara paksa tanpa event dapat kehilangan paling banyak interval terakhir yang belum tersimpan. Saat storage penuh/tidak tersedia, peringatan tampil; perubahan dalam memori dapat hilang jika tab ditutup.
