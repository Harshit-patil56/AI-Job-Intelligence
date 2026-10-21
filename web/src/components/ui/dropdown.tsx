"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, Search } from "lucide-react";
import { spring } from "@/lib/springs";
import { cn } from "@/lib/utils";
import { useFluidHover, useRegisterFluidHoverItem } from "@/hooks/use-fluid-hover";
import { FluidHoverHighlight } from "@/components/fluid-hover-highlight";

// ---------------------------------------------------------------------------
// Dropdown Context
// ---------------------------------------------------------------------------

interface DropdownContextValue {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  close: () => void;
  triggerRef: React.RefObject<HTMLDivElement | null>;
}

const DropdownContext = React.createContext<DropdownContextValue | null>(null);

export function useDropdownContext() {
  const ctx = React.useContext(DropdownContext);
  if (!ctx) {
    throw new Error("Dropdown components must be rendered inside <DropdownMenu>");
  }
  return ctx;
}

interface DropdownContentContextValue {
  registerItem: (index: number, element: HTMLElement | null) => void;
  activeIndex: number | null;
  checkedIndex?: number;
  checkedIndices?: number[];
  close: () => void;
}

const DropdownContentContext = React.createContext<DropdownContentContextValue | null>(null);

function useDropdownContentContext() {
  const ctx = React.useContext(DropdownContentContext);
  if (!ctx) {
    throw new Error("MenuItem must be rendered inside <DropdownContent>");
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// DropdownMenu Root
// ---------------------------------------------------------------------------

export interface DropdownMenuProps {
  children: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

export function DropdownMenu({
  children,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  className,
}: DropdownMenuProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const setOpen = React.useCallback(
    (value: React.SetStateAction<boolean>) => {
      const next = typeof value === "function" ? value(open) : value;
      if (!isControlled) {
        setUncontrolledOpen(next);
      }
      onOpenChange?.(next);
    },
    [isControlled, open, onOpenChange]
  );

  const close = React.useCallback(() => setOpen(false), [setOpen]);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLDivElement>(null);

  // Close on outside pointerdown and Escape key
  React.useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside, true);
    document.addEventListener("touchstart", handleClickOutside, true);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true);
      document.removeEventListener("touchstart", handleClickOutside, true);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, setOpen]);

  const ctxValue = React.useMemo(
    () => ({ open, setOpen, close, triggerRef }),
    [open, setOpen, close]
  );

  return (
    <DropdownContext.Provider value={ctxValue}>
      <div ref={rootRef} className={cn("relative inline-block text-left", className)}>
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// DropdownTrigger
// ---------------------------------------------------------------------------

export interface DropdownTriggerProps {
  children?: React.ReactNode;
  render?: React.ReactElement<{
    onClick?: React.MouseEventHandler;
    "aria-expanded"?: boolean;
    "aria-haspopup"?: boolean | "menu";
    active?: boolean;
    className?: string;
  }>;
  className?: string;
}

export function DropdownTrigger({ children, render, className }: DropdownTriggerProps) {
  const { open, setOpen, triggerRef } = useDropdownContext();

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    setOpen((prev) => !prev);
  };

  if (render && React.isValidElement(render)) {
    const isDomElement = typeof render.type === "string";
    const clonedProps: Record<string, unknown> = {
      onClick: (e: React.MouseEvent) => {
        (render.props as { onClick?: (e: React.MouseEvent) => void }).onClick?.(e);
        handleToggle(e);
      },
      "aria-haspopup": "menu",
      "aria-expanded": open,
      "data-active": open ? "true" : undefined,
    };

    if (!isDomElement) {
      clonedProps.active = open;
    }

    return (
      <div ref={triggerRef} className={cn("inline-block", className)}>
        {React.cloneElement(render, clonedProps)}
      </div>
    );
  }

  return (
    <div ref={triggerRef} className="inline-block">
      <button
        type="button"
        onClick={handleToggle}
        aria-haspopup="menu"
        aria-expanded={open}
        className={className}
      >
        {children}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DropdownContent
// ---------------------------------------------------------------------------

export interface DropdownContentProps {
  children: React.ReactNode;
  checkedIndex?: number;
  checkedIndices?: number[];
  className?: string;
  align?: "start" | "end" | "center";
  sideOffset?: number;
}

export function DropdownContent({
  children,
  checkedIndex,
  checkedIndices,
  className,
  align = "start",
}: DropdownContentProps) {
  const { open, close } = useDropdownContext();
  const listRef = React.useRef<HTMLUListElement>(null);
  const hover = useFluidHover(listRef, { axis: "y" });

  const contentCtx = React.useMemo(
    () => ({
      registerItem: hover.registerItem,
      activeIndex: hover.activeIndex,
      checkedIndex,
      checkedIndices,
      close,
    }),
    [hover.registerItem, hover.activeIndex, checkedIndex, checkedIndices, close]
  );

  // Clear hover highlight on scroll so it never lingers or floats while scrolling
  const handleScroll = React.useCallback(() => {
    hover.setActiveIndex(null);
  }, [hover]);

  // Keep search pinned at the top if passed inside children, list scrolls underneath
  const childrenArray = React.Children.toArray(children);
  const searchChild = childrenArray.find(
    (child) =>
      React.isValidElement(child) &&
      ((child.type as { displayName?: string })?.displayName === "DropdownSearch" ||
        (child.type as { name?: string })?.name === "DropdownSearch")
  );
  const listChildren = searchChild
    ? childrenArray.filter((c) => c !== searchChild)
    : children;

  return (
    <AnimatePresence>
      {open && (
        <DropdownContentContext.Provider value={contentCtx}>
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4, transition: spring.fast.exit }}
            transition={spring.fast}
            className={cn(
              "absolute z-50 mt-1 min-w-[210px] overflow-hidden rounded-xl border border-[#E0DFDC] bg-white p-1 shadow-lg dark:border-[#30363D] dark:bg-[#24292E] select-none",
              align === "end" ? "right-0" : align === "center" ? "left-1/2 -translate-x-1/2" : "left-0",
              className
            )}
          >
            {searchChild}
            <ul
              ref={listRef}
              {...hover.handlers}
              onScroll={handleScroll}
              role="menu"
              className="relative flex flex-col gap-0.5 outline-none max-h-[280px] overflow-y-auto no-scrollbar scrollbar-none py-0.5"
            >
              <FluidHoverHighlight
                hover={hover}
                className="rounded-lg bg-zinc-100/90 dark:bg-zinc-850/80 dark:bg-[#1E2228]"
              />
              {listChildren}
            </ul>
          </motion.div>
        </DropdownContentContext.Provider>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// MenuItem
// ---------------------------------------------------------------------------

export interface MenuItemProps extends React.HTMLAttributes<HTMLLIElement> {
  index: number;
  label: string;
  checked?: boolean;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  disabled?: boolean;
  closeOnClick?: boolean;
  onSelect?: () => void;
}

export const MenuItem = React.forwardRef<HTMLLIElement, MenuItemProps>(
  (
    {
      index,
      label,
      checked = false,
      icon,
      badge,
      disabled = false,
      closeOnClick = true,
      onSelect,
      className,
      onClick,
      ...props
    },
    forwardedRef
  ) => {
    const itemRef = React.useRef<HTMLLIElement>(null);
    const { registerItem, close, checkedIndices } = useDropdownContentContext();

    useRegisterFluidHoverItem(registerItem, index, itemRef);

    const isChecked = checked ?? (checkedIndices ? checkedIndices.includes(index) : false);

    const handleClick = (e: React.MouseEvent<HTMLLIElement>) => {
      if (disabled) return;
      onClick?.(e);
      onSelect?.();
      if (closeOnClick) {
        close();
      }
    };

    return (
      <li
        ref={(node) => {
          (itemRef as React.MutableRefObject<HTMLLIElement | null>).current = node;
          if (typeof forwardedRef === "function") forwardedRef(node);
          else if (forwardedRef) (forwardedRef as React.MutableRefObject<HTMLLIElement | null>).current = node;
        }}
        role="menuitem"
        aria-checked={isChecked}
        aria-disabled={disabled}
        onClick={handleClick}
        className={cn(
          "relative z-10 flex h-8.5 items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer select-none outline-none transition-colors",
          disabled && "opacity-50 pointer-events-none cursor-not-allowed",
          className
        )}
        {...props}
      >
        <div className="flex items-center gap-2 min-w-0 pr-2">
          {icon && <span className="shrink-0 flex items-center text-muted-foreground">{icon}</span>}
          {/* Weight without reflow ghost-span pattern */}
          <span className="inline-grid min-w-0">
            <span
              className={cn(
                "col-start-1 row-start-1 truncate transition-[color,font-weight] duration-80",
                isChecked
                  ? "font-semibold text-[#191919] dark:text-[#F0F6FC]"
                  : "font-normal text-[#666666] dark:text-[#8B949E]"
              )}
            >
              {label}
            </span>
            <span
              aria-hidden="true"
              className="col-start-1 row-start-1 invisible font-semibold truncate"
            >
              {label}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-auto pl-2">
          {badge && <span className="text-[11px] text-muted-foreground font-mono">{badge}</span>}
          {isChecked && (
            <Check size={14} className="text-[#0A66C2] dark:text-[#70B5F9] stroke-[2.5] shrink-0" />
          )}
        </div>
      </li>
    );
  }
);

MenuItem.displayName = "MenuItem";

// ---------------------------------------------------------------------------
// Optional Subcomponents: DropdownSearch, DropdownEmpty, DropdownSeparator
// ---------------------------------------------------------------------------

export function DropdownSearch({
  value,
  onValueChange,
  onKeyDown,
  onPaste,
  placeholder = "Search...",
  className,
}: {
  value: string;
  onValueChange: (val: string) => void;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
  onPaste?: React.ClipboardEventHandler<HTMLInputElement>;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative px-2 py-1.5 border-b border-[#E0DFDC] dark:border-[#30363D] mb-1", className)}>
      <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        placeholder={placeholder}
        className="w-full pl-6 pr-2 py-1 text-xs bg-transparent outline-none placeholder:text-muted-foreground"
        autoFocus
      />
    </div>
  );
}

DropdownSearch.displayName = "DropdownSearch";

export function DropdownEmpty({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <li className={cn("px-3 py-2 text-xs text-muted-foreground text-center", className)}>
      {children}
    </li>
  );
}

export function DropdownSeparator({ className }: { className?: string }) {
  return (
    <li
      role="separator"
      className={cn("my-1 -mx-1 h-px bg-[#E0DFDC] dark:bg-[#30363D]", className)}
    />
  );
}

export function DropdownGroupLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "px-2.5 pt-2 pb-1 text-[10px] font-bold tracking-wider uppercase text-muted-foreground/75 select-none",
        className
      )}
    >
      {children}
    </div>
  );
}

export { Button } from "@/components/ui/button";

