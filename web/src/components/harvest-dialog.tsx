"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ThinkingSteps,
  ThinkingStepsHeader,
  ThinkingStepsContent,
  ThinkingStep,
  ThinkingStepSources,
  ThinkingStepSource,
} from "@/components/ui/thinking-steps";

export interface HarvestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onHarvestSuccess?: () => void;
}

export function HarvestDialog({
  open,
  onOpenChange,
  onHarvestSuccess,
}: HarvestDialogProps) {
  // Step: "prompt" (simple question dialog) -> "executing" (execution status modal)
  const [step, setStep] = React.useState<"prompt" | "executing">("prompt");
  const [targetCities, setTargetCities] = React.useState<string[]>([
    "Bengaluru",
    "Hyderabad",
    "Pune",
    "Mumbai",
    "Remote",
  ]);

  // Execution state
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [executionStep, setExecutionStep] = React.useState(0);
  const [isStepsOpen, setIsStepsOpen] = React.useState(true);
  const [result, setResult] = React.useState<{
    success?: boolean;
    message?: string;
    jobs_found?: number;
    jobs_created?: number;
    jobs_updated?: number;
  } | null>(null);

  // Live active stage telemetry from backend pipeline tracker
  const [activeStageInfo, setActiveStageInfo] = React.useState<{
    stage_name?: string;
    stage_detail?: string;
    source_id?: string;
    company_name?: string;
    jobs_found?: number;
    status?: string;
  } | null>(null);

  const abortControllerRef = React.useRef<AbortController | null>(null);
  // True while a local profile harvest fetch is in flight — prevents the
  // continuity poller from fighting the live fetch and looping steps backward.
  const isLocallyRunningRef = React.useRef(false);
  // Once we've set a terminal result we never let continuity overwrite it.
  const hasCompletedRef = React.useRef(false);

  // ── Continuity poller — only for cross-refresh detection ─────────────────
  // Rules:
  //  1. If a local fetch is in flight → do nothing (the fetch owns the state).
  //  2. If already completed → do nothing.
  //  3. RUNNING detected → enter executing view; step only moves FORWARD.
  //  4. Non-RUNNING after previously submitting → show result.
  const checkActiveRun = React.useCallback(async () => {
    if (isLocallyRunningRef.current) return;
    if (hasCompletedRef.current) return;
    try {
      const res = await fetch("/api/pipeline/runs?limit=3");
      if (!res.ok) return;
      const data = await res.json();
      const activeStage = data.active_stage;
      const latest = data.runs?.[0];

      if (activeStage) {
        setActiveStageInfo(activeStage);
      }

      const isRunning = latest?.status === "RUNNING" || activeStage?.is_active;

      if (isRunning) {
        setStep("executing");
        setIsSubmitting(true);
        setIsStepsOpen(true);
        // Use real step from backend if available; never go backward.
        // Cap at 4: step 5 only fires when the HTTP response arrives.
        const backendStep = Math.min(activeStage?.step ?? (latest?.jobs_found > 0 ? 3 : 1), 4);
        setExecutionStep((prev) => Math.max(prev, backendStep));
      } else if (!isRunning && latest && latest.status !== "RUNNING") {
        // Backend run has finished — but only transition if we were tracking it
        // (i.e. step > 0 means we entered the executing view at some point).
        setExecutionStep((prev) => {
          if (prev > 0 && !hasCompletedRef.current) {
            hasCompletedRef.current = true;
            setIsSubmitting(false);
            setIsStepsOpen(false);
            if (latest.status === "SUCCESS" || latest.status === "PARTIAL") {
              setResult({
                success: true,
                jobs_found: latest.jobs_found,
                jobs_created: latest.jobs_created,
                jobs_updated: latest.jobs_updated,
                message: `Harvest complete: ${latest.jobs_found ?? 0} found, ${latest.jobs_created ?? 0} new.`,
              });
            } else if (latest.status === "STOPPED") {
              setResult({ success: false, message: "Harvest pipeline was stopped by user." });
            } else {
              setResult({ success: false, message: latest.error_summary || "Pipeline encountered an error." });
            }
            return 5;
          }
          return prev;
        });
      }
    } catch {
      // Ignore background polling errors
    }
  }, []);

  // Poll for cross-refresh continuity only while dialog is open
  React.useEffect(() => {
    if (open) {
      checkActiveRun();
      const interval = setInterval(checkActiveRun, 2000);
      return () => clearInterval(interval);
    }
  }, [open, checkActiveRun]);

  // Reset state each time the dialog opens fresh (but not while executing)
  React.useEffect(() => {
    if (open && !isLocallyRunningRef.current) {
      // Only reset if we are not mid-run
      setStep((prev) => prev); // no-op to avoid unnecessary flicker
    }
    if (!open) {
      // On close, reset everything so next open is fresh
      setTimeout(() => {
        if (!isLocallyRunningRef.current) {
          setStep("prompt");
          setResult(null);
          setExecutionStep(0);
          hasCompletedRef.current = false;
        }
      }, 300);
    }
  }, [open]);

  // Load candidate preferred locations when dialog opens
  React.useEffect(() => {
    if (open) {
      fetch("/api/profile")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.preferred_locations && Array.isArray(data.preferred_locations) && data.preferred_locations.length > 0) {
            setTargetCities(data.preferred_locations);
          }
        })
        .catch(() => {});
    }
  }, [open]);

  // Trigger profile-guided harvest execution
  const handleStartProfileHarvest = async () => {
    // Signal to continuity poller: hands-off, local fetch owns state now
    isLocallyRunningRef.current = true;
    hasCompletedRef.current = false;

    setStep("executing");
    setIsSubmitting(true);
    setResult(null);
    setExecutionStep(1);
    setIsStepsOpen(true);

    abortControllerRef.current = new AbortController();

    // Poll backend for real stage — steps only move FORWARD, capped at 4
    // while the fetch is still in flight (step 5 = only set on actual response).
    const stagePollInterval = setInterval(async () => {
      try {
        const r = await fetch("/api/pipeline/runs?limit=1");
        if (!r.ok) return;
        const d = await r.json();
        const stage = d.active_stage;
        if (stage) {
          setActiveStageInfo(stage);
          if (stage.step) {
            // Cap at 4: step 5 (Canonical Storage) only lights up when the top-level
            // fetch resolves, not when an intermediate sub-run reports completion.
            const cappedStep = Math.min(stage.step, 4);
            setExecutionStep((prev) => Math.max(prev, cappedStep));
          }
        }
      } catch { /* ignore */ }
    }, 1200);

    try {
      const res = await fetch("/api/pipeline/harvest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_matrix: true,
          sources: ["LINKEDIN", "NAUKRI", "WELLFOUND", "CUTSHORT", "HIRIST"],
          cities: targetCities,
        }),
        signal: abortControllerRef.current.signal,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.detail || "Harvest run encountered an error.");
      }

      hasCompletedRef.current = true;
      setExecutionStep(5);
      setIsStepsOpen(false);
      setResult({
        success: true,
        message: `Harvest complete: ${data.jobs_found ?? 0} jobs found, ${data.jobs_created ?? 0} new.`,
        jobs_found: data.jobs_found ?? data.total_found,
        jobs_created: data.jobs_created ?? data.total_created,
        jobs_updated: data.jobs_updated ?? data.total_updated,
      });
    } catch (err: unknown) {
      hasCompletedRef.current = true;
      if (err instanceof DOMException && err.name === "AbortError") {
        setResult({ success: false, message: "Harvest pipeline execution was stopped by user." });
      } else {
        const msg = err instanceof Error ? err.message : String(err);
        setResult({ success: false, message: msg });
      }
    } finally {
      clearInterval(stagePollInterval);
      setIsSubmitting(false);
      isLocallyRunningRef.current = false;
    }
  };

  const handleStopHarvest = async () => {
    hasCompletedRef.current = true;
    setActiveStageInfo((prev) =>
      prev ? { ...prev, status: "STOPPED", stage_detail: "Harvest pipeline execution stopped by user." } : null
    );
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    try {
      await fetch("/api/pipeline/harvest/stop", { method: "POST" });
    } catch {
      // Ignore network errors on stop
    } finally {
      isLocallyRunningRef.current = false;
      setIsSubmitting(false);
      setResult({
        success: false,
        message: "Harvest pipeline execution was stopped by user.",
      });
    }
  };

  const handleDone = () => {
    onHarvestSuccess?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm" className="max-h-[80vh] overflow-y-auto">
        {step === "prompt" ? (
          /* ─── Simple Prompt Dialog (No Cancel button as requested) ────────── */
          <>
            <DialogHeader>
              <DialogTitle>Trigger job harvest</DialogTitle>
              <DialogDescription>
                Harvest new live opportunities from top portals (<strong className="text-foreground">LinkedIn</strong>, <strong className="text-foreground">Naukri</strong>, <strong className="text-foreground">Wellfound</strong>) prioritized first, followed by Cutshort and Hirist based on your candidate profile.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="gap-2 sm:gap-2 pt-2 justify-end">
              <Button
                variant="secondary"
                render={<a href="/harvest" />}
                onClick={() => onOpenChange(false)}
              >
                Advanced harvest
              </Button>
              <Button
                variant="primary"
                onClick={handleStartProfileHarvest}
              >
                Harvest from profile
              </Button>
            </DialogFooter>
          </>
        ) : (
          /* ─── Execution Status Modal (Kept alive across refreshes) ─────────── */
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-semibold text-foreground">
                  Execution status
                </h3>
                <Badge variant="solid" color="blue" size="compact">
                  Profile targets
                </Badge>
                {activeStageInfo?.source_id && isSubmitting && (
                  <Badge variant="solid" color="purple" size="compact" className="font-mono text-[10px] tracking-wide">
                    {activeStageInfo.source_id}
                  </Badge>
                )}
              </div>

              {isSubmitting ? (
                <Badge color="blue" size="compact" variant="dot">
                  {activeStageInfo?.source_id ? `Harvesting ${activeStageInfo.source_id}` : "Harvesting"}
                </Badge>
              ) : result?.message?.includes("stopped") ? (
                <Badge color="amber" size="compact" variant="dot">
                  Stopped
                </Badge>
              ) : result?.success ? (
                <Badge color="emerald" size="compact" variant="dot">
                  Succeeded
                </Badge>
              ) : result ? (
                <Badge color="red" size="compact" variant="dot">
                  Failed
                </Badge>
              ) : (
                <Badge color="gray" size="compact" variant="dot">
                  Standby
                </Badge>
              )}
            </div>

            {!isSubmitting && result?.message?.includes("stopped") && (
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-900 dark:text-amber-200 animate-in fade-in duration-150">
                <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                <div className="flex-1 min-w-0 font-medium">
                  Pipeline execution was stopped by user. All background workers and scrapers were halted.
                </div>
              </div>
            )}

            {/* Pipeline Stages */}
            <div className="rounded-xl border border-border/70 bg-card p-4">
              <ThinkingSteps open={isStepsOpen} onOpenChange={setIsStepsOpen}>
                <ThinkingStepsHeader onToggle={() => setIsStepsOpen(!isStepsOpen)}>
                  Pipeline stages
                </ThinkingStepsHeader>
                <ThinkingStepsContent>
                  <ThinkingStep
                    label="Endpoint Handshake"
                    description={
                      activeStageInfo?.company_name && executionStep === 1
                        ? activeStageInfo.company_name
                        : `Routing to profile target streams (${targetCities.slice(0, 3).join(", ")})`
                    }
                    status={
                      isSubmitting
                        ? executionStep >= 1
                          ? "complete"
                          : "active"
                        : result?.success
                        ? "complete"
                        : result
                        ? executionStep === 1
                          ? "failed"
                          : "complete"
                        : "pending"
                    }
                    delay={0.02}
                  >
                    {(isSubmitting || result) && (
                      <ThinkingStepSources>
                        <ThinkingStepSource color="blue">
                          {activeStageInfo?.source_id || "Profile targets"}
                        </ThinkingStepSource>
                      </ThinkingStepSources>
                    )}
                  </ThinkingStep>

                  <ThinkingStep
                    label="Payload Ingestion & Normalization"
                    description={
                      activeStageInfo?.stage_detail && executionStep === 2
                        ? activeStageInfo.stage_detail
                        : "Extracting structured roles, compensation bands, and skills"
                    }
                    status={
                      isSubmitting
                        ? executionStep > 2
                          ? "complete"
                          : executionStep === 2
                          ? "active"
                          : "pending"
                        : result?.success
                        ? "complete"
                        : result
                        ? executionStep === 2
                          ? "failed"
                          : executionStep > 2
                          ? "complete"
                          : "pending"
                        : "pending"
                    }
                    delay={0.04}
                  >
                    {result?.success && result.jobs_found !== undefined && (
                      <ThinkingStepSources>
                        <ThinkingStepSource color="blue">
                          {result.jobs_found} Raw Listings
                        </ThinkingStepSource>
                      </ThinkingStepSources>
                    )}
                  </ThinkingStep>

                  <ThinkingStep
                    label="Canonical Deduplication"
                    description="Cross-referencing content hashes against active postings"
                    status={
                      isSubmitting
                        ? executionStep > 3
                          ? "complete"
                          : executionStep === 3
                          ? "active"
                          : "pending"
                        : result?.success
                        ? "complete"
                        : result
                        ? executionStep === 3
                          ? "failed"
                          : executionStep > 3
                          ? "complete"
                          : "pending"
                        : "pending"
                    }
                    delay={0.06}
                  >
                    {result?.success && (
                      <ThinkingStepSources>
                        <ThinkingStepSource color="emerald">
                          Fingerprint Verified
                        </ThinkingStepSource>
                      </ThinkingStepSources>
                    )}
                  </ThinkingStep>

                  <ThinkingStep
                    label="Agency & Spam Verification"
                    description="Evaluating placement integrity and recruitment agency filters"
                    status={
                      isSubmitting
                        ? executionStep > 4
                          ? "complete"
                          : executionStep === 4
                          ? "active"
                          : "pending"
                        : result?.success
                        ? "complete"
                        : result
                        ? executionStep === 4
                          ? "failed"
                          : executionStep > 4
                          ? "complete"
                          : "pending"
                        : "pending"
                    }
                    delay={0.08}
                  />

                  <ThinkingStep
                    label="Canonical Storage & Telemetry"
                    description={
                      result?.success
                        ? "Ingestion run committed to PostgreSQL database"
                        : "Persisting validated records and updating telemetry metrics"
                    }
                    status={
                      isSubmitting
                        ? executionStep >= 5
                          ? "complete"
                          : executionStep === 5
                          ? "active"
                          : "pending"
                        : result?.success
                        ? "complete"
                        : result
                        ? executionStep === 5
                          ? "failed"
                          : "pending"
                        : "pending"
                    }
                    delay={0.1}
                    isLast={true}
                  >
                    {result?.success && (
                      <ThinkingStepSources>
                        <ThinkingStepSource color="emerald">
                          +{result.jobs_created ?? 0} Created
                        </ThinkingStepSource>
                        <ThinkingStepSource color="blue">
                          {result.jobs_updated ?? 0} Refreshed
                        </ThinkingStepSource>
                      </ThinkingStepSources>
                    )}
                  </ThinkingStep>
                </ThinkingStepsContent>
              </ThinkingSteps>
            </div>

            {/* Results Counters */}
            {result?.success && (
              <div className="grid grid-cols-3 gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-center">
                <div>
                  <div className="text-[11px] text-muted-foreground">Discovered</div>
                  <div className="text-sm font-semibold text-foreground">
                    {result.jobs_found ?? 0}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">New Ingested</div>
                  <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    +{result.jobs_created ?? 0}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-[#0A66C2] dark:text-[#70B5F9] font-medium">Refreshed</div>
                  <div className="text-sm font-semibold text-[#0A66C2] dark:text-[#70B5F9]">
                    {result.jobs_updated ?? 0}
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {result && !result.success && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                {result.message}
              </div>
            )}

            {/* Execution Modal Footer with Stop Button */}
            <DialogFooter className="pt-2 flex items-center justify-between sm:justify-between">
              {isSubmitting ? (
                <>
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shrink-0" />
                    <span className="text-xs text-muted-foreground truncate">
                      {activeStageInfo?.source_id ? `Harvesting ${activeStageInfo.source_id}...` : "Harvesting in progress..."}
                    </span>
                  </div>
                  <Button
                    variant="secondary"
                    size="compact"
                    onClick={handleStopHarvest}
                    className="text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 cursor-pointer shrink-0"
                  >
                    Stop harvest
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="compact"
                    onClick={() => {
                      setStep("prompt");
                      setResult(null);
                    }}
                    className="text-xs"
                  >
                    Back
                  </Button>
                  <Button
                    variant="primary"
                    size="compact"
                    onClick={handleDone}
                    className="px-4 text-xs font-medium"
                  >
                    {result?.success ? "View updated jobs" : "Close"}
                  </Button>
                </>
              )}
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
