"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Rocket01Icon,
  Search01Icon,
  Time02Icon,
  SparklesIcon,
  Cancel01Icon,
  UserCircleIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenHarvest?: () => void;
  onOpenRuns: () => void;
  onOpenProfile?: () => void;
  totalJobs: number;
}

export function Navbar({
  searchQuery,
  onSearchChange,
  onOpenHarvest,
  onOpenRuns,
  onOpenProfile,
  totalJobs,
}: NavbarProps) {
  const [isMobileSearchOpen, setIsMobileSearchOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur-md py-1.5 sm:py-3.5 px-2 sm:px-6">
      <div className="mx-auto flex flex-col max-w-[1360px] w-full rounded-xl sm:rounded-2xl border border-border/80 bg-card shadow-xs transition-all duration-150 overflow-hidden">
        <div className="flex h-11 sm:h-14 items-center justify-between px-2 sm:px-6 gap-1.5 sm:gap-2">
          {/* Brand identity */}
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-1">
            <div className="flex h-7 w-7 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <HugeiconsIcon icon={SparklesIcon} size={15} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-xs sm:text-base font-semibold tracking-tight text-foreground truncate">
                  AI Job Intelligence
                </span>
                <span className="hidden xs:inline-block rounded-full bg-accent px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] font-medium text-accent-foreground shrink-0">
                  India Tech Matrix
                </span>
              </div>
            </div>
          </div>

          {/* Search bar & quick triggers */}
          <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
            {/* Desktop search bar */}
            <div className="relative hidden md:block w-64 lg:w-80">
              <HugeiconsIcon
                icon={Search01Icon}
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search title, skills, company, or city..."
                className="h-9 w-full rounded-md border border-border bg-secondary/50 pl-9 pr-8 text-[13px] text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-background focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={14} />
                </button>
              )}
            </div>

            {/* Mobile search toggle button */}
            <Button
              variant={isMobileSearchOpen ? "secondary" : "ghost"}
              size="compact"
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              className="md:hidden h-7 w-7 p-0 flex items-center justify-center shrink-0 text-muted-foreground hover:text-foreground"
              aria-label="Toggle mobile search"
              title="Search jobs"
            >
              <HugeiconsIcon icon={isMobileSearchOpen ? Cancel01Icon : Search01Icon} size={14} />
            </Button>

            {/* Candidate Profile and Settings Trigger: compact icon on mobile, clean text on desktop */}
            {onOpenProfile && (
              <Button
                variant="ghost"
                size="compact"
                onClick={onOpenProfile}
                className="h-7 w-7 sm:w-auto p-0 sm:px-2.5 text-xs shrink-0 flex items-center justify-center text-muted-foreground hover:text-foreground border border-border/60 sm:border-transparent"
                title="Profile and settings"
              >
                <HugeiconsIcon icon={UserCircleIcon} size={15} className="sm:hidden text-primary" />
                <span className="hidden sm:inline">Profile</span>
              </Button>
            )}

            {/* Telemetry Trigger: compact icon on mobile, clean text without icon on desktop */}
            <Button
              variant="secondary"
              size="compact"
              onClick={onOpenRuns}
              className="h-7 w-7 sm:w-auto p-0 sm:px-3 text-xs shrink-0 flex items-center justify-center"
              title="Pipeline Telemetry"
            >
              <HugeiconsIcon icon={Time02Icon} size={14} className="sm:hidden" />
              <span className="hidden sm:inline">Telemetry</span>
            </Button>

            {/* Harvest Trigger: opens dedicated /harvest studio in a separate tab */}
            <Button
              variant="primary"
              size="compact"
              render={<a href="/harvest" target="_blank" rel="noopener noreferrer" />}
              className="h-7 w-7 sm:w-auto p-0 sm:px-3 text-xs shrink-0 flex items-center justify-center"
              title="Open Ingestion Studio in separate tab"
            >
              <HugeiconsIcon icon={Rocket01Icon} size={14} className="sm:hidden" />
              <span className="hidden sm:inline">Trigger Harvest</span>
            </Button>
          </div>
        </div>

        {/* Expandable Mobile Search Row */}
        {isMobileSearchOpen && (
          <div className="md:hidden border-t border-border/80 px-3.5 py-2.5 bg-secondary/30 rounded-b-xl animate-in slide-in-from-top-2 duration-150">
            <div className="relative w-full">
              <HugeiconsIcon
                icon={Search01Icon}
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search title, skills, company, or city..."
                className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-8 text-[13px] text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={14} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
