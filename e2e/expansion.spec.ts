import { interact } from "./helpers/missionNavigation";
import { COMMUNITY_MISSIONS } from "../src/game/missions/communityMissions";
import { expect, test, type Page } from "@playwright/test";
import { MAPS } from "../src/game/maps/mapRegistry";
import { MISSIONS } from "../src/game/missions/missionRegistry";
import type { MapId } from "../src/game/data/types";
test.use({ actionTimeout: 10000 });
const KEY = "krakatau-pintar:v2";
const oldProgress = () => ({
  avatar: 1,
  started: true,
  completed: ["welcome", "science"],
  items: ["rock", "leaf", "shell"],
  stars: [],
  points: 13,
  badges: ["Sahabat Guru", "Peneliti Alam"],
  unlocked: ["village", "beach", "forest", "garden", "lab"],
  labRound: 0,
});
async function seedLegacy(page: Page) {
  await page.goto("/");
  const raw = JSON.stringify({
    version: 1,
    active: "dinar",
    muted: true,
    profiles: { dinar: oldProgress(), delisha: oldProgress() },
  });
  await page.evaluate((raw) => {
    localStorage.clear();
    localStorage.setItem("krakatau-pintar:v1", raw);
  }, raw);
  await page.reload();
  return raw;
}
async function pos(page: Page): Promise<[number, number]> {
  return page
    .locator(".minimap-button svg circle")
    .last()
    .evaluate((el) => [
      Number(el.getAttribute("cx")),
      Number(el.getAttribute("cy")),
    ]);
}
async function ready(page: Page) {
  await expect(page.locator('.playing[data-ready="true"]')).toBeVisible();
}
async function switchMap(page: Page, mapId: MapId) {
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Ganti map", exact: true }).click();
  await page
    .getByRole("button", { name: `Masuk Map ${MAPS[mapId].name}`, exact: true })
    .click();
  await ready(page);
}
async function saved(page: Page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), KEY);
}

test("migration, all nine Raja Ampat missions, map travel, reload and isolated reset", async ({
  page,
}) => {
  test.setTimeout(540000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.setViewportSize({ width: 1280, height: 820 });
  const original = await seedLegacy(page);
  await page.getByRole("button", { name: "Lanjutkan sebagai Dinar" }).click();
  await ready(page);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Ganti map", exact: true }).click();
  await page.screenshot({ path: "docs/expansion-map-selector.png" });
  await page
    .getByRole("button", {
      name: "Masuk Map Laut Raja Ampat Pintar",
      exact: true,
    })
    .click();
  await ready(page);
  await expect(page.getByTestId("star-total")).toHaveText("0");
  const fps = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        let count = 0,
          start = 0;
        const frame = (now: number) => {
          if (!start) start = now;
          if (++count === 90) resolve(89000 / (now - start));
          else requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
      }),
  );
  console.info(`Raja Ampat RAF rate on this machine: ${fps.toFixed(1)} fps`);
  for (const m of MISSIONS.filter(
    (m) =>
      m.mapId === "raja-ampat" &&
      !COMMUNITY_MISSIONS.some((c) => c.id === m.id),
  )) {
    await test.step(m.title, async () => {
      await interact(page, m.npcId, "raja-ampat");
      await page
        .getByRole("button", { name: `Mulai Misi: ${m.title}`, exact: true })
        .click();
      for (const id of m.objectives) await interact(page, id, "raja-ampat");
      await interact(page, m.npcId, "raja-ampat");
      await page
        .getByRole("button", { name: "Buka Kuis", exact: true })
        .click();
      await expect(
        page.getByRole("dialog", { name: m.title, exact: true }),
      ).toBeVisible();
      if (m.id === "ra-clean") {
        await page
          .getByRole("button", { name: "Botol plastik", exact: false })
          .click();
        await expect(
          page.getByText("Belum tepat.", { exact: false }),
        ).toBeVisible();
        await page
          .getByRole("button", { name: "Coba lagi", exact: true })
          .click();
      }
      await page
        .getByRole("dialog", { name: m.title, exact: true })
        .getByRole("button", { name: m.quiz.dinar.answer, exact: false })
        .click();
      await page
        .getByRole("button", { name: "Ambil hadiah", exact: true })
        .click();
      expect(
        (await saved(page)).profiles.dinar.maps["raja-ampat"].completed,
      ).toContain(m.id);
      console.info(`Verified mission: ${m.id}`);
      if (m.id === "ra-coral")
        await page.screenshot({ path: "docs/raja-ampat-game.png" });
    });
  }
  let data = await saved(page);
  expect(data.profiles.dinar.maps["raja-ampat"].badges).toContain(
    "Penjaga Laut",
  );
  const points = data.profiles.dinar.maps["raja-ampat"].points;
  expect(data.profiles.dinar.maps["raja-ampat"].completed).toHaveLength(9);
  await page.reload();
  await page.getByRole("button", { name: "Lanjutkan sebagai Dinar" }).click();
  await ready(page);
  await expect(page.getByTestId("star-total")).toHaveText(String(points));
  await switchMap(page, "krakatau");
  await expect(page.getByTestId("star-total")).toHaveText("13");
  await switchMap(page, "raja-ampat");
  await expect(page.getByTestId("star-total")).toHaveText(String(points));
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Reset progres Dinar", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Ya, reset progres Dinar", exact: true })
    .click();
  data = await saved(page);
  expect(data.profiles.dinar.maps["raja-ampat"].points).toBe(0);
  expect(data.profiles.dinar.maps.krakatau.points).toBe(13);
  expect(data.profiles.delisha.maps.krakatau.points).toBe(13);
  expect(
    await page.evaluate(() => localStorage.getItem("krakatau-pintar:v1")),
  ).toBe(original);
  expect(errors).toEqual([]);
});

