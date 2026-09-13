# Pemulihan misi dan perluasan komunitas

Misi lama tetap tersedia: 7 di Krakatau dan 9 di Raja Ampat. Ditambahkan 10 misi pendek, sehingga total menjadi **26 misi dan 25 area**. Semua ID, koordinat tujuan lama, key save `krakatau-pintar:v2`, serta progres profil/map lama dipertahankan.

## Penyebab dan perbaikan

Layar multiplayer sebelumnya memakai `freshProgress()`, `nearby=null`, dan kontrol interaksi yang dimatikan. Akibatnya NPC terlihat sebagai dekorasi dan misi tidak dapat dimainkan. `MultiplayerGame` sekarang memakai `Adventure` yang sama dengan single-player, dengan konteks room sebagai input tambahan. Ini memulihkan seluruh dialog, papan misi, kuis, collectible, HUD tujuan/progres/jumlah selesai, serta tombol E dan interaksi touch tanpa membuat sistem misi kedua.

Setiap pembaruan progres secara eksplisit menunjuk **profil sesi dan map aktif**, bukan `lastMap` profil. Memasuki room memulai progres map lokal bila belum dimulai, tanpa mengganti map terakhir atau avatar solo. Jawaban dan hadiah tersimpan melalui validator/updateProgress existing di localStorage. Avatar remote hanya dirender dan tidak menjadi sumber interaksi. Tidak ada perintah misi, jawaban, collectible atau hadiah yang dikirim melalui Supabase.

Dua tab pada browser/profil penyimpanan yang sama memakai save lokal yang sama per anak; untuk mewakili perangkat pemain berbeda, uji dengan browser/incognito yang memiliki penyimpanan terpisah.

## Sepuluh misi baru

| Map        | Pemberi misi | Tugas                                                  |
| ---------- | ------------ | ------------------------------------------------------ |
| Krakatau   | Ustazah Eva  | Amati lima batu dingin dan berhitung                   |
| Krakatau   | Ustazah Rima | Baca kartu dan lengkapi kalimat pendek                 |
| Krakatau   | Umi Icha     | Cocokkan tiga warna bendera jalur                      |
| Krakatau   | Umi Dini     | Kumpulkan empat sampah lalu pilih tempat sampah di pos |
| Krakatau   | Nenek Gema   | Pilih ucapan sopan dan terima kasih                    |
| Raja Ampat | Umi Resa     | Amati tiga ikan tanpa mengganggunya                    |
| Raja Ampat | Umi Safa     | Susun angka 1–10 menggunakan tombol urutan             |
| Raja Ampat | Bunda Danti  | Pilih air minum/bekal yang beragam                     |
| Raja Ampat | Teteh Nabila | Kenali huruf awal buku/daun                            |
| Raja Ampat | Nenek Uti    | Amati daun dan cocokkan bentuknya                      |

Misi ini tidak memiliki prasyarat; kunjungi NPC atau tandai melalui buku misi. Setiap misi mengikuti alur terima → amati/kumpulkan tujuan → kembali ke NPC → kuis sesuai profil → ambil hadiah. Memberi 1 bintang per objek dan 6 bintang/lencana ketika selesai. Jawaban salah bisa dicoba lagi; hadiah tidak diberikan dua kali. Tanaman hanya diamati, tidak dipetik atau dikonsumsi. Krakatau diamati dari pulau aman; warna bendera merupakan latihan warna, bukan informasi aktivitas gunung nyata.

## Tata letak dan performa

Radius setiap map naik dari sekitar 38,18 menjadi 54 satuan: **luas lingkaran tiap map menjadi 2×**. Area baru mengisi jalur luar dengan pos belajar, pengamatan, pantai, kebun dan pondok. Jalur data diperlebar minimal 4 satuan. Lokasi gunung dekoratif digeser lebih jauh agar tetap terpisah oleh laut. Batas collision lingkaran, pelampung dan minimap mengikuti radius baru; pemain tidak dapat berjalan keluar batas.

Host memiliki spawn pertama, kemudian menerima guest pada tiga spawn aman berbeda. Slot dipesan host sebelum mengirim welcome, dipertahankan selama keanggotaan, dan dilepas ketika keluar. Avatar remote tidak menambah collision.

Tidak menambah dependency atau engine fisika. Model sederhana existing digunakan kembali, pohon tetap instanced, jumlah pohon existing dipertahankan, DPR tetap maksimal 1,5, dan objek interaktif di luar jarak 30 satuan disembunyikan saat bermain. Target dipilih 2× untuk membatasi perjalanan dan biaya render; belum mengklaim performa perangkat fisik keluarga.

## Berkas utama

