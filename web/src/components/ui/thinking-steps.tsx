"use client";

import {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
  useContext,
  createContext,
  forwardRef,
  type ReactNode,
  type HTMLAttributes,
} from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { useIcons } from "@/lib/icon-context";
import { spring } from "@/lib/springs";
import { fontWeights } from "@/lib/font-weight";
import { useShape } from "@/lib/shape-context";
import { SizeProvider, useSize, typeClass, type SizeVariant } from "@/lib/size-context";
import { Badge } from "@/components/ui/badge";

// SSR-safe layout effect
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/** Open state of the nearest ThinkingSteps root */
const ThinkingStepsOpenContext = createContext(true);

interface TriggerRowProps extends HTMLAttributes<HTMLButtonElement> {
  open: boolean;
  children: ReactNode;
}

/**
 * Trigger row: hover background, dual-layer variable-weight label, and a
 * chevron that rotates from right (closed) to down (open).
 */
const TriggerRow = forwardRef<HTMLButtonElement, TriggerRowProps>(
  ({ open, children, className, onClick, ...props }, ref) => {
    const icons = useIcons();
    const ChevronRight = icons["chevron-right"];
    const shape = useShape();
    const sizeClasses = useSize();
    const [isHovered, setIsHovered] = useState(false);
    const highlighted = open || isHovered;

    return (
      <div
        className="relative w-full"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <AnimatePresence>
          {isHovered && (
            <motion.div
              className={`absolute inset-0 ${shape.bg} bg-hover pointer-events-none rounded-lg`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: spring.fast.exit }}
              transition={{ duration: 0.08 }}
            />
          )}
        </AnimatePresence>
        <button
          type="button"
          ref={ref}
          onClick={onClick}
          className={cn(
            `relative z-10 flex w-full items-center justify-between gap-2.5 ${shape.item} px-2 py-1.5 cursor-pointer outline-none select-none rounded-lg`,
            "focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)] focus-visible:ring-offset-0",
            className
          )}
          {...props}
        >
          {/* Label with dual-layer text (invisible bold layer reserves width) */}
          <span className={cn("inline-grid text-left", sizeClasses.text)}>
            <span
              className="col-start-1 row-start-1 invisible"
              style={{ fontVariationSettings: fontWeights.semibold }}
              aria-hidden="true"
            >
              {children}
            </span>
            <span
              className={cn(
                "col-start-1 row-start-1 transition-[color,font-variation-settings] duration-80",
                highlighted ? "text-foreground" : "text-muted-foreground"
              )}
              style={{
                fontVariationSettings: open ? fontWeights.semibold : fontWeights.normal,
              }}
            >
              {children}
            </span>
          </span>

          {/* Chevron — right when collapsed, rotates 90° down when expanded */}
          <motion.span
            className="shrink-0 inline-flex items-center justify-center text-muted-foreground"
            animate={{ rotate: open ? 90 : 0 }}
            transition={spring.fast}
          >
            <ChevronRight
              size={sizeClasses.icon}
              strokeWidth={highlighted ? 2 : 1.5}
              className={cn(
                "transition-[color,stroke-width] duration-80",
                highlighted ? "text-foreground" : "text-muted-foreground"
              )}
            />
          </motion.span>
        </button>
      </div>
    );
  }
);
TriggerRow.displayName = "ThinkingStepsTriggerRow";

interface CollapsePanelProps {
  open: boolean;
  children: ReactNode;
}

/**
 * Collapsible panel with measured layout pixel target and bounce: 0 spring.
 */
