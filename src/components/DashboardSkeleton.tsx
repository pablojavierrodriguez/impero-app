import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="w-full space-y-5 animate-in fade-in-50 duration-300">
      {/* Month Selector Skeleton */}
      <div className="flex items-center justify-between px-1">
        <Skeleton className="h-8 w-32 rounded-lg" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>

      {/* Balance Header Skeleton */}
      <div className="rounded-2xl border border-border/50 bg-card/60 p-6 space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 w-56 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="rounded-xl bg-secondary/40 p-3 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-24" />
          </div>
          <div className="rounded-xl bg-secondary/40 p-3 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-24" />
          </div>
        </div>
      </div>

      {/* Velocity Bar Skeleton */}
      <div className="rounded-xl border border-border/40 bg-card/40 p-4 space-y-2">
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>

      {/* Account Cards Carousel Skeleton */}
      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex gap-3 overflow-hidden">
          <Skeleton className="h-32 w-64 shrink-0 rounded-xl" />
          <Skeleton className="h-32 w-64 shrink-0 rounded-xl" />
          <Skeleton className="h-32 w-64 shrink-0 rounded-xl" />
        </div>
      </div>

      {/* Chart Skeleton */}
      <div className="rounded-2xl border border-border/50 bg-card/60 p-5 space-y-4">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    </div>
  );
}
