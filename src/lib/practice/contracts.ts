import { z } from "zod";

const id = z.uuid();
const subtestCode = z.string().regex(/^[A-Z][A-Z0-9]{1,11}$/);
const topicCode = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).max(100);
const count = z.number().int().nonnegative();
const date = z.iso.datetime({ offset: true });
const accuracy = z.number().min(0).max(100);
const choice = z.number().int().min(1).max(5);

export const practiceLengths = [5, 10, 20] as const;
const length = z.literal(practiceLengths);
const ordinal = z.number().int().min(1).max(20);
export const positionParam = z.string().regex(/^[1-9]\d?$/).transform(Number).pipe(ordinal);
export const startInput = z.object({
  blueprint: id,
  subtest: subtestCode,
  topic: topicCode.or(z.literal("")),
  length: z.enum(["5", "10", "20"]).transform(Number).pipe(length),
  request: id,
});
export const sessionInput = z.object({ session: id });
export const answerInput = sessionInput.extend({
  position: positionParam,
  choice: z.string().regex(/^[1-5]$/).transform(Number).pipe(choice),
});

const topic = z.object({ code: topicCode, name: z.string(), parent_code: topicCode.nullable(), count });
const subtest = z.object({ code: subtestCode, name: z.string(), count, topics: z.array(topic) });
export const catalog = z.object({
  id, exam_year: z.number().int(), version: z.number().int(),
  classification: z.enum(["historical_reference", "official"]),
  subtests: z.array(subtest),
});
export type PracticeSubtest = z.infer<typeof subtest>;

const totals = z.object({ correct: count, incorrect: count, unanswered: count });
const result = totals.extend({
  question_count: length, accuracy_percent: accuracy,
  by_topic: z.array(totals.extend({ topic_code: topicCode, topic: z.string() })),
}).refine(({ correct, incorrect, unanswered, question_count }) =>
  correct + incorrect + unanswered === question_count);

const item = z.object({
  position: ordinal, version_id: id, stem: z.string(), passage: z.string().nullable(), topic: z.string(),
  options: z.array(z.object({ position: choice, text: z.string() })).min(2).max(5),
  feedback: z.object({
    selected_position: choice, correct_position: choice, is_correct: z.boolean(), explanation: z.string(),
  }).nullable(),
});

export const practiceSession = z.object({
  id, subtest: z.string(), topic: z.string().nullable(),
  question_count: length, finished_at: date.nullable(),
  navigation: z.array(z.object({ position: ordinal, answered: z.boolean() })),
  item: item.nullable(), result: result.nullable(),
}).refine((session) => session.navigation.length === session.question_count &&
  Boolean(session.finished_at) === Boolean(session.result));

export type PracticeSession = z.infer<typeof practiceSession>;

export const practiceHistory = z.array(z.object({
  id, started_at: date, finished_at: date.nullable(), question_count: length, answered: count,
  subtest: z.string(), accuracy_percent: accuracy.nullable(),
}));
