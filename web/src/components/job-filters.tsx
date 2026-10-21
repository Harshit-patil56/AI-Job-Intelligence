"use client";

import * as React from "react";
import {
  DropdownMenu,
  DropdownTrigger,
  DropdownContent,
  DropdownSearch,
  DropdownEmpty,
  DropdownGroupLabel,
  MenuItem,
} from "@/components/ui/dropdown";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { RefreshCw } from "@/components/animate-ui/icons/refresh-cw";
import { fontWeights } from "@/lib/font-weight";
import {
  ChevronDown,
  MapPin,
  Globe,
  Laptop,
  Building,
  CheckCircle2,
} from "lucide-react";

export interface RoleTrack {
  id: string;
  label: string;
  count: number;
}

export interface DetectedLocation {
  name: string;
  count: number;
}

interface JobFiltersProps {
  selectedPriority: string;
  onPriorityChange: (priority: string) => void;
  selectedLocation: string;
  onLocationChange: (loc: string) => void;
  selectedExperience: string;
  onExperienceChange: (exp: string) => void;
  selectedApplicationStatus: string;
  onApplicationStatusChange: (status: string) => void;
  selectedStatus?: string;
  onStatusChange?: (status: string) => void;
  tracks?: RoleTrack[];
  detectedLocations?: DetectedLocation[];
  preferredLocations?: string[];
  onRefresh: () => void;
  isLoading: boolean;
}

const DEFAULT_TRACKS: RoleTrack[] = [
  { id: "ALL", label: "All Roles", count: 0 },
  { id: "P1", label: "P1 • AI & GenAI", count: 0 },
  { id: "P2", label: "P2 • Backend Python", count: 0 },
  { id: "P3", label: "P3 • Software Eng", count: 0 },
];

const EXPERIENCE_OPTIONS = [
  { value: "ALL", label: "Any Experience" },
  { value: "ENTRY", label: "Fresher / 0–2 YOE" },
  { value: "MID", label: "Mid-level / 2–5 YOE" },
  { value: "SENIOR", label: "Senior / 5+ YOE" },
];

const APPLICATION_OPTIONS = [
  { value: "ALL", label: "All Pipeline" },
  { value: "NOT_APPLIED", label: "Unapplied Queue" },
  { value: "APPLIED", label: "Applied" },
  { value: "INTERVIEWING", label: "Interviewing" },
];

const STATUS_OPTIONS = [
  { value: "ALL", label: "All Qualities" },
  { value: "ELIGIBLE", label: "Eligible Only" },
  { value: "VERIFIED", label: "High Confidence" },
  { value: "REVIEW", label: "Review Required" },
];

interface LocationItem {
  value: string;
  label: string;
  group: "Workplace" | "Preferred Hubs" | "Detected Locations";
  icon: React.ReactNode;
  count?: number;
}

