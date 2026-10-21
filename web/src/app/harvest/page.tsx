"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Home01Icon,
  ArrowLeft01Icon,
  SparklesIcon,
  Rocket01Icon,
  CheckmarkCircle01Icon,
  AlertCircleIcon,
  Database01Icon,
  Layers01Icon,
  Building03Icon,
  ServerIcon,
  Time02Icon,
  LinkSquare02Icon,
  Tick02Icon,
  StopCircleIcon,
} from "@hugeicons/core-free-icons";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/motion/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardGroup,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardFooter,
} from "@/components/ui/card";
import { RefreshCw } from "@/components/animate-ui/icons/refresh-cw";
import { spring } from "@/lib/springs";
import { cn } from "@/lib/utils";
import { ThinkingIndicator } from "@/components/ui/thinking-indicator";
import {
  ThinkingSteps,
  ThinkingStepsHeader,
  ThinkingStepsContent,
  ThinkingStep,
  ThinkingStepSources,
  ThinkingStepSource,
} from "@/components/ui/thinking-steps";

const ICON_SHOWN = { opacity: 1, scale: 1, filter: "blur(0px)" };
const ICON_HIDDEN = { opacity: 0, scale: 0.6, filter: "blur(4px)" };
const iconEnter = { type: "tween" as const, duration: spring.fast.duration, ease: "easeOut" as const };
const iconLeave = { type: "tween" as const, ...spring.fast.exit, ease: "easeIn" as const };

type BadgeHue =
  | "gray"
  | "red"
  | "orange"
  | "amber"
  | "yellow"
  | "lime"
  | "green"
  | "emerald"
  | "teal"
  | "cyan"
  | "blue"
  | "indigo"
  | "violet"
  | "purple"
  | "fuchsia"
  | "pink"
  | "rose";

interface IngestionChannel {
  id: string;
  name: string;
  sample: string;
  label: string;
  category: "Global ATS" | "Indian Tech" | "Multi-Source";
  badge: string;
  badgeColor: BadgeHue;
}

const INGESTION_CHANNELS: IngestionChannel[] = [
  {
    id: "GREENHOUSE",
    name: "Greenhouse",
    sample: "canonical",
    label: "Canonical, Figma, Stripe, Datadog",
    category: "Global ATS",
    badge: "Official API",
    badgeColor: "emerald",
  },
  {
    id: "ASHBY",
    name: "Ashby",
    sample: "ramp",
    label: "Ramp, OpenAI, Linear, Notion",
    category: "Global ATS",
    badge: "Direct JSON",
    badgeColor: "purple",
  },
  {
    id: "LEVER",
    name: "Lever",
    sample: "postman",
    label: "Postman, Spotify, Docker",
    category: "Global ATS",
    badge: "Postings API",
    badgeColor: "blue",
  },
  {
    id: "INSTAHYRE",
    name: "Instahyre India",
    sample: "Python|Bengaluru",
    label: "Direct Startup Sourcing & Hubs",
    category: "Indian Tech",
    badge: "Curated Hubs",
    badgeColor: "amber",
  },
  {
    id: "NAUKRI",
    name: "Naukri India",
    sample: "Python Engineer|Bengaluru",
    label: "Tier-1 Indian Tech Portal",
    category: "Indian Tech",
    badge: "Enterprise Pool",
    badgeColor: "orange",
  },
  {
    id: "WELLFOUND",
    name: "Wellfound (AngelList)",
    sample: "jobs",
    label: "Global & Indian Seed / Series-A",
    category: "Global ATS",
    badge: "Startup Direct",
    badgeColor: "teal",
  },
  {
    id: "CUTSHORT",
    name: "Cutshort India",
    sample: "Bengaluru",
    label: "Indian Founders & Direct Recruiters",
    category: "Indian Tech",
    badge: "Direct Connect",
    badgeColor: "indigo",
  },
  {
    id: "HIRIST",
    name: "Hirist India",
    sample: "AI Engineer",
    label: "Premium Indian Tech Talents",
    category: "Indian Tech",
    badge: "Specialized",
    badgeColor: "violet",
  },
  {
    id: "MATRIX",
    name: "Indian Tech Matrix",
    sample: "Bengaluru, Hyderabad",
    label: "Multi-Source Parallel Ingestion Batch",
    category: "Multi-Source",
    badge: "High Throughput",
    badgeColor: "blue",
  },
];

