"use client";

import * as React from "react";
import { useFluidHover } from "@/hooks/use-fluid-hover";
import { FluidHoverHighlight } from "@/components/fluid-hover-highlight";
import { JobCard } from "@/components/job-card";
import { JobItem } from "@/lib/types";

interface JobGridProps {
  jobs: JobItem[];
  selectedJobId?: string | null;
  onSelectJob?: (job: JobItem) => void;
}

export function JobGrid({ jobs, selectedJobId, onSelectJob }: JobGridProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const hover = useFluidHover(containerRef, { axis: "xy", gapClick: false });

  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card p-12 text-center">
        <div className="text-3xl">🔍</div>
        <h3 className="mt-3 text-base font-semibold text-foreground">
          No matching postings found
        </h3>
        <p className="mt-1 max-w-sm text-[13px] text-muted-foreground">
          Try broadening your location filter, switching priority tier, or triggering an on-demand harvest.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      {...hover.handlers}
      className="relative grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3"
    >
      {/* 2-D Fluid Hover Highlight overlay (borderless) */}
      <FluidHoverHighlight
        hover={hover}
        className="pointer-events-none z-20 rounded-xl bg-[#0A66C2]/[0.05] shadow-xs dark:bg-white/[0.06]"
      />

      {jobs.map((job, i) => (
        <JobCard
          key={job.id}
          job={job}
          index={i}
          registerItem={hover.registerItem}
          onSelectJob={onSelectJob}
          isSelected={selectedJobId === job.id}
        />
      ))}
    </div>
  );
}
