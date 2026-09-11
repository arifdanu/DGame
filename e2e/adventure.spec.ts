import { expect, test, type Page } from "@playwright/test";
const SAVE_KEY = "krakatau-pintar:v2";
async function pos(page: Page) {
  return page
    .locator(".minimap-button svg circle")
    .last()
    .evaluate((el) => [
      Number(el.getAttribute("cx")),
      Number(el.getAttribute("cy")),
    ]);
}
async function walk(page: Page, x: number, z: number) {
  const end = Date.now() + 25000;
  let held: string[] = [];
  try {
    while (Date.now() < end) {
      const [px, pz] = await pos(page);
      const dx = x - px,
        dz = z - pz;
      if (Math.hypot(dx, dz) < 0.6) return;
      const next = [
        ...(Math.abs(dx) > 0.35 ? [dx > 0 ? "d" : "a"] : []),
        ...(Math.abs(dz) > 0.35 ? [dz > 0 ? "s" : "w"] : []),
      ];
      for (const k of held) if (!next.includes(k)) await page.keyboard.up(k);
      for (const k of next) if (!held.includes(k)) await page.keyboard.down(k);
      held = next;
      await page.waitForTimeout(95);
    }
    throw new Error(`Could not walk to ${x},${z}; actual ${await pos(page)}`);
  } finally {
    for (const k of held) await page.keyboard.up(k);
  }
}
async function begin(
  page: Page,
  profile = "Dinar",
  avatar = "Anak laki-laki penjelajah",
) {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Mulai Bermain", exact: true })
    .click();
  await page
    .getByRole("button", { name: new RegExp(`Pilih ${profile}`) })
    .click();
  await page.getByRole("button", { name: avatar, exact: true }).click();
  await page
    .getByRole("button", { name: "Mulai Petualangan", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Masuk Map Krakatau Pintar", exact: true })
    .click();
  await expect(page.locator('.playing[data-ready="true"]')).toBeVisible();
}
async function action(page: Page) {
  await expect(page.locator(".interaction-prompt")).toBeVisible();
  await page.keyboard.press("e");
}
async function reward(page: Page, answer: string) {
  await page.getByRole("button", { name: answer, exact: false }).click();
  await page.getByRole("button", { name: "Ambil hadiah" }).click();
}
test("Dinar completes all four missions by walking, earns rewards and resumes saved progress", async ({
  page,
}) => {
  test.setTimeout(240000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.setViewportSize({ width: 1100, height: 760 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Petualangan Krakatau Pintar/ }),
  ).toBeVisible();
  await page.screenshot({ path: "docs/krakatau-home.png" });
  await begin(page);
  await page.keyboard.press("e");
  await expect(page.getByRole("dialog")).toHaveCount(0); // Too far from the NPC.
  await walk(page, 0, 4.8);
  await action(page);
  await page.getByRole("button", { name: "Lanjut", exact: true }).click();
  await page.getByRole("button", { name: "Mulai Misi", exact: true }).click();
  await expect(page.getByTestId("star-total")).toHaveText("5");
  await page.screenshot({ path: "docs/krakatau-game.png" });
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("dialog", { name: "Istirahat sebentar?" }),
  ).toBeVisible();
  const frozen = await pos(page);
  await page.keyboard.down("w");
  await page.waitForTimeout(350);
  await page.keyboard.up("w");
  expect(await pos(page)).toEqual(frozen);
  await page
    .getByRole("button", { name: "Lanjutkan permainan", exact: true })
    .click();
  await walk(page, 13.8, 12);
  await action(page);
  await walk(page, 18, 9);
  await action(page);
  await walk(page, 21, 13.3);
  await action(page);
  await expect(
    page.getByRole("dialog", { name: "Penemuan di pantai" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Agar menjadi batu" }).click();
  await expect(page.getByText("Belum tepat.", { exact: false })).toBeVisible();
  await expect(page.getByTestId("star-total")).toHaveText("8");
  await page.getByRole("button", { name: "Coba lagi" }).click();
  await reward(page, "Untuk membuat makanan");
  await expect(page.getByTestId("star-total")).toHaveText("13");
  await walk(page, 0, 0);
  await expect(page.locator('.playing[data-ready="true"]')).toBeVisible();
  await walk(page, 0, -7);
  await walk(page, -14, -8);
  await action(page);
  await expect(page.getByRole("dialog", { name: "Hutan Huruf" })).toBeVisible();
  for (const letter of ["B", "U", "K", "U"])
    await page
      .getByRole("button", { name: letter, exact: true })
      .and(page.locator(":enabled"))
      .first()
      .click();
  await page.getByRole("button", { name: "Ambil hadiah" }).click();
  await walk(page, 0, -7);
  await walk(page, 0, 12);
  for (const [x, z] of [
    [-5.6, 12],
    [-7.6, 14.5],
    [-10.5, 15.5],
    [-13.4, 14],
    [-13, 10.7],
  ]) {
    await walk(page, x, z);
    await action(page);
  }
  await expect(
    page.getByRole("dialog", { name: "Hitung Bintang" }),
  ).toBeVisible();
  await reward(page, "12");
  await expect(page.getByTestId("star-total")).toHaveText("28");
  await page
    .getByRole("button", { name: "Buku petualangan", exact: true })
    .click();
  await expect(
    page.getByText("Dinar · 4/7 misi selesai · 28 bintang"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Tutup", exact: true }).click();
  const save = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    SAVE_KEY,
  );
  expect(save.profiles.dinar.maps.krakatau.badges).toHaveLength(4);
  expect(save.profiles.dinar.maps.krakatau.unlocked).toContain("lab");
  expect(save.profiles.delisha.maps.krakatau.points).toBe(0);
  await page.reload();
  await page.getByRole("button", { name: "Lanjutkan sebagai Dinar" }).click();
  await expect(page.getByTestId("star-total")).toHaveText("28");
  await expect(page.locator('.playing[data-ready="true"]')).toBeVisible();
  await walk(page, 0, -7);
  await walk(page, 17, -6);
  await action(page);
  await expect(
    page.getByRole("dialog", { name: "Klub Peneliti Kecil" }),
  ).toBeVisible();
  await reward(page, "8");
  await expect(page.getByTestId("star-total")).toHaveText("30");
  await action(page);
  await reward(page, "6");
  await expect(page.getByTestId("star-total")).toHaveText("32");
  expect(errors).toEqual([]);
});
test("touch landscape profile, avatar, movement, jump, camera and pause are usable", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 844, height: 390 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await begin(page, "Delisha", "Anak kecil ahli alam");
  await expect(page.locator(".joystick")).toBeVisible();
  await expect(page.locator(".desktop-help")).toBeHidden();
  const before = await pos(page);
  const box = (await page.locator(".joystick").boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y + 10);
  await page.waitForTimeout(1100);
  await page.mouse.up();
  expect((await pos(page))[1]).toBeLessThan(before[1] - 1);
  await page.getByRole("button", { name: "Lompat", exact: true }).click();
  await page.getByRole("button", { name: "Reset kamera", exact: true }).click();
  await page.screenshot({ path: "docs/krakatau-mobile.png" });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Jeda permainan", exact: true })
    .click();
  await page.getByRole("button", { name: "Ganti profil", exact: true }).click();
  await page.getByRole("button", { name: /Pilih Dinar/ }).click();
  await page
    .getByRole("button", { name: "Mulai Petualangan", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Masuk Map Krakatau Pintar", exact: true })
    .click();
  await expect(page.getByTestId("star-total")).toHaveText("0");
  const saved = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    SAVE_KEY,
  );
  expect(saved.profiles.delisha.avatar).toBe(2);
  expect(saved.active).toBe("dinar");
  await context.close();
});
test("Delisha matching quiz can be resumed and reset only changes the selected profile", async ({
  page,
}) => {
  await begin(page, "Delisha", "Anak perempuan peneliti");
  await page.evaluate((key) => {
    const d = JSON.parse(localStorage.getItem(key)!);
    d.profiles.delisha.maps.krakatau = {
      ...d.profiles.delisha.maps.krakatau,
      completed: ["welcome", "science"],
      items: ["rock", "leaf", "shell"],
      badges: ["Sahabat Guru", "Peneliti Alam"],
      unlocked: ["village", "beach", "forest", "garden", "lab"],
      points: 13,
    };
    d.profiles.dinar.maps.krakatau.points = 2;
    localStorage.setItem(key, JSON.stringify(d));
  }, SAVE_KEY);
  await page.reload();
  await page.getByRole("button", { name: "Lanjutkan sebagai Delisha" }).click();
  await expect(page.locator('.playing[data-ready="true"]')).toBeVisible();
  await walk(page, 0, -7);
  await walk(page, -14, -8);
  await action(page);
  await page.getByRole("button", { name: "🐟 Ikan" }).click();
  await page.getByRole("button", { name: "Coba lagi" }).click();
  await reward(page, "🍎 Apel");
  await expect(page.getByTestId("star-total")).toHaveText("18");
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Reset progres Delisha", exact: true })
    .click();
  await page.getByRole("button", { name: "Batal", exact: true }).click();
  await page
    .getByRole("button", { name: "Reset progres Delisha", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Ya, reset progres Delisha", exact: true })
    .click();
  const saved = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    SAVE_KEY,
  );
  expect(saved.profiles.delisha.maps.krakatau.points).toBe(0);
  expect(saved.profiles.dinar.maps.krakatau.points).toBe(2);
});

test("home controls, portrait layout, mute persistence and damaged saves", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Bisukan suara", exact: true })
    .click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Nyalakan suara", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Pantai Sains Temukan/ }).click();
  await expect(
    page.getByRole("dialog", { name: "Pantai Sains", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Tutup", exact: true }).click();
  await page.screenshot({ path: "docs/krakatau-portrait.png", fullPage: true });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.evaluate(
    (key) => localStorage.setItem(key, '{"version":99}'),
    SAVE_KEY,
  );
  await page.reload();
  await expect(
    page.getByRole("dialog", { name: "Data perlu diperiksa" }),
  ).toBeVisible();
  expect(
    await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY),
  ).toBe('{"version":99}');
});
