import { expect, test } from "vitest";
import { draft, publishedQuestion, report, transition } from "@/lib/editorial/contracts";

const version = "20260000-0000-4000-8000-000000000001";
const content = {
  blueprint_id: version, subtest_code: "PU", topic_code: "induktif",
  options: ["First", "Second"], answer: 2, explanation: "Private rationale",
  stem: "Original question", difficulty: "easy", tags: ["fixture"],
  passage_version_id: null, passage_text: null, license_kind: "original",
  owner_name: "Test", provenance: "Created for test", agreement_ref: null, source_url: null,
};

test("draft validation requires scoped references, unique choices and rights metadata", () => {
  expect(draft.safeParse(content).success).toBe(true);
  for (const changes of [
    { options: ["First", "first"] }, { answer: 3 }, { options: ["Only"] },
    { license_kind: "licensed" }, { provenance: "" }, { explanation: " " },
    { blueprint_id: "unverified-version" }, { source_url: "javascript:alert(1)" },
    { passage_version_id: "broken-reference" },
  ]) {
    expect(draft.safeParse({ ...content, ...changes }).success).toBe(false);
  }
  expect(draft.safeParse({ ...content, license_kind: "licensed", agreement_ref: "TEST-001" }).success).toBe(true);
});

test("review decisions validate reasons and an independently selected option", () => {
  const review = { version, revision: "2", action: "approve", notes: "Independent solution", answer: 2 };
  expect(transition.parse(review).revision).toBe(2);
  expect(transition.safeParse({ ...review, answer: null }).success).toBe(false);
  expect(transition.safeParse({ ...review, notes: null, action: "reject" }).success).toBe(false);
  expect(report.safeParse({ reason: "content", reporter_id: version }).success).toBe(false);
});

test("the student response schema strips both top-level and nested secrets", () => {
  const result = publishedQuestion.parse({
    ...content, id: version, question_id: version, version: 1, format: "single_choice", passage: null,
    correct_position: 2,
    options: [{ position: 1, text: "First", correct: false }, { position: 2, text: "Second", correct: true }],
  });
  expect(result).not.toHaveProperty("correct_position");
  expect(result).not.toHaveProperty("answer");
  expect(result).not.toHaveProperty("explanation");
  expect(result.options[1]).toEqual({ position: 2, text: "Second" });
});
