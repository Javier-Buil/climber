"use client";

import { ScrollArea as BaseScrollArea } from "@base-ui/react/scroll-area";
import type { ReactNode, Ref } from "react";
import { cn } from "@/lib/cn";

export function ScrollArea({
  children,
  className,
  viewportRef,
}: {
  children: ReactNode;
  className?: string;
  viewportRef?: Ref<HTMLDivElement>;
}) {
  return (
    <BaseScrollArea.Root className={cn("relative min-h-0 overflow-hidden", className)}>
      <BaseScrollArea.Viewport ref={viewportRef} className="h-full overscroll-contain outline-none">
        <BaseScrollArea.Content>{children}</BaseScrollArea.Content>
      </BaseScrollArea.Viewport>
      <BaseScrollArea.Scrollbar className="flex w-1.5 justify-center bg-ink opacity-0 transition-opacity data-hovering:opacity-100 data-scrolling:opacity-100">
        <BaseScrollArea.Thumb className="w-full bg-signal/60" />
      </BaseScrollArea.Scrollbar>
    </BaseScrollArea.Root>
  );
}
