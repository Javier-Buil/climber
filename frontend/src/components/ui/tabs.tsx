"use client";

import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export const Tabs = BaseTabs.Root;

export function TabList({ children }: { children: ReactNode }) {
  return (
    <BaseTabs.List className="relative flex border-b border-line">
      {children}
      <BaseTabs.Indicator className="absolute bottom-0 left-0 h-0.5 w-(--active-tab-width) translate-x-(--active-tab-left) bg-signal transition-[translate,width] duration-200" />
    </BaseTabs.List>
  );
}

export function Tab({ value, children }: { value: string; children: ReactNode }) {
  return (
    <BaseTabs.Tab
      value={value}
      className="flex-1 cursor-pointer px-3 py-2 font-sans text-[11px] font-semibold tracking-[0.2em] text-dim uppercase outline-none hover:text-bone focus-visible:bg-signal/10 data-active:text-signal"
    >
      {children}
    </BaseTabs.Tab>
  );
}

export function TabPanel({ value, children, className }: { value: string; children: ReactNode; className?: string }) {
  return (
    <BaseTabs.Panel value={value} className={cn("min-h-0 flex-1 outline-none [[hidden]]:hidden", className)}>
      {children}
    </BaseTabs.Panel>
  );
}
