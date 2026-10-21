"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick02Icon } from "@hugeicons/core-free-icons";
import { spring } from "@/lib/springs";
import { cn } from "@/lib/utils";

const SHOWN = { opacity: 1, scale: 1, filter: "blur(0px)" };
const HIDDEN = { opacity: 0, scale: 0.6, filter: "blur(4px)" };
const enter = { type: "tween" as const, duration: spring.fast.duration, ease: "easeOut" as const };
const leave = { type: "tween" as const, ...spring.fast.exit, ease: "easeIn" as const };

interface FluidActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
  label: string;
  activeLabel?: string;
  isActive?: boolean;
  size?: "default" | "compact";
}

/**
 * Action button adhering to Fluid Functionalism motion principles:
 * - Strictly horizontal flex layout with zero text wrapping.
 * - Blurred spring crossfade between resting and active glyphs (icon swap pattern).
 * - Kinetic press feedback with spring physics.
 * - Native token palette with harmonious light and dark surfaces.
 */
export function FluidActionButton({
  icon,
  activeIcon,
  label,
  activeLabel = "Copied",
  isActive = false,
  size = "compact",
  className,
  onClick,
  ...props
}: FluidActionButtonProps) {
  const iconSize = size === "compact" ? 14 : 16;
  const heightClass = size === "compact" ? "h-7 px-2.5 text-xs" : "h-9 px-3.5 text-sm";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative inline-flex flex-row items-center justify-center gap-1.5 whitespace-nowrap rounded-md font-medium select-none cursor-pointer",
        "border transition-[background-color,border-color,color,box-shadow,transform] duration-120 [transition-timing-function:var(--ease-out,cubic-bezier(0.16,1,0.3,1))]",
        "active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        heightClass,
        isActive
          ? "border-emerald-500/30 bg-emerald-50/80 text-emerald-700 dark:border-emerald-600/40 dark:bg-emerald-950/40 dark:text-emerald-400 font-semibold shadow-xs"
          : "border-border/70 bg-white/80 text-muted-foreground hover:bg-muted/70 hover:text-foreground hover:border-border dark:border-[#30363D] dark:bg-[#24292E]/80 dark:text-[#8B949E] dark:hover:bg-[#2F363D] dark:hover:text-[#F0F6FC]",
        className
      )}
      {...props}
    >
      {/* Icon Swap Container with Blur Crossfade */}
      <span className="grid size-4 shrink-0 place-items-center">
        <motion.span
          className="col-start-1 row-start-1 flex items-center justify-center"
          initial={false}
          animate={isActive ? HIDDEN : SHOWN}
          transition={isActive ? leave : enter}
        >
          {icon}
        </motion.span>
        <motion.span
          className="col-start-1 row-start-1 flex items-center justify-center text-emerald-600 dark:text-emerald-400"
          initial={false}
          animate={isActive ? SHOWN : HIDDEN}
          transition={isActive ? enter : leave}
        >
          {activeIcon ?? <HugeiconsIcon icon={Tick02Icon} size={iconSize} strokeWidth={2.5} />}
        </motion.span>
      </span>

      {/* Label with Weight Transition */}
      <span className="inline-grid select-none">
        <motion.span
          key={isActive ? "active" : "resting"}
          initial={{ opacity: 0, y: 1 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -1 }}
          transition={{ duration: 0.12 }}
          className="col-start-1 row-start-1 leading-none"
        >
          {isActive ? activeLabel : label}
        </motion.span>
      </span>
    </button>
  );
}
