# Fase 1 Multiplayer — 12 September 2026

## Hasil implementasi

**Main Bersama** tersedia di halaman utama. Pemain dapat membuat room berkode enam karakter, memilih salah satu dari dua map dan tiga avatar, memilih panggilan rekaan, lalu masuk lobby. Teman memasukkan kode, memilih panggilan/avatar, dan otomatis memperoleh map host. Masing-masing menekan **Mulai Bermain** ketika siap; avatar di lobby belum muncul di dunia.

Lobby menampilkan kode yang dapat disalin, map, avatar/nama panggilan, host, status koneksi, jumlah pemain maksimal 4, dan tombol keluar. Di dunia tersedia gerak keyboard/joystick, lompat, kamera, minimap, menu pemain, dan keluar room. Map tidak dapat diganti dalam room. Avatar remote menggunakan model existing dan interpolasi posisi/rotasi; tidak masuk daftar collision lokal.

Nama panggilan dipilih dari 12 nama rekaan, bukan teks bebas. Ini mencegah permintaan nama asli dan penggunaan nickname sebagai jalur pesan. Pilihan profil dan avatar hanya berlaku pada sesi room. Tidak ada chat, voice, emote, pencarian pemain, daftar room, matchmaking, inventory bersama, atau progres misi yang disinkronkan.

**Pembaruan pemulihan misi:** mode bersama kini memakai layar misi existing. Dialog, kuis, collectible dan hadiah bekerja secara lokal per profil/map, seperti single-player. Avatar tersimpan dan map terakhir solo tidak diganti oleh room; progres misi tidak pernah disinkronkan melalui Realtime. Lihat [rincian pemulihan dan 10 NPC baru](MISSION-RESTORATION.md).

## Konfigurasi Supabase

Project awal belum mempunyai konfigurasi Supabase. Dependency `@supabase/supabase-js` ditambahkan. Buat/pilih project Supabase milik Anda, lalu salin `.env.example` menjadi `.env.local` dan isi:

