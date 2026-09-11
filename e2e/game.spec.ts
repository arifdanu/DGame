import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { webcrypto } from "node:crypto";
import { LEVELS } from "../src/content/levels";
import { initialData, STORAGE_KEY } from "../src/storage/store";
import type { Activity, AppData, Level, ProfileId } from "../src/types";
const testPin = "123456"; // Data uji sintetis, bukan PIN pengguna.
async function fixture(profile: ProfileId = "delisha"): Promise<AppData> {
  const d = initialData();
  const salt = webcrypto.getRandomValues(new Uint8Array(16));
  const key = await webcrypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(testPin),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const hash = await webcrypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 210000, hash: "SHA-256" },
    key,
    256,
  );
  d.pin = {
    salt: Buffer.from(salt).toString("hex"),
    hash: Buffer.from(hash).toString("hex"),
    iterations: 210000,
    failures: 0,
    cooldownUntil: 0,
  };
  d.selected = profile;
  return d;
}
async function seed(page: Page, data: AppData) {
  await page.goto("/");
  await page.evaluate(
    ({ key, data }) => {
      localStorage.setItem(key, JSON.stringify(data));
      sessionStorage.clear();
    },
    { key: STORAGE_KEY, data },
  );
}
async function setup(page: Page) {
  await page.goto("/");
  await page.getByLabel("Buat PIN enam digit").fill(testPin);
  await page.getByLabel("Ulangi PIN").fill(testPin);
  await page.getByRole("button", { name: "Simpan & pilih penjelajah" }).click();
  await expect(
    page.getByRole("heading", { name: "Siapa yang berlayar hari ini?" }),
  ).toBeVisible();
}
async function tutorial(page: Page) {
  const button = page.getByRole("button", { name: "Aku siap mencoba" });
  await expect(page.locator(".activity-card")).toBeVisible();
  if (await page.locator("dialog").count()) await button.click();
}
async function solve(page: Page, a: Activity) {
  await expect(
    page.getByRole("heading", { name: a.instruction, exact: true }),
  ).toBeVisible();
  const t = a.interaction;
  switch (t.kind) {
    case "story":
    case "choice":
      await page.getByRole("button", { name: t.answer, exact: true }).click();
      break;
    case "count":
      for (let i = 0; i < t.target; i++)
        await page
          .getByRole("button", {
            name: `${t.objects[i]} ${i + 1}`,
            exact: true,
          })
          .click();
      break;
    case "number":
      if (t.groups)
        for (let i = 0; i < t.groups.count; i++)
          await page
            .getByRole("button", {
              name: `Buka kelompok ${i + 1}`,
              exact: true,
            })
            .click();
      for (const digit of String(t.answer))
        await page.getByRole("button", { name: digit, exact: true }).click();
      break;
    case "order":
      for (const piece of t.answer)
        await page.getByRole("button", { name: piece, exact: true }).click();
      break;
    case "grid":
      for (const direction of t.solution)
        await page
          .getByRole("button", { name: `Jalan ${direction}`, exact: true })
          .click();
      break;
  }
  await page
    .getByRole("button", { name: "Periksa jawaban", exact: true })
    .click();
  await expect(
    page.getByText("Kamu teliti mencoba!", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: a.id.endsWith("-5") ? "Selesaikan misi" : "Lanjut",
      exact: true,
    })
    .click();
}
async function playLevel(page: Page, l: Level) {
  await page.goto(`/play/${l.id}`);
  await expect(
    page.getByRole("heading", {
      name: l.activities[0].instruction,
      exact: true,
    }),
  ).toBeVisible();
  await tutorial(page);
  for (const a of l.activities) await solve(page, a);
  await expect(
    page.getByRole("heading", { name: "Misi selesai!", exact: true }),
  ).toBeVisible();
}
async function stored(page: Page) {
  return page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!) as AppData,
    STORAGE_KEY,
  );
}
test("setup → Delisha → level lengkap → reload dan deep link", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await setup(page);
  await page.getByRole("button", { name: "Main sebagai Delisha" }).click();
  await page.getByRole("button", { name: /Jelajahi Pulau Angka/ }).click();
  await page.getByRole("button", { name: /Kerang untuk Kiko/ }).click();
  await tutorial(page);
  for (const a of LEVELS[0].activities) await solve(page, a);
  await page
    .getByRole("link", { name: "Kembali ke peta", exact: true })
    .click();
  await page.reload();
  await expect(page.getByText("1/12", { exact: true })).toBeVisible();
  const d = await stored(page);
  expect(d.profiles.delisha.badges).toEqual(["delisha-angka-1"]);
  expect(d.profiles.dinar.badges).toEqual([]);
  await page.goto("/parent");
  await page.reload();
  await expect(page.getByRole("button", { name: "Buka panel" })).toBeVisible();
  expect(errors).toEqual([]);
});
for (const level of LEVELS) {
  test(`seluruh aktivitas playable: ${level.id}`, async ({ page }) => {
    const d = await fixture(level.profile);
    d.profiles[level.profile].tutorial = true;
    d.profiles[level.profile].badges = LEVELS.filter(
      (l) =>
        l.profile === level.profile &&
        l.island === level.island &&
        l.rank < level.rank,
    ).map((l) => l.id);
    await seed(page, d);
    await playLevel(page, level);
    expect((await stored(page)).profiles[level.profile].badges).toContain(
      level.id,
    );
  });
}
test("Dinar mendapatkan materi berbeda tanpa mencampur progres", async ({
  page,
}) => {
  const d = await fixture("dinar");
  d.profiles.delisha.badges = ["delisha-angka-1"];
  await seed(page, d);
  await page.goto("/map");
  await page.getByRole("button", { name: /Jelajahi Pulau Angka/ }).click();
  await page.getByRole("button", { name: /Jembatan Bilangan/ }).click();
  await tutorial(page);
  await expect(page.getByText("24 + 13 = ?", { exact: true })).toBeVisible();
  expect((await stored(page)).profiles.dinar.badges).toHaveLength(0);
  expect((await stored(page)).profiles.delisha.badges).toHaveLength(1);
});
test("batas harian, peringatan, dan refresh dengan clock mock", async ({
  page,
}) => {
  const d = await fixture();
  d.profiles.delisha.tutorial = true;
  await seed(page, d);
  await page.clock.install({ time: new Date("2026-09-10T10:00:00+07:00") });
  await page.clock.pauseAt(new Date("2026-09-10T10:00:01+07:00"));
  await page.goto("/play/delisha-angka-1");
  await expect(
    page.getByRole("button", { name: "kerang 1", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "kerang 1", exact: true }).click();
  await page.clock.fastForward(14 * 60000);
  await expect(
    page.getByText("Satu menit lagi. Kita segera beristirahat, ya."),
  ).toBeVisible();
  await page.clock.fastForward(60001);
  await expect(
    page.getByRole("heading", { name: "Saatnya istirahat, penjelajah" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Saatnya istirahat, penjelajah" }),
  ).toBeVisible();
  expect(
    (await stored(page)).profiles.delisha.drafts["delisha-angka-1"].input,
  ).toEqual(["0"]);
});
test("jeda, keluar, pergantian profil, dan refresh tidak menghapus waktu", async ({
  page,
}) => {
  const d = await fixture();
  d.profiles.delisha.tutorial = true;
  await seed(page, d);
  await page.clock.install({ time: new Date("2026-09-10T10:00:00+07:00") });
  await page.clock.pauseAt(new Date("2026-09-10T10:00:01+07:00"));
  await page.goto("/play/delisha-angka-1");
  await expect(
    page.getByRole("button", { name: "kerang 1", exact: true }),
  ).toBeEnabled();
  await page.clock.fastForward(30000);
  await page.getByRole("button", { name: "Jeda", exact: true }).click();
  await page.clock.fastForward(120000);
  expect((await stored(page)).profiles.delisha.usage["2026-09-10"]).toBe(30000);
  await page.getByRole("button", { name: "Lanjut bermain" }).click();
  await page.clock.fastForward(10000);
  await page.getByRole("button", { name: "Keluar & simpan" }).click();
  await page.getByRole("button", { name: "Keluar ke peta" }).click();
  await page.reload();
  expect((await stored(page)).profiles.delisha.usage["2026-09-10"]).toBe(40000);
  await page.goto("/");
  await page.getByRole("button", { name: "Main sebagai Dinar" }).click();
  expect((await stored(page)).profiles.dinar.usage).toEqual({});
  expect((await stored(page)).profiles.delisha.usage["2026-09-10"]).toBe(40000);
});
test("PIN salah, cooldown, dan akses langsung tetap terkunci", async ({
  page,
}) => {
  await seed(page, await fixture());
  await page.clock.install();
  await page.goto("/parent");
  for (let i = 0; i < 5; i++) {
    await page.getByLabel("PIN enam digit").fill("000000");
    await page.getByRole("button", { name: "Buka panel" }).click();
    await expect(page.getByLabel("PIN enam digit")).toHaveValue("");
  }
  await expect(page.getByRole("button", { name: "Buka panel" })).toBeDisabled();
  await page.reload();
  await expect(page.getByRole("button", { name: "Buka panel" })).toBeDisabled();
  await page.clock.fastForward(31000);
  await page.getByLabel("PIN enam digit").fill(testPin);
  await page.getByRole("button", { name: "Buka panel" }).click();
  await expect(page.getByText("Pengaturan bersama")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Buka panel" })).toBeVisible();
});
test("profil yang sama tidak dapat bermain di dua tab", async ({
  page,
  context,
}) => {
  const d = await fixture();
  d.profiles.delisha.tutorial = true;
  await seed(page, d);
  await page.goto("/play/delisha-angka-1");
  await expect(
    page.getByRole("button", { name: "kerang 1", exact: true }),
  ).toBeEnabled();
  const other = await context.newPage();
  await other.goto("/play/delisha-angka-1");
  await expect(
    other.getByRole("heading", { name: "Kiko sedang bermain di tab lain" }),
  ).toBeVisible();
  await page.goto("/map");
  await other.reload();
  await expect(
    other.getByRole("button", { name: "kerang 1", exact: true }),
  ).toBeEnabled();
});
test("dua kesalahan menampilkan contoh dan menyimpan statistik terbimbing", async ({
  page,
}) => {
  const d = await fixture();
  d.profiles.delisha.tutorial = true;
  await seed(page, d);
  await page.goto("/play/delisha-angka-1");
  await page.getByRole("button", { name: "kerang 1", exact: true }).click();
  await page.getByRole("button", { name: "Bantuan", exact: true }).click();
  await page.getByRole("button", { name: "Periksa jawaban" }).click();
  await expect(
    page.getByText("Ayo coba cara lain.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Periksa jawaban" }).click();
  await expect(
    page.getByRole("heading", { name: "Kita coba bersama Kiko" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Aku sudah mengikuti contoh" })
    .click();
  const r = (await stored(page)).profiles.delisha.drafts["delisha-angka-1"]
    .records["delisha-angka-1-1"];
  expect(r).toMatchObject({
    attempts: 2,
    help: 1,
    completed: true,
    guided: true,
    firstCorrect: false,
  });
});
test("tiga level menutup sesi dan tidak memulai sesi otomatis", async ({
  page,
}) => {
  const d = await fixture();
  d.profiles.delisha.tutorial = true;
  d.profiles.delisha.session = {
    id: "session-test",
    completed: ["delisha-kata-1", "delisha-logika-1"],
    ended: false,
    startedAt: Date.now(),
    durationMs: 10000,
  };
  await seed(page, d);
  await playLevel(page, LEVELS[0]);
  await page.getByRole("link", { name: "Lihat penutup sesi" }).click();
  await expect(
    page.getByRole("button", { name: "Selesai & Istirahat" }),
  ).toBeVisible();
  await page.reload();
  expect((await stored(page)).profiles.delisha.session?.ended).toBe(true);
  await page.goto("/play/delisha-angka-1");
  await expect(page).toHaveURL(/\/session$/);
  await page.getByRole("button", { name: "Selesai & Istirahat" }).click();
  await expect(page).toHaveURL(/\/rest$/);
  expect((await stored(page)).profiles.delisha.session).toBeNull();
});
test("mobile 360 dan desktop: layout, gambar lokal, keyboard, tanpa error", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await seed(page, await fixture());
  for (const size of [
    { width: 1366, height: 900 },
    { width: 360, height: 800 },
  ]) {
    await page.setViewportSize(size);
    await page.goto("/map");
    await expect(
      page.getByRole("button", { name: /Jelajahi Hutan Kata/ }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(
      await page
        .locator("img")
        .evaluateAll((imgs) =>
          imgs.every(
            (i) =>
              (i as HTMLImageElement).complete &&
              (i as HTMLImageElement).naturalWidth > 0,
          ),
        ),
    ).toBe(true);
    await page.screenshot({
      path: `docs/map-${size.width}.png`,
      fullPage: true,
    });
  }
  await page.getByRole("button", { name: /Jelajahi Pulau Angka/ }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.goto("/play/delisha-angka-1");
  await tutorial(page);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "docs/play-360.png", fullPage: true });
  expect(errors).toEqual([]);
});
test("panel mengubah batas dan PIN, hapus progres perlu dua konfirmasi", async ({
  page,
}) => {
  const d = await fixture();
  d.profiles.delisha.badges = ["delisha-angka-1"];
  d.profiles.delisha.usage["2026-09-10"] = 45000;
  await seed(page, d);
  await page.goto("/parent");
  await page.getByLabel("PIN enam digit").fill(testPin);
  await page.getByRole("button", { name: "Buka panel" }).click();
  await page.getByLabel("Batas harian Delisha").selectOption("10");
  expect((await stored(page)).profiles.delisha.limit).toBe(10);
  await page
    .getByRole("button", { name: "Hapus progres Delisha", exact: true })
    .click();
  await page.getByRole("dialog").getByLabel("PIN enam digit").fill(testPin);
  await page.getByRole("button", { name: "Lanjut ke konfirmasi" }).click();
  expect((await stored(page)).profiles.delisha.badges).toHaveLength(1);
  await page.getByRole("button", { name: "Ya, hapus progres Delisha" }).click();
  expect((await stored(page)).profiles.delisha.badges).toHaveLength(0);
  expect((await stored(page)).profiles.delisha.usage["2026-09-10"]).toBe(45000);
  await page.getByRole("button", { name: "Ubah PIN", exact: true }).click();
  await page.getByLabel("Buat PIN enam digit").fill("987654");
  await page.getByLabel("Ulangi PIN").fill("987654");
  await page.getByRole("button", { name: "Simpan PIN baru" }).click();
  await expect(
    page.getByText("PIN baru tersimpan.", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await page.getByLabel("PIN enam digit").fill("987654");
  await page.getByRole("button", { name: "Buka panel" }).click();
  await expect(page.getByText("Pengaturan bersama")).toBeVisible();
  await page.setViewportSize({ width: 360, height: 800 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "docs/parent-360.png", fullPage: true });
});
test("data rusak dipertahankan dan permainan diblokir", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(
    (key) => localStorage.setItem(key, '{"rusak":'),
    STORAGE_KEY,
  );
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Data perlu diperiksa orang tua" }),
  ).toBeVisible();
  expect(
    await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY),
  ).toBe('{"rusak":');
});
test("background menghentikan hitungan, visible melanjutkan", async ({
  page,
}) => {
  const d = await fixture();
  d.profiles.delisha.tutorial = true;
  await seed(page, d);
  await page.clock.install({ time: new Date("2026-09-10T10:00:00+07:00") });
  await page.clock.pauseAt(new Date("2026-09-10T10:00:01+07:00"));
  await page.goto("/play/delisha-angka-1");
  await expect(
    page.getByRole("button", { name: "kerang 1", exact: true }),
  ).toBeEnabled();
  await page.clock.fastForward(10000);
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.clock.fastForward(120000);
  expect((await stored(page)).profiles.delisha.usage["2026-09-10"]).toBe(10000);
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.clock.fastForward(5000);
  expect((await stored(page)).profiles.delisha.usage["2026-09-10"]).toBe(15000);
});
