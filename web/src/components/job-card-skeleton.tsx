"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function JobCardSkeleton() {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-[#E0DFDC] bg-white p-4 shadow-xs dark:border-[#30363D] dark:bg-[#24292E]">
      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Logo Avatar skeleton */}
            <Skeleton className="h-11 w-11 rounded-lg" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          {/* Priority Pill skeleton */}
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>

        {/* Title skeleton */}
        <div className="mt-3.5 space-y-1.5">
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-3/5" />
        </div>

        {/* Badges skeleton */}
        <div className="mt-3.5 flex flex-wrap gap-1.5">
          <Skeleton className="h-6 w-24 rounded-md" />
          <Skeleton className="h-6 w-20 rounded-md" />
        </div>
      </div>

      {/* Footer Actions skeleton */}
      <div className="mt-4 flex items-center justify-between border-t border-[#E0DFDC] pt-3 dark:border-[#30363D]">
        <Skeleton className="h-3 w-14" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-20 rounded-md" />
          <Skeleton className="h-7 w-14 rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function JobGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <JobCardSkeleton key={i} />
      ))}
    </div>
  );
}
