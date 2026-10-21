"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownTrigger,
  DropdownContent,
  MenuItem,
} from "@/components/ui/dropdown";
import { Button } from "@/components/ui/button";

export interface StatusOption {
  id: string;
  label: string;
  dotColor: string;
  badgeColor: "gray" | "blue" | "amber" | "violet" | "green" | "rose";
}

export const APPLICATION_STATUS_OPTIONS: StatusOption[] = [
  {
    id: "NOT_APPLIED",
    label: "Not applied",
    dotColor: "bg-zinc-400 dark:bg-zinc-500",
    badgeColor: "gray",
  },
  {
    id: "SHORTLISTED",
    label: "Shortlisted",
    dotColor: "bg-[#0A66C2] dark:bg-[#70B5F9]",
    badgeColor: "blue",
  },
  {
    id: "APPLIED",
    label: "Applied",
    dotColor: "bg-amber-500 dark:bg-amber-400",
    badgeColor: "amber",
  },
  {
    id: "INTERVIEWING",
    label: "Interviewing",
    dotColor: "bg-purple-600 dark:bg-purple-400",
    badgeColor: "violet",
  },
  {
    id: "OFFER",
    label: "Offer received",
    dotColor: "bg-emerald-600 dark:bg-emerald-400",
    badgeColor: "green",
  },
  {
    id: "REJECTED",
    label: "Archived",
    dotColor: "bg-rose-500/80 dark:bg-rose-400/80",
    badgeColor: "rose",
  },
];

export function getStatusBadgeProps(status?: string | null): {
  color: "gray" | "blue" | "amber" | "violet" | "green" | "rose";
  label: string;
} {
  const match = APPLICATION_STATUS_OPTIONS.find((opt) => opt.id === status);
  if (match) {
    return { color: match.badgeColor, label: match.label };
  }
  return { color: "gray", label: "Not applied" };
}

export interface PipelineStatusSelectorProps {
  currentStatus: string;
  onChange: (statusId: string) => void;
  disabled?: boolean;
  className?: string;
  layoutIdPrefix?: string;
}

/**
 * Dropdown status selector adhering to Fluid Functionalism:
 * - Shows single active status in a ghost/secondary button with ChevronDown
 * - Fluid hover highlight on dropdown menu items
 * - No search input needed for short list
 * - Color dot indicator and weight without reflow
 */
export function PipelineStatusSelector({
  currentStatus,
  onChange,
  disabled = false,
  className,
}: PipelineStatusSelectorProps) {
  const currentOption =
    APPLICATION_STATUS_OPTIONS.find((opt) => opt.id === currentStatus) ||
    APPLICATION_STATUS_OPTIONS[0];

  const checkedIndex = APPLICATION_STATUS_OPTIONS.findIndex(
    (opt) => opt.id === currentStatus
  );

  return (
    <DropdownMenu className={className}>
      <DropdownTrigger
        render={
          <Button
            variant="ghost"
            size="compact"
            trailingIcon={ChevronDown}
            disabled={disabled}
            className="border border-[#E0DFDC] bg-white px-3 py-1 text-xs font-medium text-[#191919] shadow-xs hover:bg-[#F3F2F0] dark:border-[#30363D] dark:bg-[#24292E] dark:text-[#F0F6FC] dark:hover:bg-[#1E2228] h-8"
          >
            <span
              className={cn("h-2 w-2 rounded-full shrink-0 mr-1.5", currentOption.dotColor)}
              aria-hidden="true"
            />
            <span>{currentOption.label}</span>
          </Button>
        }
      />
      <DropdownContent checkedIndex={checkedIndex} align="start">
        {APPLICATION_STATUS_OPTIONS.map((opt, i) => (
          <MenuItem
            key={opt.id}
            index={i}
            label={opt.label}
            checked={currentStatus === opt.id}
            icon={
              <span
                className={cn("h-2 w-2 rounded-full shrink-0", opt.dotColor)}
                aria-hidden="true"
              />
            }
            onSelect={() => onChange(opt.id)}
          />
        ))}
      </DropdownContent>
    </DropdownMenu>
  );
}

export const PipelineStatusDropdown = PipelineStatusSelector;
