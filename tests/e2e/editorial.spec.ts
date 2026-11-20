import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";

const enabled = process.env.EVALIO_TEST_EDITORIAL === "1";
const origin = "http://127.0.0.1:3100";
const base = "/admin/questions";
const keySentinel = "PRIVATE_SYNTHETIC_EXPLANATION";
const blueprintId = "20260000-0000-4000-8000-000000000001";

if (enabled && process.env.NEXT_PUBLIC_SUPABASE_URL !== "http://127.0.0.1:55321") {
  throw new Error("Editorial testing is restricted to the isolated loopback Supabase API.");
}

async function signIn(page: Page, role: string) {
  await page.goto("/sign-in");
  await page.getByRole("textbox", { name: "Email", exact: true }).fill(`evalio-editorial-${role}@example.com`);
  await page.getByLabel("Kata sandi", { exact: true }).fill("Synthetic-Editorial-49!");
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Dasbor siswa" })).toBeVisible();
}

test("guests cannot open the CMS or read questions", async ({ page, request }) => {
  await page.goto(base);
  await expect(page).toHaveURL(/\/sign-in\?status=required$/);
  expect((await request.get(`/api/v1/questions/${blueprintId}`)).status()).toBe(401);
  expect((await request.post(`/api/v1/questions/${blueprintId}`, {
    headers: { origin: "https://example.test" }, data: { reason: "content" },
  })).status()).toBe(403);
});

test("separate staff roles author, review, publish, and retire without leaking keys", async ({ browser, isMobile }, info) => {
  test.skip(!enabled || isMobile, "Requires local editorial fixtures and Desktop Chromium");
  test.setTimeout(90_000);
  const [editor, reviewer, admin, learner] = await Promise.all(Array.from({ length: 4 }, () =>
    browser.newPage({ baseURL: origin, viewport: { width: 1280, height: 900 } })));
  try {
    await Promise.all([signIn(editor, "editor"), signIn(reviewer, "reviewer"), signIn(admin, "admin"), signIn(learner, "learner")]);
    expect((await learner.goto(base))?.status()).toBe(404);

    await editor.goto(base);
    await editor.getByRole("link", { name: "Buat draf" }).click();
    await editor.getByLabel("Subtes dan topik").selectOption(`${blueprintId}|PU|induktif`);
    const stem = `Fixture editorial sintetis ${randomUUID().slice(0, 6)}. Berapa 2 + 3? <b>teks</b>`;
    await editor.getByLabel("Pertanyaan", { exact: true }).fill(stem);
    await editor.getByLabel("Teks bacaan baru atau revisi").fill("Bacaan uji yang disimpan sebagai satu versi.");
    await editor.getByLabel("Pilihan 1", { exact: true }).fill("4");
    await editor.getByLabel("Pilihan 2", { exact: true }).fill("5");
    await editor.getByLabel("Pilihan benar").selectOption("2");
    await editor.getByLabel("Pembahasan", { exact: true }).fill(keySentinel);
    await editor.getByLabel("Pemilik konten").fill("Fixture Evalio");
    await editor.getByLabel("Asal dan proses pembuatan").fill("Dibuat untuk pengujian sintetis.");
    await editor.getByRole("button", { name: "Simpan draf" }).click();
    await expect(editor.getByText("Draf tersimpan.")).toBeVisible();
    await expect(editor.getByRole("paragraph").filter({ hasText: stem })).toBeVisible();
    expect(await editor.locator("main b").count()).toBe(0);
    await expect(editor.getByLabel("Pembahasan", { exact: true })).toHaveValue("");
    await expect(editor.getByLabel("Pilihan benar")).toHaveValue("");
    const detailPath = new URL(editor.url()).pathname;
    const version = detailPath.split("/").at(-1);
    const studentPath = `/api/v1/questions/${version}`;
    expect((await learner.request.get(studentPath)).status()).toBe(404);
    expect(await (await editor.request.get(detailPath)).text()).not.toContain(keySentinel);
    await editor.setViewportSize({ width: 360, height: 800 });
    expect(await editor.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await editor.screenshot({ path: info.outputPath("editorial-mobile.png"), fullPage: true });
    await editor.getByRole("button", { name: "Ajukan peninjauan" }).click();
    await expect(editor.getByText("Draf diajukan untuk peninjauan.")).toBeVisible();

    await reviewer.goto(detailPath);
    await expect(reviewer.getByRole("button", { name: "Terbitkan versi" })).toBeHidden();
    await reviewer.getByLabel("Jawaban hasil telaah").selectOption("2");
    await reviewer.getByLabel("Alasan persetujuan").fill("Hasil penjumlahan adalah lima. Konten ini merupakan fixture sintetis.");
    await reviewer.getByRole("button", { name: "Setujui peninjauan" }).click();
    await expect(reviewer.getByText("Peninjauan tercatat.")).toBeVisible();
    await reviewer.screenshot({ path: info.outputPath("editorial-desktop.png"), fullPage: true });

    await admin.goto(detailPath);
    await admin.getByRole("button", { name: "Terbitkan versi" }).click();
    await expect(admin.getByText("Versi soal diterbitkan.")).toBeVisible();
    const response = await learner.request.get(studentPath);
    expect(response.status()).toBe(200);
    expect(await response.json()).toMatchObject({ stem, options: [{ position: 1, text: "4" }, { position: 2, text: "5" }] });
    expect(await response.text()).not.toMatch(/correct_position|explanation|PRIVATE_SYNTHETIC/);

    const report = await learner.request.post(studentPath, { headers: { origin }, data: { reason: "content", notes: "Laporan fixture" } });
    expect(report.status()).toBe(202);
    await admin.reload();
    await expect(admin.getByText("Laporan fixture")).toBeVisible();
    await admin.getByRole("button", { name: "Buat versi revisi" }).click();
    await expect(admin.getByRole("heading", { name: "Versi soal 2" })).toBeVisible();
    await admin.getByRole("link", { name: "Versi 1 · Terbit" }).click();
    await admin.getByRole("button", { name: "Arsipkan versi" }).click();
    await expect(admin.getByText("Versi soal diarsipkan.")).toBeVisible();
    expect((await learner.request.get(studentPath)).status()).toBe(404);
    await expect(admin.getByRole("link", { name: "Versi 2 · Draf" })).toBeVisible();
  } finally {
    await Promise.all([editor, reviewer, admin, learner].map((page) => page.context().close()));
  }
});
