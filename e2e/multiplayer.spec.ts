import { interact, walk } from "./helpers/missionNavigation";
import { COMMUNITY_MISSIONS } from "../src/game/missions/communityMissions";
import { expect, test, type Page, type Browser } from "@playwright/test";
import { SupabaseMock } from "./helpers/supabaseMock";
import { NICKNAMES } from "../src/multiplayer/roomCode";
const KEY = "krakatau-pintar:v2";
async function newPlayer(
  browser: Browser,
  hub: SupabaseMock,
  name: string,
  mobile = false,
) {
  const context = await browser.newContext({
    viewport: mobile
      ? { width: 844, height: 390 }
      : { width: 1100, height: 760 },
    hasTouch: mobile,
    isMobile: mobile,
  });
  await hub.attach(context, name);
  const page = await context.newPage();
  await page.goto("/");
  await page.getByRole("button", { name: "Main Bersama", exact: true }).click();
  return { context, page };
}
async function options(page: Page, i: number) {
  await page
    .getByRole("combobox", { name: /Nama panggilan/ })
    .selectOption(NICKNAMES[i]);
  await page.locator(`input[name="mp-avatar"][value="${i % 3}"]`).check();
  await page
    .getByRole("combobox", { name: /Profil permainan/ })
    .selectOption(i % 2 ? "delisha" : "dinar");
}
async function create(page: Page, mapId = "krakatau") {
  await page.locator(`input[name="mp-map"][value="${mapId}"]`).check();
  await options(page, 0);
  await page.getByRole("button", { name: "Buat Room", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Lobby petualangan", exact: true }),
  ).toBeVisible();
  return (await page.getByTestId("room-code").textContent())!;
}
async function join(page: Page, code: string, i: number) {
  await page
    .getByRole("button", { name: "Punya kode room", exact: true })
    .click();
  await page.getByRole("textbox", { name: /Kode room/ }).fill(code);
  await options(page, i);
  await page.getByRole("button", { name: "Gabung Room", exact: true }).click();
}
async function start(page: Page) {
  await page
    .getByRole("button", { name: "Mulai Bermain", exact: true })
    .click();
  await expect(page.locator('.mp-playing[data-ready="true"]')).toBeVisible();
}
async function move(page: Page, key: string) {
  await page.keyboard.down(key);
  await page.waitForTimeout(700);
  await page.keyboard.up(key);
}
const remote = (page: Page, nickname: string) =>
  page.getByTestId("remote-player").filter({ hasText: nickname });
for (const mapId of ["krakatau", "raja-ampat"])
  test(`real SDK with simulated Realtime: two-way avatars, movement, jump, leave and refresh on ${mapId}`, async ({
    browser,
  }) => {
    const hub = new SupabaseMock();
    const host = await newPlayer(browser, hub, "host"),
      guest = await newPlayer(browser, hub, "guest", mapId === "raja-ampat");
    const errors: string[] = [];
    for (const p of [host.page, guest.page]) {
      p.on("pageerror", (e) => errors.push(e.message));
      p.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text());
      });
    }

    const code = await create(host.page, mapId);
    await join(guest.page, code, 2);
    await expect(
      guest.page.getByRole("heading", {
        name: "Lobby petualangan",
        exact: true,
      }),
    ).toBeVisible();
    await expect(host.page.getByTestId("room-count")).toHaveText("2/4");
    await expect(
      guest.page.getByRole("heading", {
        name:
          mapId === "krakatau" ? "Krakatau Pintar" : "Laut Raja Ampat Pintar",
        exact: true,
      }),
    ).toBeVisible();
    await host.page.screenshot({
      path: `docs/multiplayer-lobby-${mapId}.png`,
      fullPage: true,
    });
    await start(host.page);
    await start(guest.page);
    await expect(host.page.locator(".mp-playing")).toHaveAttribute(
      "data-map",
      mapId,
    );
    await expect(guest.page.locator(".mp-playing")).toHaveAttribute(
      "data-map",
      mapId,
    );
    await expect(remote(host.page, NICKNAMES[2])).toBeVisible();
    await expect(remote(guest.page, NICKNAMES[0])).toBeVisible();
    await expect(remote(host.page, NICKNAMES[2])).toHaveAttribute(
      "data-avatar",
      "2",
    );
    await move(host.page, "w");
    await expect
      .poll(async () =>
        Number(await remote(guest.page, NICKNAMES[0]).getAttribute("data-z")),
      )
      .toBeLessThan(9.5);
    await guest.page.screenshot({
      path: `docs/multiplayer-world-${mapId}.png`,
    });
    await move(host.page, "d");
    await expect
      .poll(async () =>
        Number(await remote(guest.page, NICKNAMES[0]).getAttribute("data-x")),
      )
      .toBeGreaterThan(1.5);
    const guestX = Number(
      await remote(host.page, NICKNAMES[2]).getAttribute("data-x"),
    );
    await move(guest.page, "a");
    await expect
      .poll(async () =>
        Number(await remote(host.page, NICKNAMES[2]).getAttribute("data-x")),
      )
      .toBeLessThan(guestX - 1.5);
    await expect
      .poll(async () =>
        Math.abs(
          Number(
            await remote(guest.page, NICKNAMES[0]).getAttribute(
              "data-rotation",
            ),
          ),
        ),
      )
      .toBeLessThan(2);
    // Hold through at least one render frame, including on software-rendered CI.
    await host.page.keyboard.down("Space");
    await host.page.waitForTimeout(200);
    await host.page.keyboard.up("Space");
    await expect
      .poll(async () =>
        Number(await remote(guest.page, NICKNAMES[0]).getAttribute("data-y")),
      )
      .toBeGreaterThan(0.4);
    await expect(guest.page.getByTestId("mission-hud")).toBeVisible();
    expect(
      await guest.page
        .getByRole("button", { name: "Ganti map", exact: true })
        .count(),
    ).toBe(0);
    expect(
      await host.page.evaluate(
        (key) => JSON.parse(localStorage.getItem(key)!).profiles.dinar.maps,
        KEY,
      ),
    ).toMatchObject({
      krakatau: { completed: [] },
      "raja-ampat": { completed: [] },
    });
    if (mapId === "raja-ampat") {
      await guest.page.setViewportSize({ width: 390, height: 844 });
      expect(
        await guest.page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await guest.page.setViewportSize({ width: 844, height: 390 });
      const box = (await guest.page.locator(".joystick").boundingBox())!;
      const z = Number(
        await remote(host.page, NICKNAMES[2]).getAttribute("data-z"),
      );
      await guest.page.mouse.move(
        box.x + box.width / 2,
        box.y + box.height / 2,
      );
      await guest.page.mouse.down();
      await guest.page.mouse.move(box.x + box.width / 2, box.y + 10);
      await guest.page.waitForTimeout(600);
      await guest.page.mouse.up();
      await expect
        .poll(async () =>
          Number(await remote(host.page, NICKNAMES[2]).getAttribute("data-z")),
        )
        .toBeLessThan(z - 0.8);
    }
    await guest.page.reload();
    await expect(
      guest.page.getByRole("button", { name: "Main Bersama", exact: true }),
    ).toBeVisible();
    await expect(remote(host.page, NICKNAMES[2])).toHaveCount(0, {
      timeout: 12000,
    });
    await guest.page
      .getByRole("button", { name: "Main Bersama", exact: true })
      .click();
    await join(guest.page, code, 1);
    await expect(guest.page.getByTestId("room-count")).toHaveText("2/4");
    await host.page
      .getByRole("button", { name: "Keluar Room", exact: true })
      .click();
    await expect(guest.page.getByText(/Host keluar/).first()).toBeVisible();
    await guest.page
      .getByRole("button", { name: "Main Sendiri", exact: true })
      .click();
    expect(
      hub.messages.every(
        (m) =>
          !JSON.stringify(m).match(
            /"(points|badges|inventory|completed|email)"/,
          ),
      ),
    ).toBe(true);
    expect(errors).toEqual([]);
    await host.context.close();
    await guest.context.close();
  });
