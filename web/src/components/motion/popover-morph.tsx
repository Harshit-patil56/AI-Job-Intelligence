"use client";

import {
  AnimatePresence,
  motion,
  animate,
  useMotionValue,
  usePresence,
  useReducedMotion,
} from "motion/react";
import {
  cloneElement,
  createContext,
  isValidElement,
  type ReactElement,
  type ReactNode,
  type Ref,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { usePopoverPortalPosition } from "@/components/motion/popover-position";
import { EASE_OUT, SPRING_PANEL } from "@/lib/ease";
import { cn } from "@/lib/utils";

type Side = "top" | "bottom";
type Align = "start" | "end";

type MorphContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  triggerId: string;
  contentId: string;
  triggerRef: React.MutableRefObject<HTMLElement | null>;
  registerTrigger: (node: HTMLElement | null) => void;
  contentRef: React.MutableRefObject<HTMLDivElement | null>;
};

const MorphContext = createContext<MorphContextValue | null>(null);

function useMorphContext(component: string) {
  const ctx = useContext(MorphContext);
  if (!ctx) throw new Error(`${component} must be used within <MorphPopover>`);
  return ctx;
}

export interface MorphPopoverProps {
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

/**
 * A popover whose panel morphs open from the trigger corner: it's laid out at
 * full size but clipped to the corner nearest the trigger, then unclips as one
 * piece. Closes on outside pointer / Escape.
 */
export function MorphPopover({
  children,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  className,
}: MorphPopoverProps) {
  const baseId = useId();
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const [trigger, setTrigger] = useState<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const controlled = controlledOpen !== undefined;
  const open = controlled ? controlledOpen : internalOpen;

  const setOpen = useCallback(
    (next: boolean) => {
      if (!controlled) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [controlled, onOpenChange],
  );
  const toggle = useCallback(() => setOpen(!open), [setOpen, open]);

  const anchorRef = useMemo<React.MutableRefObject<HTMLElement | null>>(
    () => ({ current: trigger ?? root }),
    [root, trigger],
  );

  const close = useCallback(() => {
    setOpen(false);
    const focused = document.activeElement;
    const inPanel =
      focused instanceof HTMLElement && contentRef.current?.contains(focused);
    if (!inPanel) return;
    const restore = trigger ?? (root && root.tabIndex >= 0 ? root : null);
    restore?.focus();
  }, [root, setOpen, trigger]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node;
      if (
        root &&
        !root.contains(target) &&
        !contentRef.current?.contains(target)
      )
        close();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [open, root, close]);

  const ctx = useMemo<MorphContextValue>(
    () => ({
      open,
      setOpen,
      toggle,
      triggerId: `${baseId}-trigger`,
      contentId: `${baseId}-content`,
      triggerRef: anchorRef,
      registerTrigger: setTrigger,
      contentRef,
    }),
    [open, setOpen, toggle, baseId, anchorRef],
  );

  return (
    <MorphContext.Provider value={ctx}>
      <div ref={setRoot} className={cn("relative inline-flex", className)}>
        {children}
      </div>
    </MorphContext.Provider>
  );
}

export interface MorphPopoverTriggerProps {
  children: ReactElement;
}

function mergeRefs<T>(...refs: Array<Ref<T> | undefined>) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(node);
      else if (ref && typeof ref === "object")
        (ref as React.MutableRefObject<T | null>).current = node;
    }
  };
}

export function MorphPopoverTrigger({ children }: MorphPopoverTriggerProps) {
  const ctx = useMorphContext("MorphPopoverTrigger");
  const child = children as ReactElement<Record<string, unknown>>;
  const childOnClick = child?.props?.onClick as
    | ((e: unknown) => void)
    | undefined;
  const childRef = (child?.props as { ref?: Ref<HTMLElement> } | undefined)
    ?.ref;
  const mergedRef = useMemo(
    () => mergeRefs(childRef, ctx.registerTrigger),
    [childRef, ctx.registerTrigger],
  );
  if (!isValidElement(children)) return children;

  return cloneElement(child, {
    id: ctx.triggerId,
    ref: mergedRef,
    onClick: (e: unknown) => {
      childOnClick?.(e);
      ctx.toggle();
    },
    "aria-haspopup": "dialog",
    "aria-expanded": ctx.open,
    "aria-controls": ctx.open ? ctx.contentId : undefined,
  });
}