interface ExecutionResult {
  success: boolean;
  message: string;
  jobs_found?: number;
  jobs_created?: number;
  jobs_updated?: number;
  run_id?: number;
}

interface HarvestRunRecord {
  id: number;
  source_id: string;
  status: string;
  jobs_found: number;
  jobs_created: number;
  jobs_updated: number;
  error_message?: string | null;
  started_at: string;
  completed_at?: string | null;
}

// ---------------------------------------------------------------------------
// Main Ingestion Studio Page Component
// ---------------------------------------------------------------------------
export default function HarvestStudioPage() {
  const [selectedSource, setSelectedSource] = React.useState<string>("GREENHOUSE");
  const [companyName, setCompanyName] = React.useState<string>("Canonical");
  const [endpointToken, setEndpointToken] = React.useState<string>("canonical");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isStopping, setIsStopping] = React.useState(false);
  const [result, setResult] = React.useState<ExecutionResult | null>(null);
  const [executionStep, setExecutionStep] = React.useState<number>(0);
  const [isStepsOpen, setIsStepsOpen] = React.useState<boolean>(true);
  const [recentRuns, setRecentRuns] = React.useState<HarvestRunRecord[]>([]);
  const [isLoadingRuns, setIsLoadingRuns] = React.useState(false);
  const abortControllerRef = React.useRef<AbortController | null>(null);
  // Gate: set true while a local submit fetch is in flight so the poller
  // cannot interfere and loop steps backward.
  const isLocallyRunningRef = React.useRef(false);
  // Once we reach a terminal state we block further poller transitions.
  const hasCompletedRef = React.useRef(false);

  // Responsive columns for CardGroup: columns > 1 activates 2-D fluid hover across rows and columns
  const [columns, setColumns] = React.useState<number>(3);

  React.useEffect(() => {
    const handleResize = () => {
      if (typeof window !== "undefined") {
        if (window.innerWidth < 640) {
          setColumns(1);
        } else if (window.innerWidth < 1180) {
          setColumns(2);
        } else {
          setColumns(3);
        }
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [])

  const fetchRecentRuns = React.useCallback(async () => {
    try {
      setIsLoadingRuns(true);
      const res = await fetch("/api/pipeline/runs?limit=8");
      if (!res.ok) throw new Error("Failed to load runs");
      const data = await res.json();
      const runs = Array.isArray(data) ? data : data.runs || [];
      setRecentRuns(runs);

      // --- Do NOT touch executionStep if a local fetch is in flight or we're done ---
      if (isLocallyRunningRef.current) return;
      if (hasCompletedRef.current) return;

      const activeStage = data.active_stage;
      const latest = runs[0];
      const isRunning = latest?.status === "RUNNING" || activeStage?.is_active;

      if (isRunning) {
        // Continuity: keep Execution Status UI and Stop button alive across page refresh
        setIsSubmitting(true);
        setIsStepsOpen(true);
        if (latest?.source_id) {
          setSelectedSource(latest.source_id);
        }
        // Step moves forward-only from the real backend stage.
        // Cap at 4: step 5 only fires when the HTTP response arrives.
        const backendStep = Math.min(activeStage?.step ?? (latest?.jobs_found > 0 ? 3 : 1), 4);
        setExecutionStep((prev) => Math.max(prev, backendStep));
      } else if (latest && latest.status !== "RUNNING") {
        setExecutionStep((prev) => {
          // Only transition to terminal state if we were already tracking a run
          if (prev > 0 && !hasCompletedRef.current) {
            hasCompletedRef.current = true;
            setIsSubmitting(false);
            if (latest.status === "SUCCESS" || latest.status === "PARTIAL") {
              setResult({
                success: true,
                jobs_found: latest.jobs_found,
                jobs_created: latest.jobs_created,
                jobs_updated: latest.jobs_updated,
                run_id: latest.id,
                message: `Harvest run complete: ${latest.jobs_found ?? 0} jobs found, ${latest.jobs_created ?? 0} new listings created, ${latest.jobs_updated ?? 0} refreshed.`,
              });
            } else if (latest.status === "STOPPED") {
              setResult({ success: false, message: "Harvest pipeline execution was stopped by user." });
            } else {
              setResult({ success: false, message: latest.error_summary || "Harvest pipeline encountered an error." });
            }
            return 5;
          }
          return prev;
        });
      }
    } catch (err) {
      console.warn("Could not retrieve telemetry runs:", err);
    } finally {
      setIsLoadingRuns(false);
    }
  }, []);

  React.useEffect(() => {
    fetchRecentRuns();
    const pollInterval = setInterval(fetchRecentRuns, 2000);
    return () => clearInterval(pollInterval);
  }, [fetchRecentRuns]);

  const handleSourceSelect = (sourceId: string, sampleToken: string) => {
    setSelectedSource(sourceId);
    setResult(null);
    setExecutionStep(0);

    switch (sourceId) {
      case "GREENHOUSE":
        setCompanyName("Canonical");
        setEndpointToken("canonical");
        break;
      case "ASHBY":
        setCompanyName("Ramp");
        setEndpointToken("ramp");
        break;
      case "LEVER":
        setCompanyName("Postman");
        setEndpointToken("postman");
        break;
      case "INSTAHYRE":
        setCompanyName("Direct Hub");
        setEndpointToken("Python|Bengaluru");
        break;
      case "NAUKRI":
        setCompanyName("Indian Tech Hub");
        setEndpointToken("Python Engineer|Bengaluru");
        break;
      case "WELLFOUND":
        setCompanyName("Seed Portfolio");
        setEndpointToken("jobs");
        break;
      case "CUTSHORT":
        setCompanyName("Founders Direct");
        setEndpointToken("Bengaluru");
        break;
      case "HIRIST":
        setCompanyName("Tech Talents");
        setEndpointToken("AI Engineer");
        break;
      case "MATRIX":
        setCompanyName("India Tech Matrix");
        setEndpointToken("Bengaluru, Hyderabad");
        break;
      default:
        setCompanyName(sourceId);
        setEndpointToken(sampleToken);
    }
  };

  const handleStop = async () => {
    setIsStopping(true);
    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      await fetch("/api/pipeline/harvest/stop", { method: "POST" });
    } catch (err) {
      console.warn("Could not dispatch stop request:", err);
    } finally {
      setIsStopping(false);
      setIsSubmitting(false);
      setResult({
        success: false,
        message: "Harvest pipeline execution was stopped by user.",
      });
      fetchRecentRuns();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Gate poller so it does not interfere while we own the state
    isLocallyRunningRef.current = true;
    hasCompletedRef.current = false;

    setIsSubmitting(true);
    setIsStopping(false);
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
        if (stage?.step) {
          // Cap at 4: step 5 only lights up when the top-level fetch resolves.
          const cappedStep = Math.min(stage.step, 4);
          setExecutionStep((prev) => Math.max(prev, cappedStep));
        }
      } catch { /* ignore */ }
    }, 1500);

    try {
      const isMatrix = selectedSource === "MATRIX";
      const payload = isMatrix
        ? {
            is_matrix: true,
            sources: ["CUTSHORT", "HIRIST", "JOBSPY"],
            cities: endpointToken
              .split(",")
              .map((c) => c.trim())
              .filter(Boolean),
          }
        : {
            source_id: selectedSource,
            company_name: companyName.trim(),
            endpoint_token: endpointToken.trim(),
          };

      const res = await fetch("/api/pipeline/harvest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: abortControllerRef.current.signal,
      });

      const data = await res.json();

      if (!res.ok) {
        let msg = data.error || data.detail || "Harvest execution encountered an error";
        if (typeof msg === "object") {
          try {
            msg = JSON.stringify(msg);
          } catch {
            msg = "Execution encountered an error";
          }
        }
        throw new Error(msg);
      }

      setResult({
        success: true,
        message: `Harvest run complete: ${data.jobs_found ?? 0} jobs found, ${
          data.jobs_created ?? 0
        } new listings created, ${data.jobs_updated ?? 0} refreshed.`,
        jobs_found: data.jobs_found,
        jobs_created: data.jobs_created,
        jobs_updated: data.jobs_updated,
        run_id: data.run_id,
      });

      hasCompletedRef.current = true;
      setExecutionStep(5);
      fetchRecentRuns();
    } catch (err: unknown) {
      hasCompletedRef.current = true;
      if (err instanceof DOMException && err.name === "AbortError") {
        setResult({
          success: false,
          message: "Harvest pipeline execution was stopped by user.",
        });
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

  const isMatrix = selectedSource === "MATRIX";
  const selectedChannel = INGESTION_CHANNELS.find((c) => c.id === selectedSource);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Application Bar matching Dashboard UI with Breadcrumbs */}
      <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur-md py-1.5 sm:py-3.5 px-2 sm:px-6">
        <div className="mx-auto flex h-11 sm:h-14 max-w-[1360px] items-center justify-between rounded-xl sm:rounded-2xl border border-border/80 bg-card px-3 sm:px-6 shadow-xs gap-2 transition-all duration-150">
          {/* Mobile view (< sm): Compact back link and current page */}
          <div className="flex sm:hidden items-center gap-2 min-w-0 flex-1">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#0A66C2] dark:text-[#70B5F9] shrink-0 hover:underline"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={15} />
              <span>Dashboard</span>
            </Link>
            <span className="text-zinc-300 dark:text-zinc-700">/</span>
            <span className="text-xs font-medium text-foreground truncate">
              Ingestion Studio
            </span>
          </div>

          {/* Desktop view (sm+): Full Breadcrumb with icon */}
          <div className="hidden sm:block min-w-0 overflow-hidden flex-1">
            <Breadcrumb>
              <BreadcrumbList maxItems={3}>
                <BreadcrumbItem>
                  <BreadcrumbLink render={(props) => <Link href="/" {...props} />}>
                    <HugeiconsIcon icon={Home01Icon} size={14} />
                    <span>Dashboard</span>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbPage>Ingestion Studio</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* Right Action Controls */}
          <div className="shrink-0 flex items-center">
            <Button
              variant="secondary"
              size="compact"
              render={<Link href="/" />}
              className="group/return h-7 px-3 text-xs shrink-0 inline-flex items-center justify-center transition-colors"
              title="Return to Main Dashboard"
            >
              <span className="inline-flex items-center gap-1.5">
                <HugeiconsIcon
                  icon={ArrowLeft01Icon}
                  size={13}
                  className="shrink-0 transition-transform duration-150 ease-out group-hover/return:-translate-x-0.5"
                />
                <span>Return to Dashboard</span>
              </span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Studio Content */}
      <main className="mx-auto max-w-[1360px] w-full px-3 sm:px-6 py-4 sm:py-6 space-y-6 flex-1">
        {/* Configuration & Trigger Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Channel Selection with 2-D Fluid Hover CardGroup */}
          <div className="lg:col-span-8 space-y-5">
            <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    1. Select Ingestion Channel
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Hover and select a dedicated source or initiate a parallel matrix batch
                  </p>
                </div>
                <Badge color="gray" size="compact">
                  {INGESTION_CHANNELS.length} Channels Available
                </Badge>
              </div>

              {/* Fluid Functionalism CardGroup: columns > 1 enables 2-D fluid hover across rows & columns */}
              <CardGroup
                columns={columns}
                border="outlined"
                separated
                className="mt-4"
              >
                {INGESTION_CHANNELS.map((channel) => (
                  <Card
                    key={channel.id}
                    selected={selectedSource === channel.id}
                    onClick={() => handleSourceSelect(channel.id, channel.sample)}
                    size="compact"
                    className="cursor-pointer"
                  >
                    <CardHeader className="p-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${
                            selectedSource === channel.id
                              ? "bg-primary text-primary-foreground shadow-xs"
                              : "bg-secondary text-muted-foreground"
                          }`}
                        >
                          {channel.id === "MATRIX" ? (
                            <HugeiconsIcon icon={Layers01Icon} size={15} strokeWidth={2} />
                          ) : channel.category === "Indian Tech" ? (
                            <HugeiconsIcon icon={Building03Icon} size={15} strokeWidth={2} />
                          ) : (
                            <HugeiconsIcon icon={ServerIcon} size={15} strokeWidth={2} />
                          )}
                        </div>
                        <CardTitle className="text-xs truncate">{channel.name}</CardTitle>
                      </div>

                      <CardAction>
                        <Badge color={channel.badgeColor} size="compact">
                          {channel.badge}
                        </Badge>
                      </CardAction>

                      <CardDescription className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed pt-1">
                        {channel.label}
                      </CardDescription>
                    </CardHeader>

                    <CardFooter className="p-3 pt-0 mt-auto flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                      <span>Preset: {channel.sample}</span>
                      {selectedSource === channel.id && (
                        <Badge color="blue" size="compact" className="font-sans font-medium">
                          <span className="inline-flex items-center gap-1.5">
                            <HugeiconsIcon icon={Tick02Icon} size={11} strokeWidth={2.5} className="shrink-0" />
                            <span>Selected</span>
                          </span>
                        </Badge>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </CardGroup>
            </div>

            {/* Parameter Inputs & Trigger Form */}
            <form onSubmit={handleSubmit} className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-4">
              <div className="pb-3 border-b border-border/60">
                <h2 className="text-sm font-semibold text-foreground">
                  2. Pipeline Parameters
                </h2>
                <p className="text-xs text-muted-foreground">
                  Configure target organization and query parameters for the selected channel
                </p>
              </div>

              {!isMatrix ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Company / Organization Name
                    </label>
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g., Canonical, Stripe, Ramp"
                      className="h-9 w-full rounded-lg border border-border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Canonical identifier used in job records
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Board Token / Search Term
                    </label>
                    <input
                      type="text"
                      required
                      value={endpointToken}
                      onChange={(e) => setEndpointToken(e.target.value)}
                      placeholder="e.g., canonical, ramp, Python|Bengaluru"
                      className="h-9 w-full rounded-lg border border-border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Target subdomain identifier or query expression
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-border/60 bg-primary/[0.04] p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                    <HugeiconsIcon icon={Layers01Icon} size={15} />
                    <span>Parallel Multi-Source Batch</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    This triggers concurrent scrapers across Cutshort, Hirist, and Jobspy targeting
                    top Indian hubs (Bengaluru, Pune, Hyderabad, Gurgaon, Remote). Automated agency
                    filtration and content hashing are applied prior to database commits.
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {["Cutshort India", "Hirist AI", "Jobspy Aggregator"].map((source) => (
                      <Badge key={source} color="blue" size="compact">
                        {source}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <Button
                  variant="ghost"
                  size="compact"
                  type="button"
                  onClick={() => handleSourceSelect("GREENHOUSE", "canonical")}
                  disabled={isSubmitting}
                  className="text-xs text-muted-foreground"
                >
                  Reset Parameters
                </Button>

                <div className="flex items-center gap-2">
                  {/* Stop Execution Button */}
                  {isSubmitting && (
                    <Button
                      variant="secondary"
                      size="default"
                      type="button"
                      onClick={handleStop}
                      disabled={isStopping}
                      aria-label="Stop active harvest execution"
                      className="text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                    >
                      {isStopping ? "Stopping..." : "Stop"}
                    </Button>
                  )}

                  <Button
                    variant="primary"
                    size="default"
                    type="submit"
                    disabled={isSubmitting}
                    className="group/launch relative px-6 text-xs font-semibold overflow-hidden transition-all duration-120 active:scale-[0.98]"
                  >
                    <span className="inline-flex items-center justify-center gap-2">
                      {/* Fluid Functionalism Icon Swap with Blur Crossfade */}
                      <span className="grid size-4 shrink-0 place-items-center">
                        <motion.span
                          className="col-start-1 row-start-1 flex items-center justify-center transition-transform duration-150 ease-out group-hover/launch:-translate-y-0.5 group-hover/launch:translate-x-0.5"
                          initial={false}
                          animate={isSubmitting ? ICON_HIDDEN : ICON_SHOWN}
                          transition={isSubmitting ? iconLeave : iconEnter}
                        >
                          <HugeiconsIcon icon={Rocket01Icon} size={15} strokeWidth={2} />
                        </motion.span>
                        <motion.span
                          className="col-start-1 row-start-1 flex items-center justify-center text-white"
                          initial={false}
                          animate={isSubmitting ? ICON_SHOWN : ICON_HIDDEN}
                          transition={isSubmitting ? iconEnter : iconLeave}
                        >
                          <RefreshCw
                            size={14}
                            animation="rotate"
                            animate="rotate"
                            loop={true}
                          />
                        </motion.span>
                      </span>

                      {/* Fluid Functionalism Ghost-Span Label Swap (Zero Layout Shift) */}
                      <span className="inline-grid select-none">
                        <span aria-hidden="true" className="col-start-1 row-start-1 invisible font-semibold whitespace-nowrap">
                          Executing Pipeline Run...
                        </span>
                        <AnimatePresence mode="wait" initial={false}>
                          <motion.span
                            key={isSubmitting ? "submitting" : "idle"}
                            initial={{ opacity: 0, y: 2 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -2 }}
                            transition={{ duration: 0.1, ease: "easeOut" }}
                            className="col-start-1 row-start-1 flex items-center justify-center font-semibold whitespace-nowrap"
                          >
                            {isSubmitting ? "Executing Pipeline Run..." : "Launch Ingestion Run"}
                          </motion.span>
                        </AnimatePresence>
                      </span>
                    </span>
                  </Button>
                </div>
              </div>
            </form>
          </div>

          {/* Right Column: Execution Feedback & Live Telemetry Feed */}
          <div className="lg:col-span-4 space-y-5">
            {/* Live Run Status Card */}
            <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs min-h-[500px] flex flex-col justify-between transition-all duration-200">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-border/60">
                  <div className="flex items-center gap-2 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground truncate">
                      Execution Status
                    </h3>
                    {selectedChannel && (
                      <Badge color={(selectedChannel.badgeColor as any) || "blue"} size="compact" variant="solid">
                        {selectedChannel.name}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isSubmitting && (
                      <Button
                        variant="ghost"
                        size="compact"
                        type="button"
                        onClick={handleStop}
                        disabled={isStopping}
                        className="h-6 px-2 text-[11px] font-medium text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer"
                        title="Stop active harvest execution"
                      >
                        {isStopping ? "Stopping..." : "Stop"}
                      </Button>
                    )}
                    {isSubmitting ? (
                      <Badge color="blue" size="compact" variant="dot">
                        Harvesting
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
                </div>

                {/* 1. Fluid Functionalism ThinkingIndicator with Morphing SVG Infinity Loop & Shimmer Text */}
                <div className="rounded-xl border border-border/60 bg-muted/20 p-2">
                  <ThinkingIndicator
                    size="compact"
                    words={
                      isSubmitting
                        ? [
                            `Querying ${selectedChannel?.name || selectedSource}`,
                            "Parsing Ingestion Payloads",
                            "Deduplicating Postings",
                            "Evaluating Agency Rules",
                            "Committing Records",
                          ]
                        : result?.message?.includes("stopped")
                        ? ["Execution Stopped by User", "Pipeline Aborted Cleanly"]
                        : result?.success
                        ? [
                            "Harvest Pipeline Succeeded",
                            `${result.jobs_found ?? 0} Listings Discovered`,
                            `+${result.jobs_created ?? 0} New Listings Ingested`,
                            `${result.jobs_updated ?? 0} Postings Refreshed`,
                          ]
                        : result
                        ? ["Execution Failed", "Pipeline Encountered Error"]
                        : ["Pipeline Standby", "Target Configured", "Awaiting Execution Launch"]
                    }
                    intervalMs={isSubmitting ? 2200 : 3800}
                  />
                </div>

                {/* 2. Fluid Functionalism ThinkingSteps Chain-of-Thought Stages with Continuous Connector Rail */}
                <ThinkingSteps open={isStepsOpen} onOpenChange={setIsStepsOpen}>
                  <ThinkingStepsHeader onToggle={() => setIsStepsOpen(!isStepsOpen)}>
                    Pipeline Stages
                  </ThinkingStepsHeader>
                  <ThinkingStepsContent>
                    {/* Stage 1: Endpoint Handshake */}
                    <ThinkingStep
                      label="Endpoint Handshake"
                      description={
                        isSubmitting || result
                          ? `Routing to ${selectedChannel?.name || selectedSource} (${endpointToken})`
                          : `Configured: ${selectedChannel?.name || selectedSource} (${endpointToken})`
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
                          <ThinkingStepSource color={(selectedChannel?.badgeColor as any) || "blue"}>
                            {selectedSource}
                          </ThinkingStepSource>
                          {companyName && (
                            <ThinkingStepSource color="gray">
                              {companyName}
                            </ThinkingStepSource>
                          )}
                        </ThinkingStepSources>
                      )}
                    </ThinkingStep>

                    {/* Stage 2: Payload Extraction & Normalization */}
                    <ThinkingStep
                      label="Payload Ingestion & Normalization"
                      description="Extracting structured roles, compensation bands, and skills"
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

                    {/* Stage 3: Canonical Deduplication */}
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

                    {/* Stage 4: Rule Heuristics & Verification */}
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

                    {/* Stage 5: Database Commit & Telemetry */}
                    <ThinkingStep
                      label="Canonical Storage & Telemetry"
                      description={
                        result?.success
                          ? `Ingestion run committed to PostgreSQL database`
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

              {/* Bottom Outcome & Actions Section */}
              <div className="pt-4 mt-2 border-t border-border/60">
                <AnimatePresence mode="wait">
                  {/* Results Outcome */}
                  {result?.success && (
                    <motion.div
                      key="result-success"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={spring.fast}
                      className="space-y-3"
                    >
                      {result.jobs_found !== undefined && (
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="rounded-lg bg-card/60 p-2 border border-border/50 shadow-2xs">
                            <span className="block text-[10px] text-muted-foreground font-medium">Found</span>
                            <span className="text-xs font-bold text-foreground">
                              {result.jobs_found}
                            </span>
                          </div>
                          <div className="rounded-lg bg-emerald-500/[0.06] p-2 border border-emerald-500/20 shadow-2xs">
                            <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Created</span>
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                              +{result.jobs_created}
                            </span>
                          </div>
                          <div className="rounded-lg bg-primary/[0.06] p-2 border border-primary/20 shadow-2xs">
                            <span className="block text-[10px] text-primary font-medium">Refreshed</span>
                            <span className="text-xs font-bold text-primary">
                              {result.jobs_updated}
                            </span>
                          </div>
                        </div>
                      )}

                      <Button
                        variant="secondary"
                        size="compact"
                        render={
                          <Link href="/" target="_blank" rel="noopener noreferrer" />
                        }
                        className="group/view w-full text-xs justify-center"
                      >
                        <span className="inline-flex items-center justify-center gap-1.5">
                          <span>View Postings on Dashboard</span>
                          <HugeiconsIcon
                            icon={LinkSquare02Icon}
                            size={13}
                            className="shrink-0 transition-transform duration-150 ease-out group-hover/view:translate-x-0.5 group-hover/view:-translate-y-0.5"
                          />
                        </span>
                      </Button>
                    </motion.div>
                  )}

                  {/* Failure State or Stopped State */}
                  {result && !result.success && (
                    <motion.div
                      key={result.message.includes("stopped") ? "result-stopped" : "result-failed"}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={spring.fast}
                      className={cn(
                        "rounded-xl p-3 space-y-2 border",
                        result.message.includes("stopped")
                          ? "border-amber-500/30 bg-amber-500/[0.05]"
                          : "border-red-500/30 bg-red-500/[0.05]"
                      )}
                    >
                      <div
                        className={cn(
                          "flex items-center gap-1.5",
                          result.message.includes("stopped")
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-red-600 dark:text-red-400"
                        )}
                      >
                        <HugeiconsIcon
                          icon={result.message.includes("stopped") ? StopCircleIcon : AlertCircleIcon}
                          size={15}
                          className="shrink-0"
                        />
                        <span className="text-xs font-semibold">
                          {result.message.includes("stopped") ? "Execution Stopped" : "Harvest Failed"}
                        </span>
                      </div>
                      <p className="text-[11px] text-foreground leading-relaxed break-words [overflow-wrap:anywhere]">
                        {result.message}
                      </p>
                    </motion.div>
                  )}

                  {/* Idle Readiness State */}
                  {!isSubmitting && !result && (
                    <motion.div
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2.5 rounded-xl border border-dashed border-border/80 p-3 bg-muted/10 text-muted-foreground"
                    >
                      <HugeiconsIcon icon={Database01Icon} size={18} className="shrink-0 opacity-60 text-primary" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground">Ready for Harvest</p>
                        <p className="text-[11px] leading-snug truncate">
                          Launch to trigger the 5-stage ingestion pipeline.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Historical Telemetry Feed */}
            <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <div className="flex items-center gap-1.5">
                  <HugeiconsIcon icon={Time02Icon} size={14} className="text-primary" />
                  <h3 className="text-xs font-semibold text-foreground">
                    Recent Harvest Telemetry
                  </h3>
                </div>
                <Button
                  variant="ghost"
                  size="compact"
                  disabled={isLoadingRuns}
                  onClick={fetchRecentRuns}
                  className="h-7 w-7 p-0 rounded-md text-muted-foreground hover:text-foreground shrink-0 cursor-pointer flex items-center justify-center transition-colors"
                  title="Reload Telemetry Records"
                >
                  <RefreshCw
                    size={14}
                    animation="rotate"
                    animateOnHover="rotate"
                    animate={isLoadingRuns ? "rotate" : undefined}
                    loop={isLoadingRuns}
                    completeOnStop
                  />
                  <span className="sr-only">Reload Telemetry Records</span>
                </Button>
              </div>

              <div className="space-y-2 max-h-[380px] overflow-y-auto no-scrollbar scrollbar-none">
                {recentRuns.length === 0 ? (
                  <div className="p-4 text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg">
                    {isLoadingRuns ? "Loading telemetry records..." : "No harvest records yet."}
                  </div>
                ) : (
                  recentRuns.map((r) => {
                    const isSuccess = r.status === "SUCCESS";
                    const timeStr = r.started_at
                      ? new Date(r.started_at).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Recent";

                    return (
                      <div
                        key={r.id}
                        className="rounded-xl border border-border/60 bg-secondary/25 p-2.5 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground">
                            {r.source_id}
                          </span>
                          <Badge
                            color={isSuccess ? "emerald" : "red"}
                            size="compact"
                            variant="dot"
                          >
                            {isSuccess ? "Success" : "Failed"}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                          <span>
                            {r.jobs_found} found • +{r.jobs_created} new
                          </span>
                          <span>{timeStr}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
