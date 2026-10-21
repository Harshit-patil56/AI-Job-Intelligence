"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/springs";
import { fontWeights } from "@/lib/font-weight";
import { useShape } from "@/lib/shape-context";
import { useSize } from "@/lib/size-context";
import { useFluidHover, useRegisterFluidHoverItem } from "@/hooks/use-fluid-hover";
import { FluidHoverHighlight } from "@/components/fluid-hover-highlight";
import type { IconComponent } from "@/lib/icon-context";

// ─── Sidebar Context ─────────────────────────────────────────────────────────

interface SidebarContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  isMobile: boolean;
  width: string;
}

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

export function useSidebar(): SidebarContextValue {
  const ctx = React.useContext(SidebarContext);
  if (!ctx) {
    return {
      open: true,
      setOpen: () => {},
      isMobile: false,
      width: "13rem",
    };
  }
  return ctx;
}

export interface SidebarProviderProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  persist?: boolean;
  shortcut?: string | null;
  width?: string;
}

export function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange,
  width = "13rem",
  persist,
  shortcut,
  className,
  children,
  ...props
}: SidebarProviderProps) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const open = openProp ?? internalOpen;

  const setOpen = React.useCallback(
    (value: boolean) => {
      if (onOpenChange) onOpenChange(value);
      else setInternalOpen(value);
    },
    [onOpenChange]
  );

  const value = React.useMemo(
    () => ({
      open,
      setOpen,
      isMobile: false,
      width,
    }),
    [open, setOpen, width]
  );

  return (
    <SidebarContext.Provider value={value}>
      <div
        data-slot="sidebar-provider"
        className={cn("relative flex w-full", className)}
        style={{ "--sidebar-width": width } as React.CSSProperties}
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

// ─── Sidebar Root ────────────────────────────────────────────────────────────

export interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  collapsible?: "none" | "offcanvas";
}

export const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ collapsible = "none", className, style, children, ...props }, ref) => {
    const { width } = useSidebar();

    return (
      <aside
        ref={ref}
        data-slot="sidebar"
        data-collapsible={collapsible}
        className={cn(
          "flex shrink-0 flex-col border-r border-border/80 bg-sidebar text-sidebar-foreground",
          className
        )}
        style={{ width, ...style }}
        {...props}
      >
        {children}
      </aside>
    );
  }
);
Sidebar.displayName = "Sidebar";

// ─── Header, Content, Footer, Groups ─────────────────────────────────────────

export function SidebarHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="sidebar-header"
      className={cn("flex flex-col gap-1.5 shrink-0", className)}
      {...props}
    />
  );
}

export function SidebarContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="sidebar-content"
      className={cn("flex min-h-0 flex-1 flex-col overflow-y-auto", className)}
      {...props}
    />
  );
}

export function SidebarFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="sidebar-footer"
      className={cn("flex flex-col gap-1.5 shrink-0 p-3", className)}
      {...props}
    />
  );
}

export function SidebarGroup({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="sidebar-group"
      className={cn("relative flex w-full min-w-0 flex-col p-2", className)}
      {...props}
    />
  );
}

export function SidebarGroupLabel({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="sidebar-group-label"
      className={cn(
        "flex h-7 shrink-0 items-center px-2.5 text-xs font-semibold text-muted-foreground select-none",
        className
      )}
      {...props}
    />
  );
}

export function SidebarGroupContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="sidebar-group-content"
      className={cn("w-full", className)}
      {...props}
    />
  );
}

export function SidebarSeparator({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="sidebar-separator"
      className={cn("my-1 h-px w-full bg-border/60", className)}
      {...props}
    />
  );
}

// ─── SidebarMenu & Fluid Hover Machinery ─────────────────────────────────────

interface SidebarMenuContextValue {
  registerItem: (index: number, element: HTMLElement | null) => void;
  activeIndex: number | null;
}

const SidebarMenuContext = React.createContext<SidebarMenuContextValue | null>(null);

export interface SidebarMenuProps extends React.HTMLAttributes<HTMLUListElement> {
  focusRing?: boolean;
}

