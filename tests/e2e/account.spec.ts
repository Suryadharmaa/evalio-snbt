import { expect, test } from "@playwright/test";

test("a guest cannot open private student routes or download data", async ({ page, request }) => {
  for (const path of ["/dashboard", "/profile"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/sign-in\?status=required$/);
    await expect(page.getByRole("heading", { name: "Masuk ke Evalio" })).toBeVisible();
    await expect(page.getByText(/Masuk untuk membuka halaman akun/)).toBeVisible();
  }
  const response = await request.get("/profile/export");
  expect(response.status()).toBe(401);
  expect(response.headers()["cache-control"]).toContain("no-store");
});

test("privacy and recovery pages explain what a guest can do", async ({ page }) => {
  await page.goto("/reset-password");
  await expect(page.getByRole("button", { name: "Simpan kata sandi" })).toBeHidden();
  await page.getByRole("link", { name: "Minta tautan baru" }).click();
  await expect(page.getByRole("heading", { name: "Lupa kata sandi" })).toBeVisible();

  await page.getByRole("link", { name: "Privasi akun" }).click();
  await expect(page.getByRole("heading", { name: "Privasi akun uji" })).toBeVisible();
  await expect(page.getByText(/persetujuan orang tua atau wali/)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("an invalid confirmation link does not grant a session or render a confirmation form", async ({ page }) => {
  const response = await page.goto("/auth/confirm?token_hash=invalid&type=recovery&next=https://example.com");
  expect(response?.headers()["referrer-policy"]).toBe("no-referrer");
  await expect(page.getByRole("button", { name: "Lanjutkan pemulihan" })).toBeHidden();
  await page.getByRole("link", { name: "Minta tautan baru" }).click();
  await expect(page).toHaveURL(/\/forgot-password$/);
});
