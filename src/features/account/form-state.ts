export type FormState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export const initialFormState: FormState = { status: "idle" };

export const unavailableMessage = "Layanan akun belum tersedia di lingkungan ini.";
