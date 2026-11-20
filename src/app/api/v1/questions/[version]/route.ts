import { z } from "zod";
import { getAuthConfig } from "@/lib/auth/config";
import { getStudent } from "@/lib/auth/student";
import { publishedQuestion, report } from "@/lib/editorial/contracts";

type Context = { params: Promise<{ version: string }> };
const headers = { "Cache-Control": "private, no-store" };
const error = (message: string, status: number) => Response.json({ error: message }, { status, headers });

export async function GET(_request: Request, context: Context) {
  const student = await getStudent();
  if (!student) return error("sign_in_required", 401);
  const version = z.uuid().safeParse((await context.params).version);
  if (!version.success) return error("invalid_version", 400);

  const result = await student.client.rpc("read_published_question", { p_version: version.data });
  if (result.error) return error("question_unavailable", 503);
  if (result.data === null) return error("question_not_found", 404);
  // The SQL projection omits private data, and Zod strips unlisted fields.
  const parsed = publishedQuestion.safeParse(result.data);
  if (!parsed.success) return error("question_unavailable", 503);
  return Response.json(parsed.data, { headers });
}

export async function POST(request: Request, context: Context) {
  // This cookie-authenticated mutation is available to the same origin only.
  const origin = getAuthConfig()?.origin;
  if (!origin || request.headers.get("origin") !== origin) return error("invalid_origin", 403);
  const student = await getStudent(true);
  if (!student) return error("sign_in_required", 401);
  const version = z.uuid().safeParse((await context.params).version);
  const input = report.safeParse(await request.json().catch(() => null));
  if (!version.success || !input.success) return error("invalid_report", 400);
  const result = await student.client.rpc("report_question", {
    p_version: version.data, p_reason: input.data.reason, p_notes: input.data.notes,
  });
  if (result.error?.code === "P0002") return error("question_not_found", 404);
  if (result.error) return error("report_unavailable", 503);
  return Response.json({ state: "recorded" }, { status: 202, headers });
}
