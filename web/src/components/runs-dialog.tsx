"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Time02Icon,
  CheckmarkCircle01Icon,
  AlertCircleIcon,
} from "@hugeicons/core-free-icons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CollectionRunItem, RunsResponse } from "@/lib/types";

interface RunsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RunsDialog({ open, onOpenChange }: RunsDialogProps) {
  const [runs, setRuns] = React.useState<CollectionRunItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  const fetchRuns = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/pipeline/runs?limit=15");
      const data: RunsResponse = await res.json();
      setRuns(data.runs || []);
    } catch {
      setRuns([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (open) {
      fetchRuns();
    }
  }, [open, fetchRuns]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={true}
        size="lg"
        className="bg-white dark:bg-[#24292E] border border-[#E0DFDC] max-h-[85vh] h-[75vh] flex flex-col p-0 overflow-hidden rounded-xl sm:rounded-2xl"
      >
        {/* Fixed Header */}
        <div className="px-5 py-4 sm:px-7 sm:py-5 border-b border-border shrink-0 bg-white dark:bg-[#24292E] pr-12 sm:pr-14">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary text-foreground">
                  <HugeiconsIcon icon={Time02Icon} size={16} />
                </div>
                <DialogTitle className="text-lg font-bold text-foreground">
                  Harvesting Telemetry & Runs
                </DialogTitle>
              </div>
              <Button
                variant="secondary"
                size="compact"
                disabled={isLoading}
                onClick={fetchRuns}
              >
                Refresh
              </Button>
            </div>
            <DialogDescription className="text-xs text-muted-foreground mt-1.5">
              Audit log of autonomous scheduler sweeps and manual harvesting executions.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Scrollable Runs List */}
        <ScrollArea
          className="flex-1 min-h-0 overflow-hidden"
          viewportClassName="scroll-fade"
        >
          <div className="px-7 py-6 space-y-3.5">
          {runs.length === 0 ? (
            <div className="rounded-md border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
              {isLoading ? "Loading telemetry records..." : "No harvest runs recorded yet."}
            </div>
          ) : (
            runs.map((r) => {
              const isSuccess = r.status === "SUCCESS";
              const timeStr = r.started_at
                ? new Date(r.started_at).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })
                : "Recent";

              return (
                <div
                  key={r.id}
                  className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3.5 text-xs sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full ${
                        isSuccess
                          ? "bg-success/15 text-success"
                          : "bg-destructive/15 text-destructive"
                      }`}
                    >
                      <HugeiconsIcon
                        icon={isSuccess ? CheckmarkCircle01Icon : AlertCircleIcon}
                        size={14}
                      />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">
                          {r.source_id}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          ID: {r.id.slice(0, 8)}
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Started at {timeStr}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <div className="text-right">
                      <div className="font-medium text-foreground">
                        {r.jobs_found} found • {r.jobs_created} new
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {r.jobs_updated} updated • {r.jobs_failed} failed
                      </div>
                    </div>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                        isSuccess
                          ? "bg-success/15 text-success"
                          : "bg-destructive/15 text-destructive"
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          </div>
        </ScrollArea>

        {/* Fixed Footer */}
        <div className="px-7 py-4 border-t border-border shrink-0 flex justify-end bg-white dark:bg-[#24292E]">
          <Button variant="secondary" size="compact" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
