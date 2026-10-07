"use client";

import { Switch as BaseSwitch } from "@base-ui/react/switch";
import { useId } from "react";

interface SwitchProps {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export function Switch({ label, checked, onCheckedChange }: SwitchProps) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-3">
      <label htmlFor={id} className="cursor-pointer text-[11px] tracking-[0.15em] text-dim uppercase">
        {label}
      </label>
      <BaseSwitch.Root
        id={id}
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value)}
        className="flex h-4 w-8 shrink-0 cursor-pointer border border-line-strong bg-ink p-px transition-colors data-checked:border-signal data-checked:bg-signal/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
      >
        <BaseSwitch.Thumb className="h-full w-3 bg-faint transition-[translate,background-color] duration-150 data-checked:translate-x-4 data-checked:bg-signal" />
      </BaseSwitch.Root>
    </div>
  );
}
