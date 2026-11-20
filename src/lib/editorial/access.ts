import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { getStudent } from "@/lib/auth/student";
import { role } from "./contracts";

export const requireEditorial = cache(async (writable = false) => {
  const student = await getStudent(writable);
  if (!student) redirect("/sign-in?status=required");
  const { data, error } = await student.client.rpc("editorial_access");
  const roles = z.array(role).safeParse(data);
  if (error || !roles.success || !roles.data.length) notFound();
  return { ...student, roles: roles.data };
});
