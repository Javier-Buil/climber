"use client";

import { Button as BaseButton } from "@base-ui/react/button";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Variant = "solid" | "outline" | "ghost";
type Size = "sm" | "md" | "icon";

const VARIANTS: Record<Variant, string> = {
  solid: "bg-signal text-ink hover:bg-signal-soft border border-signal",
  outline: "border border-line-strong text-signal hover:bg-signal/10 hover:border-signal",
  ghost: "border border-transparent text-dim hover:text-signal hover:border-line",
};

const SIZES: Record<Size, string> = {
  sm: "h-7 px-2 text-[11px]",
  md: "h-9 px-3 text-xs",
  icon: "size-8 justify-center",
};

export interface ButtonProps extends ComponentProps<typeof BaseButton> {
  variant?: Variant;
  size?: Size;
}

export function Button({ variant = "outline", size = "md", className, ...props }: ButtonProps) {
  return (
    <BaseButton
      className={cn(
        "inline-flex shrink-0 cursor-pointer items-center gap-2 font-mono tracking-[0.15em] uppercase transition-colors select-none",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal",
        "data-disabled:pointer-events-none data-disabled:opacity-40",
        VARIANTS[variant],
        SIZES[size],
        className as string,
      )}
      {...props}
    />
  );
}
