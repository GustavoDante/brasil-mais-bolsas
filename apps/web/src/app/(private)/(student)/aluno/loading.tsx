import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-56" />
      <Skeleton className="h-56" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 2 }, (_, index) => (
          <Skeleton key={index} className="h-28" />
        ))}
      </div>
    </div>
  );
}
