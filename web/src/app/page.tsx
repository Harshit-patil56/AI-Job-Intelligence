"use client";

import * as React from "react";
import { Navbar } from "@/components/navbar";
import { JobFilters, RoleTrack, DetectedLocation } from "@/components/job-filters";
import { JobGrid } from "@/components/job-grid";
import { JobGridSkeleton } from "@/components/job-card-skeleton";
import { RunsDialog } from "@/components/runs-dialog";
import { SettingsDialog } from "@/components/dialog-sidebar/settings-dialog";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { HugeiconsIcon } from "@hugeicons/react";
import { Building03Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { JobItem, JobListResponse } from "@/lib/types";

const PAGE_SIZE = 12;

interface JobStats {
  total: number;
  p1: number;
  p2: number;
  verified: number;
  review: number;
}

export default function HomePage() {
  const [jobs, setJobs] = React.useState<JobItem[]>([]);
  const [totalJobs, setTotalJobs] = React.useState(0);
  const [stats, setStats] = React.useState<JobStats>({
    total: 0,
    p1: 0,
    p2: 0,
    verified: 0,
    review: 0,
  });
  const [currentPage, setCurrentPage] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCompany, setSelectedCompany] = React.useState<string | null>(null);
  const [selectedPriority, setSelectedPriority] = React.useState("ALL");
  const [selectedLocation, setSelectedLocation] = React.useState("All Locations");
  const [selectedStatus, setSelectedStatus] = React.useState("ALL");
  const [selectedExperience, setSelectedExperience] = React.useState("ALL");
  const [selectedApplicationStatus, setSelectedApplicationStatus] = React.useState("ALL");
  const [preferredLocations, setPreferredLocations] = React.useState<string[]>([]);
  const [facets, setFacets] = React.useState<{ tracks: RoleTrack[]; locations: DetectedLocation[] }>({
    tracks: [],
    locations: [],
  });
  const [isRunsOpen, setIsRunsOpen] = React.useState(false);
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);

  // Sync initial page, company, and filter states from URL query string
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const pageParam = parseInt(params.get("page") || "1", 10);
      if (!isNaN(pageParam) && pageParam > 0) {
        setCurrentPage(pageParam);
      }
      const companyParam = params.get("company");
      if (companyParam) {
        setSelectedCompany(companyParam);
        setSelectedPriority("ALL");
        setSelectedLocation("All Locations");
        setSelectedStatus("ALL");
        setSelectedExperience("ALL");
        setSelectedApplicationStatus("ALL");
        setSearchQuery("");
      } else {
        if (params.get("priority")) setSelectedPriority(params.get("priority")!);
        if (params.get("location")) setSelectedLocation(params.get("location")!);
        if (params.get("status")) setSelectedStatus(params.get("status")!);
        if (params.get("experience")) setSelectedExperience(params.get("experience")!);
        if (params.get("app_status")) setSelectedApplicationStatus(params.get("app_status")!);
      }

      // Handle browser back / forward navigation without document reload
      const onPopState = () => {
        const p = new URLSearchParams(window.location.search);
        const pg = parseInt(p.get("page") || "1", 10);
        if (!isNaN(pg) && pg > 0) {
          setCurrentPage(pg);
        }
        const comp = p.get("company");
        setSelectedCompany(comp || null);
        if (p.get("priority")) setSelectedPriority(p.get("priority") || "ALL");
        if (p.get("location")) setSelectedLocation(p.get("location") || "All Locations");
        if (p.get("status")) setSelectedStatus(p.get("status") || "ALL");
        if (p.get("experience")) setSelectedExperience(p.get("experience") || "ALL");
        if (p.get("app_status")) setSelectedApplicationStatus(p.get("app_status") || "ALL");
      };
      window.addEventListener("popstate", onPopState);
      return () => window.removeEventListener("popstate", onPopState);
    }
  }, []);

  // Fetch dynamic facets (tracks + detected locations)
  const fetchFacets = React.useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch("/api/jobs/facets", { signal });
      if (res.ok) {
        const data = await res.json();
        setFacets({
          tracks: data.tracks || [],
          locations: data.locations || [],
        });
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
    }
  }, []);

  // Fetch candidate profile preferences (dynamic locations)
  const fetchProfilePreferences = React.useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch("/api/profile", { signal });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.preferred_locations) && data.preferred_locations.length > 0) {
          setPreferredLocations(data.preferred_locations);
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
    }
  }, []);

  // Fetch aggregate KPI metrics
  const fetchStats = React.useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch("/api/jobs/stats", { signal });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
    }
  }, []);

  // Fetch paginated jobs from backend with AbortController to prevent memory leaks
  const fetchJobs = React.useCallback(
    async (page: number, signal?: AbortSignal) => {
      setIsLoading(true);
      try {
        const offset = (page - 1) * PAGE_SIZE;
        const params = new URLSearchParams();
        params.set("limit", String(PAGE_SIZE));
        params.set("offset", String(offset));

        if (selectedPriority === "P1" || selectedPriority === "P2" || selectedPriority === "P3") {
          params.set("role_priority", selectedPriority);
        } else if (selectedPriority === "REVIEW") {
          params.set("status", "REVIEW");
        } else if (selectedPriority === "ELIGIBLE") {
          params.set("status", "ELIGIBLE");
        } else if (selectedPriority === "VERIFIED") {
          params.set("verified", "true");
        }

        if (selectedStatus !== "ALL") {
          params.set("status", selectedStatus);
        }

        if (selectedLocation !== "All Locations" && selectedLocation !== "All India") {
          params.set("location", selectedLocation);
        }

        if (selectedExperience !== "ALL") {
          params.set("experience_level", selectedExperience);
        }

        if (selectedApplicationStatus !== "ALL") {
          params.set("application_status", selectedApplicationStatus);
        }

        if (selectedCompany && selectedCompany.trim()) {
          params.set("company", selectedCompany.trim());
        }

        if (searchQuery.trim()) {
          params.set("search", searchQuery.trim());
        }

        const minDelayPromise = new Promise<void>((resolve, reject) => {
          const timer = setTimeout(resolve, 350);
          signal?.addEventListener("abort", () => {
            clearTimeout(timer);
            reject(new DOMException("Aborted", "AbortError"));
          });
        });

        const fetchPromise = (async () => {
          const res = await fetch(`/api/jobs?${params.toString()}`, { signal });
          if (!res.ok) throw new Error("Failed to fetch jobs");
          return (await res.json()) as JobListResponse;
        })();

        const [_, data] = await Promise.all([minDelayPromise, fetchPromise]);

        setJobs(data.jobs || []);
        setTotalJobs(data.total || 0);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        setJobs([]);
        setTotalJobs(0);
      } finally {
        setIsLoading(false);
      }
    },
    [
      selectedPriority,
      selectedLocation,
      selectedStatus,
      selectedExperience,
      selectedApplicationStatus,
      searchQuery,
      selectedCompany,
    ]
  );

  // Initial and reactive fetch with cleanup to guarantee zero memory leaks
  React.useEffect(() => {
    const controller = new AbortController();
    fetchStats(controller.signal);
    fetchFacets(controller.signal);
    fetchProfilePreferences(controller.signal);
    fetchJobs(currentPage, controller.signal);

    return () => {
      controller.abort();
    };
  }, [currentPage, fetchJobs, fetchStats, fetchFacets, fetchProfilePreferences]);

  // Refresh profile preferences and facets when profile dialog closes
  React.useEffect(() => {
    if (!isProfileOpen) {
      fetchProfilePreferences();
      fetchFacets();
    }
  }, [isProfileOpen, fetchProfilePreferences, fetchFacets]);

  // Navigate page staying on the same page (no document reload, smooth compositor slide)
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage === currentPage) return;
    setCurrentPage(newPage);

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("page", String(newPage));
      window.history.pushState({}, "", url.toString());
      // Smoothly scroll to job grid top
      window.scrollTo({ top: 380, behavior: "smooth" });
    }
  };

  // Reset page to 1 whenever filters change
  const handlePriorityChange = (priority: string) => {
    setSelectedPriority(priority);
    setCurrentPage(1);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("page", "1");
      if (priority !== "ALL") {
        url.searchParams.set("priority", priority);
      } else {
        url.searchParams.delete("priority");
      }
      window.history.pushState({}, "", url.toString());
    }
  };

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    setCurrentPage(1);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("page", "1");
      if (status !== "ALL") {
        url.searchParams.set("status", status);
      } else {
        url.searchParams.delete("status");
      }
      window.history.pushState({}, "", url.toString());
    }
  };

  const handleLocationChange = (loc: string) => {
    setSelectedLocation(loc);
    setCurrentPage(1);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("page", "1");
      if (loc !== "All Locations") {
        url.searchParams.set("location", loc);
      } else {
        url.searchParams.delete("location");
      }
      window.history.pushState({}, "", url.toString());
    }
  };

  const handleExperienceChange = (exp: string) => {
    setSelectedExperience(exp);
    setCurrentPage(1);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("page", "1");
      if (exp !== "ALL") {
        url.searchParams.set("experience", exp);
      } else {
        url.searchParams.delete("experience");
      }
      window.history.pushState({}, "", url.toString());
    }
  };

  const handleApplicationStatusChange = (status: string) => {
    setSelectedApplicationStatus(status);
    setCurrentPage(1);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("page", "1");
      if (status !== "ALL") {
        url.searchParams.set("app_status", status);
      } else {
        url.searchParams.delete("app_status");
      }
      window.history.pushState({}, "", url.toString());
    }
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("page", "1");
      window.history.pushState({}, "", url.toString());
    }
  };

  const handleClearCompanyFilter = () => {
    setSelectedCompany(null);
    setCurrentPage(1);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("company");
      url.searchParams.set("page", "1");
      window.history.pushState({}, "", url.toString());
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalJobs / PAGE_SIZE));

  // Build pagination window (e.g. 1 2 3 ... 40)
  const getPaginationItems = () => {
    const items: (number | "ellipsis")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) items.push(i);
    } else {
      items.push(1);
      if (currentPage > 3) {
        items.push("ellipsis");
      }
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        items.push(i);
      }
      if (currentPage < totalPages - 2) {
        items.push("ellipsis");
      }
      items.push(totalPages);
    }
    return items;
  };

  const startRecord = totalJobs === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endRecord = Math.min(currentPage * PAGE_SIZE, totalJobs);

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onOpenRuns={() => setIsRunsOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        totalJobs={stats.total}
      />

      <main className="mx-auto max-w-7xl w-full px-3 sm:px-6 py-3.5 sm:py-6 space-y-3.5 sm:space-y-6 overflow-x-hidden">
        {/* Filter Toolbar */}
        <JobFilters
          selectedPriority={selectedPriority}
          onPriorityChange={handlePriorityChange}
          selectedLocation={selectedLocation}
          onLocationChange={handleLocationChange}
          selectedExperience={selectedExperience}
          onExperienceChange={handleExperienceChange}
          selectedApplicationStatus={selectedApplicationStatus}
          onApplicationStatusChange={handleApplicationStatusChange}
          selectedStatus={selectedStatus}
          onStatusChange={handleStatusChange}
          tracks={facets.tracks}
          detectedLocations={facets.locations}
          preferredLocations={preferredLocations}
          onRefresh={() => {
            fetchStats();
            fetchFacets();
            fetchJobs(currentPage);
          }}
          isLoading={isLoading}
        />

        {/* Feed Summary Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-2">
            <span>
              Showing{" "}
              <span className="font-semibold text-foreground">
                {startRecord}-{endRecord}
              </span>{" "}
              of <span>{totalJobs}</span> matching postings
            </span>
            {selectedCompany && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-[#0A66C2]/30 px-2.5 py-0.5 text-xs font-semibold text-[#0A66C2] dark:bg-[#70B5F9]/15 dark:text-[#70B5F9]">
                <HugeiconsIcon icon={Building03Icon} size={13} />
                <span>Company: {selectedCompany}</span>
                <button
                  type="button"
                  onClick={handleClearCompanyFilter}
                  className="rounded-full p-0.5 hover:bg-[#0A66C2]/20 text-[#0A66C2] dark:text-[#70B5F9] transition-colors"
                  aria-label="Clear company filter"
                  title="Clear company filter"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={11} strokeWidth={2.5} />
                </button>
              </span>
            )}
            {selectedPriority !== "ALL" && (
              <span className="text-[#0A66C2]">({selectedPriority})</span>
            )}
            {selectedLocation !== "All India" && (
              <span className="text-[#0A66C2]">• {selectedLocation}</span>
            )}
          </div>
        </div>

        {/* Job Cards Grid with Skeleton Loading (350ms min display + 150ms cross-fade) and 2-D Fluid Hover */}
        <div className="relative min-h-[480px]">
          {isLoading ? (
            <div className="animate-in fade-in duration-150">
              <JobGridSkeleton count={PAGE_SIZE} />
            </div>
          ) : (
            <div className="animate-in fade-in duration-150">
              <JobGrid
                jobs={jobs}
              />
            </div>
          )}
        </div>

        {/* Animated Sliding Surface Pagination (staying on same page) */}
        {totalPages > 1 && (
          <div className="pt-4 pb-12 w-full max-w-full overflow-hidden">
            <Pagination>
              <PaginationContent className="flex-wrap justify-center gap-1 sm:gap-1.5">
                <PaginationItem>
                  <PaginationPrevious
                    disabled={currentPage <= 1 || isLoading}
                    onClick={() => handlePageChange(currentPage - 1)}
                    className="px-2.5 sm:px-3.5 text-xs sm:text-[13px]"
                  />
                </PaginationItem>

                {getPaginationItems().map((item, idx) => {
                  // On mobile screen, only show active page, 1, and totalPages to prevent wide blowout
                  const isCurrent = currentPage === item;
                  const isExtreme = item === 1 || item === totalPages;
                  const isMobileVisible = isCurrent || isExtreme;

                  return (
                    <PaginationItem
                      key={idx}
                      className={!isMobileVisible && item !== "ellipsis" ? "hidden sm:inline-block" : ""}
                    >
                      {item === "ellipsis" ? (
                        <PaginationEllipsis />
                      ) : (
                        <PaginationLink
                          isActive={isCurrent}
                          disabled={isLoading}
                          onClick={() => handlePageChange(item as number)}
                          className="h-8 min-w-8 sm:h-9 sm:min-w-9 px-2 sm:px-3 text-xs sm:text-[13px]"
                        >
                          {item}
                        </PaginationLink>
                      )}
                    </PaginationItem>
                  );
                })}

                <PaginationItem>
                  <PaginationNext
                    disabled={currentPage >= totalPages || isLoading}
                    onClick={() => handlePageChange(currentPage + 1)}
                    className="px-2.5 sm:px-3.5 text-xs sm:text-[13px]"
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>

            <div className="mt-2 text-center text-[12px] text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
          </div>
        )}
      </main>

      {/* Dialogs */}
      <RunsDialog
        open={isRunsOpen}
        onOpenChange={setIsRunsOpen}
      />

      <SettingsDialog
        open={isProfileOpen}
        onOpenChange={setIsProfileOpen}
      />
    </div>
  );
}

