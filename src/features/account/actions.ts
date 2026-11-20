"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createAccountClient } from "@/lib/auth/client";
import { getAuthConfig } from "@/lib/auth/config";
import { clearPasswordRecovery, getRecoveryClient, grantPasswordRecovery } from "@/lib/auth/recovery";
import { requireStudent } from "@/lib/auth/student";
import { type FormState, unavailableMessage } from "./form-state";
import {
  confirmationSchema,
  emailSchema,
  privacyNoticeVersion,
  profileSchema,
  resetSchema,
  signInSchema,
  signUpSchema,
} from "./validation";

const temporaryError = "Layanan akun sedang mengalami kendala. Coba lagi nanti.";

function errorState(message: string): FormState {
  return { status: "error", message };
}

function invalidInput(error: z.ZodError): FormState {
  return {
    status: "error",
    message: "Periksa kembali isian yang ditandai.",
    fieldErrors: z.flattenError(error).fieldErrors,
  };
}

export async function signUp(_previous: FormState, formData: FormData): Promise<FormState> {
  const form = signUpSchema.safeParse(Object.fromEntries(formData));
  if (!form.success) return invalidInput(form.error);
  const config = getAuthConfig();
  const client = await createAccountClient({ writable: true });
  if (!config || !client) return errorState(unavailableMessage);

  const { email, password, cohortYear } = form.data;
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${config.origin}/auth/confirm`,
      data: { cohort_year: cohortYear, privacy_notice_version: privacyNoticeVersion },
    },
  });
  if (data.session) {
    // This project's Auth configuration requires proof of email ownership.
    await client.auth.signOut({ scope: "local" });
    return errorState(temporaryError);
  }
  if (error?.code === "weak_password") return errorState("Pilih kata sandi yang lebih kuat.");
  if (error && !["user_already_exists", "email_exists"].includes(error.code ?? "")) {
    return errorState(temporaryError);
  }

  return {
    status: "success",
    message: "Periksa kotak masuk. Jika pendaftaran dapat diproses, kamu akan menerima tautan konfirmasi.",
  };
}

export async function signIn(_previous: FormState, formData: FormData): Promise<FormState> {
  const form = signInSchema.safeParse(Object.fromEntries(formData));
  if (!form.success) return invalidInput(form.error);
  const client = await createAccountClient({ writable: true });
  if (!client) return errorState(unavailableMessage);

  const { error } = await client.auth.signInWithPassword(form.data);
  if (error?.code === "email_not_confirmed") {
    return errorState("Konfirmasi email melalui tautan di kotak masuk sebelum masuk.");
  }
  if (error?.code === "invalid_credentials") return errorState("Email atau kata sandi tidak cocok.");
  if (error) return errorState(temporaryError);
  redirect("/dashboard");
}

export async function signOut(): Promise<void> {
  const { client } = await requireStudent(true);
  const { error } = await client.auth.signOut({ scope: "local" });
  if (error) redirect("/dashboard?status=logout-error");
  redirect("/sign-in?status=signed-out");
}

export async function requestPasswordReset(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const form = emailSchema.safeParse(Object.fromEntries(formData));
  if (!form.success) return invalidInput(form.error);
  const config = getAuthConfig();
  const client = await createAccountClient({ recovery: true, writable: true });
  if (!config || !client) return errorState(unavailableMessage);

  await client.auth.resetPasswordForEmail(form.data.email, {
    redirectTo: `${config.origin}/auth/confirm`,
  });
  return {
    status: "success",
    message: "Jika email terdaftar dan permintaan dapat diproses, tautan pemulihan akan dikirim.",
  };
}

export async function resendConfirmation(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const form = emailSchema.safeParse(Object.fromEntries(formData));
  if (!form.success) return invalidInput(form.error);
  const config = getAuthConfig();
  const client = await createAccountClient({ writable: true });
  if (!config || !client) return errorState(unavailableMessage);

  await client.auth.resend({
    type: "signup",
    email: form.data.email,
    options: { emailRedirectTo: `${config.origin}/auth/confirm` },
  });
  return {
    status: "success",
    message: "Jika email masih menunggu konfirmasi, kamu akan menerima tautan baru.",
  };
}

export async function confirmEmail(_previous: FormState, formData: FormData): Promise<FormState> {
  const form = confirmationSchema.safeParse(Object.fromEntries(formData));
  if (!form.success) return errorState("Tautan tidak valid. Minta tautan baru.");
  const recovery = form.data.type === "recovery";
  const client = await createAccountClient({ recovery, writable: true });
  if (!client) return errorState(unavailableMessage);

  // Supabase's broad "email" OTP type also accepts recovery tokens.
  const { data, error } = await client.auth.verifyOtp({
    token_hash: form.data.token_hash,
    type: recovery ? "recovery" : "signup",
  });
  if (error || !data.session) return errorState("Tautan tidak berlaku atau sudah digunakan. Minta tautan baru.");
  if (!recovery) redirect("/dashboard");

  if (!await grantPasswordRecovery(client)) {
    await client.auth.signOut({ scope: "local" });
    await clearPasswordRecovery();
    return errorState(temporaryError);
  }
  redirect("/reset-password");
}

export async function resetPassword(_previous: FormState, formData: FormData): Promise<FormState> {
  const client = await getRecoveryClient(true);
  if (!client) return errorState("Sesi pemulihan berakhir. Minta tautan baru.");

  const form = resetSchema.safeParse(Object.fromEntries(formData));
  if (!form.success) return invalidInput(form.error);

  const { error } = await client.auth.updateUser({ password: form.data.password });
  if (error?.code === "same_password") return errorState("Pilih kata sandi yang berbeda dari sebelumnya.");
  if (error?.code === "weak_password") return errorState("Pilih kata sandi yang lebih kuat.");
  if (error) return errorState(temporaryError);

  // Revoke refresh tokens and clear the browser's recovery session after the change.
  await client.auth.signOut({ scope: "global" });
  await clearPasswordRecovery();
  redirect("/sign-in?status=password-reset");
}

export async function saveProfile(_previous: FormState, formData: FormData): Promise<FormState> {
  const { client, user } = await requireStudent(true);
  const form = profileSchema.safeParse(Object.fromEntries(formData));
  if (!form.success) return invalidInput(form.error);

  const { alias, cohortYear, studyGoal } = form.data;
  const { data, error } = await client.from("profiles")
    .update({ alias, cohort_year: cohortYear, study_goal: studyGoal })
    .eq("user_id", user.id)
    .select("user_id")
    .single();

  if (error || !data) return errorState("Profil belum tersimpan. Coba lagi.");
  redirect("/profile?status=saved");
}

export async function requestDeletion(_previous: FormState, formData: FormData): Promise<FormState> {
  const { client } = await requireStudent(true);
  if (formData.get("confirmed") !== "on") {
    return { status: "error", fieldErrors: { confirmed: ["Konfirmasi permintaan penghapusan."] } };
  }

  const { data, error } = await client.rpc("request_account_deletion");
  if (error || !data) return errorState("Permintaan belum tercatat. Coba lagi.");
  redirect("/profile?status=deletion-requested");
}
