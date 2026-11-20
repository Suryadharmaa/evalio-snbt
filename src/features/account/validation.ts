import { z } from "zod";

export const privacyNoticeVersion = "evalio-preview-1";

const email = z.string().trim().max(254).pipe(z.email("Masukkan alamat email yang valid."));
const suppliedPassword = z.string().min(1, "Masukkan kata sandi.").max(256);
const newPassword = suppliedPassword
  .min(8, "Gunakan minimal 8 karakter.")
  .refine((value) => new TextEncoder().encode(value).length <= 72, "Gunakan maksimal 72 byte.");

const cohortYear = z.string()
  .regex(/^\d{4}$/, "Masukkan tahun dengan empat angka.")
  .transform(Number)
  .pipe(z.number().int().min(2026, "Pilih tahun 2026 atau lebih baru.").max(2100, "Pilih tahun hingga 2100."));

const optionalText = (max: number) =>
  z.string().trim().max(max, `Gunakan maksimal ${max} karakter.`).default("").transform((value) => value || null);

export const emailSchema = z.object({ email });
export const signInSchema = z.object({ email, password: suppliedPassword });
export const signUpSchema = z.object({
  email,
  password: newPassword,
  cohortYear,
  acknowledged: z.literal("on", "Baca dan setujui pemberitahuan privasi akun uji."),
});
export const resetSchema = z.object({ password: newPassword });
export const profileSchema = z.object({
  alias: optionalText(60),
  cohortYear,
  studyGoal: optionalText(500),
});
export const confirmationSchema = z.object({
  // Treat the provider token as opaque. PKCE links include a provider prefix.
  token_hash: z.string().min(32).max(256).regex(/^[A-Za-z0-9_-]+$/),
  type: z.enum(["email", "recovery"]),
});