const originFor = (side: Side, align: Align) =>
  `${side === "bottom" ? "top" : "bottom"} ${align === "end" ? "right" : "left"}`;

function clipAt(side: Side, align: Align, radius: number, inset: number) {
  const top = side === "bottom" ? "0%" : `${inset}%`;
  const bottom = side === "bottom" ? `${inset}%` : "0%";
  const right = align === "end" ? "0%" : `${inset}%`;
  const left = align === "end" ? `${inset}%` : "0%";
  return `inset(${top} ${right} ${bottom} ${left} round ${radius}px)`;
}

const MORPH_CLIP_TRANSITION = { duration: 0.32, ease: EASE_OUT } as const;

export interface MorphPopoverContentProps {
  children: ReactNode;
  side?: Side;
  align?: Align;
  sideOffset?: number;
  radius?: number;
  className?: string;
}

export function MorphPopoverContent(props: MorphPopoverContentProps) {
  const ctx = useMorphContext("MorphPopoverContent");
  const [portalReady, setPortalReady] = useState(false);
  useEffect(() => setPortalReady(true), []);
  if (!portalReady) return null;
  return createPortal(
    <AnimatePresence>
      {ctx.open && <MorphPopoverSurface {...props} />}
    </AnimatePresence>,
    document.body,
  );
}

function MorphPopoverSurface({
  children,
  side = "bottom",
  align = "end",
  sideOffset = 8,
  radius = 12,
  className,
}: MorphPopoverContentProps) {
  const ctx = useMorphContext("MorphPopoverContent");
  const reduce = useReducedMotion() ?? false;
  const [isPresent, safeToRemove] = usePresence();
  const layout = usePopoverPortalPosition(
    ctx.triggerRef,
    ctx.contentRef,
    isPresent,
  );

  const left = layout
    ? align === "end"
      ? layout.trigger.left + layout.trigger.width - layout.content.width
      : layout.trigger.left
    : 0;
  const top = layout
    ? side === "bottom"
      ? layout.trigger.top + layout.trigger.height + sideOffset
      : layout.trigger.top - layout.content.height - sideOffset
    : 0;

  const wrap = reduce
    ? undefined
    : {
        hidden: { scale: 0.96, transition: SPRING_PANEL },
        show: { scale: 1, transition: SPRING_PANEL },
      };
  const clip = reduce
    ? undefined
    : {
        hidden: {
          clipPath: clipAt(side, align, radius, 92),
          transition: MORPH_CLIP_TRANSITION,
        },
        show: {
          clipPath: clipAt(side, align, radius, 0),
          transition: MORPH_CLIP_TRANSITION,
        },
      };

  const opacity = useMotionValue(0);
  const ready = layout !== null;
  useEffect(() => {
    if (!ready) {
      if (!isPresent) safeToRemove?.();
      return;
    }
    const animation = animate(opacity, isPresent ? 1 : 0, {
      ...(reduce ? { duration: 0.12 } : SPRING_PANEL),
      onComplete: () => {
        if (!isPresent) safeToRemove?.();
      },
    });
    return () => animation.stop();
  }, [opacity, ready, isPresent, reduce, safeToRemove]);

  return (
    <motion.div
      data-morph-popover-portal=""
      inert={!isPresent}
      variants={wrap}
      initial="hidden"
      animate={layout ? "show" : "hidden"}
      exit="hidden"
      style={{
        left,
        top,
        opacity,
        pointerEvents: isPresent ? "auto" : "none",
        visibility: layout ? "visible" : "hidden",
        transformOrigin: originFor(side, align),
      }}
      className="fixed z-[9999] [filter:drop-shadow(0_10px_25px_rgba(0,0,0,0.12))] dark:[filter:drop-shadow(0_10px_25px_rgba(0,0,0,0.4))]"
    >
      <motion.div
        ref={ctx.contentRef}
        id={ctx.contentId}
        role="dialog"
        aria-labelledby={ctx.triggerId}
        variants={clip}
        style={{ borderRadius: radius }}
        className={cn(
          "overflow-hidden border border-border bg-card text-card-foreground shadow-md dark:border-[#30363D] dark:bg-[#24292E]",
          className,
        )}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