function CollapsePanel({ open, children }: CollapsePanelProps) {
  const compactStep = useSize().variant === "compact";
  const innerRef = useRef<HTMLDivElement | null>(null);
  const roRef = useRef<ResizeObserver | null>(null);
  const [contentHeight, setContentHeight] = useState<number | null>(null);
  const [needsSnap, setNeedsSnap] = useState(open);

  const measureRef = useCallback((el: HTMLDivElement | null) => {
    roRef.current?.disconnect();
    roRef.current = null;
    innerRef.current = el;
    if (!el) return;
    if (el.offsetHeight > 0) setContentHeight(el.offsetHeight);
    const ro = new ResizeObserver(() => {
      if (el.offsetHeight > 0) setContentHeight(el.offsetHeight);
    });
    ro.observe(el);
    roRef.current = ro;
  }, []);

  useIsoLayoutEffect(() => {
    if (open && innerRef.current && innerRef.current.offsetHeight > 0) {
      setContentHeight(innerRef.current.offsetHeight);
    }
  }, [open]);

  useEffect(() => {
    if (!needsSnap || contentHeight === null) return;
    const frame = requestAnimationFrame(() => setNeedsSnap(false));
    return () => cancelAnimationFrame(frame);
  }, [needsSnap, contentHeight]);

  const [exitComplete, setExitComplete] = useState(!open);
  if (open && exitComplete) {
    setExitComplete(false);
  }

  return (
    <div hidden={!open && exitComplete}>
      <motion.div
        className="overflow-hidden"
        initial={{ height: open ? "auto" : 0 }}
        animate={{ height: open ? contentHeight ?? "auto" : 0 }}
        transition={
          needsSnap ? { duration: 0 } : { ...spring.moderate, bounce: 0 }
        }
        onAnimationComplete={() => {
          if (!open) setExitComplete(true);
        }}
      >
        <div
          ref={measureRef}
          className={cn(
            "px-1 pb-2 pt-1 text-muted-foreground",
            typeClass("body", compactStep ? "compact" : "default")
          )}
        >
          {children}
        </div>
      </motion.div>
    </div>
  );
}

// ─── ThinkingSteps (Root) ───────────────────────────────────────────────────

interface ThinkingStepsProps extends HTMLAttributes<HTMLDivElement> {
  size?: SizeVariant;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

const ThinkingSteps = forwardRef<HTMLDivElement, ThinkingStepsProps>(
  ({ size, defaultOpen = true, open, onOpenChange, children, className, ...props }, ref) => {
    const [internalOpen, setInternalOpen] = useState(defaultOpen);
    const isOpen = open ?? internalOpen;

    const handleToggle = () => {
      const next = !isOpen;
      if (open === undefined) setInternalOpen(next);
      onOpenChange?.(next);
    };

    const root = (
      <div
        ref={ref}
        className={cn("w-full max-w-full space-y-1", className)}
        {...props}
      >
        <ThinkingStepsOpenContext.Provider value={isOpen}>
          {typeof children === "function" ? (children as any)(handleToggle) : children}
        </ThinkingStepsOpenContext.Provider>
      </div>
    );

    return size ? <SizeProvider size={size}>{root}</SizeProvider> : root;
  }
);
ThinkingSteps.displayName = "ThinkingSteps";

// ─── ThinkingStepsHeader ────────────────────────────────────────────────────

interface ThinkingStepsHeaderProps extends HTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  onToggle?: () => void;
}

const ThinkingStepsHeader = forwardRef<HTMLButtonElement, ThinkingStepsHeaderProps>(
  ({ children = "Execution Chain", className, onToggle, ...props }, ref) => {
    const isOpen = useContext(ThinkingStepsOpenContext);
    return (
      <TriggerRow ref={ref} open={isOpen} onClick={onToggle} className={className} {...props}>
        {children}
      </TriggerRow>
    );
  }
);
ThinkingStepsHeader.displayName = "ThinkingStepsHeader";

// ─── ThinkingStepsContent ───────────────────────────────────────────────────

interface ThinkingStepsContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

const ThinkingStepsContent = forwardRef<HTMLDivElement, ThinkingStepsContentProps>(
  ({ children, className, ...props }, ref) => {
    const isOpen = useContext(ThinkingStepsOpenContext);
    return (
      <CollapsePanel open={isOpen}>
        <div ref={ref} className={cn("flex flex-col space-y-0.5", className)} {...props}>
          {children}
        </div>
      </CollapsePanel>
    );
  }
);
ThinkingStepsContent.displayName = "ThinkingStepsContent";

// ─── ThinkingStep ───────────────────────────────────────────────────────────

export type StepStatus = "complete" | "active" | "pending" | "failed";

interface ThinkingStepProps {
  icon?: string;
  iconNode?: ReactNode;
  showIcon?: boolean;
  label: string;
  description?: string;
  status?: StepStatus;
  delay?: number;
  isLast?: boolean;
  children?: ReactNode;
  className?: string;
}

