import { expect, test } from "@playwright/test";

const base = "/api/v1/exam-blueprints";
const localEnabled = process.env.EVALIO_TEST_LOCAL_SUPABASE === "1";

if (localEnabled && process.env.NEXT_PUBLIC_SUPABASE_URL !== "http://127.0.0.1:55321") {
  throw new Error("Blueprint database integration requires the isolated loopback Supabase API.");
}

test("blueprint routes reject invalid inputs and do not expose write methods", async ({ request }) => {
  for (const path of ["?year=2027&year=2026", "?year=latest", "/2026/0", "/2026/1/answers"]) {
    const response = await request.get(base + path);
    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_blueprint_request" });
  }
  expect((await request.post(base, { data: { exam_year: 2027, status: "published" } })).status()).toBe(405);
});

test("public blueprint API serves verified history and reports unavailable versions", async ({ request, isMobile }) => {
  test.skip(!localEnabled || isMobile, "Loopback database integration runs on Desktop Chromium");

  const collection = await request.get(base);
  expect(collection.ok()).toBe(true);
  expect(await collection.json()).toMatchObject({
    state: "available",
    blueprints: [{
      exam_year: 2026, version: 1, status: "published", classification: "historical_reference",
      total_questions: 160, duration_seconds: 11700, source_verified_on: "2026-11-20",
    }],
  });

  const detail = await request.get(base + "/2026/1");
  expect(detail.ok()).toBe(true);
  expect(detail.headers()["cache-control"]).toBe("no-store");
  const published = await detail.json();
  expect(published.blueprint.sources).toEqual(expect.arrayContaining([
    expect.objectContaining({ url: "https://snpmb.id/fr/", verified_on: "2026-11-20" }),
  ]));
  expect(published.subtests.map(({ subtest_code }: { subtest_code: string }) => subtest_code))
    .toEqual(["PU", "PPU", "PBM", "PK", "LBI", "LBE", "PM"]);

  const subtestResponse = await request.get(base + "/2026/1/subtests");
  expect(subtestResponse.ok()).toBe(true);
  const subtests = await subtestResponse.json();
  expect(subtests).toMatchObject({ blueprint: published.blueprint, subtests: published.subtests });
  expect(subtests).not.toHaveProperty("topics");

  const topicResponse = await request.get(base + "/2026/1/topics");
  expect(topicResponse.ok()).toBe(true);
  const topics = await topicResponse.json();
  expect(topics).toMatchObject({
    blueprint: published.blueprint,
    taxonomy_origin: "evalio_editorial",
    topics: expect.arrayContaining([expect.objectContaining({
      subtest_code: "PU", code: "induktif", parent_code: "penalaran",
    })]),
  });
  expect(topics).not.toHaveProperty("subtests");

  const nextYear = await request.get(base + "?year=2027");
  expect(nextYear.status()).toBe(200);
  expect(await nextYear.json()).toEqual({
    state: "unavailable", exam_year: 2027, version: null, status: null, source_verified_on: null, reason: "no_approved_blueprint", blueprints: [],
  });
  for (const path of ["/2027/1", "/2026/99", "/2027/1/topics"]) {
    const response = await request.get(base + path);
    expect(response.status()).toBe(404);
    expect(await response.json()).toMatchObject({ state: "unavailable", reason: "no_approved_blueprint" });
  }
});
