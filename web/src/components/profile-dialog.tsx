"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserCircleIcon,
  CheckmarkCircle01Icon,
  File01Icon,
  Briefcase01Icon,
  Location01Icon,
  FloppyDiskIcon,
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
import { fontWeights } from "@/lib/font-weight";
import { TagCombobox } from "@/components/ui/tag-combobox";
import { Code2, Briefcase, MapPin } from "lucide-react";

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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

export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
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

  const [activeTab, setActiveTab] = React.useState<"resume" | "preferences">("resume");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isSaved, setIsSaved] = React.useState(false);

  // Fetch candidate profile on open
  const fetchProfile = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile({
          full_name: data.full_name || "Tanmay",
          headline: data.headline || "",
          target_roles: data.target_roles || [],
          preferred_locations: data.preferred_locations || [],
          skills: data.skills || [],
          resume_text: data.resume_text || "",
          portfolio_url: data.portfolio_url || "",
          github_url: data.github_url || "",
          linkedin_url: data.linkedin_url || "",
        });
      }
    } catch {
      // Keep baseline defaults
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (open) {
      fetchProfile();
    }
  }, [open, fetchProfile]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (res.ok) {
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2200);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={true}
        size="lg"
        className="bg-white dark:bg-[#24292E] border border-[#E0DFDC] dark:border-[#30363D] max-h-[85vh] h-[78vh] flex flex-col p-0 overflow-hidden rounded-xl sm:rounded-2xl"
      >
        {/* Fixed Header */}
        <div className="px-5 py-3.5 sm:px-7 sm:py-4 border-b border-border shrink-0 bg-white dark:bg-[#24292E] pr-12 sm:pr-14">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <HugeiconsIcon icon={UserCircleIcon} size={18} strokeWidth={2} />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
                  Candidate Profile & Copilot Persona
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Your resume text and skills customize the Application Copilot bullet points and outreach messages.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Fluid Tab Switcher with Ghost-Span pattern (zero layout shift) */}
          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border/60">
            <button
              type="button"
              onClick={() => setActiveTab("resume")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                activeTab === "resume"
                  ? "bg-[#E8F3FF] text-[#0A66C2] dark:bg-[#70B5F9]/15 dark:text-[#70B5F9]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <HugeiconsIcon icon={File01Icon} size={14} />
              <span className="inline-grid">
                <span
                  className="col-start-1 row-start-1 transition-[color,font-variation-settings] duration-80"
                  style={{ fontVariationSettings: activeTab === "resume" ? fontWeights.bold : fontWeights.semibold }}
                >
                  Resume Text & Markdown
                </span>
                <span aria-hidden="true" className="col-start-1 row-start-1 invisible" style={{ fontVariationSettings: fontWeights.bold }}>
                  Resume Text & Markdown
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("preferences")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                activeTab === "preferences"
                  ? "bg-[#E8F3FF] text-[#0A66C2] dark:bg-[#70B5F9]/15 dark:text-[#70B5F9]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <HugeiconsIcon icon={Briefcase01Icon} size={14} />
              <span className="inline-grid">
                <span
                  className="col-start-1 row-start-1 transition-[color,font-variation-settings] duration-80"
                  style={{ fontVariationSettings: activeTab === "preferences" ? fontWeights.bold : fontWeights.semibold }}
                >
                  Target Roles & Skills
                </span>
                <span aria-hidden="true" className="col-start-1 row-start-1 invisible" style={{ fontVariationSettings: fontWeights.bold }}>
                  Target Roles & Skills
                </span>
              </span>
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <ScrollArea className="flex-1 p-5 sm:p-7 overflow-y-auto">
          {activeTab === "resume" ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Full Name</label>
                  <input
                    type="text"
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    className="w-full h-8 sm:h-9 px-3 rounded-lg border border-border bg-secondary/30 text-xs text-foreground focus:border-primary focus:outline-none"
                    placeholder="e.g. Tanmay"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Professional Headline</label>
                  <input
                    type="text"
                    value={profile.headline}
                    onChange={(e) => setProfile({ ...profile, headline: e.target.value })}
                    className="w-full h-8 sm:h-9 px-3 rounded-lg border border-border bg-secondary/30 text-xs text-foreground focus:border-primary focus:outline-none"
                    placeholder="e.g. AI / GenAI & Backend Engineer"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-foreground">
                    Resume Text / Markdown (Projects, Experience & Background)
                  </label>
                  <span className="text-[11px] text-muted-foreground">
                    Copilot extracts metrics & projects from here
                  </span>
                </div>
                <textarea
                  rows={10}
                  value={profile.resume_text}
                  onChange={(e) => setProfile({ ...profile, resume_text: e.target.value })}
                  placeholder="Paste your resume markdown, bullet points, past projects, and technology achievements..."
                  className="w-full p-3 rounded-lg border border-border bg-secondary/20 text-xs text-foreground focus:border-primary focus:outline-none font-mono leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">GitHub Profile URL</label>
                  <input
                    type="text"
                    value={profile.github_url || ""}
                    onChange={(e) => setProfile({ ...profile, github_url: e.target.value })}
                    className="w-full h-8 sm:h-9 px-3 rounded-lg border border-border bg-secondary/30 text-xs text-foreground focus:border-primary focus:outline-none"
                    placeholder="https://github.com/..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">LinkedIn Profile URL</label>
                  <input
                    type="text"
                    value={profile.linkedin_url || ""}
                    onChange={(e) => setProfile({ ...profile, linkedin_url: e.target.value })}
                    className="w-full h-8 sm:h-9 px-3 rounded-lg border border-border bg-secondary/30 text-xs text-foreground focus:border-primary focus:outline-none"
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <TagCombobox
                label="Core Skills & Frameworks"
                icon={Code2}
                placeholder="Add skill..."
                items={profile.skills}
                onChange={(skills) => setProfile({ ...profile, skills })}
                suggestions={[
                  "Python", "TypeScript", "JavaScript", "Go", "Rust", "C++", "Java", "SQL",
                  "PyTorch", "TensorFlow", "LangChain", "LlamaIndex", "RAG", "Hugging Face",
                  "Transformers", "vLLM", "Ollama", "FastAPI", "Django", "Next.js", "React",
                  "PostgreSQL", "Redis", "MongoDB", "Docker", "Kubernetes", "AWS"
                ]}
                unitName="skills"
              />

              <TagCombobox
                label="Target Roles"
                icon={Briefcase}
                placeholder="Add role..."
                items={profile.target_roles}
                onChange={(target_roles) => setProfile({ ...profile, target_roles })}
                suggestions={[
                  "AI Engineer", "Generative AI Engineer", "Agentic AI Engineer", "Machine Learning Engineer",
                  "LLM Engineer", "MLOps Engineer", "Backend Engineer", "Senior Backend Engineer",
                  "Full Stack Engineer", "Software Engineer", "Staff Software Engineer"
                ]}
                unitName="roles"
              />

              <TagCombobox
                label="Preferred Job Locations"
                icon={MapPin}
                placeholder="Add city / Remote..."
                items={profile.preferred_locations}
                onChange={(preferred_locations) => setProfile({ ...profile, preferred_locations })}
                suggestions={[
                  "Remote", "Bengaluru", "Hyderabad", "Pune", "Mumbai", "Delhi NCR", "Gurgaon", "Noida",
                  "Chennai", "San Francisco", "New York", "London", "Hybrid"
                ]}
                unitName="locations"
              />
            </div>
          )}
        </ScrollArea>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 sm:px-7 sm:py-4 border-t border-border flex items-center justify-between bg-white dark:bg-[#24292E] shrink-0">
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            {isSaved && (
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold animate-in fade-in">
                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} />
                Profile & Resume Saved!
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="compact" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button
              variant="primary"
              size="compact"
              disabled={isSaving}
              onClick={handleSave}
              className="px-4 text-xs"
            >
              <HugeiconsIcon icon={FloppyDiskIcon} size={14} className="sm:hidden" />
              <span>{isSaving ? "Saving..." : "Save Profile"}</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