- `src/game/Adventure.tsx`: layar misi bersama, pemilihan profil/map room, write progres lokal eksplisit, status pause, HUD room.
- `src/components/multiplayer/MultiplayerGame.tsx`: adapter kecil ke layar existing.
- `src/game/missions/communityMissions.ts`: data NPC, id/map, judul, instruksi, tipe, target, posisi, hadiah, kuis per profil.
- `src/game/maps/communityLayout.ts`: NPC/objek/area/jalur/pondok dan empat spawn.
- `missionRegistry.ts`, kedua data map: mendaftarkan konten baru tanpa menghapus lama.
- `World.tsx`, `Player.tsx`, `multiplayerService.ts`: spawn yang diberikan host, pose dan remote renderer.
- `ExpansionObjects.tsx`, `Map.tsx`, `Scenery.tsx`, `game.css`: visual objek/marker, minimap, gunung terpisah, HUD/urutan angka responsif.
- `tests/expansion.test.ts`, `e2e/community.spec.ts`, `e2e/multiplayer.spec.ts`: jangkauan, misi baru, spawn, regresi room dan isolasi progres.

## Uji lokal dan Vercel

```bash
npm ci
npm run dev
npm run lint
npm test
npm run build
npm run test:e2e
npm run test:multiplayer
```

Single-player: pilih anak dan map, kunjungi guru lama, lalu buka buku misi untuk menandai NPC baru. Selesaikan objek/kuis, reload, dan pastikan progres muncul kembali. Bandingkan profil dan map lain.

Multiplayer: dengan environment Supabase aktif, buat room, gabung dari incognito/browser kedua dengan profil berbeda, lalu mulai pada kedua browser. Kedua pemain mendekati NPC yang sama. Pemain A menerima misi dan mengambil objek; pemain B harus tetap dapat menerima/mengambil objek sendiri. Selesaikan kuis A, pastikan HUD B tidak mendapat hadiah, lalu selesaikan misi B. Periksa pause/remote avatar, keluar, refresh dan host terputus.

Vercel: deploy build terbaru dengan `VITE_SUPABASE_URL` dan salah satu `VITE_SUPABASE_ANON_KEY`/`VITE_SUPABASE_PUBLISHABLE_KEY` pada scope yang benar. Redeploy setelah perubahan environment; buka URL HTTPS pada dua konteks browser. Tidak perlu tabel atau migrasi database. Single-player tetap dapat dimainkan jika Realtime gagal. Pengujian otomatis Realtime memakai SDK asli dengan WebSocket simulasi; pengujian deployment nyata memerlukan URL deployment dan konfigurasi milik pengguna.

## Hasil verifikasi, 13 September 2026

- `npm run lint`: lulus.
- `npm test`: 81 tes dalam 6 berkas lulus, termasuk semua misi data untuk kedua profil, isolasi map, hadiah sekali, migrasi save, jangkauan tujuan, batas map, dan empat spawn.
- Browser Chrome: seluruh 46 skenario tercakup dan lulus melalui suite utama dan pengulangan terarah. Suite utama semula 44 lulus/2 gagal; selector jawaban “12” diperjelas dan skrip menunggu map siap sebelum mengirim tombol gerak. Kedua skenario tersebut kemudian lulus. Sepuluh misi baru dimainkan melalui NPC, objek, kuis, hadiah, dan reload; seluruh misi lama tetap diuji.
- Multiplayer: seluruh 6 skenario lulus melalui suite dan pengulangan terarah, mencakup create/join, kedua map, remote avatar, batas empat pemain, lifecycle/fallback, serta dua pemain menyelesaikan misi NPC yang sama secara privat. Pengulangan memperbaiki rute keyboard tes dan selector pilihan huruf. Memakai Supabase SDK asli dengan WebSocket simulasi, bukan koneksi ke project Supabase produksi.
- Pengujian misi solo dan multiplayer mengumpulkan `console.error`/`pageerror` dan tidak menemukan error. Pemeriksaan awal halaman dengan agent-browser juga tidak menemukan error.
- `npm run build`: TypeScript dan Vite lulus. Bundle Adventure sekitar 1.039 kB (285 kB gzip); Vite masih memberi peringatan chunk di atas 500 kB. Model tetap sederhana dan tidak menambah dependency. Performa perangkat mobile fisik belum diuji.
- Deployment Vercel belum dilakukan atau diverifikasi pada perubahan ini. Gunakan langkah dua browser di atas sesudah deployment.

Bukti visual: [komunitas Krakatau](community-krakatau.png), [komunitas Raja Ampat](community-raja-ampat.png), [misi room Krakatau](multiplayer-missions-krakatau.png), dan [misi room Raja Ampat](multiplayer-missions-raja-ampat.png).
