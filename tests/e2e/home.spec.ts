import { expect, test } from "@playwright/test";

test("the homepage loads, fits the viewport, and supports its navigation", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(page.locator("html")).toHaveAttribute("lang", "id");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBe(true);

  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Lewati ke konten utama" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
  await expect(page).toHaveURL(/#konten-utama$/);

  await page.getByRole("link", { name: "Kenali Evalio" }).click();
  await expect(page).toHaveURL(/#tentang-evalio$/);
  await expect(page.getByRole("region", { name: "Yang sedang disiapkan" })).toBeFocused();
});
