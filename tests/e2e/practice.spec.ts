import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/auth/database";
import { practiceSession } from "@/lib/practice/contracts";
import { expect, test, type Page } from "@playwright/test";

const emptyFixture = process.env.EVALIO_TEST_PRACTICE_EMPTY === "1";
const populatedFixture = process.env.EVALIO_TEST_PRACTICE === "1";
const origin = "http://127.0.0.1:3100";
const explanation = "Pembahasan fixture sintetis";

if ((emptyFixture || populatedFixture) && process.env.NEXT_PUBLIC_SUPABASE_URL !== "http://127.0.0.1:55321") {
  throw new Error("Practice fixtures require isolated loopback Supabase.");
}

async function signIn(page: Page, role: "learner" | "admin") {
  await page.goto("/sign-in");
  await page.getByRole("textbox", { name: "Email", exact: true }).fill(`evalio-editorial-${role}@example.com`);
  await page.getByLabel("Kata sandi", { exact: true }).fill("Synthetic-Editorial-49!");
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Dasbor siswa" })).toBeVisible();
  await page.getByRole("link", { name: "Latihan", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Latihan UTBK" })).toBeVisible();
}

test("guests cannot reach practice discovery or a session", async ({ page }) => {
  await page.goto("/practice");
  await expect(page).toHaveURL(/\/sign-in\?status=required$/);
  await page.goto("/practice/00000000-0000-4000-8000-000000000100?q=1");
  await expect(page).toHaveURL(/\/sign-in\?status=required$/);
});

test("an empty catalog offers all seven subtests and keeps starting disabled", async ({ page, isMobile }) => {
  test.skip(!emptyFixture || isMobile, "Requires empty loopback published inventory");
  await signIn(page, "learner");
  await expect(page.getByText(/Belum ada soal terbit untuk subtes ini/)).toBeVisible();
  await expect(page.getByRole("region", { name: "Pilih subtes" }).getByRole("link")).toHaveCount(7);
  for (const size of [5, 10, 20]) {
    await page.getByRole("radio", { name: `${size} soal`, exact: true }).check();
    await expect(page.getByRole("button", { name: "Mulai latihan" })).toBeDisabled();
  }
});

test("practice commits before giving feedback, resumes, and reconciles results and history", async ({ browser, isMobile }, info) => {
  test.skip(!populatedFixture || isMobile, "Requires synthetic published inventory in the loopback database");
  test.setTimeout(90_000);
  const owner = await browser.newPage({ baseURL: origin, viewport: { width: 360, height: 800 } });
  const other = await browser.newPage({ baseURL: origin });
  try {
    await signIn(owner, "learner");
    await expect(owner.getByText("6 soal terbit tersedia untuk pilihan ini.")).toBeVisible();
    const start = owner.getByRole("button", { name: "Mulai latihan" });
    for (const size of [10, 20]) {
      await owner.getByRole("radio", { name: `${size} soal`, exact: true }).check();
      await expect(start).toBeDisabled();
    }
    await owner.getByRole("radio", { name: "5 soal", exact: true }).check();
    await owner.getByLabel("Topik", { exact: true }).selectOption("induktif");
    await expect(start).toBeDisabled();
    await owner.getByLabel("Topik", { exact: true }).selectOption("");
    await start.click();
    await expect(owner.getByRole("heading", { name: "Soal 1", exact: true })).toBeVisible();
    const session = new URL(owner.url()).pathname;
    const first = session + "?q=1";
    const response = await owner.request.get(first);
    expect(response.headers()["cache-control"]).toMatch(/no-store/);
    expect(await response.text()).not.toContain(explanation);
    await expect(owner.getByRole("heading", { name: "Bacaan" })).toBeVisible();
    const correct = owner.getByRole("radio", { name: "Buku sains ditempatkan di rak B." });
    await correct.focus();
    await owner.keyboard.press("Space");
    await expect(correct).toBeChecked();
    await expect(owner.getByRole("heading", { name: "Pembahasan" })).toBeHidden();
    await owner.getByRole("button", { name: "Kirim jawaban" }).click();
    await expect(owner.getByText("Jawaban tersimpan. Jawabanmu benar.")).toBeVisible();
    await expect(owner.getByText("Jawaban benar", { exact: true })).toBeVisible();
    expect(await owner.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await owner.screenshot({ path: info.outputPath("practice-mobile.png"), fullPage: true });
    await owner.setViewportSize({ width: 1280, height: 900 });
    expect(await owner.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await owner.screenshot({ path: info.outputPath("practice-desktop.png"), fullPage: true });
    await owner.reload();
    await expect(owner.getByText("Jawaban tersimpan. Jawabanmu benar.")).toBeVisible();

    await signIn(other, "admin");
    await other.goto(first);
    await expect(other.getByRole("heading", { name: "Soal 1" })).toBeHidden();
    await expect(other.getByText(explanation)).toBeHidden();

    await owner.goto(session);
    await expect(owner.getByRole("heading", { name: "Soal 2", exact: true })).toBeVisible();
    await expect(owner.getByRole("heading", { name: "Pembahasan" })).toBeHidden();
    expect(await (await owner.request.get(session + "?q=2")).text()).not.toContain(explanation);
    await owner.getByRole("radio", { name: "Semua buku ditempatkan di rak yang sama." }).check();
    await owner.getByRole("button", { name: "Kirim jawaban" }).click();
    await expect(owner.getByText("Jawaban tersimpan. Jawabanmu belum tepat.")).toBeVisible();
    await owner.getByText("Akhiri latihan", { exact: true }).click();
    await expect(owner.getByText(/3 soal belum dijawab/)).toBeVisible();
    await owner.getByRole("button", { name: "Selesaikan sesi" }).click();
    await expect(owner.getByRole("heading", { name: "Ringkasan latihan" })).toBeVisible();
    await expect(owner.getByText("20%", { exact: true })).toBeVisible();
    await expect(owner.getByRole("heading", { name: "Hasil per topik" })).toBeVisible();
    await owner.getByRole("link", { name: "Soal 3, belum dijawab" }).click();
    await expect(owner.getByText("Soal ini belum dijawab.")).toBeVisible();
    await expect(owner.getByRole("heading", { name: "Pembahasan" })).toBeHidden();
    await owner.goto("/practice");
    const history = owner.getByRole("region", { name: "Riwayat latihan" });
    await expect(history.getByRole("link").filter({ hasText: "Lihat hasil · 20%" }).first()).toBeVisible();
  } finally {
    await owner.context().close();
    await other.context().close();
  }
});

test("concurrent answer retries and finalizations produce one immutable result", async ({ isMobile }) => {
  test.skip(!populatedFixture || isMobile, "Requires synthetic published inventory in the loopback database");
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!key) throw new Error("Practice tests require the local publishable key.");
  const client = createClient<Database>("http://127.0.0.1:55321", key, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
  const login = await client.auth.signInWithPassword({
    email: "evalio-editorial-learner@example.com", password: "Synthetic-Editorial-49!",
  });
  expect(login.error).toBeNull();
  const created = await client.rpc("practice_start", {
    p_blueprint: "20260000-0000-4000-8000-000000000001", p_subtest: "PU",
    p_topic: null, p_count: 5, p_request: randomUUID(),
  });
  expect(created.error).toBeNull();
  const id = created.data;
  if (!id) throw new Error("Missing practice session");

  const answer = (position: number, choice: number) =>
    client.rpc("practice_answer", { p_session: id, p_position: position, p_choice: choice });
  const [first, retry] = await Promise.all([answer(1, 2), answer(1, 2)]);
  for (const response of [first, retry]) {
    expect(response.error).toBeNull();
    expect(response.data).toBeNull();
  }
  const choices = await Promise.all([answer(2, 1), answer(2, 2)]);
  expect(choices.filter((response) => response.error === null)).toHaveLength(1);
  expect(choices.find((response) => response.error)?.error?.code).toBe("23505");
  const chosen = choices[0].error ? 2 : 1;
  const read = await client.rpc("practice_session", { p_session: id, p_position: 2 });
  expect(practiceSession.parse(read.data).item?.feedback?.selected_position).toBe(chosen);

  const finish = () => client.rpc("practice_finish", { p_session: id });
  const races = await Promise.all([finish(), finish(), answer(3, 2)]);
  expect(races[0].error).toBeNull();
  expect(races[1].error).toBeNull();
  expect([null, "23514"]).toContain(races[2].error?.code ?? null);
  const final = practiceSession.parse((await client.rpc("practice_session", { p_session: id })).data);
  expect(final.result).toMatchObject({
    correct: 1 + Number(chosen === 2) + Number(races[2].error === null),
    incorrect: Number(chosen === 1),
    unanswered: races[2].error ? 3 : 2,
  });
  expect((await answer(4, 2)).error?.code).toBe("23514");
  expect((await finish()).error).toBeNull();
  expect(practiceSession.parse((await client.rpc("practice_session", { p_session: id })).data)).toEqual(final);
});
