"use client";

import React, { useState, useMemo, useCallback, useRef } from "react";
import {
  DropdownMenu,
  DropdownContent,
  DropdownEmpty,
  MenuItem,
} from "@/components/ui/dropdown";
import {
  Search,
  Plus,
  X,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface TagComboboxProps {
  label: string;
  description?: string;
  icon?: LucideIcon;
  placeholder?: string;
  items: string[];
  onChange: (items: string[]) => void;
  suggestions?: string[];
  uncommitted?: boolean;
  unitName?: string; // e.g. "skills", "roles", "locations"
  className?: string;
}

export function TagCombobox({
  label,
  description,
  icon: Icon,
  placeholder = "Search to add...",
  items = [],
  onChange,
  suggestions = [],
  uncommitted = false,
  unitName = "items",
  className,
}: TagComboboxProps) {
  // Merged available items: starts from suggestions + any already selected or custom items
  const [availableItems, setAvailableItems] = useState<string[]>(() => {
    const combined = [...suggestions];
    for (const it of items) {
      if (!combined.some((c) => c.toLowerCase() === it.toLowerCase())) {
        combined.push(it);
      }
    }
    return combined;
  });

  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync any external items into availableItems if not present
  React.useEffect(() => {
    setAvailableItems((prev) => {
      let updated = false;
      const next = [...prev];
      for (const it of items) {
        if (!next.some((c) => c.toLowerCase() === it.toLowerCase())) {
          next.push(it);
          updated = true;
        }
      }
      return updated ? next : prev;
    });
  }, [items]);

  // Toggle selection
  const toggle = useCallback(
    (tag: string) => {
      const lower = tag.trim().toLowerCase();
      if (items.some((x) => x.toLowerCase() === lower)) {
        onChange(items.filter((x) => x.toLowerCase() !== lower));
      } else {
        onChange([...items, tag.trim()]);
      }
      inputRef.current?.focus();
    },
    [items, onChange]
  );

  // Remove single tag
  const removeTag = useCallback(
    (tagToRemove: string) => {
      const lower = tagToRemove.trim().toLowerCase();
      onChange(items.filter((x) => x.toLowerCase() !== lower));
      inputRef.current?.focus();
    },
    [items, onChange]
  );

  // Clear all
  const clearAll = useCallback(() => {
    onChange([]);
    inputRef.current?.focus();
  }, [onChange]);

  // Matches filtered by query
  const matches = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return availableItems;
    return availableItems.filter((c) => c.toLowerCase().includes(trimmed));
  }, [availableItems, query]);

  // Create row condition
  const q = query.trim();
  const canCreate =
    q !== "" && !availableItems.some((c) => c.toLowerCase() === q.toLowerCase());

  // Handle paste with commas
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text");
    if (pasted.includes(",") || pasted.includes("\n") || pasted.includes(";")) {
      e.preventDefault();
      const parts = pasted
        .split(/[,;\n]+/)
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

      const newItems = [...items];
      const newAvailable = [...availableItems];

      for (const part of parts) {
        if (!newItems.some((it) => it.toLowerCase() === part.toLowerCase())) {
          newItems.push(part);
        }
        if (!newAvailable.some((it) => it.toLowerCase() === part.toLowerCase())) {
          newAvailable.push(part);
        }
      }
      setAvailableItems(newAvailable);
      onChange(newItems);
      setQuery("");
    }
  };

  // Keyboard navigation inside the single search input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Comma immediately adds the typed query
    if (e.key === ",") {
      e.preventDefault();
      if (q) {
        if (!availableItems.some((c) => c.toLowerCase() === q.toLowerCase())) {
          setAvailableItems((prev) => [...prev, q]);
        }
        if (!items.some((x) => x.toLowerCase() === q.toLowerCase())) {
          onChange([...items, q]);
        }
        setQuery("");
      }
      return;
    }

    // Enter adds top match or creates custom item
    if (e.key === "Enter") {
      e.preventDefault();
      if (canCreate) {
        if (!availableItems.some((c) => c.toLowerCase() === q.toLowerCase())) {
          setAvailableItems((prev) => [...prev, q]);
        }
        toggle(q);
        setQuery("");
      } else if (matches.length > 0 && q) {
        toggle(matches[0]);
        setQuery("");
      }
      return;
    }

    // Backspace on empty query removes the last active tag
    if (e.key === "Backspace" && !query && items.length > 0) {
      e.preventDefault();
      removeTag(items[items.length - 1]);
      return;
    }

    // Down arrow opens dropdown if closed
    if (e.key === "ArrowDown" && !isOpen) {
      e.preventDefault();
      setIsOpen(true);
      return;
    }

    if (e.key === "Escape") {
      setIsOpen(false);
      return;
    }
  };

  return (
    <div
      className={cn(
        "group relative flex flex-col gap-2.5 rounded-xl border border-border/70 bg-card/60 p-3.5 transition-all duration-150 hover:border-border",
        className
      )}
    >
      {/* Top Header: Label & Icon on Left | Compact Search Bar + Unsaved + Clear on Right */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 min-w-0">
          {Icon && (
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground">
              <Icon size={12} strokeWidth={2} />
            </div>
          )}
          <span className="text-xs font-semibold text-foreground truncate">
            {label}
          </span>
          {items.length > 0 && (
            <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {items.length} {unitName}
            </span>
          )}
        </div>

        {/* Right Controls: Compact Search Bar shifted to left of Clear button */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Search Bar matching Dropdown size */}
          <DropdownMenu
            open={isOpen}
            onOpenChange={setIsOpen}
            className="relative w-52 sm:w-64"
          >
            <div className="relative flex items-center w-full">
              <Search
                size={12}
                className="absolute left-2.5 text-muted-foreground pointer-events-none"
              />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder={placeholder || `Add ${unitName}...`}
                className="h-7.5 w-full rounded-md border border-border/80 bg-background pl-7 pr-6 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all shadow-2xs"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    inputRef.current?.focus();
                  }}
                  className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center rounded text-muted-foreground hover:text-foreground cursor-pointer"
                  title="Clear search"
                >
                  <X size={11} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsOpen((prev) => !prev)}
                  className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center rounded text-muted-foreground/70 hover:text-foreground cursor-pointer"
                  title="Toggle list"
                >
                  <ChevronDown
                    size={11}
                    className={cn(
                      "transition-transform duration-150",
                      isOpen && "rotate-180 text-foreground"
                    )}
                  />
                </button>
              )}
            </div>

            {/* Fluid Hover Highlight Menu List - exact matching width */}
            <DropdownContent
              align="end"
              className="w-full min-w-full max-w-[calc(100vw-3rem)]"
              checkedIndices={matches.flatMap((c, i) =>
                items.some((it) => it.toLowerCase() === c.toLowerCase()) ? [i] : []
              )}
            >
              {matches.map((c, i) => {
                const isChecked = items.some(
                  (it) => it.toLowerCase() === c.toLowerCase()
                );
                return (
                  <MenuItem
                    key={c}
                    index={i}
                    label={c}
                    checked={isChecked}
                    closeOnClick={false}
                    onSelect={() => toggle(c)}
                  />
                );
              })}

              {canCreate && (
                <MenuItem
                  index={matches.length}
                  icon={<Plus size={13} className="shrink-0 text-primary" strokeWidth={2.5} />}
                  label={`Create “${q}”`}
                  closeOnClick={false}
                  onSelect={() => {
                    if (!availableItems.includes(q)) {
                      setAvailableItems((prev) => [...prev, q]);
                    }
                    toggle(q);
                    setQuery("");
                  }}
                />
              )}

              {matches.length === 0 && !canCreate && (
                <DropdownEmpty>No matching {unitName} found</DropdownEmpty>
              )}
            </DropdownContent>
          </DropdownMenu>

          {items.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="text-[11px] text-muted-foreground hover:text-destructive transition-colors cursor-pointer pl-0.5"
              title="Remove all"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {description ? (
        <p className="text-[11px] text-muted-foreground -mt-1">{description}</p>
      ) : null}

      {/* Active Tags Area (chips with individual remove buttons) */}
      {items.length > 0 ? (
        <div
          className={cn(
            "flex flex-wrap gap-1.5 min-h-[28px] items-center",
            description ? "pt-0.5" : "pt-2.5 sm:pt-3"
          )}
        >
          {items.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1.5 rounded-md bg-secondary/80 border border-border/60 pl-2.5 pr-1 py-1 text-xs font-medium text-foreground transition-all duration-100 hover:border-border hover:bg-secondary"
            >
              <span className="truncate max-w-[220px]">{item}</span>
              <button
                type="button"
                onClick={() => removeTag(item)}
                aria-label={`Remove ${item}`}
                className="flex h-4 w-4 items-center justify-center rounded-sm text-muted-foreground/80 hover:bg-foreground/10 hover:text-foreground transition-colors cursor-pointer"
              >
                <X size={11} strokeWidth={2.5} />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <div
          className={cn(
            "text-[11px] text-muted-foreground italic py-1",
            !description && "pt-2.5 sm:pt-3"
          )}
        >
          No {unitName} added yet. Use the search bar above to add.
        </div>
      )}
    </div>
  );
}
