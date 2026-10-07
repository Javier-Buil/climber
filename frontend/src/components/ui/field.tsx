"use client";

import { Field } from "@base-ui/react/field";
import { Input } from "@base-ui/react/input";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

const CONTROL =
  "w-full border border-line bg-ink px-2 py-1.5 font-mono text-xs text-bone placeholder:text-faint outline-none transition-colors focus:border-signal";

export function TextField({
  label,
  className,
  ...props
}: { label: string } & ComponentProps<typeof Input>) {
  return (
    <Field.Root className="flex flex-col gap-1">
      <Field.Label className="text-[10px] tracking-[0.18em] text-dim uppercase">{label}</Field.Label>
      <Input className={cn(CONTROL, className as string)} {...props} />
    </Field.Root>
  );
}

export function TextAreaField({
  label,
  className,
  ...props
}: { label: string } & ComponentProps<"textarea">) {
  return (
    <Field.Root className="flex flex-col gap-1">
      <Field.Label className="text-[10px] tracking-[0.18em] text-dim uppercase">{label}</Field.Label>
      <Field.Control render={<textarea className={cn(CONTROL, "min-h-16 resize-none", className)} {...props} />} />
    </Field.Root>
  );
}

export const inputClassName = CONTROL;
