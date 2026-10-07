import { notFound } from "next/navigation";
import { Suspense } from "react";
import { RouteViewer } from "@/components/wall/route-viewer";

export default function RoutePage({ params }: PageProps<"/routes/[routeId]">) {
  return (
    <Suspense fallback={<div className="grid-backdrop h-full" />}>
      {params.then(({ routeId }) => {
        const id = Number(routeId);
        if (!Number.isInteger(id) || id <= 0) notFound();
        return <RouteViewer routeId={id} />;
      })}
    </Suspense>
  );
}
