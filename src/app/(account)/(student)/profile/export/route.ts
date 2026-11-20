import { getStudent } from "@/lib/auth/student";

export async function GET() {
  const responseHeaders = { "Cache-Control": "private, no-store" };
  const student = await getStudent();
  if (!student) return Response.json({ error: "Masuk untuk mengunduh data akun." }, { status: 401, headers: responseHeaders });

  const { client, user } = student;
  const [profile, acknowledgments] = await Promise.all([
    client.from("profiles").select("user_id, alias, cohort_year, study_goal, created_at, delete_requested_at").eq("user_id", user.id).single(),
    client.from("user_consents").select("policy_version, consent_type, granted_at").eq("user_id", user.id),
  ]);
  if (profile.error || acknowledgments.error) {
    return Response.json({ error: "Data akun belum dapat diunduh. Coba lagi." }, { status: 503, headers: responseHeaders });
  }

  return Response.json({
    account: { id: user.id, email: user.email },
    profile: profile.data,
    privacy_acknowledgments: acknowledgments.data,
  }, {
    headers: { ...responseHeaders, "Content-Disposition": 'attachment; filename="evalio-data-akun.json"' },
  });
}