export const SidebarMenu = React.forwardRef<HTMLUListElement, SidebarMenuProps>(
  ({ className, focusRing = false, children, ...props }, ref) => {
    const containerRef = React.useRef<HTMLUListElement>(null);
    const shape = useShape();
    const hover = useFluidHover(containerRef, { axis: "y", gapClick: false });

    const contextValue = React.useMemo(
      () => ({
        registerItem: hover.registerItem,
        activeIndex: hover.activeIndex,
      }),
      [hover.registerItem, hover.activeIndex]
    );

    return (
      <SidebarMenuContext.Provider value={contextValue}>
        <ul
          ref={(node) => {
            (containerRef as React.MutableRefObject<HTMLUListElement | null>).current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) (ref as React.MutableRefObject<HTMLUListElement | null>).current = node;
          }}
          data-sidebar="menu"
          className={cn("relative flex w-full min-w-0 flex-col gap-0.5 select-none", className)}
          onMouseEnter={hover.handlers.onMouseEnter}
          onMouseMove={hover.handlers.onMouseMove}
          onMouseLeave={hover.handlers.onMouseLeave}
          onClick={hover.handlers.onClick}
          {...props}
        >
          {/* Fluid hover highlight that glides between menu rows */}
          <FluidHoverHighlight hover={hover} className={shape.bg} />
          {children}
        </ul>
      </SidebarMenuContext.Provider>
    );
  }
);
SidebarMenu.displayName = "SidebarMenu";

export interface SidebarMenuItemProps extends React.LiHTMLAttributes<HTMLLIElement> {}

export const SidebarMenuItem = React.forwardRef<HTMLLIElement, SidebarMenuItemProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <li
        ref={ref}
        data-sidebar="menu-item"
        className={cn("group/menu-item relative list-none", className)}
        {...props}
      >
        {children}
      </li>
    );
  }
);
SidebarMenuItem.displayName = "SidebarMenuItem";

export interface SidebarMenuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isActive?: boolean;
  icon?: IconComponent;
  trailing?: React.ReactNode;
}

let itemCounter = 0;

export const SidebarMenuButton = React.forwardRef<HTMLButtonElement, SidebarMenuButtonProps>(
  ({ isActive = false, icon: Icon, trailing, className, children, onClick, ...props }, ref) => {
    const menuCtx = React.useContext(SidebarMenuContext);
    const itemRef = React.useRef<HTMLButtonElement>(null);
    const shape = useShape();
    const sizeClasses = useSize();

    // Stable item index across renders
    const [index] = React.useState(() => itemCounter++);
    useRegisterFluidHoverItem(menuCtx?.registerItem, index, itemRef);

    const isHovered = menuCtx?.activeIndex === index;
    const lit = isActive || isHovered;

    return (
      <button
        ref={(node) => {
          (itemRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
        }}
        type="button"
        data-sidebar="menu-button"
        data-active={isActive ? "true" : undefined}
        onClick={onClick}
        className={cn(
          "peer/menu-button relative z-10 flex h-8 w-full cursor-pointer select-none items-center gap-2 px-2.5 text-left text-xs outline-none transition-colors duration-80",
          shape.item,
          isActive
            ? "text-primary font-medium"
            : "text-muted-foreground hover:text-foreground",
          className
        )}
        {...props}
      >
        {/* Moderate spring active background indicator */}
        {isActive && (
          <motion.div
            layoutId="sidebar-active-indicator"
            className={cn(
              "absolute inset-0 z-0 bg-primary/10",
              shape.bg
            )}
            transition={spring.moderate}
          />
        )}

        {/* Icon */}
        {Icon && (
          <span className="relative z-10 shrink-0">
            <Icon
              size={15}
              strokeWidth={lit ? 2 : 1.5}
              className={cn(
                "transition-[color,stroke-width] duration-80",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground group-hover/menu-item:text-foreground"
              )}
            />
          </span>
        )}

        {/* Ghost-span label for zero layout shift during weight changes */}
        <span className="relative z-10 inline-grid min-w-0 flex-1 text-left truncate">
          <span
            className="col-start-1 row-start-1 invisible truncate"
            style={{ fontVariationSettings: fontWeights.semibold }}
            aria-hidden="true"
          >
            {children}
          </span>
          <span
            className={cn(
              "col-start-1 row-start-1 truncate transition-[color,font-variation-settings] duration-80",
              isActive ? "text-primary" : "text-foreground"
            )}
            style={{
              fontVariationSettings: isActive ? fontWeights.semibold : fontWeights.normal,
            }}
          >
            {children}
          </span>
        </span>

        {trailing && <span className="relative z-10 shrink-0 ml-auto">{trailing}</span>}
      </button>
    );
  }
);
SidebarMenuButton.displayName = "SidebarMenuButton";
