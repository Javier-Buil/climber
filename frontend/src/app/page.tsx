import { Suspense } from "react";
import { WorldExplorer } from "@/components/map/world-explorer";

export default function Home() {
  return (
    <Suspense fallback={<BootScreen />}>
      <WorldExplorer />
    </Suspense>
  );
}

function BootScreen() {
  return (
    <div className="grid-backdrop flex h-full items-center justify-center">
      <span className="animate-blink text-xs tracking-[0.3em] text-signal uppercase">Initialising recon…</span>
    </div>
  );
}
