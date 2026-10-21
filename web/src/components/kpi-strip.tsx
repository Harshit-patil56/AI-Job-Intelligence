"use client";

import * as React from "react";
import { motion } from "motion/react";
import { AnimateIcon } from "@animate-ui/react/icons";
import { LayoutDashboard } from "@/components/animate-ui/icons/hugeicons/layout-dashboard";
import { Bot } from "@/components/animate-ui/icons/hugeicons/bot";
import { ComputerTerminal01 } from "@/components/animate-ui/icons/hugeicons/computer-terminal-01";
import { ShieldCheck } from "@/components/animate-ui/icons/hugeicons/shield-check";
import { TriangleAlert } from "@/components/animate-ui/icons/hugeicons/triangle-alert";
import { useFluidHover, useRegisterFluidHoverItem } from "@/hooks/use-fluid-hover";
import { FluidHoverHighlight } from "@/components/fluid-hover-highlight";
import { fontWeights } from "@/lib/font-weight";
import { spring } from "@/lib/springs";

interface KPIStripProps {
  totalCount: number;
  p1Count: number;
  p2Count: number;
  verifiedCount: number;
  reviewCount: number;
  activePriority: string | null;
  onSelectPriority: (priority: string | null) => void;
}

interface KPICardData {
  id: string | null;
  label: string;
  value: number;
  subtext: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  active: boolean;
}

function KPICardItem({
  card,
  index,
  registerItem,
  isSelected,
  onSelect,
}: {
  card: KPICardData;
  index: number;
  registerItem: ReturnType<typeof useFluidHover>["registerItem"];
  isSelected: boolean;
  onSelect: () => void;
}) {
  const cardRef = React.useRef<HTMLButtonElement>(null);
  useRegisterFluidHoverItem(registerItem, index, cardRef);
  const IconComponent = card.icon;

  return (
    <AnimateIcon animateOnHover asChild>
      <button
        ref={cardRef}
        type="button"
        data-fluid-hover-index={index}
        onClick={onSelect}
        className={`group/kpi relative flex flex-col justify-between rounded-xl border p-2.5 sm:p-4 text-left transition-colors duration-100 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0 min-w-[125px] sm:min-w-0 flex-1 ${
          isSelected
            ? "border-[#B5D6F8] bg-[#EBF4FD] shadow-xs dark:border-[#1E3F66] dark:bg-[#13263E]"
            : "border-border bg-card/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-neutral-300 hover:bg-card dark:border-[#30363D] dark:bg-[#24292E] dark:hover:border-[#484F58]"
        }`}
      >
        {/* Fluid Functionalism Active Surface Indicator - smooth gliding LinkedIn blueish selection surface */}
        {isSelected && (
          <motion.div
            layoutId="kpi-active-indicator"
            className="pointer-events-none absolute inset-0 z-0 rounded-xl bg-[#EBF4FD] border border-[#B5D6F8] shadow-xs dark:bg-[#13263E] dark:border-[#1E3F66]"
            transition={spring.moderate}
          />
        )}

        {/* Top row: Label with Ghost-Span Weight Animation & Cleanly Colored Animated Icon */}
        <div className="relative z-20 flex items-center justify-between gap-1.5 sm:gap-2">
          <span className="inline-grid text-[11px] sm:text-xs">
            <span
              className={`col-start-1 row-start-1 transition-[color,font-variation-settings] duration-80 truncate ${
                isSelected
                  ? "font-semibold text-foreground"
                  : "font-normal text-muted-foreground group-hover/kpi:text-foreground"
              }`}
              style={{
                fontVariationSettings: isSelected
                  ? fontWeights.semibold
                  : fontWeights.normal,
              }}
            >
              {card.label}
            </span>
            <span
              className="invisible col-start-1 row-start-1 select-none"
              style={{ fontVariationSettings: fontWeights.semibold }}
              aria-hidden="true"
            >
              {card.label}
            </span>
          </span>

          {/* Icon only has color - no background box and no border */}
          <div
            className={`flex h-5 w-5 sm:h-6 sm:w-6 shrink-0 items-center justify-center ${card.color} transition-transform duration-100 group-hover/kpi:scale-110`}
          >
            <IconComponent size={16} />
          </div>
        </div>

        {/* Bottom row: Crisp Tabular Metric Number & Descriptor */}
        <div className="relative z-20 mt-1.5 sm:mt-3">
          <span className="text-xl sm:text-3xl font-extrabold tracking-tight text-foreground tabular-nums">
            {card.value.toLocaleString()}
          </span>
          <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-[11px] font-medium text-muted-foreground truncate">
            {card.subtext}
          </p>
        </div>
      </button>
    </AnimateIcon>
  );
}

export function KPIStrip({
  totalCount,
  p1Count,
  p2Count,
  verifiedCount,
  reviewCount,
  activePriority,
  onSelectPriority,
}: KPIStripProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const hover = useFluidHover(containerRef, { axis: "xy", gapClick: true });

  const cards: KPICardData[] = [
    {
      id: null,
      label: "Total Tracked",
      value: totalCount,
      subtext: "Canonical deduplicated",
      icon: LayoutDashboard,
      color: "text-blue-500 dark:text-blue-400",
      active: activePriority === null,
    },
    {
      id: "P1",
      label: "P1 • GenAI & LLM",
      value: p1Count,
      subtext: "Agents, RAG & Fine-tuning",
      icon: Bot,
      color: "text-purple-500 dark:text-purple-400",
      active: activePriority === "P1",
    },
    {
      id: "P2",
      label: "P2 • Core Backend / ML",
      value: p2Count,
      subtext: "Distributed & ML Infra",
      icon: ComputerTerminal01,
      color: "text-sky-500 dark:text-sky-400",
      active: activePriority === "P2",
    },
    {
      id: "VERIFIED",
      label: "Direct ATS Verified",
      value: verifiedCount,
      subtext: "Greenhouse / Ashby / Lever",
      icon: ShieldCheck,
      color: "text-emerald-500 dark:text-emerald-400",
      active: activePriority === "VERIFIED",
    },
    {
      id: "REVIEW",
      label: "Audit Queue",
      value: reviewCount,
      subtext: "Heuristics confirmation",
      icon: TriangleAlert,
      color: "text-amber-500 dark:text-amber-400",
      active: activePriority === "REVIEW",
    },
  ];

  return (
    <div
      ref={containerRef}
      {...hover.handlers}
      className="relative flex w-full max-w-full overflow-x-auto gap-2 pb-1.5 px-0.5 sm:grid sm:grid-cols-3 lg:grid-cols-5 no-scrollbar scrollbar-none touch-pan-x"
    >
      {/* 2-D Fluid Hover Highlight that glides between cards */}
      <FluidHoverHighlight
        hover={hover}
        className="pointer-events-none z-10 rounded-xl bg-hover shadow-2xs"
      />

      {cards.map((card, i) => (
        <KPICardItem
          key={card.label}
          card={card}
          index={i}
          registerItem={hover.registerItem}
          isSelected={card.active}
          onSelect={() => onSelectPriority(card.id)}
        />
      ))}
    </div>
  );
}
