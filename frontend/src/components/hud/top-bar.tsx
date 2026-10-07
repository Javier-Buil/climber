"use client";

import Link from "next/link";
import { Fragment, useEffect, useState, type ReactNode } from "react";

export interface Crumb {
  label: string;
  href?: string;
}

function UtcClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="tabular-nums">{now ? now.toISOString().slice(11, 19) : "--:--:--"}Z</span>;
}

export function TopBar({ crumbs = [], right }: { crumbs?: Crumb[]; right?: ReactNode }) {
  return (
    <header className="relative z-20 flex h-12 shrink-0 items-center gap-4 border-b border-line bg-ink/90 px-4 backdrop-blur">
      <Link href="/" className="group flex items-center gap-2.5">
        <Logo />
        <span className="font-sans text-sm font-bold tracking-[0.3em] text-bone group-hover:text-signal">
          CLIMBER
        </span>
        <span className="hidden text-[10px] tracking-[0.25em] text-signal sm:inline">{"// RECON"}</span>
      </Link>

      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-[11px] tracking-[0.18em] uppercase">
        {crumbs.map((crumb, i) => (
          <Fragment key={i}>
            <span className="text-faint">/</span>
            {crumb.href ? (
              <Link href={crumb.href} className="truncate text-dim hover:text-signal">
                {crumb.label}
              </Link>
            ) : (
              <span className="truncate text-bone">{crumb.label}</span>
            )}
          </Fragment>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-4 text-[10px] tracking-[0.2em] text-dim uppercase">
        {right}
        <span className="hidden items-center gap-1.5 md:flex">
          <span className="size-1.5 animate-blink bg-signal" />
          Link active
        </span>
        <UtcClock />
      </div>
    </header>
  );
}

function Logo() {
  return (
    <svg viewBox="0 0 24 24" className="size-6 text-signal" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M2 21 9 8l4 6 3-4 6 11Z" />
      <path d="M12 2v4M12 2l3 1.5L12 5" />
      <circle cx="12" cy="13" r="10.5" strokeOpacity=".35" strokeDasharray="2 3" />
    </svg>
  );
}
