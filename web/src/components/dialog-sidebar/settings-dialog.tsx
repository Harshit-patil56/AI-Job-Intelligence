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
  MenuItem,
} from "@/components/ui/dropdown";
import { InputGroup, InputField } from "@/components/ui/input-group";
import { Badge } from "@/components/ui/badge";
import { Highlighter } from "@/components/ui/highlighter";
import { ChevronDown, User, Briefcase, Link, Globe, Code2, MapPin, X } from "lucide-react";
import { TagCombobox } from "@/components/ui/tag-combobox";
import { useIcons, type IconName } from "@/lib/icon-context";
import { cn } from "@/lib/utils";
import { fontWeights } from "@/lib/font-weight";

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
    id: "appearance",
    label: "Appearance and density",
    group: "Workspace",
    icon: "palette",
    description: "Theme contrast, row spacing, and typographic density.",
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
    full_name: "Tanmay",
    headline: "AI / GenAI & Backend Engineer",
    target_roles: ["AI Engineer", "Generative AI Engineer", "Backend Engineer", "Software Engineer"],
    preferred_locations: ["Bengaluru", "Hyderabad", "Pune", "Mumbai", "Remote"],
    skills: ["Python", "FastAPI", "PyTorch", "LangChain", "RAG", "Docker", "TypeScript", "Next.js"],
    resume_text: "",
    github_url: "",
    linkedin_url: "",
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
          full_name: data.full_name ?? "Tanmay",
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
    const skills = JSON.stringify(profile.skills) !== JSON.stringify(savedProfile.skills);
    const targetRoles = JSON.stringify(profile.target_roles) !== JSON.stringify(savedProfile.target_roles);
    const preferredLocations = JSON.stringify(profile.preferred_locations) !== JSON.stringify(savedProfile.preferred_locations);

    const identity = fullName || headline || resumeText || githubUrl || linkedinUrl;
    const targets = skills || targetRoles || preferredLocations;
    const any = identity || targets;

    return {
      fullName,
      headline,
      resumeText,
      githubUrl,
      linkedinUrl,
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
    case "appearance":
      return <AppearancePanel />;
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
  };
  onSave?: () => void;
  isSaving?: boolean;
  feedback?: string | null;
  isLoading?: boolean;
}) {
  return (
    <div className="space-y-4">
      <InputGroup className="w-full">
        <InputField
          index={0}
          label="Full name"
          placeholder="e.g. Tanmay"
          icon={User}
          value={profile.full_name}
          onChange={(v) => setProfile((p) => ({ ...p, full_name: v }))}
          uncommitted={dirtyFlags.fullName}
        />
        <InputField
          index={1}
          multiline={true}
          label="Professional headline"
          placeholder="e.g. AI / GenAI & Backend Engineer"
          icon={Briefcase}
          value={profile.headline}
          onChange={(v) => setProfile((p) => ({ ...p, headline: v }))}
          uncommitted={dirtyFlags.headline}
        />
      </InputGroup>

      <div>
        <div className="flex items-center justify-between mb-1.5 px-2.5">
          <label className="block text-xs font-medium text-muted-foreground">
            Resume text and markdown
          </label>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-[11px] text-muted-foreground">
              Copilot references this content to personalize bullets
            </span>
          </div>
        </div>
        <textarea
          rows={8}
          value={profile.resume_text}
          onChange={(e) => setProfile((p) => ({ ...p, resume_text: e.target.value }))}
          placeholder="Paste your resume markdown, engineering projects, metrics, and technical accomplishments..."
          className={cn(
            "w-full p-3 rounded-xl border bg-secondary/15 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none font-mono leading-relaxed transition-colors",
            dirtyFlags.resumeText
              ? "border-rose-400/60 dark:border-rose-500/50 focus:border-rose-500"
              : "border-border/70 focus:border-primary"
          )}
        />
      </div>

      <InputGroup className="w-full">
        <InputField
          index={0}
          label="GitHub profile link"
          placeholder="https://github.com/..."
          icon={Link}
          value={profile.github_url || ""}
          onChange={(v) => setProfile((p) => ({ ...p, github_url: v }))}
          uncommitted={dirtyFlags.githubUrl}
        />
        <InputField
          index={1}
          label="LinkedIn profile link"
          placeholder="https://linkedin.com/in/..."
          icon={Globe}
          value={profile.linkedin_url || ""}
          onChange={(v) => setProfile((p) => ({ ...p, linkedin_url: v }))}
          uncommitted={dirtyFlags.linkedinUrl}
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

const THEME_OPTIONS: DropdownItem[] = [
  { value: "system", label: "System default" },
  { value: "light", label: "Light theme" },
  { value: "dark", label: "Dark theme" },
];

const DENSITY_OPTIONS: DropdownItem[] = [
  { value: "default", label: "Default (36px controls)" },
  { value: "compact", label: "Compact (28px controls)" },
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

// ─── 5. Appearance Panel ─────────────────────────────────────────────────────

function AppearancePanel() {
  const [theme, setTheme] = React.useState("system");
  const [density, setDensity] = React.useState("default");

  return (
    <div className="flex flex-col">
      <SettingRow
        label="Theme palette"
        description="Select light theme or dark theme."
      >
        <SettingsDropdown
          value={theme}
          onValueChange={setTheme}
          options={THEME_OPTIONS}
          placeholder="Theme"
        />
      </SettingRow>

      <SettingRow
        label="Interface density"
        description="Control height and row spacing across job cards and tables."
      >
        <SettingsDropdown
          value={density}
          onValueChange={setDensity}
          options={DENSITY_OPTIONS}
          placeholder="Density"
        />
      </SettingRow>

      <SettingRow
        label="Font optical sizing"
        description="Inter Variable font with active opsz axis for zero-shift weight adjustments."
      >
        <span className="text-xs text-muted-foreground font-mono bg-secondary/50 px-2 py-1 rounded">
          opsz: 14-32 enabled
        </span>
      </SettingRow>
    </div>
  );
}
