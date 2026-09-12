import { expect, test } from "@playwright/test";
test("multiplayer menu, unavailable service, mobile form and single-player fallback", async ({
  page,
}) => {
  await page.routeWebSocket("**/realtime/v1/websocket**", (ws) => ws.close());
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Main Bersama", exact: true }).click();
  await expect(page.locator('input[name="mp-avatar"]')).toHaveCount(3);
  await expect(page.getByRole("textbox", { name: /nama/i })).toHaveCount(0);
  await page.getByRole("button", { name: "Buat Room", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Coba Lagi", exact: true }),
  ).toBeVisible({ timeout: 16000 });
  await page.screenshot({
    path: "docs/multiplayer-unavailable-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Main Sendiri", exact: true }).click();
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
  expect(errors).toEqual([]);
});
