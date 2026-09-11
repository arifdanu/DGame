import type { ProfileId, Quiz, QuizId } from "./types";
const basic: Record<ProfileId, Record<Exclude<QuizId, "lab">, Quiz>> = {
  delisha: {
    science: {
      id: "science",
      title: "Penemuan di pantai",
      prompt: "Benda mana yang berasal dari tumbuhan?",
      illustration: "🪨  🍃  🐚",
      options: ["Daun", "Batu", "Kerang"],
      answer: "Daun",
      explanation:
        "Daun tumbuh pada tumbuhan. Daun membantu tumbuhan membuat makanan dengan cahaya matahari.",
    },
    letters: {
      id: "letters",
      title: "Hutan Huruf",
      prompt: "Huruf A adalah awal dari gambar…",
      illustration: "A",
      options: ["🍎 Apel", "🐟 Ikan", "🐈 Kucing"],
      answer: "🍎 Apel",
      explanation: "A untuk Apel. A-p-e-l. Yuk, ucapkan bersama!",
    },
    count: {
      id: "count",
      title: "Hitung Bintang",
      prompt: "Berapa bintang yang kamu kumpulkan di taman?",
      illustration: "⭐ ⭐ ⭐ ⭐ ⭐",
      options: ["3", "5", "7"],
      answer: "5",
      explanation:
        "Mari hitung satu per satu: satu, dua, tiga, empat, lima. Ada 5 bintang!",
    },
  },
  dinar: {
    science: {
      id: "science",
      title: "Penemuan di pantai",
      prompt: "Mengapa daun membutuhkan cahaya matahari?",
      illustration: "☀️ → 🍃",
      options: [
        "Untuk membuat makanan",
        "Agar menjadi batu",
        "Untuk menghasilkan pasir",
      ],
      answer: "Untuk membuat makanan",
      explanation:
        "Dengan air dan cahaya matahari, tumbuhan membuat makanannya sendiri. Proses ini disebut fotosintesis.",
    },
    letters: {
      id: "letters",
      title: "Hutan Huruf",
      prompt: "Susun huruf menjadi nama benda yang kita baca.",
      illustration: "📚",
      options: ["U", "K", "B", "U"],
      answer: "BUKU",
      explanation:
        "B-U-K-U membentuk kata BUKU. Kita membaca buku untuk belajar hal baru.",
      order: true,
    },
    count: {
      id: "count",
      title: "Hitung Bintang",
      prompt: "Kamu punya 7 bintang dan menemukan 5 lagi. Berapa semuanya?",
      illustration: "7 + 5 = ?",
      options: ["10", "12", "14"],
      answer: "12",
      explanation:
        "Mulai dari 7, lalu hitung 5 langkah: 8, 9, 10, 11, 12. Jadi 7 + 5 = 12.",
    },
  },
};
const lab: Record<ProfileId, Omit<Quiz, "id" | "title">[]> = {
  delisha: [
    {
      prompt: "Mana yang termasuk warna dasar?",
      illustration: "🎨",
      options: ["Merah", "Kursi", "Kucing"],
      answer: "Merah",
      explanation:
        "Merah adalah warna. Kursi adalah benda, dan kucing adalah hewan.",
    },
    {
      prompt: "Bentuk apa yang bulat seperti roda?",
      illustration: "🛞",
      options: ["Lingkaran", "Segitiga", "Persegi"],
      answer: "Lingkaran",
      explanation: "Lingkaran berbentuk bulat dan tidak mempunyai sudut.",
    },
    {
      prompt: "Hewan mana yang hidup di air?",
      illustration: "🌊",
      options: ["Ikan", "Ayam", "Kucing"],
      answer: "Ikan",
      explanation: "Ikan hidup di air dan bernapas menggunakan insang.",
    },
    {
      prompt: "Ada dua apel. Ditambah satu, menjadi berapa?",
      illustration: "🍎 🍎 + 🍎",
      options: ["2", "3", "4"],
      answer: "3",
      explanation: "Dua ditambah satu menjadi tiga. Yuk hitung apelnya!",
    },
    {
      prompt: "Angka apa yang datang setelah 9?",
      illustration: "7 · 8 · 9 · ?",
      options: ["8", "10", "6"],
      answer: "10",
      explanation:
        "Setelah sembilan adalah sepuluh. Kamu sudah mengenal angka 1 sampai 10!",
    },
  ],
  dinar: [
    {
      prompt: "Ada 12 kerang. Empat dikembalikan ke pantai. Berapa sisanya?",
      illustration: "12 − 4 = ?",
      options: ["6", "8", "10"],
      answer: "8",
      explanation: "12 dikurangi 4 sama dengan 8.",
    },
    {
      prompt: "Ada 3 keranjang. Masing-masing berisi 2 apel. Ada berapa apel?",
      illustration: "🍎🍎  🍎🍎  🍎🍎",
      options: ["5", "6", "9"],
      answer: "6",
      explanation: "3 × 2 artinya 2 + 2 + 2, hasilnya 6.",
    },
    {
      prompt: "Apa bahasa Inggris dari “buku”?",
      illustration: "📖",
      options: ["Book", "Tree", "Fish"],
      answer: "Book",
      explanation:
        "Book berarti buku. Tree berarti pohon dan fish berarti ikan.",
    },
    {
      prompt: "“Ibu menanam bunga di taman.” Apa yang ditanam Ibu?",
      illustration: "🌷",
      options: ["Bunga", "Batu", "Kerang"],
      answer: "Bunga",
      explanation: "Kalimat itu bercerita tentang Ibu yang menanam bunga.",
    },
  ],
};
export function getQuiz(profile: ProfileId, id: QuizId, round = 0): Quiz {
  return id === "lab"
    ? {
        id,
        title: "Klub Peneliti Kecil",
        ...lab[profile][round % lab[profile].length],
      }
    : basic[profile][id];
}
