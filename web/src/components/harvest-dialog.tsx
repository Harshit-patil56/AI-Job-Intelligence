"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Rocket01Icon,
  CheckmarkCircle01Icon,
  AlertCircleIcon,
  ArrowReloadHorizontalIcon,
  DatabaseIcon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface HarvestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onHarvestSuccess: () => void;
}

const ATS_SOURCES = [
  { id: "GREENHOUSE", name: "Greenhouse", sample: "canonical", label: "Canonical, Figma, Stripe" },
  { id: "ASHBY", name: "Ashby", sample: "ramp", label: "Ramp, OpenAI, Linear" },
  { id: "LEVER", name: "Lever", sample: "postman", label: "Postman, Spotify" },
  { id: "INSTAHYRE", name: "Instahyre India", sample: "Python|Bengaluru", label: "Curated Direct Startup Sourcing" },
  { id: "NAUKRI", name: "Naukri India", sample: "Python Engineer|Bengaluru", label: "Tier-1 Indian Tech Portal" },
  { id: "WELLFOUND", name: "Wellfound (AngelList)", sample: "jobs", label: "Global & Indian Seed/Series-A Startups" },
  { id: "CUTSHORT", name: "Cutshort India", sample: "Bengaluru", label: "Indian Startups & Direct Founders" },
  { id: "HIRIST", name: "Hirist India", sample: "AI Engineer", label: "Indian Premium Tech Sourcing" },
  { id: "MATRIX", name: "Full India Matrix", sample: "Bengaluru, Hyderabad", label: "Multi-Source Parallel Sourcing" },
];

export function HarvestDialog({
  open,
  onOpenChange,
  onHarvestSuccess,
}: HarvestDialogProps) {
  const [selectedSource, setSelectedSource] = React.useState("GREENHOUSE");
  const [companyName, setCompanyName] = React.useState("Canonical");
  const [endpointToken, setEndpointToken] = React.useState("canonical");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [result, setResult] = React.useState<{
    success?: boolean;
    message?: string;
    jobs_found?: number;
    jobs_created?: number;
    jobs_updated?: number;
  } | null>(null);

  const handleSourceSelect = (sourceId: string, sample: string) => {
    setSelectedSource(sourceId);
    if (sourceId === "MATRIX") {
      setCompanyName("Indian Tech Matrix");
      setEndpointToken("all");
    } else if (sourceId === "ASHBY") {
      setCompanyName("Ramp");
      setEndpointToken("ramp");
    } else if (sourceId === "GREENHOUSE") {
      setCompanyName("Canonical");
      setEndpointToken("canonical");
    } else if (sourceId === "INSTAHYRE") {
      setCompanyName("Instahyre Tech");
      setEndpointToken("Python|Bengaluru");
    } else if (sourceId === "NAUKRI") {
      setCompanyName("Naukri India");
      setEndpointToken("Python Engineer|Bengaluru");
    } else if (sourceId === "WELLFOUND") {
      setCompanyName("Wellfound Startups");
      setEndpointToken("jobs");
    } else {
      setCompanyName(sample);
      setEndpointToken(sample.toLowerCase());
    }
    setResult(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResult(null);

    try {
      const isMatrix = selectedSource === "MATRIX";
      const payload = isMatrix
        ? { is_matrix: true, sources: ["CUTSHORT", "HIRIST", "JOBSPY"] }
        : {
            source_id: selectedSource,
            company_name: companyName,
            endpoint_token: endpointToken,
          };

      const res = await fetch("/api/pipeline/harvest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Harvest failed");
      }

      setResult({
        success: true,
        message: `Harvest run complete: ${data.jobs_found ?? 0} jobs found, ${data.jobs_created ?? 0} new jobs ingested.`,
        jobs_found: data.jobs_found,
        jobs_created: data.jobs_created,
        jobs_updated: data.jobs_updated,
      });

      onHarvestSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setResult({
        success: false,
        message: msg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={true} size="lg" className="bg-white dark:bg-[#24292E] border border-[#E0DFDC] rounded-xl sm:rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <HugeiconsIcon icon={Rocket01Icon} size={16} strokeWidth={2} />
            </div>
            <DialogTitle className="text-lg font-bold text-foreground">
              Trigger On-Demand Ingestion Harvest
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Execute immediate collection runs via Greenhouse, Ashby, Lever, or Indian Tech Matrix with deduplication and agency filtering.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Source Selection Grid */}
          <div>
            <label className="text-xs font-semibold text-foreground">
              Select Ingestion Channel
            </label>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {ATS_SOURCES.map((source) => {
                const isSelected = selectedSource === source.id;
                return (
                  <button
                    key={source.id}
                    type="button"
                    onClick={() => handleSourceSelect(source.id, source.sample)}
                    className={`flex flex-col rounded-md border p-2.5 text-left transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/10 font-semibold text-primary"
                        : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    <span className="text-xs font-bold">{source.name}</span>
                    <span className="text-[10px] text-muted-foreground truncate">
                      {source.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Fields */}
          {selectedSource !== "MATRIX" ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-foreground">
                  Company Name
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Canonical, Ramp"
                  className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-[13px] text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-foreground">
                  Board Slug / Identifier
                </label>
                <input
                  type="text"
                  required
                  value={endpointToken}
                  onChange={(e) => setEndpointToken(e.target.value)}
                  placeholder="e.g. canonical, ramp"
                  className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-[13px] text-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          ) : (
            <div className="rounded-md border border-border bg-secondary/30 p-3 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Multi-Source Indian Tech Matrix:</span> Runs parallel harvesting across Cutshort, Hirist, and JobSpy targeting top Indian engineering hubs (Bengaluru, Hyderabad, Pune, Gurgaon, Remote).
            </div>
          )}

          {/* Result Alert */}
          {result && (
            <div
              className={`flex items-start gap-2.5 rounded-md border p-3 text-xs ${
                result.success
                  ? "border-success/30 bg-success/10 text-success"
                  : "border-destructive/30 bg-destructive/10 text-destructive"
              }`}
            >
              <HugeiconsIcon
                icon={result.success ? CheckmarkCircle01Icon : AlertCircleIcon}
                size={16}
                className="shrink-0 mt-0.5"
              />
              <div>
                <div className="font-semibold">
                  {result.success ? "Harvest Succeeded" : "Harvest Failed"}
                </div>
                <div className="mt-0.5">{result.message}</div>
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
            <Button
              type="button"
              variant="secondary"
              size="compact"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="compact"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Running Harvest..." : "Run Harvest Now"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