test("real SDK with simulated Realtime: four seats, simultaneous joins, invalid code and freed seat", async ({
  browser,
}) => {
  const hub = new SupabaseMock(),
    host = await newPlayer(browser, hub, "host"),
    code = await create(host.page);
  const guests: Awaited<ReturnType<typeof newPlayer>>[] = [];
  for (let i = 1; i <= 4; i++)
    guests.push(await newPlayer(browser, hub, `guest-${i}`));
  await Promise.all(guests.map((g, i) => join(g.page, code, i + 1)));
  await expect(host.page.getByTestId("room-count")).toHaveText("4/4");
  await expect
    .poll(async () => {
      let full = 0;
      for (const g of guests)
        full += await g.page.getByText("Room penuh", { exact: true }).count();
      return full;
    })
    .toBe(1);
  const accepted: Awaited<ReturnType<typeof newPlayer>>[] = [];
  for (const g of guests)
    if (await g.page.getByTestId("room-count").count()) accepted.push(g);
  const rejected = guests.find((g) => !accepted.includes(g))!;
  await accepted[0].page
    .getByRole("button", { name: "Keluar Room", exact: true })
    .click();
  await expect(host.page.getByTestId("room-count")).toHaveText("3/4");
  await rejected.page
    .getByRole("button", { name: "Coba Lagi", exact: true })
    .click();
  await expect(rejected.page.getByTestId("room-count")).toHaveText("4/4");
  const invalid = accepted[0];
  await invalid.page
    .getByRole("button", { name: "Main Bersama", exact: true })
    .click();
  await join(invalid.page, "ZZZZ99", 5);
  await expect(
    invalid.page.getByText("Room tidak ditemukan", { exact: true }),
  ).toBeVisible({ timeout: 15000 });
  for (const g of [host, ...guests]) await g.context.close();
});
test("real SDK with simulated Realtime: brief reconnect and host disconnection timeout", async ({
  browser,
}) => {
  const hub = new SupabaseMock(),
    host = await newPlayer(browser, hub, "host"),
    guest = await newPlayer(browser, hub, "guest");
  const code = await create(host.page);
  await join(guest.page, code, 1);
  await expect(host.page.getByTestId("room-count")).toHaveText("2/4");
  hub.setOffline("guest", true);
  await expect(host.page.getByText(/Terputus/).first()).toBeVisible();
  hub.setOffline("guest", false);
  await expect(guest.page.locator(".mp-connection")).toHaveText("Terhubung", {
    timeout: 15000,
  });
  hub.setOffline("host", true);
  await expect(
    guest.page.getByText("Room ditutup", { exact: true }),
  ).toBeVisible({ timeout: 15000 });
  await expect(
    guest.page.getByRole("button", { name: "Main Sendiri", exact: true }),
  ).toBeVisible();
  await host.context.close();
  await guest.context.close();
});