```env
VITE_SUPABASE_URL=https://PROJECT_REF.supabase.co
# Isi salah satu key berikut:
VITE_SUPABASE_ANON_KEY=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Gunakan **legacy anon key** dengan JWT role `anon` atau **publishable key** berawalan `sb_publishable_`. Kedua tipe diterima pada kedua nama environment key. Jika keduanya terisi, `VITE_SUPABASE_PUBLISHABLE_KEY` diprioritaskan; nilai kosong/whitespace memakai `VITE_SUPABASE_ANON_KEY`. Jangan memakai `service_role`, secret key, password database, atau token pengguna. Validator menolak role selain `anon` dan key `sb_secret_...`; SDK tidak diinisialisasi bila konfigurasi kosong/salah. Tidak perlu membuat tabel database, skema posisi, akun/login, atau endpoint backend. Auth SDK tidak menyimpan sesi, tidak menyegarkan token pengguna, dan tidak membaca callback login.

Variabel `VITE_` di atas memang masuk ke build browser. Isi hanya nilai publik yang aman. File `.env.local` diabaikan Git. Setelah mengganti nilai, restart `npm run dev`; untuk deployment, isi URL dan salah satu public key pada environment hosting lalu build ulang. Pada Vercel pastikan scope Production/Preview sesuai deployment yang dibuka; perubahan environment tidak mengubah bundle deployment lama. UI dan console menyebut nama variabel yang hilang atau tidak valid, tanpa nilai URL/key. Pesan console yang sama hanya dicetak sekali sampai konfigurasi berubah. Konfigurasi Vercel yang ada tetap dapat digunakan.

### Batas privasi channel fase ini

Project ini belum memiliki Auth/RLS untuk membership room, jadi adapter memakai **channel Realtime publik dengan akses melalui kode** (`private: false`). Ini adalah fallback yang diizinkan spesifikasi, **bukan private channel yang diotorisasi server**. Tidak ada daftar/discovery room dalam aplikasi.

Kode memakai `crypto.getRandomValues()`: enam karakter dari 32 simbol, sekitar 30 bit kemungkinan; karakter ambigu I/O/0/1 tidak dipakai. Kode tidak disimpan ke database atau localStorage. Room hidup hanya selama host terhubung. Kode dibagikan secara pribadi oleh pemain di luar aplikasi.

Kode acak dan validasi klien bukan batas keamanan terhadap klien yang dimodifikasi. Pemegang anon key dan kode/topic yang benar secara teknis dapat mendengarkan/mengirim langsung ke channel publik. Batas 4 pemain dan otoritas host ditegakkan protokol klien, bukan RLS atau admission server. Pemain yang ditolak harus keluar channel, tetapi klien yang dimodifikasi dapat mengabaikannya. Jangan menganggap mode ini menyediakan verifikasi identitas atau isolasi kriptografis per anggota.

Jika project Supabase hanya mengizinkan private channels, koneksi fase ini gagal dengan aman dan **Main Sendiri** tetap tersedia. Adapter tidak menurunkan private channel secara otomatis jika otorisasi ditolak. Private channel yang sesungguhnya memerlukan kebijakan membership/RLS dan token terverifikasi terlebih dahulu; jangan sekadar membuka semua policy `realtime.messages` untuk anon. Mengaktifkan private channel tanpa kebijakan yang sesuai tidak menyelesaikan otorisasi room.

Rujukan resmi: [Presence](https://supabase.com/docs/guides/realtime/presence), [Broadcast](https://supabase.com/docs/guides/realtime/broadcast), dan [Realtime Authorization](https://supabase.com/docs/guides/realtime/authorization).

## Protokol dan siklus hidup

- Channel: `game-room:<ROOMCODE>`; `roomId` UUID membedakan inkarnasi room/kode.
- Metadata host: `roomCode`, `roomId`, `hostId`, `mapId`, `createdAt`, disiarkan melalui Presence/roster.
- `playerId` baru menggunakan `crypto.randomUUID()` untuk setiap sesi, bukan ID perangkat permanen.
- Presence berisi anggota, map, avatar, nickname dan status sesi; pembaruan hanya saat masuk/perubahan status/reconnect.
- Broadcast `game` hanya menerima tipe `request`, `welcome`, `roster`, `reject`, `pose`, `leave`, `closed`. Host memesan slot secara sinkron sebelum mengirim jawaban, sehingga permintaan bergabung bersamaan tetap maksimal empat pemain pada klien aplikasi.
- Snapshot posisi terbaru diambil paling cepat setiap 100 ms, maksimal 10 kali/detik saat bermain; lobby/pause memakai heartbeat satu detik. Paket yang masih menunggu ack tidak ditumpuk. Posisi tidak pernah ditulis ke database.
- Paket menyertakan posisi XYZ, rotasi, animasi, avatar, nickname, enum profil/map, waktu dan nomor urut. Penerima mengabaikan paket lama, map/room salah, anggota yang belum diterima, nickname tidak dikenal, avatar invalid, nilai non-finite, dan posisi di luar batas dunia. Field tambahan dibuang.
- Remote memakai interpolasi eksponensial dan rotasi sudut terpendek. Pose target datang lewat jaringan; transform mesh diperbarui per frame tanpa mengubah physics lokal.
- Host keluar: broadcast penutupan dan hapus channel. Pemain lain mendapat pesan room ditutup dan opsi Main Sendiri.
- Guest keluar: dilepas dari roster, slot tersedia kembali. Presence yang hilang ditandai Terputus; heartbeat terlambat sekitar 3,5 detik juga ditandai. Remote dihapus setelah sekitar 7 detik; host tanpa heartbeat sekitar 8 detik menutup sesi guest.
- SDK mencoba reconnect untuk gangguan singkat dan Presence ditrack ulang. Jika slot/host sudah kedaluwarsa, gunakan **Coba Lagi**: guest melakukan join baru, host membuat room/kode baru. Kode lama tidak dijamin bisa dilanjutkan.
- `pagehide` berusaha meninggalkan room. Penutupan tab/refresh yang tidak sempat mengirim pesan tetap ditangani Presence/timeout. Setelah refresh, room tidak dilanjutkan otomatis: masukkan kode lagi. Nickname/identitas tidak disimpan.
- Berpindah tab membuka pause lokal, tetapi koneksi room tetap hidup. Di pause, simulasi pemain lokal berhenti sementara avatar remote tetap menerima pembaruan. Browser yang menidurkan tab lama dapat dianggap terputus.

## Berkas utama

| Berkas | Peran |
| --- | --- |
| `src/multiplayer/types.ts` | Kontrak pose, pemain, room, message, transport |
| `roomCode.ts` | Kode acak, normalisasi, nickname rekaan |
| `playerSync.ts` | Validasi payload, batas waktu/frekuensi, interpolasi |
| `realtimeChannel.ts` | Validasi konfigurasi, lazy SDK, adapter Supabase |
| `multiplayerService.ts` | Admission host, roster, timeout, reconnect, cleanup |
| `useMultiplayerRoom.ts` | Subscription React dan lifecycle halaman |
| `src/components/multiplayer/` | Menu, create/join, lobby, room code, player list, status, mode game, CSS |
| `src/game/RemotePlayers.tsx` | Model dan label pemain remote |
| `src/game/player/Player.tsx` | Callback pose dari player existing |
| `src/game/ui/Controls.tsx` | Kontrol joystick, lompat dan interaksi lokal pada kedua mode |
| `src/game/world/World.tsx` | Remote renderer dan pembaruan dunia ketika pause multiplayer |
| `src/game/ui/Screens.tsx`, `Adventure.tsx`, `game.css` | Tombol Main Bersama dan layar lazy multiplayer |
| `.env.example`, `src/vite-env.d.ts` | Kontrak URL dan kedua alternatif public key |
| `tests/multiplayer.test.ts` | State room, concurrency, rate, validasi, koneksi dan interpolasi |
| `e2e/multiplayer.spec.ts`, `e2e/helpers/supabaseMock.ts` | Browser dengan SDK nyata dan simulasi protokol Realtime |
| `e2e/multiplayer-menu.spec.ts` | UI mobile, layanan tidak tersedia, fallback single-player |
| `playwright.multiplayer.config.ts` | Server pengujian terisolasi dengan URL/key dummy |

Tidak ada kode simulator pada bundle produksi. Simulator hanya ada dalam berkas pengujian; tidak menjadi fallback aplikasi saat Supabase tidak tersedia.

## Menjalankan dan menguji dua browser nyata

```bash
npm ci
# Isi .env.local terlebih dahulu untuk multiplayer nyata.
npm run dev
npm run build
```

1. Buka URL lokal yang ditampilkan Vite pada browser pertama. Pilih **Main Bersama**, map Krakatau, avatar, panggilan, lalu **Buat Room**.
2. Salin kode dari lobby. Buka browser kedua atau incognito memakai origin yang sama dan konfigurasi Supabase yang sama.
3. Pilih **Main Bersama → Punya kode room**, masukkan kode, pilih panggilan/avatar berbeda, lalu **Gabung Room**. Kedua lobby harus menunjukkan 2/4 dan map host.
4. Tekan **Mulai Bermain** di masing-masing browser. Gerakkan W/A/S/D, putar kamera, dan lompat. Nama, avatar, rotasi dan posisi harus terlihat pada browser lain.
5. Keluar lalu ulangi dengan Raja Ampat. Kedua map tersedia untuk eksplorasi multiplayer tanpa mengubah unlock single-player.
6. Tambah browser/profil privat lain sampai 4/4; percobaan kelima harus mendapat **Room penuh**. Setelah seorang guest keluar, coba bergabung lagi.
7. Uji kode salah, refresh guest, host keluar, tab ditutup, dan koneksi offline singkat/lama. Periksa **Terputus**, hilangnya avatar, penutupan room host, **Coba Lagi**, dan **Main Sendiri**.
8. Bandingkan progres single-player sebelum/sesudah; gerakan saja tidak memberi hadiah; interaksi misi hanya menambah progres pemain lokal yang melakukannya. Pada perangkat touch, periksa joystick dan tombol lompat.

Browser pertama dan kedua memerlukan konteks browser berbeda untuk pengujian yang mewakili perangkat terpisah. Untuk dua perangkat fisik, gunakan deployment HTTPS atau server LAN yang dikonfigurasi tersendiri; default Vite project hanya mendengarkan `127.0.0.1`.

## Pengujian otomatis

```bash
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run test:multiplayer
```

`test:multiplayer` menjalankan Vite terisolasi di port 5176. URL `https://realtime-test.invalid` dan JWT dummy hanya digunakan untuk tes. Playwright mengintersep WebSocket dari SDK Supabase asli, lalu mensimulasikan Phoenix join/leave, Presence, Broadcast dan ack. Pengujian ini memeriksa integrasi UI → SDK → protokol → avatar, tetapi **tidak membuktikan konfigurasi, izin, region, latensi, atau koneksi project Supabase nyata**.

