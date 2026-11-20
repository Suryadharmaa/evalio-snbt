import { expect, test } from "vitest";
import { formatReferenceResponse, parseReferenceQuery } from "@/lib/exam/blueprint-contract";

const historical = {
  exam_year: 2026,
  version: 1,
  status: "published",
  classification: "historical_reference",
  total_questions: 160,
  duration_seconds: 11700,
  published_at: "2026-11-20T05:20:00+00:00",
  sources: [
    { url: "https://example.test/first", title: "Earlier source", publisher: "Fixture", verified_on: "2026-05-01" },
    { url: "https://example.test/review", title: "Later source", publisher: "Fixture", verified_on: "2026-11-20" },
  ],
};

test("request validation accepts only the documented paths and single catalog year", () => {
  const empty = new URLSearchParams();
  expect(parseReferenceQuery([], new URLSearchParams("year=2027"))).toEqual({ view: "catalog", year: 2027 });
  expect(parseReferenceQuery(["2026", "1"], empty)).toEqual({ view: "blueprint", year: 2026, version: 1 });
  expect(parseReferenceQuery(["2026", "1", "topics"], empty)).toEqual({ view: "topics", year: 2026, version: 1 });
  for (const path of [["2026"], ["2026", "01"], ["2026", "0"], ["2026", "1e2"], ["2000", "10000"], ["2200", "1"], ["2026", "1", "scores"]]) {
    expect(parseReferenceQuery(path, empty)).toBeNull();
  }
  for (const params of ["year=2026&year=2027", "year=26", "year=2027&status=draft"]) {
    expect(parseReferenceQuery([], new URLSearchParams(params))).toBeNull();
  }
  expect(parseReferenceQuery(["2026", "1"], new URLSearchParams("year=2027"))).toBeNull();
});

test("missing 2027 records and versions are explicit, without substituting prior years", () => {
  expect(formatReferenceResponse({ view: "catalog", year: 2027 }, [])).toEqual({
    status: 200,
    body: { state: "unavailable", exam_year: 2027, version: null, status: null, source_verified_on: null, reason: "no_approved_blueprint", blueprints: [] },
  });
  expect(formatReferenceResponse({ view: "topics", year: 2026, version: 7 }, [])).toEqual({
    status: 404,
    body: { state: "unavailable", exam_year: 2026, version: 7, status: null, source_verified_on: null, reason: "no_approved_blueprint" },
  });
});

test("read models return ordered sections, topic provenance, and the latest source check", () => {
  const fixtures = [{
    ...historical,
    status: "superseded",
    blueprint_sections: [
      { subtest_code: "PPU", name: "Pengetahuan dan Pemahaman Umum", category: "TPS", question_count: 20, duration_seconds: 900, ordinal: 2, topics: [] },
      { subtest_code: "PU", name: "Penalaran Umum", category: "TPS", question_count: 30, duration_seconds: 1800, ordinal: 1,
        topics: [{ subtest_code: "PU", code: "penalaran", name: "Penalaran", parent_code: null }],
      },
    ],
  }];
  expect(formatReferenceResponse({ view: "blueprint", year: 2026, version: 1 }, fixtures).body).toMatchObject({
    state: "available",
    blueprint: {
      exam_year: 2026, version: 1, classification: "historical_reference", status: "superseded",
      source_verified_on: "2026-11-20", sources: [historical.sources[1], historical.sources[0]],
    },
    subtests: [{ subtest_code: "PU" }, { subtest_code: "PPU" }],
    topics: [{ subtest_code: "PU", parent_code: null }],
    taxonomy_origin: "evalio_editorial",
  });
  const topics = formatReferenceResponse({ view: "topics", year: 2026, version: 1 }, fixtures);
  expect(topics.body).not.toHaveProperty("subtests");
  const subtests = formatReferenceResponse({ view: "subtests", year: 2026, version: 1 }, fixtures);
  expect(subtests.body).not.toHaveProperty("topics");
});

test("draft or malformed upstream data cannot be serialized as public evidence", () => {
  const query = { view: "catalog" } as const;
  expect(() => formatReferenceResponse({ view: "catalog", year: 2027 }, [historical])).toThrow();
  for (const changes of [
    { status: "draft" }, { sources: [] }, { duration_seconds: 0 },
    { sources: [{ ...historical.sources[0], verified_on: "unknown" }] },
  ]) {
    expect(() => formatReferenceResponse(query, [{ ...historical, ...changes }])).toThrow();
  }
});