test("new Krakatau areas and hill missions remain playable", async ({
  page,
}) => {
  test.setTimeout(240000);
  await seedLegacy(page);
  await page.getByRole("button", { name: "Lanjutkan sebagai Dinar" }).click();
  await ready(page);
  for (const m of MISSIONS.filter(
    (m) =>
      m.mapId === "krakatau" && !COMMUNITY_MISSIONS.some((c) => c.id === m.id),
  )) {
    await interact(page, m.npcId, "krakatau");
    await page
      .getByRole("button", { name: `Mulai Misi: ${m.title}`, exact: true })
      .click();
    for (const id of m.objectives) await interact(page, id, "krakatau");
    await interact(page, m.npcId, "krakatau");
    await page.getByRole("button", { name: "Buka Kuis", exact: true }).click();
    await page
      .getByRole("dialog", { name: m.title, exact: true })
      .getByRole("button", { name: m.quiz.dinar.answer, exact: false })
      .click();
    await page
      .getByRole("button", { name: "Ambil hadiah", exact: true })
      .click();
  }
  expect(
    (await saved(page)).profiles.dinar.maps.krakatau.completed,
  ).toHaveLength(5);
});

test("map lock and mobile Delisha controls survive map switching", async ({
  browser,
}) => {
  test.setTimeout(90000);
  const context = await browser.newContext({
    viewport: { width: 844, height: 390 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto("/");
  await page
    .getByRole("button", { name: "Mulai Bermain", exact: true })
    .click();
  await page.getByRole("button", { name: /Pilih Delisha/ }).click();
  await expect(page.locator(".avatar-choice")).toHaveCount(3);
  await page
    .getByRole("button", { name: "Mulai Petualangan", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Masuk Map Laut Raja Ampat Pintar",
      exact: true,
    }),
  ).toBeDisabled();
  await seedLegacy(page);
  await page
    .getByRole("button", { name: "Mulai Bermain", exact: true })
    .click();
  await page.getByRole("button", { name: /Pilih Delisha/ }).click();
  await page
    .getByRole("button", { name: "Mulai Petualangan", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Masuk Map Laut Raja Ampat Pintar",
      exact: true,
    })
    .click();
  await ready(page);
  await interact(page, "ra-teacher", "raja-ampat");
  await page
    .getByRole("button", { name: "Mulai Misi: Selamatkan Pantai", exact: true })
    .click();
  for (const id of ["ra-clean-1", "ra-clean-2", "ra-clean-3"])
    await interact(page, id, "raja-ampat");
  await interact(page, "ra-teacher", "raja-ampat");
  await page.getByRole("button", { name: "Buka Kuis", exact: true }).click();
  await page.getByRole("button", { name: "Tabung", exact: false }).click();
  await page.getByRole("button", { name: "Ambil hadiah", exact: true }).click();
  await page.screenshot({ path: "docs/raja-ampat-mobile.png" });
  await switchMap(page, "krakatau");
  await switchMap(page, "raja-ampat");
  const before = await pos(page),
    box = (await page.locator(".joystick").boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y + 8);
  await page.waitForTimeout(600);
  await page.mouse.up();
  expect((await pos(page))[1]).toBeLessThan(before[1] - 0.8);
  const stable = await pos(page);
  await page.waitForTimeout(350);
  expect(Math.abs((await pos(page))[1] - stable[1])).toBeLessThan(0.6);
  for (const size of [
    { width: 844, height: 390 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(size);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(page.locator(".joystick")).toBeVisible();
  }
  expect(
    (await saved(page)).profiles.delisha.maps["raja-ampat"].completed,
  ).toContain("ra-clean");
  await context.close();
});
