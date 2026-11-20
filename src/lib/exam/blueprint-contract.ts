import { z } from "zod";

const examYear = z.number().int().min(2000).max(2199);
const version = z.number().int().min(1).max(9999);
const yearParam = z.string().regex(/^\d{4}$/).transform(Number).pipe(examYear);
const versionParam = z.string().regex(/^[1-9]\d{0,3}$/).transform(Number).pipe(version);
const catalogParams = z.object({ year: yearParam.optional() }).strict();
const referencePath = z.union([
  z.tuple([yearParam, versionParam]),
  z.tuple([yearParam, versionParam, z.enum(["subtests", "topics"])]),
]);

type ReferenceQuery =
  | { view: "catalog"; year?: number }
  | { view: "blueprint" | "subtests" | "topics"; year: number; version: number };

export function parseReferenceQuery(
  path: readonly string[],
  params: URLSearchParams,
): ReferenceQuery | null {
  if (path.length === 0) {
    const fields = Object.fromEntries(params);
    if (Object.keys(fields).length !== params.size) return null;
    const parsed = catalogParams.safeParse(fields);
    return parsed.success ? { view: "catalog", year: parsed.data.year } : null;
  }
  if (params.size > 0) return null;
  const parsed = referencePath.safeParse(path);
  if (!parsed.success) return null;
  const [year, requestedVersion, view = "blueprint"] = parsed.data;
  return { view, year, version: requestedVersion };
}

const positiveInt = z.number().int().positive();
const subtestCode = z.string().regex(/^[A-Z][A-Z0-9]{1,11}$/);
const topicCode = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);
const name = z.string().min(1);

const source = z.object({
  url: z.url({ protocol: /^https$/ }),
  title: name,
  publisher: name,
  verified_on: z.iso.date(),
});

const blueprint = z.object({
  exam_year: examYear,
  version,
  status: z.enum(["published", "superseded"]),
  classification: z.enum(["historical_reference", "official"]),
  total_questions: positiveInt,
  duration_seconds: positiveInt,
  published_at: z.iso.datetime({ offset: true }),
  sources: z.array(source).min(1),
}).transform((row) => {
  const sources = [...row.sources].sort((a, b) =>
    b.verified_on.localeCompare(a.verified_on) || a.url.localeCompare(b.url));
  return { ...row, sources, source_verified_on: sources[0].verified_on };
});

const section = z.object({
  subtest_code: subtestCode,
  name,
  category: z.enum(["TPS", "LITERASI"]),
  question_count: positiveInt,
  duration_seconds: positiveInt.nullable(),
  ordinal: positiveInt,
});

const topic = z.object({
  subtest_code: subtestCode,
  code: topicCode,
  name,
  parent_code: topicCode.nullable(),
});

const catalogRows = z.array(blueprint);
const versionRows = z.array(z.object({
  blueprint_sections: z.array(section.extend({ topics: z.array(topic) })).min(1),
}).and(blueprint)).max(1);

export function formatReferenceResponse(query: ReferenceQuery, rows: unknown) {
  if (query.view === "catalog") {
    const blueprints = catalogRows.parse(rows);
    if (query.year !== undefined && blueprints.some((record) => record.exam_year !== query.year)) {
      throw new Error("Catalog returned a different exam year");
    }
    if (blueprints.length > 0) {
      return { status: 200, body: { state: "available" as const, exam_year: query.year ?? null, blueprints } };
    }
    return {
      status: 200,
      body: {
        state: "unavailable" as const,
        reason: "no_approved_blueprint" as const,
        exam_year: query.year ?? null,
        version: null,
        status: null,
        source_verified_on: null,
        blueprints,
      },
    };
  }

  const [record] = versionRows.parse(rows);
  if (!record) {
    return {
      status: 404,
      body: {
        state: "unavailable" as const,
        reason: "no_approved_blueprint" as const,
        exam_year: query.year,
        version: query.version,
        status: null,
        source_verified_on: null,
      },
    };
  }

  const { blueprint_sections, ...metadata } = record;
  if (metadata.exam_year !== query.year || metadata.version !== query.version) {
    throw new Error("Repository returned a different blueprint identity");
  }
  const orderedTopics: z.infer<typeof topic>[] = [];
  const subtests = blueprint_sections.sort((a, b) => a.ordinal - b.ordinal).map(({ topics, ...snapshot }) => {
    topics.sort((a, b) => Number(a.parent_code !== null) - Number(b.parent_code !== null) ||
      a.code.localeCompare(b.code));
    orderedTopics.push(...topics);
    return snapshot;
  });
  return {
    status: 200,
    body: {
      state: "available" as const,
      blueprint: metadata,
      ...(query.view !== "topics" && { subtests }),
      ...(query.view !== "subtests" && { taxonomy_origin: "evalio_editorial" as const, topics: orderedTopics }),
    },
  };
}
