import { memo } from "react";

export const SpendingBreakdownSkeleton = memo(function SpendingBreakdownSkeleton() {
  return (
    <div className="px-4 py-4 space-y-4">
      <div className="h-4 bg-secondary rounded w-24 mb-3" />
      
      {/* Chart skeleton */}
      <div className="space-y-2">
        <div className="h-24 bg-secondary rounded-lg" />
      </div>

      {/* Stacked bar skeleton */}
      <div className="h-3 bg-secondary rounded-full" />

      {/* Legend skeleton */}
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-secondary rounded-full" />
              <div className="h-3.5 bg-secondary rounded w-24" />
            </div>
            <div className="h-3.5 bg-secondary rounded w-16" />
          </div>
        ))}
      </div>
    </div>
  );
});
