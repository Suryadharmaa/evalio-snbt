import { randomUUID } from "node:crypto";
import { expect, test, type APIRequestContext, type BrowserContext, type Page } from "@playwright/test";

const localEnabled = process.env.EVALIO_TEST_LOCAL_SUPABASE === "1";
const localApi = "http://127.0.0.1:55321";
const appOrigin = "http://127.0.0.1:3100";
const mailpit = "http://127.0.0.1:55324";
const password = "Synthetic-Evalio-Only-49!";
const newPassword = "Synthetic-Evalio-New-71!";

if (localEnabled && process.env.NEXT_PUBLIC_SUPABASE_URL !== localApi) {
  throw new Error("The synthetic Auth tests require the isolated loopback Supabase API.");
}

async function getEmailLink(request: APIRequestContext, email: string, type: "email" | "recovery") {
  let link = "";
  await expect.poll(async () => {
    const list = await request.get(`${mailpit}/api/v1/search`, { params: { query: `to:${email}` } });
    if (!list.ok()) return false;
    const { messages } = await list.json() as { messages: { ID: string }[] | null };
    for (const message of messages ?? []) {
      const response = await request.get(`${mailpit}/api/v1/message/${message.ID}`);
      const { HTML } = await response.json() as { HTML: string };
      const candidate = HTML.match(/href="([^"]*\/auth\/confirm\?[^"]+)"/)?.[1].replaceAll("&amp;", "&");
      if (candidate?.startsWith(`${appOrigin}/auth/confirm?`) && new URL(candidate).searchParams.get("type") === type) {
        link = candidate;
        return true;
      }
    }
    return false;
  }, { timeout: 15_000, message: "Mailpit should receive the synthetic account email" }).toBe(true);
  return link;
}

