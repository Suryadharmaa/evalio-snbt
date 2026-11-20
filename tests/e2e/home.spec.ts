import { expect, test, type Page } from "@playwright/test";

async function expectNoHorizontalOverflow(page: Page) {
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBe(true);
}

test("the landing page fits the viewport and exposes visible keyboard skip navigation", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(page.locator("html")).toHaveAttribute("lang", "id");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  const skipLink = page.getByRole("link", { name: "Lewati ke konten utama" });
  await page.keyboard.press("Tab");
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toHaveCSS("outline-style", "solid");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
  await expect(page).toHaveURL(/#konten-utama$/);
});

test("unavailable product CTAs focus their labeled illustration", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Coba Diagnostik Gratis" }).first().click();
  await expect(page).toHaveURL(/#diagnostik$/);
  const diagnostic = page.getByRole("article", { name: "Latihan & diagnostik" });
  await expect(diagnostic).toBeFocused();
  await expect(diagnostic).toContainText("Ilustrasi · Segera hadir");

  await page.getByRole("link", { name: "Jelajahi PTN" }).click();
  await expect(page).toHaveURL(/#ptn$/);
  const planner = page.getByRole("article", { name: "Perencana pilihan PTN" });
  await expect(planner).toBeFocused();
  await expect(planner).toContainText("Ilustrasi · Segera hadir");

  await page.getByRole("link", { name: "Coba Diagnostik Gratis" }).last().click();
  await expect(diagnostic).toBeFocused();
  await expectNoHorizontalOverflow(page);
});

test("the FAQ works with the keyboard and has a footer jump link", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("navigation", { name: "Navigasi kaki halaman" }).getByRole("link", { name: "FAQ" }).click();
  const faq = page.getByRole("region", { name: "Pertanyaan umum" });
  await expect(faq).toBeFocused();
  await page.keyboard.press("Tab");
  const summary = faq.locator("summary").first();
  await expect(summary).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(faq.getByText(/Evalio sedang dikembangkan/)).toBeVisible();
  await page.keyboard.press("Space");
  await expect(faq.getByText(/Evalio sedang dikembangkan/)).toBeHidden();
  await expectNoHorizontalOverflow(page);
});

test("mobile menu closes on Escape or navigation and keeps focus predictable", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Mobile disclosure");

  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Menu" });
  const nav = page.getByRole("navigation", { name: "Navigasi utama" });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(nav).toBeHidden();

  await toggle.focus();
  await page.keyboard.press("Enter");
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(nav).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.keyboard.press("Tab");
  await expect(nav.getByRole("link", { name: "Cara kerja" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(toggle).toBeFocused();
  await expect(nav).toBeHidden();

  await toggle.click();
  await nav.getByRole("link", { name: "FAQ" }).focus();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Coba Diagnostik Gratis" }).first()).toBeFocused();
  await expect(nav).toBeHidden();

  await toggle.click();
  await nav.getByRole("link", { name: "Subtes" }).click();
  await expect(page).toHaveURL(/#subtes$/);
  await expect(page.getByRole("region", { name: "Tujuh subtes SNBT" })).toBeFocused();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(nav).toBeHidden();
});
