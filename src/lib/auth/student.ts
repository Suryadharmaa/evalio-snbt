import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createAccountClient } from "./client";

export const getStudent = cache(async (writable = false) => {
  const client = await createAccountClient({ writable });
  if (!client) return null;

  const { data, error } = await client.auth.getUser();
  if (error || !data.user?.email_confirmed_at) return null;

  return { client, user: data.user };
});

export async function requireStudent(writable = false) {
  const student = await getStudent(writable);
  if (!student) redirect("/sign-in?status=required");
  return student;
}
