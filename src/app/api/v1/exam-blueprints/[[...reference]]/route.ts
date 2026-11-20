import { createClient } from "@supabase/supabase-js";
import { getPublicSupabaseConfig } from "@/lib/auth/config";
import { formatReferenceResponse, parseReferenceQuery } from "@/lib/exam/blueprint-contract";

const summaryFields = "exam_year,version,classification,status,total_questions,duration_seconds,published_at,sources:exam_rule_sources(url,title,publisher,verified_on)";
const detailFields = `${summaryFields},blueprint_sections(subtest_code,name,category,question_count,duration_seconds,ordinal,topics(subtest_code,code,name,parent_code))`;
const headers = { "Cache-Control": "no-store" };

export async function GET(request: Request, context: { params: Promise<{ reference?: string[] }> }) {
  const { reference = [] } = await context.params;
  const query = parseReferenceQuery(reference, new URL(request.url).searchParams);
  if (!query) return Response.json({ error: "invalid_blueprint_request" }, { status: 400, headers });

  const config = getPublicSupabaseConfig();
  if (!config) return unavailable();

  try {
    // Use only the publishable key. Blueprint reads do not use the caller's session.
    const client = createClient(config.url, config.key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
    });
    let request = client.from("exam_blueprints")
      .select(query.view === "catalog" ? summaryFields : detailFields)
      .order("exam_year", { ascending: false })
      .order("version", { ascending: false });
    if (query.year !== undefined) request = request.eq("exam_year", query.year);
    if (query.view !== "catalog") request = request.eq("version", query.version);

    const { data, error } = await request;
    if (error) return unavailable();
    const { status, body } = formatReferenceResponse(query, data);
    return Response.json(body, { status, headers });
  } catch {
    return unavailable();
  }
}

function unavailable() {
  return Response.json({ error: "blueprint_service_unavailable" }, { status: 503, headers });
}