Pada saat implementasi, `.env.local` dan konfigurasi project Supabase belum tersedia. Aktivasi serta uji live dua browser memerlukan URL dan salah satu public key di atas.

Hasil pemeriksaan implementasi:

- Lint, TypeScript strict, 77 tes unit (termasuk 13 tes multiplayer), dan build produksi lulus.
- Seluruh 44 tes regresi browser lulus, termasuk seluruh misi kedua map, progres/migrasi/reset, mode latihan 2D, PIN/batas waktu, UI mobile, dan fallback Main Sendiri saat Supabase tidak tersedia.
- Empat skenario browser multiplayer memakai SDK Supabase asli dengan endpoint Realtime simulasi lulus: kedua map, gerak dua arah/rotasi/lompat/avatar berbeda, joystick mobile, refresh/keluar, lima calon pemain bersamaan, slot tersedia kembali, kode salah, reconnect singkat dan timeout host.
- Progres localStorage sebelum/sesudah sesi dibandingkan; payload jaringan diperiksa agar tidak berisi inventory, progres, hadiah atau email.
- Build masih memberi peringatan ukuran chunk dunia 3D sekitar 1 MB; SDK Supabase dimuat terpisah saat koneksi multiplayer dibutuhkan.
- Uji project Supabase nyata dan perangkat fisik belum dilakukan. Ini masih diperlukan sebelum menyatakan konfigurasi produksi siap dipakai.

Jika browser tidak menyediakan `crypto.randomUUID()`/`getRandomValues()` (misalnya alamat LAN HTTP), Main Bersama menampilkan petunjuk memakai HTTPS atau localhost, tanpa membuat sesi atau mengganti ID dengan randomness yang lemah.

## Rekomendasi Fase 2

Sebelum akses lebih luas, tambahkan admission/identitas sesi yang diverifikasi server, private Realtime channels dengan membership RLS, serta rate limiting server. Lalu uji latensi dan pemulihan pada perangkat fisik/jaringan seluler. Misi kooperatif memerlukan otoritas reward yang dirancang tersendiri; progres lokal fase ini tidak dijadikan sumber kebenaran bersama.