async function register(page: Page, request: APIRequestContext, beforeConfirmation?: (email: string) => Promise<void>) {
  const email = `evalio-${randomUUID()}@example.com`;
  await page.goto("/sign-up");
  await page.getByRole("textbox", { name: "Email", exact: true }).fill(email);
  await page.getByLabel("Kata sandi", { exact: true }).fill(password);
  await page.getByLabel("Tahun target UTBK").fill("2028");
  await page.getByRole("checkbox", { name: /telah membaca/ }).check();
  await page.getByRole("button", { name: "Daftar", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Periksa kotak masuk.");
  await beforeConfirmation?.(email);
  const link = await getEmailLink(request, email, "email");
  await page.goto(link);
  await page.reload();
  await page.getByRole("button", { name: "Konfirmasi email" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  return email;
}

async function submitSignIn(page: Page, email: string, secret: string) {
  await page.goto("/sign-in");
  await page.getByRole("textbox", { name: "Email", exact: true }).fill(email);
  await page.getByLabel("Kata sandi", { exact: true }).fill(secret);
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
}

async function exportAccount(page: Page) {
  const response = await page.request.get("/profile/export");
  expect(response.ok()).toBe(true);
  expect(response.headers()["content-disposition"]).toContain("attachment");
  return await response.json() as {
    account: { id: string; email: string };
    profile: { alias: string | null; cohort_year: number; delete_requested_at: string | null };
    privacy_acknowledgments: { policy_version: string }[];
  };
}

function isSessionCookie({ name }: { name: string }) {
  return name === "evalio-session" || name.startsWith("evalio-session.");
}

async function markCachedExpiryInPast(context: BrowserContext) {
  // Move the cached expiry only. The real provider still authenticates and rotates refresh tokens.
  const cookies = (await context.cookies()).filter(isSessionCookie);
  cookies.sort((left, right) => left.name.localeCompare(right.name, "en", { numeric: true }));
  const encoded = cookies.map(({ value }) => value).join("");
  expect(encoded.startsWith("base64-")).toBe(true);
  const session = JSON.parse(Buffer.from(encoded.slice(7), "base64url").toString("utf8")) as { expires_at: number };
  session.expires_at = 1;
  const stale = `base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`;
  let offset = 0;
  await context.addCookies(cookies.map((cookie, index) => {
    const end = index === cookies.length - 1 ? stale.length : offset + cookie.value.length;
    const value = stale.slice(offset, end);
    offset = end;
    return { ...cookie, value };
  }));
  return stale;
}

test.describe("isolated Supabase", () => {
  test.skip(({ isMobile }) => !localEnabled || isMobile, "Loopback Supabase integration runs on Desktop Chromium");

  test("confirmation, owner profile, deletion request, login, and logout", async ({ page, request }) => {
    const email = await register(page, request, async (unconfirmedEmail) => {
      await submitSignIn(page, unconfirmedEmail, password);
      await expect(page.locator("form").getByRole("alert")).toContainText("Konfirmasi email");
      await page.goto("/dashboard");
      await expect(page).toHaveURL(/\/sign-in\?status=required$/);
    });
    await page.getByRole("link", { name: "Profil", exact: true }).click();
    await expect(page.getByLabel("Tahun target UTBK")).toHaveValue("2028");
    await page.getByLabel("Nama panggilan (opsional)").fill("Pelajar Sintetis");
    await page.getByLabel("Tujuan belajar (opsional)").fill("Latihan penalaran");
    await page.getByRole("button", { name: "Simpan profil" }).click();
    await expect(page.getByText("Profil tersimpan.")).toBeVisible();
    await expect(page.getByLabel("Nama panggilan (opsional)")).toHaveValue("Pelajar Sintetis");
    const exported = await exportAccount(page);
    expect(exported.account.email).toBe(email);
    expect(exported.profile).toMatchObject({ alias: "Pelajar Sintetis", cohort_year: 2028 });
    expect(exported.privacy_acknowledgments).toEqual([expect.objectContaining({ policy_version: "evalio-preview-1" })]);

    await page.getByRole("checkbox", { name: "Saya ingin meminta penghapusan akun ini." }).check();
    await page.getByRole("button", { name: "Minta penghapusan" }).click();
    await expect(page.getByText(/Permintaan tercatat pada/)).toBeVisible();
    expect((await exportAccount(page)).profile.delete_requested_at).toBeTruthy();

    await page.getByRole("button", { name: "Keluar" }).click();
    await expect(page.getByText("Kamu sudah keluar.")).toBeVisible();
    await page.goto("/profile");
    await expect(page).toHaveURL(/\/sign-in\?status=required$/);
    expect((await page.request.get("/profile/export")).status()).toBe(401);
    await submitSignIn(page, email, "wrong-test-password");
    await expect(page.locator("form").getByRole("alert")).toHaveText("Email atau kata sandi tidak cocok.");
    await submitSignIn(page, email, password);
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.reload();
    await expect(page.getByRole("heading", { name: "Dasbor siswa" })).toBeVisible();
  });

  test("recovery email grants only a scoped password reset and cannot be reused", async ({ page, request }) => {
    const email = await register(page, request);
    await page.getByRole("button", { name: "Keluar" }).click();
    await expect(page.getByText("Kamu sudah keluar.")).toBeVisible();
    await page.goto("/forgot-password");
    await page.getByRole("textbox", { name: "Email", exact: true }).fill(email);
    await page.getByRole("button", { name: "Kirim tautan pemulihan" }).click();
    await expect(page.getByRole("status")).toContainText("tautan pemulihan akan dikirim");
    const link = await getEmailLink(request, email, "recovery");
    const incorrectPurpose = new URL(link);
    incorrectPurpose.searchParams.set("type", "email");
    await page.goto(incorrectPurpose.href);
    await page.getByRole("button", { name: "Konfirmasi email" }).click();
    await expect(page.locator("form").getByRole("alert")).toContainText("Tautan tidak berlaku");
    await page.goto(link);
    await page.getByRole("button", { name: "Lanjutkan pemulihan" }).click();
    await expect(page).toHaveURL(/\/reset-password$/);
    const cookies = await page.context().cookies(`${appOrigin}/reset-password`);
    expect(cookies.find(({ name }) => name === "evalio-recovery-grant")).toMatchObject({
      httpOnly: true, sameSite: "Lax", path: "/reset-password",
    });

    const newTab = await page.context().newPage();
    await newTab.goto("/dashboard");
    await expect(newTab).toHaveURL(/\/sign-in\?status=required$/);
    await newTab.close();

    await page.getByLabel("Kata sandi baru").fill(newPassword);
    await page.getByRole("button", { name: "Simpan kata sandi" }).click();
    await expect(page.getByText(/Kata sandi diperbarui/)).toBeVisible();
    const remaining = await page.context().cookies(`${appOrigin}/reset-password`);
    expect(remaining.some(({ name }) => name === "evalio-recovery-grant" || name === "evalio-recovery-session" || name.startsWith("evalio-recovery-session."))).toBe(false);
    await page.goto("/reset-password");
    await expect(page.getByRole("button", { name: "Simpan kata sandi" })).toBeHidden();
    await page.goto(link);
    await page.getByRole("button", { name: "Lanjutkan pemulihan" }).click();
    await expect(page.locator("form").getByRole("alert")).toContainText("sudah digunakan");

    await submitSignIn(page, email, password);
    await expect(page.locator("form").getByRole("alert")).toHaveText("Email atau kata sandi tidak cocok.");
    await submitSignIn(page, email, newPassword);
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("proxy refreshes a stale session and rejects one with a revoked refresh token", async ({ page, request }) => {
    await register(page, request);
    const context = page.context();
    const stale = await markCachedExpiryInPast(context);
    await page.reload();
    await expect(page.getByRole("heading", { name: "Dasbor siswa" })).toBeVisible();
    const current = (await context.cookies()).filter(isSessionCookie).map(({ value }) => value).join("");
    expect(current).not.toBe(stale);
    const legacySession = await context.cookies();
    await page.getByRole("button", { name: "Keluar" }).click();
    await expect(page.getByText("Kamu sudah keluar.")).toBeVisible();

    await context.addCookies(legacySession.filter(isSessionCookie));
    await markCachedExpiryInPast(context);
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/sign-in\?status=required$/);
  });
});
