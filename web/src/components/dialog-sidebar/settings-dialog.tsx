"use client";

import * as React from "react";
import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownTrigger,
  DropdownContent,
  DropdownSearch,
  DropdownEmpty,
  MenuItem,
} from "@/components/ui/dropdown";
import { InputGroup, InputField } from "@/components/ui/input-group";
import { Badge } from "@/components/ui/badge";
import { Highlighter } from "@/components/ui/highlighter";
import {
  ChevronDown,
  User,
  Briefcase,
  Link,
  Globe,
  Code2,
  MapPin,
  X,
  Database,
  Trash2,
  RefreshCw,
  Archive,
  Sparkles,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  FileText,
  Key,
  Eye,
  EyeOff,
  ShieldCheck,
  Zap,
  Search,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { spring } from "@/lib/springs";
import {
  GitHubLogoIcon,
  LinkedInLogoIcon,
  GeminiLogoIcon,
  GroqLogoIcon,
  OpenRouterLogoIcon,
  OllamaLogoIcon,
} from "@/components/ui/brand-icons";
import { TagCombobox } from "@/components/ui/tag-combobox";
import { useIcons, type IconName } from "@/lib/icon-context";
import { cn } from "@/lib/utils";
import { fontWeights } from "@/lib/font-weight";
import { HugeiconsIcon } from "@hugeicons/react";
import { Key01Icon } from "@hugeicons/core-free-icons";

export interface CandidateProfileData {
  id?: string;
  full_name: string;
  headline: string;
  target_roles: string[];
  preferred_locations: string[];
  skills: string[];
  resume_text: string;
  portfolio_url?: string;
  github_url?: string;
  linkedin_url?: string;
}

export interface SettingsSection {
  id: string;
  label: string;
  group: "Candidate" | "Workspace";
  icon: IconName;
  description: string;
}

const SECTIONS: SettingsSection[] = [
  {
    id: "identity",
    label: "Resume and identity",
    group: "Candidate",
    icon: "user",
    description: "Your full name, headline, resume markdown, and verified links.",
  },
  {
    id: "targets",
    label: "Job targets and skills",
    group: "Candidate",
    icon: "sliders-horizontal",
    description: "Target engineering roles, preferred cities, and technology keywords.",
  },
  {
    id: "ingestion",
    label: "Ingestion and sourcing",
    group: "Workspace",
    icon: "settings",
    description: "Multi-channel ATS scrapers, autonomous sweep cadence, and deduplication.",
  },
  {
    id: "copilot",
    label: "Application copilot",
    group: "Workspace",
    icon: "brain",
    description: "Personalized bullet point tone, target length, and outreach styling.",
  },
  {
    id: "api",
    label: "API",
    group: "Workspace",
    icon: "key",
    description: "Securely manage LLM API keys, models, and runtime inference toggles.",
  },
  {
    id: "database",
    label: "Database and maintenance",
    group: "Workspace",
    icon: "database",
    description: "Manage local SQLite storage, 5-day freshness auto-cleaning, and cache utilities.",
  },
];

export interface SettingsDialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultSection?: string;
}

