import { z } from "zod";

const id = z.uuid();
const difficulty = z.enum(["easy", "medium", "hard"]);
const status = z.enum(["draft", "in_review", "published", "retired"]);
export const role = z.enum(["editor", "reviewer", "admin"]);
const positive = z.number().int().positive();
const option = z.string().trim().min(1).max(1000);
const topicCode = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);
const subtestCode = z.string().regex(/^[A-Z][A-Z0-9]{1,11}$/);
const plainText = (max: number) => z.string().trim().min(1).max(max);
const license = z.object({
  license_kind: z.enum(["original", "licensed"]),
  owner_name: plainText(200),
  provenance: plainText(2000),
  agreement_ref: plainText(500).nullable(),
  source_url: z.url({ protocol: /^https$/ }).max(2048).nullable(),
});

export const draft = license.extend({
  blueprint_id: id, subtest_code: subtestCode, topic_code: topicCode,
  stem: plainText(5000), difficulty,
  tags: z.array(plainText(40)).max(8),
  options: z.array(option).min(2).max(5),
  answer: z.number().int().min(1).max(5),
  explanation: plainText(5000),
  passage_version_id: id.nullable(),
  passage_text: plainText(10000).nullable(),
}).superRefine((data, ctx) => {
  if (data.answer > data.options.length || new Set(data.options.map((item) => item.toLowerCase())).size !== data.options.length) {
    ctx.addIssue({ code: "custom", path: ["options"], message: "Gunakan pilihan berbeda dan pilih jawaban yang tersedia." });
  }
  if ((data.license_kind === "licensed") !== (data.agreement_ref !== null)) {
    ctx.addIssue({ code: "custom", path: ["agreement_ref"], message: "Soal berlisensi memerlukan rujukan izin komersial. Soal orisinal tidak memerlukan rujukan izin." });
  }
});

export type DraftQuestion = z.infer<typeof draft>;

export const versionReference = z.object({
  version: id,
  revision: z.string().regex(/^[1-9]\d*$/).transform(Number).pipe(positive.max(2147483647)),
});

const item = z.object({
  id, version: positive, status,
});

export const questionList = z.object({
  versions: z.array(item.extend({ question_id: id, subtest_code: subtestCode, stem: z.string() })),
});

const licenseSnapshot = z.object({
  kind: license.shape.license_kind,
  owner_name: license.shape.owner_name,
  provenance: license.shape.provenance,
  agreement_ref: license.shape.agreement_ref,
  source_url: license.shape.source_url,
});

export const workspace = item.extend({
  question_id: id, revision: positive, author_id: id, blueprint_id: id,
  subtest_code: subtestCode, topic_code: topicCode, stem: z.string(),
  difficulty, tags: z.array(z.string()), options: z.array(z.string()),
  license: licenseSnapshot,
  passage: z.string().nullable(),
  passage_version_id: id.nullable(),
  passage_license: licenseSnapshot.nullable(),
  history: z.array(item),
  reviews: z.array(z.object({
    revision: positive, reviewer_id: id, decision: z.enum(["approved", "rejected"]),
    notes: z.string(), reviewed_at: z.string(),
  })),
  audit: z.array(z.object({ actor_id: id, event: z.string(), revision: positive, occurred_at: z.string() })),
  reports: z.array(z.object({ reason: z.string(), notes: z.string(), reported_at: z.string() })),
});

export const choices = z.object({
  topics: z.array(z.object({
    blueprint_id: id, exam_year: positive, version: positive, subtest_code: subtestCode,
    subtest_name: z.string(), code: topicCode, name: z.string(), parent_code: topicCode.nullable(),
  })),
  passages: z.array(z.object({ id, version: positive, excerpt: z.string() })),
});

export const publishedQuestion = z.object({
  id, question_id: id, version: positive, format: z.literal("single_choice"),
  stem: z.string(), difficulty, subtest_code: subtestCode, topic_code: topicCode,
  passage: z.string().nullable(),
  options: z.array(z.object({ position: positive, text: z.string() })).min(2).max(5),
});

export const report = z.object({
  reason: z.enum(["content", "answer", "rendering", "other"]),
  notes: z.string().trim().max(1000).default(""),
}).strict();

export const transition = versionReference.extend({
  action: z.enum(["submit", "approve", "reject", "publish", "retire", "fork"]),
  notes: plainText(2000).nullable(),
  answer: z.number().int().min(1).max(5).nullable(),
}).refine((data) => data.action !== "approve" || (data.answer !== null && data.notes !== null),
  "Pilih jawaban secara mandiri dan tuliskan alasannya.")
  .refine((data) => data.action !== "reject" || data.notes !== null, "Tuliskan alasan penolakan.");

export type EditorialChoices = z.infer<typeof choices>;
export type EditorialQuestion = z.infer<typeof workspace>;
