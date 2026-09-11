# Petualangan Pulau Pintar

Aplikasi lokal React + Vite + TypeScript, tanpa backend. Dinar (7) dan Delisha (5) membantu Kiko menyalakan mercusuar lewat empat pulau: Angka, Kata, Logika, Kebaikan. Setiap profil memiliki 3 level × 5 aktivitas per pulau (120 aktivitas). Engine berbasis data mendukung pilihan, hitung/ketuk objek, keypad, susun urutan, kelompok, dan grid.

PIN enam digit bersalt PBKDF2; batas 10/15/20/30 menit (default15), zona Asia/Jakarta, maksimal tiga level per sesi. Waktu hanya berjalan di permainan terlihat dan aktif; penyimpanan berkala, refresh dan lintas tab. Semua pulau terbuka, level bertahap, lencana idempotent. Bantuan setelah kesalahan, contoh terbimbing setelah dua kesalahan. Statistik memisahkan percobaan pertama dan terbimbing.

Penyimpanan berversi, validasi, data rusak dipertahankan. Bahasa Indonesia, TTS opsional, akses keyboard/ketuk, reduced motion, 360px. 12 aktivitas offline. Tes unit/komponen dan Playwright, siap import Vercel tanpa deploy pada tugas ini.