function useStepHeight() {
  const roRef = useRef<ResizeObserver | null>(null);
  const [height, setHeight] = useState<number | null>(null);
  const ref = useCallback((el: HTMLDivElement | null) => {
    roRef.current?.disconnect();
    roRef.current = null;
    if (!el) return;
    const sync = () => {
      if (el.offsetHeight > 0) setHeight(el.offsetHeight);
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    roRef.current = ro;
  }, []);
  return [ref, height] as const;
}

function ThinkingStep({
  icon = "dot",
  iconNode,
  showIcon = true,
  label,
  description,
  status = "complete",
  delay = 0.05,
  isLast = false,
  children,
  className,
}: ThinkingStepProps) {
  const icons = useIcons();
  const IconComponent = icons[icon as keyof typeof icons] || icons["dot"];
  const shape = useShape();
  const sizeClasses = useSize();
  const [stepRef, stepHeight] = useStepHeight();

  const isActive = status === "active";
  const isComplete = status === "complete";
  const isFailed = status === "failed";
  const isPending = status === "pending";

  return (
    <motion.div
      className={cn("relative z-10 overflow-hidden", className)}
      initial={{ height: 0 }}
      animate={{ height: stepHeight ?? "auto" }}
      transition={spring.slow}
    >
      <motion.div
        ref={stepRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay, ease: "easeOut" }}
      >
        <div className={cn("flex gap-2.5 px-2 py-1.5 items-start", shape.item)}>
          {/* Continuous vertical connector column */}
          <div className="flex flex-col items-center shrink-0 w-4 self-stretch pt-0.5">
            <div className="flex items-center justify-center size-4 shrink-0">
              {iconNode ? (
                iconNode
              ) : isComplete ? (
                <div className="size-3.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <svg className="size-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              ) : isFailed ? (
                <div className="size-3.5 rounded-full bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center">
                  <span className="text-[10px] font-bold">!</span>
                </div>
              ) : isActive ? (
                <div className="size-3.5 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                  <div className="size-1.5 rounded-full bg-primary animate-pulse" />
                </div>
              ) : (
                <div className="size-3 rounded-full border border-border/80 bg-muted/40" />
              )}
            </div>
            {!isLast && (
              <div
                className={cn(
                  "w-px flex-1 mt-1 transition-colors duration-200 min-h-[14px]",
                  isComplete ? "bg-emerald-500/30" : isActive ? "bg-primary/40" : "bg-border/60"
                )}
              />
            )}
          </div>

          {/* Label, Description & Nested Content */}
          <div className="flex-1 flex flex-col gap-0.5 min-w-0">
            <div className="flex items-center justify-between gap-2 min-w-0">
              <span
                className={cn(
                  sizeClasses.type.body,
                  "text-xs leading-snug truncate",
                  isActive && "shimmer-text font-semibold",
                  isComplete && "text-foreground font-medium",
                  isFailed && "text-red-600 dark:text-red-400 font-semibold",
                  isPending && "text-muted-foreground/60"
                )}
                style={{ fontVariationSettings: fontWeights.semibold }}
              >
                {label}
                {isActive && "…"}
              </span>
            </div>

            {description && (
              <span
                className={cn(
                  "text-[11px] leading-relaxed",
                  isPending ? "text-muted-foreground/40" : "text-muted-foreground"
                )}
              >
                {description}
              </span>
            )}

            {children}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── ThinkingStepSources ────────────────────────────────────────────────────

interface ThinkingStepSourcesProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

const ThinkingStepSources = forwardRef<HTMLDivElement, ThinkingStepSourcesProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex flex-wrap gap-1.5 mt-1 items-center", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
ThinkingStepSources.displayName = "ThinkingStepSources";

// ─── ThinkingStepSource ─────────────────────────────────────────────────────

interface ThinkingStepSourceProps {
  color?: "gray" | "blue" | "emerald" | "violet" | "amber" | "red";
  delay?: number;
  children: ReactNode;
  className?: string;
}

function ThinkingStepSource({ color = "gray", delay = 0, children, className }: ThinkingStepSourceProps) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.88, filter: "blur(3px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      transition={{
        ...spring.moderate,
        delay,
        filter: { duration: 0.12, delay },
      }}
    >
      <Badge variant="solid" size="compact" color={color} className={className}>
        {children}
      </Badge>
    </motion.span>
  );
}
ThinkingStepSource.displayName = "ThinkingStepSource";

// ─── Exports ────────────────────────────────────────────────────────────────

export {
  ThinkingSteps,
  ThinkingStepsHeader,
  ThinkingStepsContent,
  ThinkingStep,
  ThinkingStepSources,
  ThinkingStepSource,
};