export function SettingsDialog({
  open = false,
  defaultOpen = false,
  onOpenChange,
  defaultSection = "identity",
}: SettingsDialogProps) {
  const icons = useIcons();
  const [section, setSection] = React.useState(defaultSection);
  const current = SECTIONS.find((s) => s.id === section) ?? SECTIONS[0];

  // Candidate profile state
  const [profile, setProfile] = React.useState<CandidateProfileData>({
    full_name: "",
    headline: "",
    target_roles: [],
    preferred_locations: [],
    skills: [],
    resume_text: "",
    github_url: "",
    linkedin_url: "",
    portfolio_url: "",
  });

  const [isLoadingProfile, setIsLoadingProfile] = React.useState(false);
  const [isSavingProfile, setIsSavingProfile] = React.useState(false);
  const [saveFeedback, setSaveFeedback] = React.useState<string | null>(null);
  const [savedProfile, setSavedProfile] = React.useState<CandidateProfileData | null>(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = React.useState(false);

  // Fetch candidate profile when modal opens
  const fetchProfile = React.useCallback(async () => {
    setIsLoadingProfile(true);
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        const loaded: CandidateProfileData = {
          full_name: data.full_name ?? "",
          headline: data.headline ?? "",
          target_roles: data.target_roles ?? [],
          preferred_locations: data.preferred_locations ?? [],
          skills: data.skills ?? [],
          resume_text: data.resume_text ?? "",
          portfolio_url: data.portfolio_url ?? "",
          github_url: data.github_url ?? "",
          linkedin_url: data.linkedin_url ?? "",
        };
        setProfile(loaded);
        setSavedProfile(loaded);
      }
    } catch {
      // Keep defaults on failure
    } finally {
      setIsLoadingProfile(false);
    }
  }, []);

  React.useEffect(() => {
    if (open) {
      fetchProfile();
      setSaveFeedback(null);
    }
  }, [open, fetchProfile]);

  const handleSaveProfile = async (): Promise<boolean> => {
    setIsSavingProfile(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (res.ok) {
        setSavedProfile(profile);
        setSaveFeedback(
          current.id === "targets"
            ? "Target preferences saved!"
            : "Resume & identity saved!"
        );
        setTimeout(() => setSaveFeedback(null), 2500);
        return true;
      } else {
        setSaveFeedback("Failed to save profile.");
        return false;
      }
    } catch {
      setSaveFeedback("Failed to save profile.");
      return false;
    } finally {
      setIsSavingProfile(false);
    }
  };

  const dirtyFlags = React.useMemo(() => {
    if (!savedProfile) {
      return {
        fullName: false,
        headline: false,
        resumeText: false,
        githubUrl: false,
        linkedinUrl: false,
        portfolioUrl: false,
        skills: false,
        targetRoles: false,
        preferredLocations: false,
        identity: false,
        targets: false,
        any: false,
      };
    }
    const fullName = profile.full_name !== savedProfile.full_name;
    const headline = profile.headline !== savedProfile.headline;
    const resumeText = profile.resume_text !== savedProfile.resume_text;
    const githubUrl = (profile.github_url || "") !== (savedProfile.github_url || "");
    const linkedinUrl = (profile.linkedin_url || "") !== (savedProfile.linkedin_url || "");
    const portfolioUrl = (profile.portfolio_url || "") !== (savedProfile.portfolio_url || "");
    const skills = JSON.stringify(profile.skills) !== JSON.stringify(savedProfile.skills);
    const targetRoles = JSON.stringify(profile.target_roles) !== JSON.stringify(savedProfile.target_roles);
    const preferredLocations = JSON.stringify(profile.preferred_locations) !== JSON.stringify(savedProfile.preferred_locations);

    const identity = fullName || headline || resumeText || githubUrl || linkedinUrl || portfolioUrl;
    const targets = skills || targetRoles || preferredLocations;
    const any = identity || targets;

    return {
      fullName,
      headline,
      resumeText,
      githubUrl,
      linkedinUrl,
      portfolioUrl,
      skills,
      targetRoles,
      preferredLocations,
      identity,
      targets,
      any,
    };
  }, [profile, savedProfile]);

  const isDirty = dirtyFlags.any;

  const handleCloseRequest = () => {
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      if (savedProfile) {
        setProfile(savedProfile);
      }
      onOpenChange?.(false);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      if (isDirty) {
        setShowDiscardConfirm(true);
        return;
      }
      if (savedProfile) {
        setProfile(savedProfile);
      }
    }
    onOpenChange?.(nextOpen);
  };

  const handleConfirmDiscard = () => {
    if (savedProfile) {
      setProfile(savedProfile);
    }
    setShowDiscardConfirm(false);
    onOpenChange?.(false);
  };

  const handleSaveAndClose = async () => {
    const success = await handleSaveProfile();
    if (success) {
      setShowDiscardConfirm(false);
      onOpenChange?.(false);
    }
  };

  React.useEffect(() => {
    if (!open && savedProfile) {
      setProfile(savedProfile);
      setShowDiscardConfirm(false);
    }
  }, [open, savedProfile]);

  return (
    <Dialog open={open} defaultOpen={defaultOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        size="xl"
        showCloseButton={false}
        className="flex h-[min(640px,calc(100dvh-4rem))] overflow-hidden p-0 border border-border bg-card shadow-2xl"
      >
        {/* Top-right action controls: Save button (left of close) + Close button */}
        <div className="absolute right-3.5 top-3.5 z-30 flex items-center gap-2">
          {saveFeedback && (
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hidden sm:inline animate-in fade-in duration-150">
              {saveFeedback}
            </span>
          )}

          {current.id === "targets" && (
            <Button
              variant="primary"
              size="compact"
              disabled={isSavingProfile || isLoadingProfile}
              onClick={handleSaveProfile}
              className="h-7 px-3 text-xs font-medium cursor-pointer shadow-xs"
            >
              {isSavingProfile ? (
                "Saving..."
              ) : (
                <>
                  <span className="hidden sm:inline">Save target preferences</span>
                  <span className="sm:hidden">Save</span>
                </>
              )}
            </Button>
          )}

          {current.id === "identity" && (
            <Button
              variant="primary"
              size="compact"
              disabled={isSavingProfile || isLoadingProfile}
              onClick={handleSaveProfile}
              className="h-7 px-3 text-xs font-medium cursor-pointer shadow-xs"
            >
              {isSavingProfile ? (
                "Saving..."
              ) : (
                <>
                  <span className="hidden sm:inline">Save resume and identity</span>
                  <span className="sm:hidden">Save</span>
                </>
              )}
            </Button>
          )}

          {/* Custom close button that intercepts unsaved edits */}
          <Button
            type="button"
            variant="ghost"
            size="compact"
            onClick={handleCloseRequest}
            className="h-7 w-7 p-0 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/60 rounded-lg cursor-pointer"
            title="Close dialog"
          >
            <X size={15} />
            <span className="sr-only">Close</span>
          </Button>
        </div>
        <SidebarProvider
          persist={false}
          shortcut={null}
          width="13.5rem"
          className="h-full min-h-0"
        >
          {/* Desktop Left Sidebar: clean sentence case, no uppercase */}
          <Sidebar
            collapsible="none"
            className="hidden h-full sm:flex bg-[rgb(var(--overlay,0_0_0)/0.03)] border-r border-border/80"
          >
            <SidebarHeader className="px-4 pt-5 pb-2">
              <DialogTitle
                className="text-base text-foreground font-normal"
                style={{ fontVariationSettings: fontWeights.normal }}
              >
                Profile and settings
              </DialogTitle>
              <DialogDescription className="sr-only">
                Candidate profile, job intelligence preferences, and workspace settings.
              </DialogDescription>
            </SidebarHeader>

            <SidebarContent>
              {/* Candidate Section Group */}
              <SidebarGroup>
                <SidebarGroupLabel>
                  Candidate
                </SidebarGroupLabel>
                <SidebarMenu focusRing={false}>
                  {SECTIONS.filter((s) => s.group === "Candidate").map((s) => {
                    const isSectionDirty = s.id === "identity" ? dirtyFlags.identity : dirtyFlags.targets;
                    return (
                      <SidebarMenuItem key={s.id}>
                        <SidebarMenuButton
                          icon={icons[s.icon]}
                          isActive={s.id === section}
                          onClick={() => setSection(s.id)}
                          trailing={
                            isSectionDirty ? (
                              <span
                                className="h-1.5 w-1.5 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)]"
                                title="Unsaved changes"
                                aria-label="Unsaved changes"
                              />
                            ) : undefined
                          }
                        >
                          {s.label}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroup>

              {/* Workspace Section Group */}
              <SidebarGroup>
                <SidebarGroupLabel>
                  Workspace
                </SidebarGroupLabel>
                <SidebarMenu focusRing={false}>
                  {SECTIONS.filter((s) => s.group === "Workspace").map((s) => (
                    <SidebarMenuItem key={s.id}>
                      <SidebarMenuButton
                        icon={icons[s.icon]}
                        isActive={s.id === section}
                        onClick={() => setSection(s.id)}
                      >
                        {s.label}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>

          {/* Right Panel: Content with fixed header and ScrollArea */}
          <div className="flex min-w-0 flex-1 flex-col bg-card">
            {/* Panel header: pr-56 sm:pr-64 clears the top-right action button & close button */}
            <div className="flex shrink-0 flex-col gap-1 px-6 pt-5 pb-4 pr-56 sm:pr-64 border-b border-border/40">
              {/* Mobile View: Select takes over navigation under visible h2 */}
              <div className="sm:hidden">
                <h2
                  className="mb-2.5 text-[length:var(--fs-title,16px)] leading-[var(--lh-title,22px)] text-foreground"
                  style={{ fontVariationSettings: fontWeights.normal }}
                >
                  Profile and settings
                </h2>
                <SettingsDropdown
                  value={section}
                  onValueChange={setSection}
                  options={SECTIONS.map((s) => ({ value: s.id, label: s.label }))}
                  placeholder="Select section..."
                />
              </div>

              {/* Desktop Section Heading & Description */}
              <div className="hidden sm:flex items-center gap-2.5">
                <h3
                  className="text-[length:var(--fs-title,16px)] leading-[var(--lh-title,22px)] text-foreground"
                  style={{ fontVariationSettings: fontWeights.normal }}
                >
                  <Highlighter
                    key={current.id}
                    action="underline"
                    color="rgb(var(--primary, 37 99 235))"
                    strokeWidth={2}
                    animationDuration={500}
                    padding={2}
                  >
                    {current.label}
                  </Highlighter>
                </h3>
                {((current.id === "identity" && dirtyFlags.identity) || (current.id === "targets" && dirtyFlags.targets)) && (
                  <Badge variant="solid" color="rose" size="compact">
                    unsaved changes
                  </Badge>
                )}
              </div>
              <p className="hidden text-[length:var(--fs-body,13px)] leading-[var(--lh-body,20px)] text-muted-foreground sm:block">
                {current.description}
              </p>
            </div>

            {/* Scrollable Section Settings */}
            <ScrollArea className="min-h-0 flex-1">
              <div className="flex flex-col gap-5 px-6 py-5">
                <SectionPanel
                  id={current.id}
                  profile={profile}
                  setProfile={setProfile}
                  onSaveProfile={handleSaveProfile}
                  isSavingProfile={isSavingProfile}
                  saveFeedback={saveFeedback}
                  isLoadingProfile={isLoadingProfile}
                  dirtyFlags={dirtyFlags}
                />
              </div>
            </ScrollArea>
          </div>
        </SidebarProvider>
        {/* In-Dialog Unsaved Changes Overlay: subtle scrim without obscuring blur, perfectly legible */}
        {showDiscardConfirm && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/25 p-4 animate-in fade-in duration-100">
            <div className="w-full max-w-sm rounded-2xl border border-border/80 bg-background dark:bg-zinc-900 p-6 shadow-2xl flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <h3 className="text-base font-medium text-foreground">
                  Unsaved changes
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  You have unsaved edits in{" "}
                  {dirtyFlags.identity && dirtyFlags.targets ? (
                    <>
                      <Highlighter
                        action="underline"
                        color="#f43f5e"
                        strokeWidth={2}
                        animationDuration={600}
                        padding={1}
                        className="font-medium text-foreground"
                      >
                        Resume and identity
                      </Highlighter>
                      {" and "}
                      <Highlighter
                        action="underline"
                        color="#f43f5e"
                        strokeWidth={2}
                        animationDuration={600}
                        padding={1}
                        className="font-medium text-foreground"
                      >
                        Job targets and skills
                      </Highlighter>
                    </>
                  ) : dirtyFlags.identity ? (
                    <Highlighter
                      action="underline"
                      color="#f43f5e"
                      strokeWidth={2}
                      animationDuration={600}
                      padding={1}
                      className="font-medium text-foreground"
                    >
                      Resume and identity
                    </Highlighter>
                  ) : (
                    <Highlighter
                      action="underline"
                      color="#f43f5e"
                      strokeWidth={2}
                      animationDuration={600}
                      padding={1}
                      className="font-medium text-foreground"
                    >
                      Job targets and skills
                    </Highlighter>
                  )}
                  . Do you want to save your changes before leaving, or discard them?
                </p>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="ghost"
                  size="compact"
                  onClick={() => setShowDiscardConfirm(false)}
                  className="text-xs"
                >
                  Keep editing
                </Button>
                <Button
                  variant="secondary"
                  size="compact"
                  onClick={handleConfirmDiscard}
                  className="text-xs text-destructive hover:bg-destructive/10"
                >
                  Discard changes
                </Button>
                <Button
                  variant="primary"
                  size="compact"
                  onClick={handleSaveAndClose}
                  disabled={isSavingProfile}
                  className="text-xs px-3"
                >
                  {isSavingProfile ? "Saving..." : "Save and close"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// SettingRow: 13px label + 12px muted description on left, control on right.
// ---------------------------------------------------------------------------

const SWITCH_LABEL_HIDDEN = "[&>span:last-child]:sr-only";

function SettingRow({
  label,
  description,
  children,
  className,
}: {
  label: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-6 border-b border-border/60 py-3.5 last:border-b-0",
        className
      )}
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[length:var(--fs-body,13px)] leading-[var(--lh-body,20px)] text-foreground font-medium">
          {label}
        </span>
        {description && (
          <span className="text-[length:var(--fs-caption,12px)] leading-[var(--lh-caption,16px)] text-muted-foreground">
            {description}
          </span>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SettingsDropdown: Fluid Functionalism DropdownMenu pattern
// ---------------------------------------------------------------------------

interface DropdownItem {
  value: string;
  label: string;
}

function SettingsDropdown({
  value,
  onValueChange,
  options,
  placeholder = "Select...",
}: {
  value: string;
  onValueChange: (val: string) => void;
  options: DropdownItem[];
  placeholder?: string;
}) {
  const selectedItem = options.find((o) => o.value === value);
  const selectedLabel = selectedItem ? selectedItem.label : placeholder;
  const checkedIndex = options.findIndex((o) => o.value === value);

  return (
    <DropdownMenu>
      <DropdownTrigger
        render={
          <Button
            variant="ghost"
            size="compact"
            trailingIcon={ChevronDown}
            className="text-xs text-foreground font-normal hover:bg-secondary/40 h-8 px-2.5 border border-border/60 rounded-lg gap-1.5"
          >
            {selectedLabel}
          </Button>
        }
      />
      <DropdownContent
        align="end"
        checkedIndex={checkedIndex >= 0 ? checkedIndex : undefined}
        className="w-56"
      >
        {options.map((item, i) => (
          <MenuItem
            key={item.value}
            index={i}
            label={item.label}
            checked={value === item.value}
            onSelect={() => onValueChange(item.value)}
          />
        ))}
      </DropdownContent>
    </DropdownMenu>
  );
}

interface SectionPanelProps {
  id: string;
  profile: CandidateProfileData;
  setProfile: React.Dispatch<React.SetStateAction<CandidateProfileData>>;
  onSaveProfile: () => void;
  isSavingProfile: boolean;
  saveFeedback: string | null;
  isLoadingProfile: boolean;
  dirtyFlags: {
    fullName: boolean;
    headline: boolean;
    resumeText: boolean;
    githubUrl: boolean;
    linkedinUrl: boolean;
    portfolioUrl: boolean;
    skills: boolean;
    targetRoles: boolean;
    preferredLocations: boolean;
    identity: boolean;
    targets: boolean;
    any: boolean;
  };
}

function SectionPanel({
  id,
  profile,
  setProfile,
  onSaveProfile,
  isSavingProfile,
  saveFeedback,
  isLoadingProfile,
  dirtyFlags,
}: SectionPanelProps) {
  switch (id) {
    case "identity":
      return (
        <IdentityPanel
          profile={profile}
          setProfile={setProfile}
          onSave={onSaveProfile}
          isSaving={isSavingProfile}
          feedback={saveFeedback}
          isLoading={isLoadingProfile}
          dirtyFlags={dirtyFlags}
        />
      );
    case "targets":
      return (
        <TargetsPanel
          profile={profile}
          setProfile={setProfile}
          onSave={onSaveProfile}
          isSaving={isSavingProfile}
          feedback={saveFeedback}
          isLoading={isLoadingProfile}
          dirtyFlags={dirtyFlags}
        />
      );
    case "copilot":
      return <CopilotPanel />;
    case "api":
      return <ApiPanel />;
    case "database":
      return <DatabasePanel />;
    default:
      return <IngestionPanel />;
  }
}

// ─── 1. Identity & Resume Panel ──────────────────────────────────────────────

function IdentityPanel({
  profile,
  setProfile,
  dirtyFlags,
}: {
  profile: CandidateProfileData;
  setProfile: React.Dispatch<React.SetStateAction<CandidateProfileData>>;
  dirtyFlags: {
    fullName: boolean;
    headline: boolean;
    resumeText: boolean;
    githubUrl: boolean;
    linkedinUrl: boolean;
    portfolioUrl: boolean;
  };
  onSave?: () => void;
  isSaving?: boolean;
  feedback?: string | null;
  isLoading?: boolean;
}) {
  const [isParsing, setIsParsing] = React.useState(false);
  const [parseFeedback, setParseFeedback] = React.useState<{ text: string; error?: boolean } | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const applyParsedData = (data: {
    full_name?: string;
    headline?: string;
    resume_text?: string;
    github_url?: string | null;
    linkedin_url?: string | null;
    portfolio_url?: string | null;
    target_roles?: string[];
    skills?: string[];
    preferred_locations?: string[];
  }) => {
    setProfile((prev) => ({
      ...prev,
      full_name: data.full_name || prev.full_name,
      headline: data.headline || prev.headline,
      resume_text: data.resume_text || prev.resume_text,
      github_url: data.github_url !== undefined && data.github_url !== null ? data.github_url : prev.github_url,
      linkedin_url: data.linkedin_url !== undefined && data.linkedin_url !== null ? data.linkedin_url : prev.linkedin_url,
      portfolio_url: data.portfolio_url !== undefined && data.portfolio_url !== null ? data.portfolio_url : prev.portfolio_url,
      target_roles: Array.isArray(data.target_roles) && data.target_roles.length > 0 ? data.target_roles : prev.target_roles,
      skills: Array.isArray(data.skills) && data.skills.length > 0 ? data.skills : prev.skills,
      preferred_locations: Array.isArray(data.preferred_locations) && data.preferred_locations.length > 0 ? data.preferred_locations : prev.preferred_locations,
    }));
    const skillsCount = data.skills?.length ?? 0;
    const rolesCount = data.target_roles?.length ?? 0;
    setParseFeedback({
      text: `Auto-filled profile from resume! Extracted candidate name, headline, verified links, ${skillsCount} technical skills, and ${rolesCount} target engineering roles. Switch to "Job targets and skills" to review.`,
    });
  };

  const handleFileUpload = async (file: File) => {
    setIsParsing(true);
    setParseFeedback(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/profile/upload-resume", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        applyParsedData(data);
      } else {
        setParseFeedback({ text: data.error || "Failed to parse uploaded resume.", error: true });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setParseFeedback({ text: `Resume upload failed: ${msg}`, error: true });
    } finally {
      setIsParsing(false);
    }
  };

  const handleTextParse = async () => {
    if (!profile.resume_text?.trim()) return;
    setIsParsing(true);
    setParseFeedback(null);
    try {
      const res = await fetch("/api/profile/parse-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume_text: profile.resume_text }),
      });

      const data = await res.json();
      if (res.ok) {
        applyParsedData(data);
      } else {
        setParseFeedback({ text: data.error || "Failed to parse resume text.", error: true });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setParseFeedback({ text: `Resume text extraction failed: ${msg}`, error: true });
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Resume File Ingestion & Intelligent Auto-Fill Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleFileUpload(file);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "rounded-xl border border-dashed p-4 flex flex-col items-center justify-center text-center gap-2 cursor-pointer transition-all",
          isDragging
            ? "border-primary bg-primary/10 ring-2 ring-primary/20"
            : "border-border/80 hover:border-primary/60 bg-[rgb(var(--overlay,0_0_0)/0.02)] hover:bg-primary/5",
          isParsing && "pointer-events-none opacity-80"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.md"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file);
            e.target.value = "";
          }}
        />
        {isParsing ? (
          <div className="flex items-center gap-2 py-2 text-xs font-medium text-primary animate-pulse">
            <RefreshCw size={14} className="animate-spin" />
            <span>Parsing resume structure and extracting profile intelligence...</span>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 text-primary">
              <UploadCloud size={18} />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-medium text-foreground">
                Upload real resume (PDF, TXT, or Markdown)
              </span>
              <span className="text-[11px] text-muted-foreground">
                Drag and drop your file here, or click to browse
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground/80 bg-secondary/60 px-2 py-0.5 rounded-full">
              Auto-fills identity, social links, target engineering roles, and skills
            </span>
          </>
        )}
      </div>

      {/* 2. Extraction Feedback Banner */}
      {parseFeedback && (
        <div
          className={cn(
            "flex items-start gap-2.5 p-3 rounded-xl border text-xs leading-relaxed animate-in fade-in duration-150",
            parseFeedback.error
              ? "border-destructive/30 bg-destructive/10 text-destructive"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
          )}
        >
          {parseFeedback.error ? (
            <AlertTriangle size={15} className="shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 size={15} className="shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
          )}
          <span className="flex-1 font-medium">{parseFeedback.text}</span>
          <Button
            type="button"
            variant="ghost"
            size="compact"
            onClick={() => setParseFeedback(null)}
            className="h-5 w-5 p-0 -mr-1 -mt-0.5 text-inherit hover:bg-transparent opacity-70 hover:opacity-100"
          >
            <X size={12} />
          </Button>
        </div>
      )}

      {/* 3. Candidate Identity Fields */}
      <InputGroup className="w-full">
        <InputField
          index={0}
          label="Full name"
          placeholder="e.g. Alex Morgan"
          icon={User}
          value={profile.full_name}
          onChange={(v) => setProfile((p) => ({ ...p, full_name: v }))}
          uncommitted={dirtyFlags.fullName}
        />
        <InputField
          index={1}
          multiline={true}
          label="Professional headline"
          placeholder="e.g. AI / GenAI & Backend Systems Engineer"
          icon={Briefcase}
          value={profile.headline}
          onChange={(v) => setProfile((p) => ({ ...p, headline: v }))}
          uncommitted={dirtyFlags.headline}
        />
      </InputGroup>

      {/* 4. Resume Textarea with Quick Auto-Fill Action */}
      <div>
        <div className="flex items-center justify-between mb-1.5 px-1">
          <label className="block text-xs font-medium text-muted-foreground">
            Resume text and markdown
          </label>
          <Button
            type="button"
            variant="ghost"
            size="compact"
            onClick={handleTextParse}
            disabled={isParsing || !profile.resume_text?.trim()}
            className="h-6 px-2 text-[11px] gap-1 text-primary hover:text-primary hover:bg-primary/10 cursor-pointer"
            title="Auto-fill profile from current resume text"
          >
            <Sparkles size={12} />
            <span>Auto-fill from text</span>
          </Button>
        </div>
        <textarea
          rows={8}
          value={profile.resume_text}
          onChange={(e) => setProfile((p) => ({ ...p, resume_text: e.target.value }))}
          placeholder="e.g. Paste your resume markdown, engineering projects, metrics, and technical accomplishments..."
          className={cn(
            "w-full p-3 rounded-xl border bg-secondary/15 text-xs text-foreground placeholder:text-muted-foreground/45 placeholder:italic placeholder:select-none dark:placeholder:text-zinc-500/70 focus:outline-none font-mono leading-relaxed transition-colors",
            dirtyFlags.resumeText
              ? "border-rose-400/60 dark:border-rose-500/50 focus:border-rose-500"
              : "border-border/70 focus:border-primary"
          )}
        />
      </div>

      {/* 5. Verified Social & Portfolio Links */}
      <InputGroup className="w-full">
        <InputField
          index={0}
          label="GitHub profile link"
          placeholder="e.g. https://github.com/your-username"
          icon={GitHubLogoIcon}
          value={profile.github_url || ""}
          onChange={(v) => setProfile((p) => ({ ...p, github_url: v }))}
          uncommitted={dirtyFlags.githubUrl}
        />
        <InputField
          index={1}
          label="LinkedIn profile link"
          placeholder="e.g. https://linkedin.com/in/your-profile-name"
          icon={LinkedInLogoIcon}
          value={profile.linkedin_url || ""}
          onChange={(v) => setProfile((p) => ({ ...p, linkedin_url: v }))}
          uncommitted={dirtyFlags.linkedinUrl}
        />
        <InputField
          index={2}
          label="Portfolio or personal website"
          placeholder="e.g. https://yourportfolio.dev"
          icon={Code2}
          value={profile.portfolio_url || ""}
          onChange={(v) => setProfile((p) => ({ ...p, portfolio_url: v }))}
          uncommitted={dirtyFlags.portfolioUrl}
        />
      </InputGroup>
    </div>
  );
}

// ─── 2. Job Targets & Skills Panel (LinkedIn-Style Comboboxes) ───────────────────

const SKILLS_TAXONOMY = [
  "Python", "TypeScript", "JavaScript", "Go", "Rust", "C++", "Java", "SQL",
  "PyTorch", "TensorFlow", "LangChain", "LlamaIndex", "RAG", "Hugging Face",
  "Transformers", "vLLM", "Ollama", "OpenAI API", "Anthropic Claude",
  "Prompt Engineering", "Fine-tuning", "LoRA", "Agents", "LangGraph",
  "ChromaDB", "Qdrant", "Pinecone", "Milvus", "FAISS", "Weaviate", "Elasticsearch",
  "FastAPI", "Django", "Flask", "Node.js", "Express", "Next.js", "React", "GraphQL", "REST APIs",
  "PostgreSQL", "Redis", "MongoDB", "MySQL", "SQLite", "Supabase",
  "Docker", "Kubernetes", "AWS", "GCP", "Azure", "Linux", "Git", "CI/CD", "Celery", "Kafka"
];

const ROLES_TAXONOMY = [
  "AI Engineer", "Generative AI Engineer", "Agentic AI Engineer", "Machine Learning Engineer",
  "LLM Engineer", "MLOps Engineer", "Backend Engineer", "Senior Backend Engineer",
  "Full Stack Engineer", "Software Engineer", "Staff Software Engineer", "Data Engineer",
  "Data Scientist", "Platform Engineer", "Cloud Solutions Architect", "Founding Engineer"
];

const LOCATIONS_TAXONOMY = [
  "Remote", "Bengaluru", "Hyderabad", "Pune", "Mumbai", "Delhi NCR", "Gurgaon", "Noida",
  "Chennai", "Kolkata", "Ahmedabad", "San Francisco", "New York", "Seattle", "Austin", "London", "Singapore", "Berlin", "Hybrid"
];

function TargetsPanel({
  profile,
  setProfile,
  dirtyFlags,
}: {
  profile: CandidateProfileData;
  setProfile: React.Dispatch<React.SetStateAction<CandidateProfileData>>;
  dirtyFlags: {
    skills: boolean;
    targetRoles: boolean;
    preferredLocations: boolean;
  };
  onSave?: () => void;
  isSaving?: boolean;
  feedback?: string | null;
  isLoading?: boolean;
}) {
  const handleSkillsChange = (newSkills: string[]) => {
    setProfile((p) => ({
      ...p,
      skills: newSkills,
    }));
  };

  const handleRolesChange = (newRoles: string[]) => {
    setProfile((p) => ({
      ...p,
      target_roles: newRoles,
    }));
  };

  const handleLocationsChange = (newLocations: string[]) => {
    setProfile((p) => ({
      ...p,
      preferred_locations: newLocations,
    }));
  };

  return (
    <div className="space-y-4">
      {/* 1. Core Skills & Frameworks with LinkedIn-style typeahead combobox */}
      <TagCombobox
        label="Core skills and frameworks"
        icon={Code2}
        placeholder="Add skill..."
        items={profile.skills}
        onChange={handleSkillsChange}
        suggestions={SKILLS_TAXONOMY}
        uncommitted={dirtyFlags.skills}
        unitName="skills"
      />

      {/* 2. Target Engineering Roles */}
      <TagCombobox
        label="Target engineering roles"
        icon={Briefcase}
        placeholder="Add role..."
        items={profile.target_roles}
        onChange={handleRolesChange}
        suggestions={ROLES_TAXONOMY}
        uncommitted={dirtyFlags.targetRoles}
        unitName="roles"
      />

      {/* 3. Preferred Job Locations */}
      <TagCombobox
        label="Preferred job locations"
        icon={MapPin}
        placeholder="Add city / Remote..."
        items={profile.preferred_locations}
        onChange={handleLocationsChange}
        suggestions={LOCATIONS_TAXONOMY}
        uncommitted={dirtyFlags.preferredLocations}
        unitName="locations"
      />

    </div>
  );
}

// ─── Options & Constants ─────────────────────────────────────────────────────

const CADENCE_OPTIONS: DropdownItem[] = [
  { value: "1h", label: "Every 1 hour" },
  { value: "4h", label: "Every 4 hours" },
  { value: "8h", label: "Every 8 hours" },
  { value: "24h", label: "Once daily" },
];

const SOURCE_OPTIONS: DropdownItem[] = [
  { value: "all", label: "Indian tech matrix (all)" },
  { value: "greenhouse", label: "Direct Greenhouse" },
  { value: "ashby", label: "Direct Ashby HQ" },
  { value: "instahyre", label: "Instahyre India" },
  { value: "naukri", label: "Naukri India" },
];

const TONE_OPTIONS: DropdownItem[] = [
  { value: "eng-metrics", label: "Engineering-first and quantified" },
  { value: "concise", label: "Ultra-concise bullet points" },
  { value: "architecture", label: "Architectural depth and scale" },
];

const BULLET_OPTIONS: DropdownItem[] = [
  { value: "2", label: "2 bullets" },
  { value: "3", label: "3 bullets (recommended)" },
  { value: "4", label: "4 bullets" },
];


// ─── 3. Ingestion & Sourcing Panel ───────────────────────────────────────────

function IngestionPanel() {
  const [canonicalDedupe, setCanonicalDedupe] = React.useState(true);
  const [agencyFilter, setAgencyFilter] = React.useState(true);
  const [sweepCadence, setSweepCadence] = React.useState("4h");
  const [defaultSource, setDefaultSource] = React.useState("all");

  return (
    <div className="flex flex-col">
      <SettingRow
        label="Cross-platform deduplication"
        description="Fuzzy match titles, company domains, and location tokens to merge duplicate listings into a canonical posting."
      >
        <Switch
          className={SWITCH_LABEL_HIDDEN}
          label="Cross-platform deduplication"
          checked={canonicalDedupe}
          onToggle={() => setCanonicalDedupe((v) => !v)}
        />
      </SettingRow>

      <SettingRow
        label="Recruitment agency heuristics"
        description="Automatically flag third-party staffing firms and ghost recruiter postings."
      >
        <Switch
          className={SWITCH_LABEL_HIDDEN}
          label="Recruitment agency heuristics"
          checked={agencyFilter}
          onToggle={() => setAgencyFilter((v) => !v)}
        />
      </SettingRow>

      <SettingRow
        label="Autonomous sweep cadence"
        description="Background in-process scheduler interval for freshness and discovery."
      >
        <SettingsDropdown
          value={sweepCadence}
          onValueChange={setSweepCadence}
          options={CADENCE_OPTIONS}
          placeholder="Cadence"
        />
      </SettingRow>

      <SettingRow
        label="Default search channel"
        description="Primary sourcing channel when triggering manual ingestion runs."
      >
        <SettingsDropdown
          value={defaultSource}
          onValueChange={setDefaultSource}
          options={SOURCE_OPTIONS}
          placeholder="Channel"
        />
      </SettingRow>
    </div>
  );
}

// ─── 4. Application Copilot Panel ────────────────────────────────────────────

function CopilotPanel() {
  const [tone, setTone] = React.useState("eng-metrics");
  const [bulletCount, setBulletCount] = React.useState("3");
  const [includeGithub, setIncludeGithub] = React.useState(true);

  return (
    <div className="flex flex-col">
      <SettingRow
        label="Bullet point framing tone"
        description="Style used when generating tailored resume bullets and elevator pitch."
      >
        <SettingsDropdown
          value={tone}
          onValueChange={setTone}
          options={TONE_OPTIONS}
          placeholder="Tone"
        />
      </SettingRow>

      <SettingRow
        label="Target bullets per application"
        description="Recommended bullet point count generated in the application pack."
      >
        <SettingsDropdown
          value={bulletCount}
          onValueChange={setBulletCount}
          options={BULLET_OPTIONS}
          placeholder="Count"
        />
      </SettingRow>

      <SettingRow
        label="Include profile and GitHub links"
        description="Automatically append your verified links to generated outreach messages."
      >
        <Switch
          className={SWITCH_LABEL_HIDDEN}
          label="Include profile and GitHub links"
          checked={includeGithub}
          onToggle={() => setIncludeGithub((v) => !v)}
        />
      </SettingRow>
    </div>
  );
}

// ─── 4b. API Credentials & LLM Routing Panel ─────────────────────────────────

interface ApiProviderCredential {
  id: string;
  provider: string;
  description: string;
  is_enabled: boolean;
  has_key: boolean;
  masked_key: string | null;
  secondary_key: string | null;
  has_secondary_key: boolean;
  base_url: string | null;
  model_name: string | null;
  updated_at: string | null;
}

interface ModelOption {
  id: string;
  name: string;
  is_free: boolean;
}

const DEFAULT_PROVIDER_MODELS: Record<string, ModelOption[]> = {
  gemini: [
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", is_free: true },
    { id: "gemini-2.5-flash-lite", name: "Gemini 2.5 Flash Lite", is_free: true },
    { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", is_free: false },
    { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", is_free: true },
    { id: "gemini-2.0-flash-lite", name: "Gemini 2.0 Flash Lite", is_free: true },
  ],
  groq: [
    { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B Versatile", is_free: true },
    { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B Instant", is_free: true },
    { id: "deepseek-r1-distill-llama-70b", name: "DeepSeek R1 Distill Llama 70B", is_free: true },
    { id: "deepseek-r1-distill-qwen-32b", name: "DeepSeek R1 Distill Qwen 32B", is_free: true },
    { id: "qwen-2.5-32b", name: "Qwen 2.5 32B", is_free: true },
    { id: "llama-3.2-3b-preview", name: "Llama 3.2 3B Preview", is_free: true },
    { id: "llama-3.2-1b-preview", name: "Llama 3.2 1B Preview", is_free: true },
    { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B 32k", is_free: true },
    { id: "gemma2-9b-it", name: "Gemma 2 9B IT", is_free: true },
  ],
  openrouter: [
    { id: "deepseek/deepseek-chat:free", name: "DeepSeek V3 (Free)", is_free: true },
    { id: "deepseek/deepseek-r1:free", name: "DeepSeek R1 (Free)", is_free: true },
    { id: "meta-llama/llama-3.3-70b-instruct:free", name: "Llama 3.3 70B Instruct (Free)", is_free: true },
    { id: "google/gemini-2.0-flash-exp:free", name: "Gemini 2.0 Flash Exp (Free)", is_free: true },
    { id: "google/gemini-2.0-flash-thinking-exp:free", name: "Gemini 2.0 Thinking (Free)", is_free: true },
    { id: "qwen/qwen-2.5-72b-instruct:free", name: "Qwen 2.5 72B Instruct (Free)", is_free: true },
    { id: "mistralai/mistral-7b-instruct:free", name: "Mistral 7B Instruct (Free)", is_free: true },
    { id: "microsoft/phi-3-medium-128k-instruct:free", name: "Phi-3 Medium 128k (Free)", is_free: true },
    { id: "meta-llama/llama-3.2-3b-instruct:free", name: "Llama 3.2 3B (Free)", is_free: true },
    { id: "anthropic/claude-3.7-sonnet", name: "Claude 3.7 Sonnet", is_free: false },
    { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet", is_free: false },
    { id: "openai/gpt-4o", name: "GPT-4o", is_free: false },
    { id: "openai/gpt-4o-mini", name: "GPT-4o Mini", is_free: false },
    { id: "deepseek/deepseek-r1", name: "DeepSeek R1", is_free: false },
    { id: "deepseek/deepseek-chat", name: "DeepSeek V3", is_free: false },
  ],
  ollama: [
    { id: "llama3.3:70b", name: "Llama 3.3 70B (Local)", is_free: true },
    { id: "llama3.2:3b", name: "Llama 3.2 3B (Local)", is_free: true },
    { id: "llama3.2:1b", name: "Llama 3.2 1B (Local)", is_free: true },
    { id: "llama3.1:8b", name: "Llama 3.1 8B (Local)", is_free: true },
    { id: "deepseek-r1:8b", name: "DeepSeek R1 8B (Local)", is_free: true },
    { id: "deepseek-r1:14b", name: "DeepSeek R1 14B (Local)", is_free: true },
    { id: "mistral:7b", name: "Mistral 7B (Local)", is_free: true },
    { id: "qwen2.5:7b", name: "Qwen 2.5 7B (Local)", is_free: true },
    { id: "qwen2.5-coder:7b", name: "Qwen 2.5 Coder 7B (Local)", is_free: true },
    { id: "phi4:14b", name: "Phi-4 14B (Local)", is_free: true },
    { id: "phi3:mini", name: "Phi-3 Mini (Local)", is_free: true },
    { id: "gemma2:9b", name: "Gemma 2 9B (Local)", is_free: true },
  ],
};

function renderProviderLogo(id: string) {
  switch (id) {
    case "gemini":
      return <GeminiLogoIcon size={16} className="text-foreground" />;
    case "groq":
      return <GroqLogoIcon size={16} className="text-foreground" />;
    case "openrouter":
      return <OpenRouterLogoIcon size={16} className="text-foreground" />;
    case "ollama":
      return <OllamaLogoIcon size={16} className="text-foreground" />;
    default:
      return <HugeiconsIcon icon={Key01Icon} size={16} className="text-foreground" />;
  }
}

/** Skill-section style model dropdown with single typeahead search input and filled Free badges */
function ModelCombobox({
  providerId,
  value,
  onChange,
  models,
  isLoading,
  onRefresh,
}: {
  providerId: string;
  value: string;
  onChange: (model: string) => void;
  models: ModelOption[];
  isLoading?: boolean;
  onRefresh?: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [typedQuery, setTypedQuery] = React.useState("");
  const [isSearching, setIsSearching] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // When opening dropdown, show ALL models by default (never pre-filter down to just 1 model)
  const handleOpenDropdown = () => {
    setIsSearching(false);
    setTypedQuery("");
    setOpen(true);
    setTimeout(() => inputRef.current?.select(), 10);
  };

  // Filter models only when user actively types into the search box
  const filtered = React.useMemo(() => {
    if (!isSearching || !typedQuery.trim()) {
      return models;
    }
    const q = typedQuery.trim().toLowerCase();
    return models.filter(
      (m) => m.id.toLowerCase().includes(q) || m.name.toLowerCase().includes(q)
    );
  }, [models, typedQuery, isSearching]);

  const selectedModel = models.find((m) => m.id === value);
  const isSelectedFree = selectedModel?.is_free || (value && value.includes(":free"));

  const trimmedQuery = typedQuery.trim();
  const canCreateCustom =
    isSearching &&
    trimmedQuery !== "" &&
    !models.some((m) => m.id.toLowerCase() === trimmedQuery.toLowerCase());

  const handleSelect = (modelId: string) => {
    onChange(modelId);
    setIsSearching(false);
    setTypedQuery("");
    setOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTypedQuery(e.target.value);
    setIsSearching(true);
    if (!open) setOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (filtered.length > 0) {
        handleSelect(filtered[0].id);
      } else if (canCreateCustom) {
        handleSelect(trimmedQuery);
      }
    } else if (e.key === "ArrowDown" && !open) {
      e.preventDefault();
      handleOpenDropdown();
    } else if (e.key === "Escape") {
      setIsSearching(false);
      setTypedQuery("");
      setOpen(false);
    }
  };

  const handleClear = () => {
    setTypedQuery("");
    setIsSearching(false);
    inputRef.current?.focus();
  };

  const selectedIndex = filtered.findIndex((m) => m.id === value);
  const displayValue = isSearching ? typedQuery : (value || "");

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
          <span>Inference Model</span>
          {isLoading && <RefreshCw size={11} className="animate-spin text-muted-foreground" />}
        </label>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            title="Fetch available models"
            className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer transition-colors"
          >
            <RefreshCw size={10} className={cn(isLoading && "animate-spin")} />
            <span>Fetch models</span>
          </button>
        )}
      </div>

      <DropdownMenu open={open} onOpenChange={setOpen} className="relative w-full">
        {/* Single typeahead search bar matching skill section TagCombobox */}
        <div className="relative flex items-center w-full">
          <Search
            size={13}
            className="absolute left-3 text-muted-foreground pointer-events-none"
          />
          <input
            ref={inputRef}
            type="text"
            value={displayValue}
            onChange={handleInputChange}
            onClick={() => {
              if (!open) handleOpenDropdown();
            }}
            onFocus={() => {
              if (!open) handleOpenDropdown();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search or enter model (e.g. flash, 70b, free)..."
            className="h-9 w-full rounded-lg border border-border bg-background pl-8.5 pr-24 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40 font-mono transition-all shadow-2xs"
          />
          <div className="absolute right-2 flex items-center gap-1.5">
            {isSelectedFree && (
              <Badge
                variant="solid"
                color="emerald"
                size="compact"
                className="shrink-0 font-sans font-semibold text-emerald-800 dark:text-emerald-200 bg-emerald-500/20 dark:bg-emerald-500/25 border border-emerald-500/30"
              >
                Free
              </Badge>
            )}
            {open && isSearching ? (
              <button
                type="button"
                onClick={handleClear}
                className="flex h-4 w-4 items-center justify-center rounded text-muted-foreground hover:text-foreground cursor-pointer"
                title="Clear filter"
              >
                <X size={12} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (open) setOpen(false);
                  else handleOpenDropdown();
                }}
                className="flex h-4 w-4 items-center justify-center rounded text-muted-foreground hover:text-foreground cursor-pointer"
                title="Toggle model list"
              >
                <ChevronDown
                  size={13}
                  className={cn(
                    "transition-transform duration-150",
                    open && "rotate-180 text-foreground"
                  )}
                />
              </button>
            )}
          </div>
        </div>

        {/* Dropdown Content without nested search bar and without duplicate outer scrollbar */}
        <DropdownContent
          align="start"
          className="w-full min-w-full"
          checkedIndex={selectedIndex >= 0 ? selectedIndex : undefined}
        >
          {filtered.length === 0 && !canCreateCustom ? (
            <DropdownEmpty>
              {isLoading ? "Fetching live models..." : "No models found"}
            </DropdownEmpty>
          ) : (
            filtered.map((m, idx) => (
              <MenuItem
                key={m.id}
                index={idx}
                label={m.name && m.name !== m.id ? `${m.name} (${m.id})` : m.id}
                checked={value === m.id}
                onSelect={() => handleSelect(m.id)}
                badge={
                  m.is_free ? (
                    <Badge
                      variant="solid"
                      color="emerald"
                      size="compact"
                      className="font-semibold text-emerald-800 dark:text-emerald-200 bg-emerald-500/20 dark:bg-emerald-500/25 border border-emerald-500/30 font-sans"
                    >
                      Free
                    </Badge>
                  ) : undefined
                }
              />
            ))
          )}

          {canCreateCustom && (
            <MenuItem
              index={filtered.length}
              label={`Use custom: "${trimmedQuery}"`}
              onSelect={() => handleSelect(trimmedQuery)}
            />
          )}
        </DropdownContent>
      </DropdownMenu>
    </div>
  );
}

function ApiPanel() {
  const [providers, setProviders] = React.useState<ApiProviderCredential[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [drafts, setDrafts] = React.useState<Record<string, { apiKey?: string; secondaryKey?: string; modelName?: string; baseUrl?: string }>>({});
  const [showKey, setShowKey] = React.useState<Record<string, boolean>>({});
  const [testingId, setTestingId] = React.useState<string | null>(null);
  const [testResults, setTestResults] = React.useState<Record<string, { success: boolean; message: string; latency_ms?: number }>>({});
  const [savingId, setSavingId] = React.useState<string | null>(null);
  const [saveFeedback, setSaveFeedback] = React.useState<Record<string, { text: string; error?: boolean }>>({});
  const [providerModels, setProviderModels] = React.useState<Record<string, ModelOption[]>>(DEFAULT_PROVIDER_MODELS);
  const [fetchingModels, setFetchingModels] = React.useState<Record<string, boolean>>({});

  const fetchModelsForProvider = React.useCallback(async (providerId: string, key?: string, url?: string) => {
    if (providerId === "logo_dev") return;
    setFetchingModels((prev) => ({ ...prev, [providerId]: true }));
    try {
      const res = await fetch(`/api/settings/api-keys/models/${providerId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: key, base_url: url }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setProviderModels((prev) => ({ ...prev, [providerId]: data }));
        }
      }
    } catch (err) {
      console.warn(`Could not load models for ${providerId}`, err);
    } finally {
      setFetchingModels((prev) => ({ ...prev, [providerId]: false }));
    }
  }, []);

  const fetchProviders = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/settings/api-keys");
      if (res.ok) {
        const data: ApiProviderCredential[] = await res.json();
        setProviders(data);
        // Preload models for configured providers
        data.forEach((p) => {
          if (p.id !== "logo_dev") {
            fetchModelsForProvider(p.id, p.masked_key || undefined, p.base_url || undefined);
          }
        });
      }
    } catch (err) {
      console.error("Failed to load API keys", err);
    } finally {
      setIsLoading(false);
    }
  }, [fetchModelsForProvider]);

  React.useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const handleToggle = async (id: string, isEnabled: boolean) => {
    setProviders((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_enabled: isEnabled } : p))
    );
    try {
      await fetch(`/api/settings/api-keys/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_enabled: isEnabled }),
      });
    } catch {
      setProviders((prev) =>
        prev.map((p) => (p.id === id ? { ...p, is_enabled: !isEnabled } : p))
      );
    }
  };

  const handleDraftChange = (id: string, field: "apiKey" | "secondaryKey" | "modelName" | "baseUrl", value: string) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));

    // When user types or pastes an API key, automatically fetch live models
    if (field === "apiKey" && value.length >= 6 && !value.includes("••••")) {
      fetchModelsForProvider(id, value);
    }
    if (field === "baseUrl" && value.startsWith("http")) {
      fetchModelsForProvider(id, undefined, value);
    }
  };

  const handleSave = async (id: string) => {
    setSavingId(id);
    setSaveFeedback((prev) => ({ ...prev, [id]: { text: "" } }));
    const draft = drafts[id] || {};
    const body: Record<string, unknown> = {};

    if (draft.apiKey !== undefined) body.api_key = draft.apiKey;
    if (draft.secondaryKey !== undefined) body.secondary_key = draft.secondaryKey;
    if (draft.modelName !== undefined) body.model_name = draft.modelName;
    if (draft.baseUrl !== undefined) body.base_url = draft.baseUrl;

    try {
      const res = await fetch(`/api/settings/api-keys/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setProviders((prev) => prev.map((p) => (p.id === id ? data : p)));
        setSaveFeedback((prev) => ({ ...prev, [id]: { text: "Saved successfully" } }));
        setDrafts((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        // Re-fetch models using newly saved key
        fetchModelsForProvider(id, data.masked_key || undefined, data.base_url || undefined);
      } else {
        setSaveFeedback((prev) => ({ ...prev, [id]: { text: data.error || "Save failed", error: true } }));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSaveFeedback((prev) => ({ ...prev, [id]: { text: msg, error: true } }));
    } finally {
      setSavingId(null);
      setTimeout(() => {
        setSaveFeedback((prev) => ({ ...prev, [id]: { text: "" } }));
      }, 3000);
    }
  };

  const handleTest = async (id: string) => {
    setTestingId(id);
    const draft = drafts[id] || {};
    const body: Record<string, unknown> = {};
    if (draft.apiKey) body.api_key = draft.apiKey;
    if (draft.modelName) body.model_name = draft.modelName;
    if (draft.baseUrl) body.base_url = draft.baseUrl;

    try {
      const res = await fetch(`/api/settings/api-keys/test/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setTestResults((prev) => ({ ...prev, [id]: data }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setTestResults((prev) => ({ ...prev, [id]: { success: false, message: msg } }));
    } finally {
      setTestingId(null);
    }
  };

  const handleClearKey = async (id: string) => {
    handleDraftChange(id, "apiKey", "");
    await handleSave(id);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Provider List */}
      {providers.map((p) => {
        const draft = drafts[p.id] || {};
        const isTesting = testingId === p.id;
        const isSaving = savingId === p.id;
        const testRes = testResults[p.id];
        const feedback = saveFeedback[p.id];
        const isRevealed = showKey[p.id] ?? false;
        const currentModel = draft.modelName !== undefined ? draft.modelName : p.model_name || "";
        const isOllama = p.id === "ollama";
        const isDirty = draft.apiKey !== undefined || draft.modelName !== undefined || draft.baseUrl !== undefined;

        return (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring.moderate}
            className={cn(
              "rounded-xl border p-4 sm:p-5 flex flex-col gap-4 transition-colors",
              p.is_enabled
                ? "border-border/80 bg-background/50 shadow-xs"
                : "border-border/40 bg-muted/20 opacity-80"
            )}
          >
            {/* Card Header with Monochrome Brand Logo */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg shrink-0 border transition-colors",
                    p.is_enabled
                      ? "bg-foreground/5 border-border/80 text-foreground"
                      : "bg-muted/30 border-border/40 text-muted-foreground/60"
                  )}
                >
                  {renderProviderLogo(p.id)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4
                      className="text-sm font-semibold text-foreground truncate"
                      style={{ fontVariationSettings: fontWeights.semibold }}
                    >
                      {p.provider}
                    </h4>
                    {p.is_enabled ? (
                      p.has_key || (isOllama && p.base_url) ? (
                        <Badge color="emerald" variant="dot" size="compact">Active</Badge>
                      ) : (
                        <Badge color="amber" variant="dot" size="compact">Key Required</Badge>
                      )
                    ) : (
                      <Badge color="gray" variant="dot" size="compact">Disabled</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{p.description}</p>
                </div>
              </div>

              {/* On / Off Toggle */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-medium text-muted-foreground hidden sm:inline">
                  {p.is_enabled ? "ON" : "OFF"}
                </span>
                <Switch
                  className={SWITCH_LABEL_HIDDEN}
                  label={`Toggle ${p.provider}`}
                  checked={p.is_enabled}
                  onToggle={() => handleToggle(p.id, !p.is_enabled)}
                  size="compact"
                />
              </div>
            </div>

            {/* Card Inputs */}
            <div className="grid grid-cols-1 gap-3.5 pt-1">
              {/* API Key field (for non-Ollama) */}
              {!isOllama && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                      <HugeiconsIcon icon={Key01Icon} size={14} className="text-muted-foreground" />
                      <span>API Key</span>
                    </label>
                    {p.has_key && draft.apiKey === undefined && (
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                        ✓ Key securely stored
                      </span>
                    )}
                  </div>

                  <div className="relative flex items-center">
                    <input
                      type={isRevealed ? "text" : "password"}
                      value={draft.apiKey !== undefined ? draft.apiKey : (p.masked_key || "")}
                      onChange={(e) => handleDraftChange(p.id, "apiKey", e.target.value)}
                      placeholder={p.has_key ? "Enter new key to replace..." : "Paste API key here..."}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 pr-20 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                    />
                    <div className="absolute right-1.5 flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="compact"
                        onClick={() => setShowKey((prev) => ({ ...prev, [p.id]: !isRevealed }))}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
                        title={isRevealed ? "Hide key" : "Show key"}
                      >
                        {isRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                      </Button>
                      {p.has_key && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="compact"
                          onClick={() => handleClearKey(p.id)}
                          className="h-7 px-1.5 text-[10px] text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Base URL (for Ollama) */}
              {isOllama && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <OllamaLogoIcon size={14} className="text-muted-foreground" />
                    <span>Ollama Host URL</span>
                  </label>
                  <input
                    type="text"
                    value={draft.baseUrl !== undefined ? draft.baseUrl : (p.base_url || "http://localhost:11434")}
                    onChange={(e) => handleDraftChange(p.id, "baseUrl", e.target.value)}
                    placeholder="http://localhost:11434"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  />
                </div>
              )}

              {/* Skill-section style model dropdown with Free badges and search */}
              <ModelCombobox
                providerId={p.id}
                value={currentModel}
                onChange={(newModel) => handleDraftChange(p.id, "modelName", newModel)}
                models={providerModels[p.id] || DEFAULT_PROVIDER_MODELS[p.id] || []}
                isLoading={fetchingModels[p.id]}
                onRefresh={() => fetchModelsForProvider(p.id, draft.apiKey || p.masked_key || undefined, draft.baseUrl || p.base_url || undefined)}
              />
            </div>

            {/* Card Footer Actions & Feedback */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-border/40 min-w-0">
              <div className="flex items-center gap-2 min-w-0 max-w-full overflow-hidden">
                <Button
                  type="button"
                  variant="ghost"
                  size="compact"
                  onClick={() => handleTest(p.id)}
                  disabled={isTesting}
                  className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
                >
                  <RefreshCw size={12} className={cn(isTesting && "animate-spin")} />
                  <span>{isTesting ? "Testing..." : "Test Connection"}</span>
                </Button>

                {testRes && (
                  <span
                    title={testRes.message}
                    className={cn(
                      "text-[11.5px] font-medium truncate max-w-[200px] sm:max-w-[280px]",
                      testRes.success ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                    )}
                  >
                    {testRes.success ? `✓ ${testRes.message}` : `✕ ${testRes.message}`}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                {feedback?.text && (
                  <span
                    className={cn(
                      "text-xs font-medium truncate max-w-[140px]",
                      feedback.error ? "text-rose-600" : "text-emerald-600 dark:text-emerald-400"
                    )}
                  >
                    {feedback.text}
                  </span>
                )}
                <Button
                  type="button"
                  variant="secondary"
                  size="compact"
                  onClick={() => handleSave(p.id)}
                  disabled={isSaving || !isDirty}
                  className="h-7 text-xs cursor-pointer shrink-0"
                >
                  {isSaving ? "Saving..." : isDirty ? "Save Provider" : "Saved ✓"}
                </Button>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── 5. Database & Maintenance Control Panel ────────────────────────────────

interface MaintenanceStats {
  database_size_bytes: number;
  database_size_mb: number;
  total_jobs: number;
  eligible_jobs: number;
  review_jobs: number;
  rejected_jobs: number;
  expired_jobs: number;
  applied_jobs: number;
  total_companies: number;
  total_raw_jobs: number;
  total_runs: number;
  logos_cached_count: number;
  freshness_cutoff_days: number;
}

function DatabasePanel() {
  const [stats, setStats] = React.useState<MaintenanceStats | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [activeAction, setActiveAction] = React.useState<string | null>(null);
  const [feedback, setFeedback] = React.useState<{ text: string; error?: boolean } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = React.useState(false);

  const fetchStats = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/maintenance");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleAction = async (action: string, successDefault: string) => {
    setActiveAction(action);
    setFeedback(null);
    try {
      const res = await fetch("/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({ text: data.message || successDefault });
        await fetchStats();
      } else {
        setFeedback({ text: data.error || "Action failed.", error: true });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFeedback({ text: `Maintenance operation failed: ${msg}`, error: true });
    } finally {
      setActiveAction(null);
      if (action === "reset-jobs") {
        setShowResetConfirm(false);
      }
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* 1. Database Footprint & Telemetry Card */}
      <div className="rounded-xl border border-border/80 bg-[rgb(var(--overlay,0_0_0)/0.02)] p-4 flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive size={15} className="text-primary" />
            <span
              className="text-xs font-semibold text-foreground"
              style={{ fontVariationSettings: fontWeights.semibold }}
            >
              Storage telemetry and footprint
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="compact"
            onClick={fetchStats}
            disabled={isLoading}
            className="h-6 px-2 text-[11px] gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
            title="Refresh database metrics"
          >
            <RefreshCw size={12} className={cn(isLoading && "animate-spin")} />
            <span>Refresh</span>
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
          <span
            className="text-2xl text-foreground font-semibold tracking-tight"
            style={{ fontVariationSettings: fontWeights.semibold }}
          >
            {stats ? `${stats.database_size_mb} MB` : "—"}
          </span>
          <span className="text-xs text-muted-foreground">
            Local SQLite database (ai_job_intelligence.db)
          </span>
        </div>

        {/* Telemetry Chips Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-border/50 text-xs">
          <div className="flex flex-col gap-0.5 p-2 rounded-lg bg-background/50 border border-border/40">
            <span className="text-[11px] text-muted-foreground">Total indexed</span>
            <span className="font-semibold text-foreground text-sm">
              {stats?.total_jobs ?? 0}
            </span>
          </div>

          <div className="flex flex-col gap-0.5 p-2 rounded-lg bg-background/50 border border-border/40">
            <span className="text-[11px] text-muted-foreground">Review ready</span>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-foreground text-sm">
                {stats?.review_jobs ?? 0}
              </span>
              <Badge variant="solid" color="blue" size="compact" className="text-[10px] py-0 px-1">
                active
              </Badge>
            </div>
          </div>

          <div className="flex flex-col gap-0.5 p-2 rounded-lg bg-background/50 border border-border/40">
            <span className="text-[11px] text-muted-foreground">Filtered / Rejected</span>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-foreground text-sm">
                {stats?.rejected_jobs ?? 0}
              </span>
              <Badge variant="solid" color="gray" size="compact" className="text-[10px] py-0 px-1">
                stale
              </Badge>
            </div>
          </div>

          <div className="flex flex-col gap-0.5 p-2 rounded-lg bg-background/50 border border-border/40">
            <span className="text-[11px] text-muted-foreground">Expired (&gt;5d)</span>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-foreground text-sm">
                {stats?.expired_jobs ?? 0}
              </span>
              <Badge variant="solid" color="amber" size="compact" className="text-[10px] py-0 px-1">
                old
              </Badge>
            </div>
          </div>

          <div className="flex flex-col gap-0.5 p-2 rounded-lg bg-background/50 border border-border/40">
            <span className="text-[11px] text-muted-foreground">Applied</span>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-foreground text-sm">
                {stats?.applied_jobs ?? 0}
              </span>
              <Badge variant="solid" color="emerald" size="compact" className="text-[10px] py-0 px-1">
                sent
              </Badge>
            </div>
          </div>

          <div className="flex flex-col gap-0.5 p-2 rounded-lg bg-background/50 border border-border/40">
            <span className="text-[11px] text-muted-foreground">Employers</span>
            <span className="font-semibold text-foreground text-sm">
              {stats?.total_companies ?? 0}
            </span>
          </div>

          <div className="flex flex-col gap-0.5 p-2 rounded-lg bg-background/50 border border-border/40">
            <span className="text-[11px] text-muted-foreground">Raw payloads</span>
            <span className="font-semibold text-foreground text-sm">
              {stats?.total_raw_jobs ?? 0}
            </span>
          </div>

          <div className="flex flex-col gap-0.5 p-2 rounded-lg bg-background/50 border border-border/40">
            <span className="text-[11px] text-muted-foreground">Cached logos</span>
            <span className="font-semibold text-foreground text-sm">
              {stats?.logos_cached_count ?? 0}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Inline Operation Feedback Banner */}
      {feedback && (
        <div
          className={cn(
            "flex items-start gap-2.5 p-3 rounded-xl border text-xs leading-relaxed animate-in fade-in duration-150",
            feedback.error
              ? "border-destructive/30 bg-destructive/10 text-destructive"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
          )}
        >
          {feedback.error ? (
            <AlertTriangle size={15} className="shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 size={15} className="shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
          )}
          <span className="flex-1 font-medium">{feedback.text}</span>
          <Button
            type="button"
            variant="ghost"
            size="compact"
            onClick={() => setFeedback(null)}
            className="h-5 w-5 p-0 -mr-1 -mt-0.5 text-inherit hover:bg-transparent opacity-70 hover:opacity-100"
          >
            <X size={12} />
          </Button>
        </div>
      )}

      {/* 3. Operational Utilities & Hygiene Actions */}
      <div className="flex flex-col">
        {/* 5-day freshness rule archival */}
        <SettingRow
          label="5-day freshness rule archival"
          description="V1 Frozen Rule: Flags unapplied postings older than 120 hours as EXPIRED to protect application energy."
        >
          <Button
            variant="secondary"
            size="compact"
            disabled={activeAction !== null}
            onClick={() => handleAction("archive-expired", "Archived expired jobs older than 5 days.")}
            className="text-xs h-8 px-3 cursor-pointer gap-1.5"
          >
            {activeAction === "archive-expired" ? (
              <>
                <RefreshCw size={12} className="animate-spin" />
                <span>Archiving...</span>
              </>
            ) : (
              <>
                <Archive size={13} />
                <span>Run archival</span>
              </>
            )}
          </Button>
        </SettingRow>

        {/* Prune rejected job records */}
        <SettingRow
          label="Purge rejected postings"
          description={`Permanently deletes unapplied rejected listings and cascades to reclaim database capacity.`}
        >
          <Button
            variant="secondary"
            size="compact"
            disabled={activeAction !== null || (stats?.rejected_jobs ?? 0) === 0}
            onClick={() => handleAction("prune-rejected", "Pruned rejected postings.")}
            className="text-xs h-8 px-3 cursor-pointer gap-1.5"
          >
            {activeAction === "prune-rejected" ? (
              <>
                <RefreshCw size={12} className="animate-spin" />
                <span>Pruning...</span>
              </>
            ) : (
              <>
                <Trash2 size={13} />
                <span>Prune rejected</span>
              </>
            )}
          </Button>
        </SettingRow>

        {/* SQLite VACUUM defragmentation */}
        <SettingRow
          label="SQLite VACUUM defragmentation"
          description="Reclaims unallocated disk pages and compacts the local ai_job_intelligence.db file."
        >
          <Button
            variant="secondary"
            size="compact"
            disabled={activeAction !== null}
            onClick={() => handleAction("vacuum", "Database compacted successfully.")}
            className="text-xs h-8 px-3 cursor-pointer gap-1.5"
          >
            {activeAction === "vacuum" ? (
              <>
                <RefreshCw size={12} className="animate-spin" />
                <span>Compacting...</span>
              </>
            ) : (
              <>
                <Sparkles size={13} />
                <span>Run VACUUM</span>
              </>
            )}
          </Button>
        </SettingRow>

        {/* Curated employer re-synchronization */}
        <SettingRow
          label="Re-enrich employer entities"
          description={`Matches companies against the curated Indian tech directory to resolve official websites and profiles.`}
        >
          <Button
            variant="secondary"
            size="compact"
            disabled={activeAction !== null}
            onClick={() => handleAction("remediate-entities", "Employer directory re-synchronized.")}
            className="text-xs h-8 px-3 cursor-pointer gap-1.5"
          >
            {activeAction === "remediate-entities" ? (
              <>
                <RefreshCw size={12} className="animate-spin" />
                <span>Re-syncing...</span>
              </>
            ) : (
              <>
                <RefreshCw size={13} />
                <span>Re-sync entities</span>
              </>
            )}
          </Button>
        </SettingRow>

        {/* Purge logo cache */}
        <SettingRow
          label="Clear cached employer logos"
          description={`Flushes disk cache in data/logos so fresh logos re-resolve via our internal logo service.`}
        >
          <Button
            variant="secondary"
            size="compact"
            disabled={activeAction !== null || (stats?.logos_cached_count ?? 0) === 0}
            onClick={() => handleAction("purge-logos", "Purged cached logos.")}
            className="text-xs h-8 px-3 cursor-pointer gap-1.5"
          >
            {activeAction === "purge-logos" ? (
              <>
                <RefreshCw size={12} className="animate-spin" />
                <span>Purging...</span>
              </>
            ) : (
              <>
                <Trash2 size={13} />
                <span>Purge logos</span>
              </>
            )}
          </Button>
        </SettingRow>
      </div>

      {/* 4. Danger Zone: Safe Harvest Database Wipe */}
      <div className="rounded-xl border border-destructive/25 bg-destructive/5 p-4 flex flex-col gap-3 mt-1">
        <div className="flex items-center gap-2">
          <AlertTriangle size={15} className="text-destructive shrink-0" />
          <span
            className="text-xs font-semibold text-foreground"
            style={{ fontVariationSettings: fontWeights.semibold }}
          >
            Danger zone: Harvest database wipe
          </span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Wipes all harvested job postings, raw payloads, and scraping collection runs.{" "}
          <strong className="text-foreground font-medium">
            Your candidate profile, resume markdown, and target skills are completely safe and preserved.
          </strong>
        </p>

        {!showResetConfirm ? (
          <div>
            <Button
              type="button"
              variant="secondary"
              size="compact"
              onClick={() => setShowResetConfirm(true)}
              className="text-xs text-destructive hover:bg-destructive/10 border-destructive/30 h-8 px-3 cursor-pointer"
            >
              Reset harvested jobs
            </Button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border border-destructive/40 bg-background/80">
            <span className="text-xs font-medium text-destructive">
              Are you sure? This cannot be undone.
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="compact"
                onClick={() => setShowResetConfirm(false)}
                className="text-xs h-7 px-2.5 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="compact"
                disabled={activeAction !== null}
                onClick={() => handleAction("reset-jobs", "Harvested jobs reset successfully.")}
                className="text-xs h-7 px-3 bg-destructive hover:bg-destructive/90 text-destructive-foreground cursor-pointer"
              >
                {activeAction === "reset-jobs" ? "Resetting..." : "Confirm reset"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

