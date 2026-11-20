import { expect, test } from "vitest";
import { answerInput, practiceSession, startInput } from "@/lib/practice/contracts";

const id = "20260000-0000-4000-8000-000000000001";

test("practice choices only accept known lengths, identifiers and option positions", () => {
  const form = { blueprint: id, subtest: "PU", topic: "", length: "5", request: id };
  for (const length of ["5", "10", "20"]) expect(startInput.parse({ ...form, length }).length).toBe(Number(length));
  for (const length of ["0", "6", "020", "100"]) expect(startInput.safeParse({ ...form, length }).success).toBe(false);
  expect(startInput.safeParse({ ...form, topic: "pku|other" }).success).toBe(false);
  expect(answerInput.parse({ session: id, position: "20", choice: "5" })).toMatchObject({ position: 20, choice: 5 });
  expect(answerInput.safeParse({ session: id, position: "21", choice: "1" }).success).toBe(false);
  expect(answerInput.safeParse({ session: id, position: "1", choice: "6" }).success).toBe(false);
});

test("pre-answer session projection strips accidental key and explanation fields", () => {
  const parsed = practiceSession.parse({
    id, subtest: "Penalaran Umum", topic: null, question_count: 5, finished_at: null,
    navigation: Array.from({ length: 5 }, (_, index) => ({ position: index + 1, answered: false })),
    result: null,
    item: {
      position: 1, version_id: id, stem: "Fixture", passage: null, topic: "Penalaran",
      options: [{ position: 1, text: "One", is_correct: true }, { position: 2, text: "Two" }],
      explanation: "Private", correct_position: 1, feedback: null,
    },
  });
  expect(parsed.item?.feedback).toBeNull();
  expect(parsed.item).not.toHaveProperty("explanation");
  expect(parsed.item).not.toHaveProperty("correct_position");
  expect(parsed.item?.options[0]).not.toHaveProperty("is_correct");
});

test("completed summaries must reconcile the three outcome counts with the session size", () => {
  const result = { correct: 1, incorrect: 1, unanswered: 3, question_count: 5, accuracy_percent: 20, by_topic: [] };
  const envelope = {
    id, subtest: "Penalaran Umum", topic: null, question_count: 5, finished_at: "2026-11-20T00:00:00+00:00",
    navigation: Array.from({ length: 5 }, (_, index) => ({ position: index + 1, answered: index < 2 })),
    item: null,
  };
  expect(practiceSession.safeParse({ ...envelope, result }).success).toBe(true);
  expect(practiceSession.safeParse({ ...envelope, result: { ...result, unanswered: 2 } }).success).toBe(false);
  expect(practiceSession.safeParse({ ...envelope, result: null }).success).toBe(false);
});
