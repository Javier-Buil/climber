import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface PanelProps {
  title?: ReactNode;
  code?: string;
  actions?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}

/** Bracketed HUD panel with an optional header strip. */
export function Panel({ title, code, actions, className, bodyClassName, children }: PanelProps) {
  return (
    <section
      className={cn(
        "bracketed flex min-h-0 flex-col border border-line bg-panel/85 backdrop-blur-sm",
        className,
      )}
    >
      {title !== undefined && (
        <header className="flex items-center gap-2 border-b border-line px-3 py-2">
          <span className="size-1.5 bg-signal" aria-hidden />
          <h2 className="font-sans text-xs font-semibold tracking-[0.2em] text-signal uppercase">{title}</h2>
          {code && <span className="text-[10px] tracking-widest text-faint">{code}</span>}
          <div className="ml-auto flex items-center gap-1">{actions}</div>
        </header>
      )}
      <div className={cn("min-h-0 flex-1", bodyClassName)}>{children}</div>
    </section>
  );
}

export function Stat({ label, value, className }: { label: string; value: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <span className="text-[10px] tracking-[0.18em] text-dim uppercase">{label}</span>
      <span className="text-sm text-bone tabular-nums">{value}</span>
    </div>
  );
}

export function Badge({
  children,
  tone = "default",
  className,
}: {
  children: ReactNode;
  tone?: "default" | "signal" | "danger";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center border px-1.5 py-px text-[10px] tracking-[0.15em] uppercase",
        tone === "default" && "border-faint text-dim",
        tone === "signal" && "border-signal/60 bg-signal/10 text-signal",
        tone === "danger" && "border-danger/60 bg-danger/10 text-danger",
        className,
      )}
    >
      {children}
    </span>
  );
}
