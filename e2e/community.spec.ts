import { expect, test } from "@playwright/test";
import { COMMUNITY_MISSIONS } from "../src/game/missions/communityMissions";
import { interact } from "./helpers/missionNavigation";
const KEY = "krakatau-pintar:v2";
for (const mapId of ["krakatau", "raja-ampat"] as const)
  test(`five community missions work in single-player on ${mapId}`, async ({
    page,
  }) => {
    test.setTimeout(420000);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    await page.goto("/");
    await page
      .getByRole("button", { name: "Mulai Bermain", exact: true })
      .click();
    await page.getByRole("button", { name: /Pilih Dinar/ }).click();
    await page
      .getByRole("button", { name: "Mulai Petualangan", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Masuk Map Krakatau Pintar", exact: true })
      .click();
    await expect(page.locator('.playing[data-ready="true"]')).toBeVisible();
    if (mapId === "raja-ampat") {
      await interact(page, "teacher", "krakatau");
      await page.getByRole("button", { name: "Lanjut", exact: true }).click();
      await page
        .getByRole("button", { name: "Mulai Misi", exact: true })
        .click();
      await page.keyboard.press("Escape");
      await page
        .getByRole("button", { name: "Ganti map", exact: true })
        .click();
      await page
        .getByRole("button", {
          name: "Masuk Map Laut Raja Ampat Pintar",
          exact: true,
        })
        .click();
    }
    await expect(
      page.locator(`.playing[data-ready="true"][data-map="${mapId}"]`),
    ).toBeVisible();
    await expect(page.getByTestId("mission-hud")).toBeVisible();
    for (const m of COMMUNITY_MISSIONS.filter((m) => m.mapId === mapId)) {
      await interact(page, m.npcId, mapId);
      await expect(
        page.getByRole("dialog", { name: m.npcName, exact: true }),
      ).toBeVisible();
      await page
        .getByRole("button", { name: `Mulai Misi: ${m.title}`, exact: true })
        .click();
      await expect(page.getByTestId("mission-hud")).toContainText(m.title);
      for (const id of m.objectives) await interact(page, id, mapId);
      await interact(page, m.npcId, mapId);
      await page
        .getByRole("button", { name: "Buka Kuis", exact: true })
        .click();
      const q = m.quiz.dinar;
      if (q.order)
        for (const n of Array.from({ length: 10 }, (_, i) => String(i + 1)))
          await page
            .getByRole("dialog")
            .getByRole("button", { name: n, exact: true })
            .click();
      else
        await page
          .getByRole("dialog")
          .locator(".quiz-options > button")
          .nth(q.options.indexOf(q.answer))
          .click();
      await page
        .getByRole("button", { name: "Ambil hadiah", exact: true })
        .click();
      expect(
        await page.evaluate(
          ({ key, mapId }) =>
            JSON.parse(localStorage.getItem(key)!).profiles.dinar.maps[mapId]
              .completed,
          { key: KEY, mapId },
        ),
      ).toContain(m.id);
      console.info(`Community mission verified: ${m.npcName}`);
    }
    await page.screenshot({ path: `docs/community-${mapId}.png` });
    await page.reload();
    expect(
      await page.evaluate(
        ({ key, mapId }) =>
          JSON.parse(localStorage.getItem(key)!).profiles.dinar.maps[mapId]
            .completed,
        { key: KEY, mapId },
      ),
    ).toEqual(
      expect.arrayContaining(
        COMMUNITY_MISSIONS.filter((m) => m.mapId === mapId).map((m) => m.id),
      ),
    );
    expect(errors).toEqual([]);
  });
