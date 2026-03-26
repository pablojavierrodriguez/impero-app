import { memo } from "react";

export const TransactionListSkeleton = memo(function TransactionListSkeleton() {
  return (
    <div className="px-4 pb-28 space-y-4">
      <div className="h-4 bg-secondary rounded w-20 mb-3" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="h-3 bg-secondary rounded w-24 mb-2" />
          {Array.from({ length: 2 }).map((_, j) => (
            <div key={j} className="flex items-center gap-3 p-3">
              <div className="w-8 h-8 bg-secondary rounded-[10px] flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 bg-secondary rounded w-3/4" />
                <div className="h-3 bg-secondary rounded w-1/2" />
              </div>
              <div className="h-3.5 bg-secondary rounded w-12" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
});
