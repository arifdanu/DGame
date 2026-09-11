import type { PinData } from "../types";
const hex = (bytes: Uint8Array) =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
async function derive(pin: string, salt: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pin),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bytes = new Uint8Array(
    salt.match(/.{2}/g)!.map((b) => parseInt(b, 16)),
  );
  return hex(
    new Uint8Array(
      await crypto.subtle.deriveBits(
        { name: "PBKDF2", salt: bytes, iterations: 210000, hash: "SHA-256" },
        key,
        256,
      ),
    ),
  );
}
export async function makePin(pin: string): Promise<PinData> {
  if (!/^\d{6}$/.test(pin)) throw new Error("Gunakan tepat enam digit.");
  const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
  return {
    salt,
    hash: await derive(pin, salt),
    iterations: 210000,
    failures: 0,
    cooldownUntil: 0,
  };
}
export async function checkPin(
  pin: string,
  data: PinData,
  now = Date.now(),
): Promise<{ ok: boolean; pin: PinData }> {
  if (data.cooldownUntil > now) return { ok: false, pin: data };
  const ok =
    /^\d{6}$/.test(pin) && (await derive(pin, data.salt)) === data.hash;
  const failures = ok ? 0 : (data.cooldownUntil ? 0 : data.failures) + 1;
  return {
    ok,
    pin: {
      ...data,
      failures: failures >= 5 ? 0 : failures,
      cooldownUntil: !ok && failures >= 5 ? now + 30000 : 0,
    },
  };
}
