import { CONSEQUENCES } from "./branches";
import type {
  Activity,
  Interaction,
  IslandId,
  Level,
  ProfileId,
} from "../types";
type Seed = [
  instruction: string,
  scene: string,
  interaction: Interaction,
  hint: string,
  explanation: string,
];
const choice = (answer: string, ...others: string[]): Interaction => ({
  kind: "choice",
  options: [...others.slice(0, 1), answer, ...others.slice(1)],
  answer,
});
const order = (...answer: string[]): Interaction => ({
  kind: "order",
  pieces: [...answer.slice(1), answer[0]],
  answer,
});
const count = (
  object: string,
  target: number,
  available = target,
): Interaction => ({
  kind: "count",
  objects: Array.from({ length: available }, () => object),
  target,
});
const number = (answer: number, display: string): Interaction => ({
  kind: "number",
  answer,
  display,
});
const groups = (count: number, size: number, object: string): Interaction => ({
  kind: "number",
  answer: count * size,
  display: `${count} kelompok, masing-masing ${size} ${object}`,
  groups: { count, size, object },
});
const grid = (
  start: number,
  goal: number,
  blocked: number[],
  solution: string[],
): Interaction => ({ kind: "grid", size: 3, start, goal, blocked, solution });
const levels: Level[] = [];
function add(
  profile: ProfileId,
  island: IslandId,
  rank: number,
  title: string,
  objective: string,
  seeds: Seed[],
) {
  const id = `${profile}-${island}-${rank}`;
  levels.push({
    id,
    profile,
    island,
    rank,
    title,
    activities: seeds.map(
      ([instruction, scene, interaction, hint, explanation], i): Activity => ({
        id: `${id}-${i + 1}`,
        profile,
        island,
        level: rank,
        objective,
        instruction,
        scene,
        interaction,
        hint,
        explanation,
      }),
    ),
  });
}
add(
  "delisha",
  "angka",
  1,
  "Kerang untuk Kiko",
  "Menghitung dan mencocokkan jumlah 1–5",
  [
    [
      "Ketuk semua kerang. Ada berapa, ya?",
      "Kiko mengumpulkan kerang di pantai.",
      count("kerang", 3),
      "Sentuh satu kerang, lalu kerang berikutnya.",
      "Satu, dua, tiga. Ada 3 kerang!",
    ],
    [
      "Pilih angka untuk dua bintang laut.",
      "★ ★",
      choice("2", "1", "4"),
      "Hitung bintang satu per satu.",
      "Dua bintang cocok dengan angka 2.",
    ],
    [
      "Masukkan 4 apel ke keranjang.",
      "Ketuk apel yang ingin kamu ambil.",
      count("apel", 4, 6),
      "Berhenti setelah menghitung sampai empat.",
      "Kamu memilih tepat 4 apel.",
    ],
    [
      "Keranjang mana yang lebih banyak?",
      "Bandingkan kedua kumpulan buah.",
      choice("5 pisang", "2 pisang"),
      "Lima lebih besar daripada dua.",
      "Keranjang berisi 5 pisang punya lebih banyak buah.",
    ],
    [
      "Berapa kura-kura yang menyapamu?",
      "Satu Kiko melambaikan tangan.",
      number(1, "1 kura-kura"),
      "Kiko hanya satu. Ketuk angka satu.",
      "Satu kura-kura ditulis dengan angka 1.",
    ],
  ],
);
add(
  "delisha",
  "angka",
  2,
  "Piknik di Pantai",
  "Menghitung 6–10 dan membandingkan jumlah",
  [
    [
      "Ketuk semua ikan di kolam.",
      "Ikan kecil berkumpul dekat pantai.",
      count("ikan", 6),
      "Hitung dengan urutan satu sampai enam.",
      "Ada 6 ikan yang kamu hitung.",
    ],
    [
      "Ambil 7 daun untuk alas piknik.",
      "Pilih daun satu per satu.",
      count("daun", 7, 9),
      "Hitung sampai tujuh, lalu berhenti.",
      "Tujuh daun siap menjadi alas piknik.",
    ],
    [
      "Pilih angka yang cocok.",
      "● ● ● ●\n● ● ● ●",
      choice("8", "6", "9"),
      "Ada empat titik di setiap baris.",
      "Empat titik dan empat titik menjadi delapan titik.",
    ],
    [
      "Mana yang lebih sedikit?",
      "Kiko punya 9 kerang. Lulu punya 6 kerang.",
      choice("6 kerang milik Lulu", "9 kerang milik Kiko"),
      "Enam lebih kecil daripada sembilan.",
      "Lulu punya kerang lebih sedikit.",
    ],
    [
      "Ketuk sepuluh bintang untuk lampu.",
      "Bintang-bintang siap dihitung.",
      count("bintang", 10),
      "Hitung perlahan sampai sepuluh.",
      "Kamu telah menghitung 10 bintang.",
    ],
  ],
);
add(
  "delisha",
  "angka",
  3,
  "Bekal Mercusuar",
  "Mencocokkan bilangan dan jumlah dalam kegiatan",
  [
    [
      "Ambil 5 bekal untuk lima teman.",
      "Satu apel untuk setiap teman.",
      count("apel", 5, 8),
      "Ada lima teman. Masing-masing perlu satu.",
      "Lima teman mendapat lima apel.",
    ],
    [
      "Pilih kumpulan yang sama banyak dengan batu Kiko.",
      "Kiko punya 4 batu.",
      choice("4 daun", "3 daun", "6 daun"),
      "Cari kumpulan yang juga berjumlah empat.",
      "Empat batu dan empat daun sama banyak.",
    ],
    [
      "Berapa piring yang masih kosong?",
      "Ada 3 piring kosong dan 2 piring berisi bekal.",
      number(3, "Piring kosong: ○ ○ ○\nPiring terisi: ● ●"),
      "Hitung hanya lingkaran kosong.",
      "Tiga piring masih kosong.",
    ],
    [
      "Susun angka dari sedikit ke banyak.",
      "Petunjuk jalan menuju mercusuar.",
      order("2", "5", "9"),
      "Mulai dari dua, lalu lima.",
      "Dua lebih sedikit dari lima, dan lima lebih sedikit dari sembilan.",
    ],
    [
      "Pilih keranjang untuk 10 teman.",
      "Setiap teman mendapat satu buah.",
      choice("10 buah", "8 buah", "7 buah"),
      "Jumlah buah harus sama dengan jumlah teman.",
      "Sepuluh buah cukup untuk sepuluh teman.",
    ],
  ],
);
add(
  "dinar",
  "angka",
  1,
  "Jembatan Bilangan",
  "Penjumlahan dan pengurangan sampai 100",
  [
    [
      "Berapa papan jembatan semuanya?",
      "Kiko membawa 24 papan. Lulu membawa 13 papan.",
      number(37, "24 + 13 = ?"),
      "Jumlahkan puluhan, lalu satuan.",
      "20 + 10 = 30 dan 4 + 3 = 7. Jadi ada 37 papan.",
    ],
    [
      "Berapa kerang yang tersisa?",
      "Ada 50 kerang. Sebanyak 18 dipakai menghias.",
      number(32, "50 − 18 = ?"),
      "Kurangi 10 dahulu, kemudian 8.",
      "50 − 10 = 40, lalu 40 − 8 = 32.",
    ],
    [
      "Pilih jumlah bekal yang tepat.",
      "Ada 36 roti dan 27 pisang.",
      choice("63 bekal", "53 bekal", "73 bekal"),
      "6 + 7 = 13; simpan satu puluhan.",
      "30 + 20 + 6 + 7 = 63 bekal.",
    ],
    [
      "Berapa meter lagi Kiko berjalan?",
      "Jalan panjangnya 90 meter. Kiko sudah berjalan 45 meter.",
      number(45, "90 − 45 = ?"),
      "Kurangi 40, lalu 5.",
      "90 − 40 − 5 = 45 meter lagi.",
    ],
    [
      "Lengkapi jumlahnya.",
      "Kita perlu 100 batu. Sudah ada 65 batu.",
      number(35, "65 + ? = 100"),
      "Dari 65 ke 70 perlu 5; ke 100 perlu 30 lagi.",
      "5 + 30 = 35. Jadi perlu 35 batu lagi.",
    ],
  ],
);
add(
  "dinar",
  "angka",
  2,
  "Kebun Kelompok",
  "Perkalian sebagai penjumlahan berulang 2, 5, dan 10",
  [
    [
      "Berapa apel dalam semua kelompok?",
      "Buka setiap keranjang untuk melihat isinya.",
      groups(3, 2, "apel"),
      "Jumlahkan 2 + 2 + 2.",
      "Tiga kelompok berisi dua: 3 × 2 = 6.",
    ],
    [
      "Berapa daun untuk hiasan?",
      "Setiap kelompok berisi lima daun.",
      groups(4, 5, "daun"),
      "Hitung 5, 10, 15, 20.",
      "4 × 5 = 5 + 5 + 5 + 5 = 20.",
    ],
    [
      "Berapa bintang dalam tiga kotak?",
      "Ada sepuluh bintang di setiap kotak.",
      groups(3, 10, "bintang"),
      "Hitung 10, 20, 30.",
      "3 × 10 = 30 bintang.",
    ],
    [
      "Susun hitungan lima-lima.",
      "Kiko menghitung empat kelompok benih.",
      order("5", "10", "15", "20"),
      "Setiap langkah bertambah lima.",
      "5, 10, 15, 20 adalah empat lompatan lima.",
    ],
    [
      "Pilih cerita untuk 5 × 2.",
      "Angka pertama menyatakan banyak kelompok.",
      choice(
        "5 kantong, masing-masing 2 kerang",
        "5 kantong, masing-masing 5 kerang",
        "2 kantong, masing-masing 2 kerang",
      ),
      "Cari lima kelompok dengan dua benda di dalamnya.",
      "5 × 2 berarti 2 + 2 + 2 + 2 + 2 = 10 kerang.",
    ],
  ],
);
add(
  "dinar",
  "angka",
  3,
  "Pasar Persahabatan",
  "Soal cerita uang sederhana dalam rupiah",
  [
    [
      "Berapa rupiah harga kedua barang?",
      "Roti Rp2.000 dan pisang Rp1.000.",
      number(3000, "Rp2.000 + Rp1.000"),
      "Dua ribu ditambah seribu.",
      "Total belanja adalah Rp3.000.",
    ],
    [
      "Berapa rupiah kembaliannya?",
      "Kiko membayar Rp5.000 untuk pensil Rp3.000.",
      number(2000, "Rp5.000 − Rp3.000"),
      "Kurangi tiga ribu dari lima ribu.",
      "Kembalian Kiko Rp2.000.",
    ],
    [
      "Bekal mana yang dapat dibeli?",
      "Uang Lulu Rp4.000. Ia tidak ingin berutang.",
      choice(
        "Roti seharga Rp3.000",
        "Jus seharga Rp5.000",
        "Buku seharga Rp6.000",
      ),
      "Harga harus tidak lebih dari uang Lulu.",
      "Rp3.000 kurang dari Rp4.000. Lulu dapat membeli roti.",
    ],
    [
      "Berapa rupiah harga dua buku?",
      "Satu buku kecil harganya Rp2.000.",
      number(4000, "2 × Rp2.000"),
      "Tambahkan dua ribu dua kali.",
      "Rp2.000 + Rp2.000 = Rp4.000.",
    ],
    [
      "Urutkan langkah berbelanja.",
      "Kiko ingin berbelanja dengan teliti.",
      order(
        "Lihat harga",
        "Hitung uang yang cukup",
        "Bayar dan periksa kembalian",
      ),
      "Ketahui harga sebelum menghitung uang.",
      "Lihat harga, siapkan uang, lalu periksa kembalian bersama orang dewasa.",
    ],
  ],
);
add(
  "delisha",
  "kata",
  1,
  "Jejak Huruf",
  "Mengenal huruf dan bunyi awal dengan gambar",
  [
    [
      "Apel dimulai dengan huruf apa?",
      "🍎 Apel",
      choice("A", "B", "S"),
      "Dengarkan: a-pel.",
      "Apel dimulai dengan huruf A.",
    ],
    [
      "Mana huruf awal ikan?",
      "🐟 Ikan",
      choice("I", "U", "M"),
      "Dengarkan: i-kan.",
      "Ikan dimulai dengan huruf I.",
    ],
    [
      "Pilih gambar yang namanya mulai dengan B.",
      "Ucapkan nama benda pelan-pelan.",
      choice("⚽ Bola", "🍎 Apel", "🐟 Ikan"),
      "B berbunyi pada awal kata bola.",
      "Bola dimulai dengan B.",
    ],
    [
      "Pasangkan huruf kecil a dengan huruf besarnya.",
      "a",
      choice("A", "D", "O"),
      "Bentuknya berbeda, namanya sama: a.",
      "a dan A adalah huruf yang sama.",
    ],
    [
      "Pilih huruf awal matahari.",
      "☀️ Matahari",
      choice("M", "S", "K"),
      "Dengarkan: ma-ta-ha-ri.",
      "Matahari dimulai dengan M.",
    ],
  ],
);
add("delisha", "kata", 2, "Kebun Suku Kata", "Menyusun kata dua suku kata", [
  [
    "Susun kata BOLA.",
    "⚽ Bola untuk bermain bersama.",
    order("bo", "la"),
    "Mulai dengan bo, lalu la.",
    "bo + la menjadi bola.",
  ],
  [
    "Susun kata BUKU.",
    "📖 Buku untuk dibaca bersama.",
    order("bu", "ku"),
    "Ucapkan bu-ku.",
    "bu + ku menjadi buku.",
  ],
  [
    "Susun kata SAPI.",
    "🐄 Sapi makan rumput.",
    order("sa", "pi"),
    "Mulai dengan sa.",
    "sa + pi menjadi sapi.",
  ],
  [
    "Lengkapi kata ma-ta.",
    "👁️ ma + …",
    choice("ta", "ku", "bo"),
    "Kita melihat dengan mata.",
    "ma + ta menjadi mata.",
  ],
  [
    "Susun kata KUDA.",
    "🐎 Kuda berjalan di padang.",
    order("ku", "da"),
    "Ucapkan ku-da.",
    "ku + da menjadi kuda.",
  ],
]);
add(
  "delisha",
  "kata",
  3,
  "Pesan untuk Kiko",
  "Menghubungkan gambar, kata, dan makna sederhana",
  [
    [
      "Pilih kata untuk gambar ini.",
      "🏠",
      choice("rumah", "ikan", "bola"),
      "Tempat kita tinggal.",
      "Gambar itu adalah rumah.",
    ],
    [
      "Susun kata KELAPA.",
      "🥥 Buah di pohon pantai.",
      order("ke", "la", "pa"),
      "Ucapkan ke-la-pa.",
      "ke + la + pa menjadi kelapa.",
    ],
    [
      "Mana benda yang dibaca?",
      "Kiko ingin membaca bersama.",
      choice("📖 Buku", "⚽ Bola", "👟 Sepatu"),
      "Benda ini punya halaman.",
      "Buku berisi gambar atau tulisan untuk dibaca.",
    ],
    [
      "Pilih kata yang mulai dengan S.",
      "Ucapkan nama benda.",
      choice("👟 Sepatu", "🏠 Rumah", "🥥 Kelapa"),
      "Se-pa-tu terdengar s di awal.",
      "Sepatu dimulai dengan S.",
    ],
    [
      "Susun kata MEJA.",
      "Tempat Kiko meletakkan buku.",
      order("me", "ja"),
      "Mulai dengan me.",
      "me + ja menjadi meja.",
    ],
  ],
);
add("dinar", "kata", 1, "Bengkel Kata", "Menyusun kata dan kalimat sederhana", [
  [
    "Susun kata petunjuk ini.",
    "Tempat kapal kecil bersandar.",
    order("der", "ma", "ga"),
    "Mulai dengan der, lalu ma.",
    "der + ma + ga membentuk dermaga.",
  ],
  [
    "Susun kalimat dimulai dengan Kiko.",
    "Kiko membawa bekal untuk perjalanan.",
    order("Kiko", "membawa", "bekal."),
    "Siapa yang membawa? Letakkan Kiko dahulu.",
    "Kiko membawa bekal. Kalimat dimulai dengan huruf besar.",
  ],
  [
    "Susun kalimat dimulai dengan Kami.",
    "Teman-teman menanam bersama.",
    order("Kami", "menanam", "pohon."),
    "Mulai dari siapa, lalu kegiatan, lalu bendanya.",
    "Kami menanam pohon.",
  ],
  [
    "Pilih kata yang tepat.",
    "Kiko merasa haus. Ia … air.",
    choice("minum", "membaca", "menyapu"),
    "Apa yang kita lakukan pada air saat haus?",
    "Kiko minum air saat haus.",
  ],
  [
    "Susun kalimat dimulai dengan Tolong.",
    "Meminta bantuan dengan sopan.",
    order("Tolong", "ambilkan", "buku", "itu."),
    "Tolong berada di awal, itu di akhir.",
    "Tolong ambilkan buku itu. Kata tolong membantu menyampaikan permintaan.",
  ],
]);
add(
  "dinar",
  "kata",
  2,
  "Perpustakaan Daun",
  "Memahami informasi tersurat dalam cerita pendek",
  [
    [
      "Siapa yang membawa payung?",
      "Pagi ini hujan. Lulu membawa payung. Kiko memakai jas hujan.",
      choice("Lulu", "Kiko", "Tidak ada"),
      "Baca kalimat kedua.",
      "Cerita menyebut Lulu membawa payung.",
    ],
    [
      "Mengapa Kiko berhenti berjalan?",
      "Kiko menuju bukit. Di jalan, ia melihat teman terjatuh. Ia berhenti untuk membantu.",
      choice("Untuk membantu teman", "Untuk tidur", "Karena sudah sampai"),
      "Baca tujuan Kiko pada kalimat terakhir.",
      "Kiko berhenti karena ingin membantu teman yang terjatuh.",
    ],
    [
      "Di mana benih ditanam?",
      "Lulu membawa benih bunga. Ia menanamnya di pot dekat jendela. Setiap pagi ia menyiramnya.",
      choice("Di pot dekat jendela", "Di dalam tas", "Di atas buku"),
      "Cari kata di pada kalimat kedua.",
      "Benih ditanam di pot dekat jendela.",
    ],
    [
      "Apa yang dilakukan sebelum membaca?",
      "Dinar merapikan meja. Setelah itu ia membaca buku. Selesai membaca, ia menyimpan buku.",
      choice("Merapikan meja", "Menyimpan buku", "Mematikan lampu"),
      "Ikuti urutan cerita dari awal.",
      "Dinar merapikan meja sebelum membaca buku.",
    ],
    [
      "Pilih judul yang paling cocok.",
      "Kiko dan Lulu memungut sampah di pantai. Mereka memasukkannya ke tempat sampah. Pantai kembali bersih.",
      choice(
        "Bersama Membersihkan Pantai",
        "Lomba Memasak",
        "Berjalan di Salju",
      ),
      "Cari kegiatan utama yang dilakukan bersama.",
      "Cerita berisi kerja sama membersihkan pantai.",
    ],
  ],
);
add(
  "dinar",
  "kata",
  3,
  "Surat Mercusuar",
  "Mengurutkan cerita dan menarik kesimpulan sederhana",
  [
    [
      "Susun cerita sesuai waktu.",
      "Perjalanan sebuah tanaman.",
      order("Benih ditanam.", "Benih disiram.", "Tunas tumbuh."),
      "Tanam dahulu sebelum menyiramnya.",
      "Benih ditanam, disiram, lalu tumbuh menjadi tunas.",
    ],
    [
      "Bagaimana perasaan Lulu di akhir cerita?",
      "Lulu kehilangan pensil dan tampak sedih. Kiko membantu mencarinya. Pensil ditemukan di bawah meja. Lulu tersenyum lega.",
      choice("Lega", "Masih takut", "Marah kepada Kiko"),
      "Perhatikan kalimat terakhir.",
      "Lulu tersenyum lega karena pensilnya ditemukan.",
    ],
    [
      "Apa yang sebaiknya dibawa Kiko?",
      "Kiko akan berjalan saat siang terik. Jalannya cukup jauh. Tidak ada tempat membeli minuman.",
      choice("Botol air minum", "Selimut tebal", "Mainan besar"),
      "Pikirkan kebutuhan saat haus.",
      "Air minum membantu memenuhi kebutuhan minum selama perjalanan.",
    ],
    [
      "Susun pesan dimulai dengan Mari.",
      "Ajakan menjaga taman.",
      order("Mari", "jaga", "kebersihan", "taman."),
      "Setelah Mari, letakkan kata jaga.",
      "Mari jaga kebersihan taman. Ini kalimat ajakan.",
    ],
    [
      "Mengapa teman-teman membagi tugas?",
      "Lampu mercusuar perlu dibersihkan. Kiko menyapu lantai. Lulu mengelap meja. Pekerjaan selesai bersama.",
      choice(
        "Agar pekerjaan dikerjakan bersama",
        "Agar saling berlomba",
        "Agar satu teman bekerja sendiri",
      ),
      "Setiap teman mengerjakan bagian berbeda.",
      "Membagi tugas membantu mereka bekerja sama.",
    ],
  ],
);
add(
  "delisha",
  "logika",
  1,
  "Jejak Bentuk",
  "Melanjutkan pola dan mengenali bentuk",
  [
    [
      "Bentuk apa sesudah ini?",
      "● ▲ ● ▲ ● …",
      choice("▲ segitiga", "● lingkaran", "■ persegi"),
      "Lingkaran dan segitiga bergantian.",
      "Sesudah lingkaran adalah segitiga.",
    ],
    [
      "Lanjutkan pola ini.",
      "★ ★ ● ★ ★ …",
      choice("● lingkaran", "★ bintang", "▲ segitiga"),
      "Dua bintang diikuti satu lingkaran.",
      "Bagian yang berulang adalah bintang, bintang, lingkaran.",
    ],
    [
      "Mana yang bentuknya berbeda?",
      "Dua benda bulat dan satu bersudut.",
      choice("■ persegi", "● lingkaran", "○ lingkaran kosong"),
      "Cari bentuk yang memiliki sudut.",
      "Persegi mempunyai empat sudut.",
    ],
    [
      "Pilih yang sama dengan contoh.",
      "Contoh: ▲ segitiga merah",
      choice("▲ segitiga merah", "● lingkaran merah", "■ persegi biru"),
      "Perhatikan bentuk dan namanya, bukan warna saja.",
      "Segitiga merah cocok dengan contoh.",
    ],
    [
      "Lanjutkan pola ukuran.",
      "Kecil → Besar → Kecil → …",
      choice("Besar", "Kecil", "Sangat kecil"),
      "Ukuran kecil dan besar bergantian.",
      "Sesudah kecil, pola ini kembali ke besar.",
    ],
  ],
);
add(
  "delisha",
  "logika",
  2,
  "Keranjang Rapi",
  "Mengelompokkan benda berdasarkan fungsi",
  [
    [
      "Mana yang termasuk buah?",
      "Kiko sedang memilih bekal.",
      choice("🍎 Apel", "👟 Sepatu", "📖 Buku"),
      "Buah tumbuh pada tanaman dan bisa dimakan.",
      "Apel termasuk buah.",
    ],
    [
      "Pilih benda untuk menggambar.",
      "Kertas sudah tersedia.",
      choice("Pensil warna", "Sendok", "Bantal"),
      "Cari alat yang membuat garis berwarna.",
      "Pensil warna dipakai untuk menggambar.",
    ],
    [
      "Mana yang masuk rak sepatu?",
      "Kita merapikan rumah.",
      choice("Sandal", "Piring", "Buku"),
      "Cari benda yang dipakai di kaki.",
      "Sandal disimpan bersama alas kaki.",
    ],
    [
      "Mana hewan yang hidup di air?",
      "Pilih penghuni kolam.",
      choice("🐟 Ikan", "🐈 Kucing", "🐔 Ayam"),
      "Hewan ini berenang dengan sirip.",
      "Ikan hidup di air dan berenang dengan sirip.",
    ],
    [
      "Mana yang berbeda kegunaannya?",
      "Dua alat makan dan satu alat tidur.",
      choice("Bantal", "Sendok", "Garpu"),
      "Sendok dan garpu digunakan saat makan.",
      "Bantal digunakan untuk tidur.",
    ],
  ],
);
add(
  "delisha",
  "logika",
  3,
  "Langkah Kecil",
  "Mengurutkan tiga kegiatan sehari-hari",
  [
    [
      "Susun langkah mencuci tangan.",
      "Gunakan air dan sabun bersama pendamping.",
      order("Basahi tangan", "Gosok dengan sabun", "Bilas sampai bersih"),
      "Basahi dahulu, bilas terakhir.",
      "Basahi tangan, gosok dengan sabun, lalu bilas.",
    ],
    [
      "Susun kegiatan memakai sepatu.",
      "Kiko bersiap berjalan.",
      order("Ambil sepatu", "Masukkan kaki", "Rekatkan perekat"),
      "Sepatu harus diambil dahulu.",
      "Ambil, pakai, lalu rekatkan sepatu.",
    ],
    [
      "Susun kegiatan menggambar.",
      "Kiko ingin menggambar laut.",
      order("Siapkan kertas", "Buat gambar", "Simpan alat gambar"),
      "Kertas disiapkan sebelum menggambar.",
      "Siapkan kertas, gambar, lalu simpan alatnya.",
    ],
    [
      "Susun kegiatan makan pisang.",
      "Pisang sudah dicuci oleh orang dewasa.",
      order("Kupas pisang", "Makan pisang", "Buang kulit ke tempat sampah"),
      "Kulit dibuka dahulu.",
      "Kupas pisang, makan, lalu buang kulitnya.",
    ],
    [
      "Susun perjalanan Kiko.",
      "Kiko berangkat dari rumah menuju taman.",
      order(
        "Keluar rumah bersama pendamping",
        "Berjalan ke taman",
        "Tiba di taman",
      ),
      "Berangkat dahulu, tiba terakhir.",
      "Kiko berangkat dan berjalan bersama pendamping, lalu tiba di taman.",
    ],
  ],
);
add("dinar", "logika", 1, "Tangga Pola", "Mengenali pola angka dan aturan", [
  [
    "Angka apa yang berikutnya?",
    "3, 6, 9, 12, …",
    number(15, "3 → 6 → 9 → 12 → ?"),
    "Setiap angka bertambah tiga.",
    "12 + 3 = 15.",
  ],
  [
    "Lengkapi pola yang turun.",
    "50, 40, 30, …",
    number(20, "50 → 40 → 30 → ?"),
    "Kurangi sepuluh setiap langkah.",
    "30 − 10 = 20.",
  ],
  [
    "Susun bilangan berjarak lima.",
    "Mulai dari 7, urutkan dari kecil ke besar.",
    order("7", "12", "17", "22"),
    "Tambahkan lima setiap langkah.",
    "7 + 5 = 12, lalu 17, lalu 22.",
  ],
  [
    "Pilih aturan pola ini.",
    "2, 4, 8, 16",
    choice("Dikali 2", "Ditambah 2", "Dikurangi 2"),
    "Periksa perubahan 4 menjadi 8 dan 8 menjadi 16.",
    "Setiap angka dua kali angka sebelumnya.",
  ],
  [
    "Angka mana yang mengisi celah?",
    "1, 3, …, 7, 9",
    number(5, "1 → 3 → ? → 7 → 9"),
    "Pola bertambah dua.",
    "3 + 2 = 5, dan 5 + 2 = 7.",
  ],
]);
add(
  "dinar",
  "logika",
  2,
  "Jembatan Sebab Akibat",
  "Mengurutkan sebab, tindakan, dan akibat",
  [
    [
      "Susun kejadian tanaman.",
      "Kiko merawat tanaman yang layu.",
      order("Tanah kering", "Tanaman disiram", "Tanaman kembali segar"),
      "Tanah kering adalah keadaan awal.",
      "Tanaman yang kekurangan air disiram agar kembali segar.",
    ],
    [
      "Mengapa lantai menjadi basah?",
      "Gelas air terjatuh. Air mengalir ke lantai.",
      choice("Air dari gelas tumpah", "Buku dibuka", "Jendela ditutup"),
      "Peristiwa mana yang terjadi lebih dahulu?",
      "Gelas jatuh menyebabkan air tumpah ke lantai.",
    ],
    [
      "Susun cara mengatasi buku berantakan.",
      "Kiko ingin mencari buku dengan mudah.",
      order(
        "Buku bercampur di lantai",
        "Kelompokkan dan susun di rak",
        "Buku mudah ditemukan",
      ),
      "Masalah muncul sebelum tindakan.",
      "Merapikan buku membuatnya lebih mudah ditemukan.",
    ],
    [
      "Apa akibat membuang sampah pada tempatnya?",
      "Teman-teman selesai piknik.",
      choice(
        "Tempat piknik lebih bersih",
        "Sampah berserakan",
        "Pohon langsung berbuah",
      ),
      "Pikirkan keadaan tempat setelah sampah dirapikan.",
      "Membuang sampah pada tempatnya membantu menjaga kebersihan.",
    ],
    [
      "Susun langkah saat hujan di perjalanan.",
      "Kiko berjalan bersama orang dewasa.",
      order(
        "Hujan mulai turun",
        "Berteduh di tempat aman bersama pendamping",
        "Lanjut saat aman",
      ),
      "Cari tempat aman ketika hujan mulai.",
      "Berteduh bersama pendamping membantu perjalanan tetap aman.",
    ],
  ],
);
add(
  "dinar",
  "logika",
  3,
  "Jalur Mercusuar",
  "Merencanakan jalur pada grid 3 × 3",
  [
    [
      "Antar Kiko ke bintang di kanan bawah.",
      "Hindari batu bertanda ×.",
      grid(0, 8, [4], ["kanan", "kanan", "bawah", "bawah"]),
      "Lewat baris atas, lalu turun di tepi kanan.",
      "Dua langkah kanan, dua langkah bawah melewati tepi grid.",
    ],
    [
      "Antar Kiko ke pojok kanan atas.",
      "Jalan tengah tertutup.",
      grid(6, 2, [4, 5], ["atas", "atas", "kanan", "kanan"]),
      "Naik melalui tepi kiri dahulu.",
      "Dua langkah atas lalu dua langkah kanan mencapai bintang.",
    ],
    [
      "Capai bintang di kiri bawah.",
      "Batu menutup jalur atas bagian tengah.",
      grid(2, 6, [1, 4], ["bawah", "bawah", "kiri", "kiri"]),
      "Turun di tepi kanan, kemudian ke kiri.",
      "Dua langkah bawah dan dua langkah kiri menghindari batu.",
    ],
    [
      "Bawa Kiko ke tengah.",
      "Pintu masuk tengah ada dari sebelah kanan.",
      grid(0, 4, [1, 3], ["kanan"]),
      "Jalan awal tertutup? Perhatikan jalur yang tersedia.",
      "Jalur dapat direncanakan dengan melihat semua penghalang.",
    ],
    [
      "Sampai ke bintang kiri atas.",
      "Batu menutup bagian tengah dan kanan atas.",
      grid(8, 0, [4, 2], ["kiri", "kiri", "atas", "atas"]),
      "Berjalan di baris bawah, lalu naik di tepi kiri.",
      "Dua langkah kiri dan dua langkah atas mencapai bintang.",
    ],
  ],
);
// Jalur ke tengah: berangkat dari kanan bawah dengan satu pintu terbuka.
const center = levels.find((l) => l.id === "dinar-logika-3")!.activities[3];
center.interaction = grid(8, 4, [1, 3, 7], ["atas", "kiri"]);
center.hint = "Naik satu langkah, lalu ke kiri.";
center.explanation = "Atas lalu kiri masuk ke tengah melalui pintu kanan.";
add(
  "delisha",
  "kebaikan",
  1,
  "Taman Perasaan",
  "Mengenali perasaan dan menerima semua emosi",
  [
    [
      "Bagaimana perasaan Kiko?",
      "Mainan Kiko rusak. Matanya berkaca-kaca.",
      choice("Sedih", "Gembira", "Mengantuk"),
      "Kiko kehilangan sesuatu yang ia sukai.",
      "Kiko mungkin sedih. Semua perasaan boleh dirasakan.",
    ],
    [
      "Apa yang bisa dilakukan saat marah?",
      "Lulu kesal karena menunggu giliran.",
      choice(
        "Tarik napas dan bilang sedang kesal",
        "Memukul teman",
        "Melempar mainan",
      ),
      "Perasaan marah boleh ada; pilih tindakan yang aman.",
      "Marah boleh dirasakan. Bernapas dan bercerita membantu menjaga tindakan tetap aman.",
    ],
    [
      "Apa yang membuat Kiko tampak senang?",
      "Kiko tersenyum saat temannya datang bermain.",
      choice("Bertemu teman", "Sepatunya hilang", "Terjatuh"),
      "Kiko tersenyum saat teman datang.",
      "Kiko tampak senang bisa bermain bersama teman.",
    ],
    [
      "Siapa yang bisa membantu saat takut?",
      "Suara keras membuat Lulu takut.",
      choice(
        "Orang dewasa tepercaya",
        "Orang asing yang mengajak pergi",
        "Tidak boleh bercerita",
      ),
      "Cari pendamping yang kamu kenal dan percaya.",
      "Takut boleh dirasakan. Ceritakan kepada orang dewasa tepercaya.",
    ],
    [
      "Apa yang bisa kita katakan kepada teman sedih?",
      "Temanmu belum ingin bermain.",
      choice(
        "Aku di sini kalau kamu ingin ditemani",
        "Jangan sedih!",
        "Aku akan menertawakanmu",
      ),
      "Tawarkan teman ruang dan dukungan.",
      "Kita dapat menemani tanpa memaksa teman berhenti sedih.",
    ],
  ],
);
add(
  "delisha",
  "kebaikan",
  2,
  "Ayunan Bersama",
  "Bergiliran dan merawat barang bersama",
  [
    [
      "Apa yang dilakukan saat teman memakai ayunan?",
      "Kiko juga ingin bermain ayunan.",
      choice(
        "Menunggu dan meminta giliran",
        "Mendorong teman",
        "Merebut ayunan",
      ),
      "Teman berhak menyelesaikan gilirannya.",
      "Kiko dapat menunggu dan berkata: setelah kamu, boleh aku?",
    ],
    [
      "Susun langkah meminjam mainan.",
      "Mainan itu milik Lulu.",
      order("Minta izin", "Gunakan setelah diizinkan", "Kembalikan mainan"),
      "Izin diminta sebelum memakai.",
      "Minta izin, gunakan dengan hati-hati, lalu kembalikan.",
    ],
    [
      "Apa yang dilakukan setelah bermain balok?",
      "Balok berserakan di jalan.",
      choice("Simpan balok ke kotaknya", "Biarkan di jalan", "Lempar ke luar"),
      "Jalan perlu kosong agar orang tidak tersandung.",
      "Menyimpan balok membuat tempat bermain lebih aman.",
    ],
    [
      "Susun langkah merapikan mainan.",
      "Kiko selesai bermain.",
      order(
        "Kumpulkan mainan",
        "Masukkan ke kotak",
        "Letakkan kotak di rak rendah",
      ),
      "Kumpulkan dahulu, simpan di tempat yang mudah dijangkau.",
      "Mainan yang dirapikan mudah ditemukan saat bermain lagi.",
    ],
    [
      "Bagaimana jika belum selesai saat giliran habis?",
      "Teman sudah menunggu.",
      choice(
        "Berikan giliran dan tunggu lagi",
        "Sembunyikan mainan",
        "Dorong teman menjauh",
      ),
      "Setiap teman perlu kesempatan bermain.",
      "Bergiliran memberi semua teman kesempatan. Kesal boleh, merebut bukan tindakan aman.",
    ],
  ],
);
add(
  "delisha",
  "kebaikan",
  3,
  "Berani Minta Bantuan",
  "Kemandirian dengan pendamping dan keselamatan",
  [
    [
      "Apa yang dilakukan jika rak terlalu tinggi?",
      "Buku Kiko ada di rak tinggi.",
      choice("Minta bantuan orang dewasa tepercaya", "Panjat rak", "Tarik rak"),
      "Rak bukan tempat memanjat.",
      "Meminta bantuan adalah pilihan aman untuk mengambil benda tinggi.",
    ],
    [
      "Kamu terpisah dari pendamping di toko. Apa langkah aman?",
      "Tetap di area yang aman.",
      choice(
        "Minta petugas toko membantu mencari pendamping",
        "Keluar bersama orang asing",
        "Bersembunyi",
      ),
      "Cari petugas toko; jangan ikut orang asing pergi.",
      "Tetap di area aman dan minta petugas menghubungi pendamping.",
    ],
    [
      "Susun persiapan berangkat.",
      "Kiko akan keluar bersama pendamping.",
      order(
        "Rapikan mainan",
        "Pakai alas kaki",
        "Berangkat bersama pendamping",
      ),
      "Rapikan dahulu, berangkat terakhir.",
      "Kegiatan kecil dapat dilakukan sendiri dengan dukungan pendamping.",
    ],
    [
      "Apa yang dilakukan saat menemukan benda tajam?",
      "Ada pecahan kaca di lantai.",
      choice(
        "Menjauh dan beri tahu orang dewasa",
        "Ambil dengan tangan",
        "Ajak teman menginjak",
      ),
      "Jangan sentuh pecahan kaca.",
      "Menjauh lalu meminta bantuan orang dewasa menjaga tubuh tetap aman.",
    ],
    [
      "Bagaimana meminta bantuan membuka kotak?",
      "Lulu sudah mencoba, tetapi tutupnya sulit dibuka.",
      choice(
        "Tolong bantu buka kotak ini",
        "Melempar kotak",
        "Menarik dengan gigi",
      ),
      "Gunakan kata tolong dan jelaskan kebutuhanmu.",
      "Meminta bantuan boleh dilakukan saat sesuatu terasa sulit.",
    ],
  ],
);
add(
  "dinar",
  "kebaikan",
  1,
  "Sahabat yang Mendengar",
  "Empati dan menghargai perasaan",
  [
    [
      "Bagaimana menemani teman yang kecewa?",
      "Lulu belum berhasil menyusun jembatan balok.",
      choice(
        "Tanya apakah ia ingin ditemani atau dibantu",
        "Bilang ia tidak boleh kecewa",
        "Tertawakan bangunannya",
      ),
      "Akui perasaannya dan tanyakan kebutuhannya.",
      "Kecewa boleh dirasakan. Menanyakan kebutuhan memberi teman pilihan.",
    ],
    [
      "Apa yang bisa dikatakan saat kamu kesal?",
      "Teman tidak sengaja merusak gambarmu.",
      choice(
        "Aku kesal karena gambarku rusak. Ayo cari cara memperbaikinya",
        "Langsung menyalahkan teman",
        "Aku akan merusak barangmu",
      ),
      "Sebutkan perasaan dan masalah tanpa menyerang teman.",
      "Perasaan kesal boleh ada. Jelaskan masalah dan cari penyelesaian bersama.",
    ],
    [
      "Susun langkah mendengarkan teman.",
      "Teman ingin bercerita.",
      order(
        "Beri perhatian",
        "Dengarkan sampai selesai",
        "Tanya bantuan yang dibutuhkan",
      ),
      "Dengarkan sebelum memberi saran.",
      "Memberi perhatian dan mendengarkan membantu memahami teman.",
    ],
    [
      "Teman memilih duduk tenang. Apa tanggapanmu?",
      "Ia bilang sedang sedih dan butuh waktu.",
      choice(
        "Hormati pilihannya dan tawarkan menemani nanti",
        "Paksa ikut bermain",
        "Bilang sedih itu salah",
      ),
      "Setiap orang bisa membutuhkan cara menenangkan diri berbeda.",
      "Sedih boleh dirasakan. Beri ruang dan tetap tawarkan dukungan.",
    ],
    [
      "Bagaimana menyambut teman baru?",
      "Teman baru belum mengenal permainan.",
      choice(
        "Kenalkan diri dan tawarkan menjelaskan aturan",
        "Langsung menuntut ia bisa",
        "Biarkan ia selalu sendiri",
      ),
      "Beri kesempatan untuk merasa diterima.",
      "Perkenalan dan penjelasan sederhana membantu teman baru ikut bermain bila ia mau.",
    ],
  ],
);
add(
  "dinar",
  "kebaikan",
  2,
  "Jembatan Kerja Sama",
  "Menyelesaikan konflik sederhana dan berbagi tugas",
  [
    [
      "Apa langkah pertama saat dua teman berebut pensil?",
      "Keduanya ingin warna yang sama.",
      choice(
        "Berhenti menarik dan bicara bergiliran",
        "Tarik lebih kuat",
        "Sembunyikan semua pensil",
      ),
      "Amankan tangan dan benda sebelum membicarakan solusi.",
      "Berhenti menarik, lalu dengarkan kebutuhan masing-masing.",
    ],
    [
      "Susun cara menyelesaikan konflik.",
      "Kiko dan Lulu berbeda pilihan permainan.",
      order(
        "Dengarkan kedua pilihan",
        "Sepakati giliran bersama",
        "Jalankan kesepakatan",
      ),
      "Pahami pilihan masing-masing sebelum membuat kesepakatan.",
      "Mendengarkan, menyepakati, dan menjalankan giliran membantu menyelesaikan konflik.",
    ],
    [
      "Bagaimana membagi pekerjaan piknik?",
      "Ada bekal dan alas piknik yang perlu disiapkan.",
      choice(
        "Sepakati tugas sesuai kemampuan masing-masing",
        "Suruh satu teman mengerjakan semua",
        "Berlomba sampai ada yang menang",
      ),
      "Pikirkan tugas yang bisa dilakukan tiap teman.",
      "Pembagian tugas yang disepakati memberi semua teman peran.",
    ],
    [
      "Apa yang dilakukan jika tugasmu terasa terlalu sulit?",
      "Kamu belum bisa membawa wadah besar.",
      choice(
        "Jelaskan kesulitan dan minta bantuan",
        "Tetap angkat meski hampir jatuh",
        "Salahkan teman",
      ),
      "Bekerja sama termasuk meminta bantuan.",
      "Jelaskan kebutuhanmu agar teman atau pendamping dapat membantu dengan aman.",
    ],
    [
      "Susun langkah memperbaiki kesalahan.",
      "Kiko tidak sengaja menumpahkan air di gambar Lulu.",
      order(
        "Akui kejadian dan minta maaf",
        "Tanya cara membantu memperbaiki",
        "Lakukan bantuan yang disepakati",
      ),
      "Akui kejadian sebelum menawarkan bantuan.",
      "Meminta maaf disertai usaha memperbaiki menunjukkan tanggung jawab.",
    ],
  ],
);
add(
  "dinar",
  "kebaikan",
  3,
  "Penjaga Desa",
  "Keselamatan sehari-hari dan orang dewasa tepercaya",
  [
    [
      "Apa yang dilakukan sebelum menyeberang?",
      "Jalan di depan taman ramai kendaraan.",
      choice(
        "Minta pendamping dan gunakan tempat penyeberangan saat aman",
        "Lari tanpa melihat",
        "Ikuti teman yang berlari",
      ),
      "Cari bantuan orang dewasa tepercaya.",
      "Menyeberang bersama pendamping di tempat penyeberangan saat aman.",
    ],
    [
      "Bagaimana menanggapi ajakan orang asing?",
      "Orang yang tidak dikenal mengajak pergi mencari hadiah.",
      choice(
        "Tolak, tetap di tempat aman, dan beri tahu pendamping",
        "Ikut karena ada hadiah",
        "Rahasiakan ajakannya",
      ),
      "Hadiah bukan alasan untuk pergi dengan orang asing.",
      "Jangan ikut. Dekati orang dewasa tepercaya dan ceritakan kejadian itu.",
    ],
    [
      "Susun langkah saat mencium bau terbakar.",
      "Kamu melihat asap dekat alat listrik.",
      order(
        "Menjauh dari sumber asap",
        "Segera beri tahu orang dewasa",
        "Ikuti arahan ke tempat aman",
      ),
      "Jangan menyentuh alat atau mencoba memadamkan sendiri.",
      "Menjauh dan mencari orang dewasa adalah tindakan aman.",
    ],
    [
      "Apa yang dilakukan jika pesan di layar membuat tidak nyaman?",
      "Seseorang meminta alamat rumah lewat pesan.",
      choice(
        "Jangan beri alamat; tunjukkan kepada orang dewasa tepercaya",
        "Kirim alamat agar sopan",
        "Simpan sebagai rahasia",
      ),
      "Informasi rumah tidak perlu diberikan kepada orang asing.",
      "Hentikan percakapan dan minta bantuan orang dewasa tepercaya.",
    ],
    [
      "Apa yang dilakukan jika diminta menyimpan rahasia yang membuat takut?",
      "Seseorang melarangmu bercerita tentang sesuatu yang menyakitkan.",
      choice(
        "Ceritakan kepada orang dewasa tepercaya sampai mendapat bantuan",
        "Harus diam selamanya",
        "Salahkan dirimu sendiri",
      ),
      "Kamu boleh bercerita tentang hal yang membuatmu tidak aman.",
      "Rasa takut boleh dirasakan. Kamu tidak bersalah karena meminta pertolongan; cari orang dewasa tepercaya.",
    ],
  ],
);
// Posisi jawaban bervariasi dan stabil saat refresh.
for (const l of levels)
  for (const a of l.activities) {
    const t = a.interaction;
    if (t.kind === "choice") {
      const offset =
        [...a.id].reduce((sum, c) => sum + c.charCodeAt(0), 0) %
        t.options.length;
      t.options = [...t.options.slice(offset), ...t.options.slice(0, offset)];
    }
  }