export function JobFilters({
  selectedPriority,
  onPriorityChange,
  selectedLocation,
  onLocationChange,
  selectedExperience,
  onExperienceChange,
  selectedApplicationStatus,
  onApplicationStatusChange,
  selectedStatus = "ALL",
  onStatusChange,
  tracks = DEFAULT_TRACKS,
  detectedLocations = [],
  preferredLocations = [],
  onRefresh,
  isLoading,
}: JobFiltersProps) {
  const [locationQuery, setLocationQuery] = React.useState("");

  // Build grouped location items inspired by CommandMenu / Dropdown pattern
  const locationItems = React.useMemo<LocationItem[]>(() => {
    const items: LocationItem[] = [];

    // 1. Workplace defaults
    items.push({
      value: "All Locations",
      label: "All Locations",
      group: "Workplace",
      icon: <Globe size={13} className="text-muted-foreground" />,
    });
    items.push({
      value: "Remote",
      label: "Remote Only",
      group: "Workplace",
      icon: <Laptop size={13} className="text-muted-foreground" />,
    });

    // 2. Candidate preferred hubs (from candidate profile)
    const effectivePreferred =
      preferredLocations.length > 0
        ? preferredLocations
        : ["Mumbai", "Pune", "Bengaluru", "Hyderabad"];

    const preferredSet = new Set<string>();
    effectivePreferred.forEach((city) => {
      if (city && city.toLowerCase() !== "remote" && city.toLowerCase() !== "all locations") {
        preferredSet.add(city.toLowerCase());
        // Find matching count from detected if available
        const matchedDetected = detectedLocations.find(
          (d) => d.name.toLowerCase().includes(city.toLowerCase())
        );
        items.push({
          value: city,
          label: city,
          group: "Preferred Hubs",
          icon: <MapPin size={13} className="text-[#0A66C2] dark:text-[#70B5F9]" />,
          count: matchedDetected?.count,
        });
      }
    });

    // 3. Detected locations dynamically discovered from real DB postings
    detectedLocations.forEach((loc) => {
      const isAlreadyPreferred = Array.from(preferredSet).some((p) =>
        loc.name.toLowerCase().includes(p)
      );
      if (!isAlreadyPreferred && loc.name.trim()) {
        items.push({
          value: loc.name,
          label: loc.name,
          group: "Detected Locations",
          icon: <Building size={13} className="text-muted-foreground" />,
          count: loc.count,
        });
      }
    });

    return items;
  }, [preferredLocations, detectedLocations]);

  // Filter matches based on search query
  const filteredLocationMatches = React.useMemo(() => {
    if (!locationQuery.trim()) return locationItems;
    const q = locationQuery.trim().toLowerCase();
    return locationItems.filter(
      (item) =>
        item.label.toLowerCase().includes(q) || item.group.toLowerCase().includes(q)
    );
  }, [locationItems, locationQuery]);

  // Group filtered matches while maintaining sequential index for Fluid Functionalism
  const groupedMatches = React.useMemo(() => {
    const groups: { [key: string]: LocationItem[] } = {};
    filteredLocationMatches.forEach((item) => {
      if (!groups[item.group]) {
        groups[item.group] = [];
      }
      groups[item.group].push(item);
    });
    return groups;
  }, [filteredLocationMatches]);

  // Active track items (fallback to default tracks if empty)
  const displayTracks = tracks.length > 0 ? tracks : DEFAULT_TRACKS;

  // Compute sequential indexing across groups for FluidHoverHighlight
  let hoverCounter = 0;

  // Pinned location pills for quick 1-click access
  const pinnedPills = React.useMemo(() => {
    const custom = preferredLocations.filter(
      (p) => p && p.toLowerCase() !== "remote" && p.toLowerCase() !== "all locations"
    );
    const defaults = custom.length > 0 ? custom.slice(0, 4) : ["Mumbai", "Pune", "Bengaluru"];
    const list = ["All Locations", ...defaults];
    if (!list.includes("Remote")) list.push("Remote");
    return list;
  }, [preferredLocations]);

  const isCustomSelected =
    !pinnedPills.includes(selectedLocation) && selectedLocation !== "All Locations";

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card p-3 sm:p-4 shadow-xs transition-colors">
      {/* Top Row: Dynamic Role Tracks with Counts + Action Selects */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 min-w-0">
        {/* Dynamic Priority Segment Pills with Ghost-Spans */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scrollbar-none pb-0.5 min-w-0 flex-1 touch-pan-x">
          {displayTracks.map((item) => {
            const isActive = selectedPriority === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onPriorityChange(item.id)}
                className={`relative flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-[12px] sm:text-[13px] font-semibold transition-all duration-80 cursor-pointer ${isActive
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
              >
                {/* Ghost-span: zero layout shift on weight changes */}
                <span className="inline-grid">
                  <span
                    className="col-start-1 row-start-1 transition-[color,font-variation-settings] duration-80"
                    style={{
                      fontVariationSettings: isActive
                        ? fontWeights.bold
                        : fontWeights.semibold,
                    }}
                  >
                    {item.label}
                  </span>
                  <span
                    aria-hidden="true"
                    className="col-start-1 row-start-1 invisible"
                    style={{ fontVariationSettings: fontWeights.bold }}
                  >
                    {item.label}
                  </span>
                </span>
                {item.count > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono tabular-nums transition-colors ${isActive
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                      }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right side: Orthogonal Filters + Refresh Button */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Eligibility / Quality Filter (Orthogonal Dimension) */}
          {onStatusChange && (
            <Select
              value={selectedStatus}
              onValueChange={onStatusChange}
              size="compact"
            >
              <SelectTrigger
                className="h-8 min-w-[125px] rounded-lg text-xs"
                placeholder="Quality..."
              />
              <SelectContent align="end" className="w-44">
                {STATUS_OPTIONS.map((opt, idx) => (
                  <SelectItem key={opt.value} value={opt.value} index={idx}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Experience Filter Dropdown */}
          <Select
            value={selectedExperience}
            onValueChange={onExperienceChange}
            size="compact"
          >
            <SelectTrigger
              className="h-8 min-w-[130px] rounded-lg text-xs"
              placeholder="Experience..."
            />
            <SelectContent align="end" className="w-44">
              {EXPERIENCE_OPTIONS.map((opt, idx) => (
                <SelectItem key={opt.value} value={opt.value} index={idx}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Application Pipeline Filter Dropdown */}
          <Select
            value={selectedApplicationStatus}
            onValueChange={onApplicationStatusChange}
            size="compact"
          >
            <SelectTrigger
              className="h-8 min-w-[125px] rounded-lg text-xs"
              placeholder="Pipeline..."
            />
            <SelectContent align="end" className="w-44">
              {APPLICATION_OPTIONS.map((opt, idx) => (
                <SelectItem key={opt.value} value={opt.value} index={idx}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Refresh Button with Slow-In/Fast-Middle/Slow-Out Easing */}
          <Button
            variant="ghost"
            size="compact"
            disabled={isLoading}
            onClick={onRefresh}
            className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground shrink-0 cursor-pointer flex items-center justify-center transition-colors"
            title="Refresh job listings"
          >
            <RefreshCw
              size={15}
              animation="rotate"
              animateOnHover="rotate"
              animate={isLoading ? "rotate" : undefined}
              loop={isLoading}
              completeOnStop
            />
            <span className="sr-only">Refresh listings</span>
          </Button>
        </div>
      </div>

      {/* Bottom Row: Pinned Hub Pills + Searchable Dropdown at the End */}
      <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-2.5 min-w-0">
        {/* Left: Location Label + Horizontally Scrollable Pinned Hub Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scrollbar-none pb-0.5 min-w-0 flex-1 touch-pan-x">
          <div className="flex items-center gap-1.5 text-[11px] sm:text-[12px] font-medium text-muted-foreground shrink-0 mr-1">
            <MapPin size={13} className="text-primary" />
            <span>Location:</span>
          </div>

          {pinnedPills.map((loc) => {
            const isActive = selectedLocation === loc;
            return (
              <button
                key={loc}
                type="button"
                onClick={() => onLocationChange(loc)}
                className={`relative flex h-7 shrink-0 items-center whitespace-nowrap rounded-full px-3 text-[11px] font-medium transition-all duration-80 cursor-pointer border ${isActive
                  ? "border-primary bg-primary/10 text-primary font-semibold shadow-xs"
                  : "border-border/60 bg-transparent text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                  }`}
              >
                <span className="inline-grid">
                  <span
                    className="col-start-1 row-start-1 transition-[color,font-variation-settings] duration-80"
                    style={{
                      fontVariationSettings: isActive
                        ? fontWeights.semibold
                        : fontWeights.normal,
                    }}
                  >
                    {loc}
                  </span>
                  <span
                    aria-hidden="true"
                    className="col-start-1 row-start-1 invisible"
                    style={{ fontVariationSettings: fontWeights.semibold }}
                  >
                    {loc}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Right: Searchable Location Dropdown Menu (Outside scroll container to prevent clipping) */}
        <div className="shrink-0 relative">
          <DropdownMenu>
            <DropdownTrigger
              render={
                <button
                  type="button"
                  className={`h-7.5 shrink-0 inline-flex items-center justify-center gap-1.5 px-2.5 rounded-lg text-xs font-medium border cursor-pointer whitespace-nowrap select-none transition-all duration-80 ${isCustomSelected
                    ? "border-primary bg-primary/10 text-primary font-semibold shadow-xs"
                    : "border-border/70 bg-secondary/30 hover:bg-secondary/60 text-muted-foreground hover:text-foreground shadow-xs"
                    }`}
                >
                  <span className="truncate max-w-[130px] sm:max-w-[190px]">
                    {isCustomSelected ? selectedLocation : "More Locations"}
                  </span>
                  <ChevronDown size={12} className="shrink-0 opacity-70 ml-0.5" />
                </button>
              }
            />
            <DropdownContent align="end" className="w-[285px] p-1.5 shadow-xl">
              <DropdownSearch
                value={locationQuery}
                onValueChange={setLocationQuery}
                placeholder="Search city or 'remote'..."
              />
              {Object.keys(groupedMatches).map((groupName) => (
                <div key={groupName} className="flex flex-col">
                  <DropdownGroupLabel>{groupName}</DropdownGroupLabel>
                  {groupedMatches[groupName].map((item) => {
                    const currentIndex = hoverCounter++;
                    const isChecked = selectedLocation === item.value;
                    return (
                      <MenuItem
                        key={item.value}
                        index={currentIndex}
                        label={item.label}
                        icon={item.icon}
                        badge={item.count ? `(${item.count})` : undefined}
                        checked={isChecked}
                        onSelect={() => {
                          onLocationChange(item.value);
                          setLocationQuery("");
                        }}
                      />
                    );
                  })}
                </div>
              ))}
              {filteredLocationMatches.length === 0 && (
                <DropdownEmpty>No matching locations found</DropdownEmpty>
              )}
            </DropdownContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
