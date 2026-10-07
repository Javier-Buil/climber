"use client";

import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  "aria-label"?: string;
  className?: string;
}

export function Checkbox({ checked, onCheckedChange, className, ...rest }: CheckboxProps) {
  return (
    <BaseCheckbox.Root
      checked={checked}
      onCheckedChange={(value) => onCheckedChange(value)}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "flex size-4 shrink-0 cursor-pointer items-center justify-center border border-line-strong bg-ink transition-colors",
        "data-checked:border-signal data-checked:bg-signal",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal",
        className,
      )}
      {...rest}
    >
      <BaseCheckbox.Indicator className="text-ink data-unchecked:hidden">
        <Check className="size-3" strokeWidth={3} />
      </BaseCheckbox.Indicator>
    </BaseCheckbox.Root>
  );
}
