import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid-backdrop flex h-full flex-col items-center justify-center gap-4 text-center">
      <p className="font-sans text-5xl font-bold tracking-[0.2em] text-signal">404</p>
      <p className="text-xs tracking-[0.3em] text-dim uppercase">Target not found on any grid</p>
      <Link href="/" className="border border-signal px-3 py-1.5 text-xs tracking-[0.2em] text-signal uppercase hover:bg-signal/10">
        Return to map
      </Link>
    </div>
  );
}
