"use client";

import { useActionState, useId } from "react";
import { type FormState, initialFormState } from "./form-state";

export type AccountField = {
  name: string;
  label: string;
  type: "email" | "password" | "number" | "text" | "textarea" | "checkbox";
  required?: boolean;
  autoComplete?: string;
  hint?: string;
  defaultValue?: string;
  maxLength?: number;
  minLength?: number;
  min?: number;
  max?: number;
};

type AccountFormProps = {
  action: (previous: FormState, data: FormData) => Promise<FormState>;
  fields?: readonly AccountField[];
  hiddenFields?: Record<string, string>;
  submitLabel: string;
  secondary?: boolean;
};

const control = "mt-1.5 block min-h-11 w-full rounded-lg border border-muted bg-surface px-3 py-2 text-ink";

export function AccountForm({
  action, fields = [], hiddenFields, submitLabel, secondary,
}: AccountFormProps) {
  const [state, submit, pending] = useActionState(action, initialFormState);
  const instance = useId();

  return (
    <form action={submit} aria-busy={pending} className="space-y-4">
      {Object.entries(hiddenFields ?? {}).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      {fields.map((field) => {
        const { name, label, type, hint, ...props } = field;
        const id = `${instance}-${name}`;
        const error = state.fieldErrors?.[name]?.[0];
        const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ");
        const common = { id, name, "aria-invalid": Boolean(error), "aria-describedby": describedBy || undefined };

        return (
          <div key={name}>
            {type === "checkbox" ? (
              <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm/6">
                <input {...common} type="checkbox" required={field.required} className="mt-1 size-5 shrink-0 accent-primary" />
                <span>{label}</span>
              </label>
            ) : (
              <>
                <label htmlFor={id} className="text-sm font-semibold">{label}</label>
                {type === "textarea" ? (
                  <textarea {...common} rows={4} defaultValue={props.defaultValue} maxLength={props.maxLength} className={control} />
                ) : (
                  <input {...common} {...props} type={type} className={control} />
                )}
              </>
            )}
            {hint && <p id={`${id}-hint`} className="mt-1 text-sm/6 text-muted">{hint}</p>}
            {error && <p id={`${id}-error`} role="alert" className="mt-1 text-sm/6 text-danger">{error}</p>}
          </div>
        );
      })}
      {state.message && (
        <p role={state.status === "error" ? "alert" : "status"} className={`rounded-lg bg-lavender p-3 text-sm/6 ${state.status === "error" ? "text-danger" : "text-ink"}`}>
          {state.message}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className={`min-h-11 w-full cursor-pointer rounded-lg px-4 py-2 text-sm font-bold disabled:cursor-wait disabled:opacity-70 sm:w-auto ${secondary ? "border border-muted bg-surface text-ink hover:bg-lavender" : "bg-primary text-white hover:bg-primary-hover"}`}
      >
        {pending ? "Memproses…" : submitLabel}
      </button>
    </form>
  );
}