for (const l of levels.filter((l) => l.island === "kebaikan"))
  for (const a of l.activities) {
    const t = a.interaction;
    if (t.kind === "choice")
      a.interaction = {
        ...t,
        kind: "story",
        branches: Object.fromEntries(
          t.options.map((option) => [
            option,
            option === t.answer ? a.explanation : (CONSEQUENCES[option] ?? ""),
          ]),
        ),
      };
  }
export const LEVELS = levels;
export const ISLANDS: {
  id: IslandId;
  name: string;
  short: string;
  description: string;
  color: string;
  icon: string;
}[] = [
  {
    id: "angka",
    name: "Pulau Angka",
    short: "Angka",
    description: "Hitung bekal, temukan keajaiban.",
    color: "#f5b85d",
    icon: "123",
  },
  {
    id: "kata",
    name: "Hutan Kata",
    short: "Kata",
    description: "Rangkai kata, buka cerita.",
    color: "#78c5a7",
    icon: "Aa",
  },
  {
    id: "logika",
    name: "Bukit Logika",
    short: "Logika",
    description: "Ikuti pola, jelajahi jalan baru.",
    color: "#b5a0df",
    icon: "◇",
  },
  {
    id: "kebaikan",
    name: "Desa Kebaikan",
    short: "Kebaikan",
    description: "Kenali perasaan, bantu teman.",
    color: "#eea197",
    icon: "♡",
  },
];
export const OFFLINE = [
  [
    "Pemburu bentuk",
    "Cari tiga benda berbentuk lingkaran di rumah bersama pendamping.",
  ],
  [
    "Keranjang hitung",
    "Hitung lima benda besar yang aman, lalu rapikan kembali.",
  ],
  ["Gambar pulau", "Gambarlah pulau impianmu dengan kertas dan pensil warna."],
  [
    "Cerita perasaan",
    "Ceritakan satu perasaan hari ini kepada orang dewasa tepercaya.",
  ],
  ["Rak yang rapi", "Rapikan tiga mainan ke tempatnya yang mudah dijangkau."],
  [
    "Kata di rumah",
    "Cari benda yang namanya dimulai dengan huruf B bersama pendamping.",
  ],
  ["Piknik mini", "Bantu menyiapkan sendok untuk setiap anggota keluarga."],
  ["Jejak pola", "Susun pola sendok–kain–sendok–kain di meja rendah."],
  [
    "Baca bersama",
    "Pilih buku dan baca bersama orang dewasa. Ceritakan bagian favoritmu.",
  ],
  [
    "Giliran bercerita",
    "Bergiliran membuat cerita satu kalimat bersama keluarga.",
  ],
  [
    "Terima kasih",
    "Sebutkan satu bantuan yang kamu terima dan ucapkan terima kasih.",
  ],
  [
    "Gerak kura-kura",
    "Berjalan perlahan seperti Kiko di ruang yang lapang bersama pendamping.",
  ],
];