for (const mapId of ["krakatau", "raja-ampat"] as const)
  test(`local missions remain private at the same NPC in a ${mapId} room`, async ({
    browser,
  }) => {
    test.setTimeout(240000);
    const hub = new SupabaseMock();
    const host = await newPlayer(browser, hub, "mission-host");
    const guest = await newPlayer(browser, hub, "mission-guest");
    const errors: string[] = [];
    for (const p of [host.page, guest.page]) {
      p.on("pageerror", (e) => errors.push(e.message));
      p.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text());
      });
    }
    const code = await create(host.page, mapId);
    await join(guest.page, code, 1);
    await expect(guest.page.getByTestId("room-count")).toHaveText("2/4");
    await start(host.page);
    await start(guest.page);
    const snapshot = (page: Page) =>
      page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), KEY);
    // Original NPC flow is restored too, not just the new community tasks.
    if (mapId === "krakatau") {
      await interact(host.page, "teacher", mapId);
      await host.page
        .getByRole("button", { name: "Lanjut", exact: true })
        .click();
      await host.page
        .getByRole("button", { name: "Mulai Misi", exact: true })
        .click();
      expect(
        (await snapshot(host.page)).profiles.dinar.maps.krakatau.completed,
      ).toContain("welcome");
      expect(
        (await snapshot(guest.page)).profiles.delisha.maps.krakatau.completed,
      ).toEqual([]);
    } else {
      await interact(host.page, "ra-teacher", mapId);
      await host.page
        .getByRole("button", {
          name: "Mulai Misi: Selamatkan Pantai",
          exact: true,
        })
        .click();
      expect(
        (await snapshot(host.page)).profiles.dinar.maps[mapId].activeMissions,
      ).toContain("ra-clean");
      expect(
        (await snapshot(guest.page)).profiles.delisha.maps[mapId]
          .activeMissions,
      ).toEqual([]);
    }
    const m = COMMUNITY_MISSIONS.find(
      (m) => m.id === (mapId === "krakatau" ? "k-rima" : "ra-nabila"),
    )!;
    await interact(host.page, m.npcId, mapId);
    await host.page
      .getByRole("button", { name: `Mulai Misi: ${m.title}`, exact: true })
      .click();
    await walk(guest.page, [0, 3], mapId);
    await interact(guest.page, m.npcId, mapId);
    await expect(
      guest.page.getByRole("button", {
        name: `Mulai Misi: ${m.title}`,
        exact: true,
      }),
    ).toBeVisible();
    await guest.page
      .getByRole("button", { name: "Tutup", exact: true })
      .click();
    for (const id of m.objectives) await interact(host.page, id, mapId);
    expect(
      (await snapshot(guest.page)).profiles.delisha.maps[mapId].items,
    ).not.toContain(m.objectives[0]);
    await interact(host.page, m.npcId, mapId);
    await host.page
      .getByRole("button", { name: "Buka Kuis", exact: true })
      .click();
    await host.page
      .getByRole("dialog")
      .locator(".quiz-options > button")
      .nth(m.quiz.dinar.options.indexOf(m.quiz.dinar.answer))
      .click();
    await host.page
      .getByRole("button", { name: "Ambil hadiah", exact: true })
      .click();
    expect(
      (await snapshot(host.page)).profiles.dinar.maps[mapId].completed,
    ).toContain(m.id);
    expect(
      (await snapshot(guest.page)).profiles.delisha.maps[mapId].completed,
    ).toEqual([]);
    // Guest can still collect the same object and finish independently.
    await interact(guest.page, m.npcId, mapId);
    await guest.page
      .getByRole("button", { name: `Mulai Misi: ${m.title}`, exact: true })
      .click();
    for (const id of m.objectives) await interact(guest.page, id, mapId);
    await interact(guest.page, m.npcId, mapId);
    await guest.page
      .getByRole("button", { name: "Buka Kuis", exact: true })
      .click();
    await guest.page
      .getByRole("dialog")
      .locator(".quiz-options > button")
      .nth(m.quiz.delisha.options.indexOf(m.quiz.delisha.answer))
      .click();
    await guest.page
      .getByRole("button", { name: "Ambil hadiah", exact: true })
      .click();
    const guestSave = await snapshot(guest.page);
    expect(guestSave.profiles.delisha.maps[mapId].completed).toEqual([m.id]);
    expect(guestSave.profiles.dinar.maps[mapId].completed).toEqual([]);
    expect(
      guestSave.profiles.delisha.maps[
        mapId === "krakatau" ? "raja-ampat" : "krakatau"
      ].completed,
    ).toEqual([]);
    expect(
      hub.messages.every(
        (m) =>
          !JSON.stringify(m).match(
            /"(completed|points|items|answer|activeMissions|trackedMission)"/,
          ),
      ),
    ).toBe(true);
    await guest.page.screenshot({
      path: `docs/multiplayer-missions-${mapId}.png`,
    });
    expect(errors).toEqual([]);
    await host.context.close();
    await guest.context.close();
  });
