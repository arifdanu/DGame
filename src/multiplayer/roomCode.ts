// 32 symbols, six independent draws: 30 bits. No modulo bias; no ambiguous 0/1/I/O.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function generateRoomCode() {
  return Array.from(
    crypto.getRandomValues(new Uint8Array(6)),
    (n) => ALPHABET[n & 31],
  ).join("");
}
export const normalizeRoomCode = (code: string) => code.trim().toUpperCase();
export const validRoomCode = (code: unknown): code is string =>
  typeof code === "string" && /^[A-HJ-NP-Z2-9]{6}$/.test(code);
// Preset fictional names avoid collecting real names and prevent names becoming a chat channel.
export const NICKNAMES = [
  "Bintang Laut",
  "Awan Kecil",
  "Kepiting Ceria",
  "Komodo Pintar",
  "Penyu Hijau",
  "Burung Biru",
  "Karang Cerah",
  "Kancil Lincah",
  "Daun Kecil",
  "Ikan Pelangi",
  "Bulan Ceria",
  "Pasir Emas",
] as const;
export const validNickname = (name: unknown): name is string =>
  typeof name === "string" && (NICKNAMES as readonly string[]).includes(name);
