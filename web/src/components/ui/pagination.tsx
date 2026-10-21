"use client";

import * as React from "react";
import * as PaginationPrimitive from "@animate-ui/react/primitives/pagination";
import { cn } from "@/lib/utils";

function Pagination({
  className,
  ...props
}: React.ComponentProps<typeof PaginationPrimitive.Root>) {
  return (
    <PaginationPrimitive.Root
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center select-none", className)}
      {...props}
    />
  );
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex flex-row items-center gap-1.5", className)}
      {...props}
    />
  );
}

function PaginationItem({
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="pagination-item"
      className={cn("list-none", className)}
      {...props}
    />
  );
}

type PaginationLinkProps = {
  isActive?: boolean;
  disabled?: boolean;
} & React.ComponentProps<"button">;

function PaginationLink({
  className,
  isActive,
  disabled,
  children,
  onClick,
  ...props
}: PaginationLinkProps) {
  return (
    <button
      type="button"
      data-slot="pagination-link"
      aria-current={isActive ? "page" : undefined}
      data-active={isActive ? "" : undefined}
      disabled={disabled}
      onClick={(e) => {
        if (disabled) {
          e.preventDefault();
          return;
        }
        onClick?.(e);
      }}
      className={cn(
        "inline-flex h-9 min-w-9 items-center justify-center rounded-md px-3 text-[13px] font-medium transition-colors outline-none select-none",
        "focus-visible:ring-2 focus-visible:ring-[#0A66C2]/40 focus-visible:ring-offset-1",
        isActive
          ? "border border-[#0A66C2] bg-[#0A66C2] text-white font-semibold shadow-xs cursor-default"
          : "border border-[#E0DFDC] bg-white text-[#191919] hover:bg-[#F3F2F0] dark:border-[#30363D] dark:bg-[#24292E] dark:text-[#F0F6FC] dark:hover:bg-[#30363D] cursor-pointer",
        disabled && "opacity-40 cursor-not-allowed hover:bg-white dark:hover:bg-[#24292E]",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function PaginationPrevious({
  className,
  disabled,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      disabled={disabled}
      className={cn("gap-1 px-3.5", className)}
      {...props}
    >
      <span>Previous</span>
    </PaginationLink>
  );
}

function PaginationNext({
  className,
  disabled,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Go to next page"
      disabled={disabled}
      className={cn("gap-1 px-3.5", className)}
      {...props}
    >
      <span>Next</span>
    </PaginationLink>
  );
}

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn("flex h-9 w-9 items-center justify-center text-[#666666] dark:text-[#8B949E]", className)}
      {...props}
    >
      …
    </span>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
};
