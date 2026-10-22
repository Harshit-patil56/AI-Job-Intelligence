"use client";

import {
  useRef,
  useState,
  useMemo,
  useEffect,
  createContext,
  useContext,
  forwardRef,
  type ReactNode,
  type HTMLAttributes,
  type InputHTMLAttributes,
} from "react";
import { Field } from "@base-ui/react/field";
import type { IconComponent } from "@/lib/icon-context";
import { cn } from "@/lib/utils";
import { fontWeights } from "@/lib/font-weight";
import { useShape } from "@/lib/shape-context";
import { SizeProvider, useSize, type SizeVariant } from "@/lib/size-context";
import { useFluidHover, useRegisterFluidHoverItem } from "@/hooks/use-fluid-hover";

// ---------------------------------------------------------------------------
// InputGroup stacks labelled text fields that share one fluid hover scope.
// At rest a field has no fill and no visible ring. The field nearest the
// pointer shows a faint fill and its ring; the focused field lifts to the
// card surface. There is no separate highlight element: each field draws its
// own state.
// ---------------------------------------------------------------------------

interface InputGroupContextValue {
  registerItem: (index: number, element: HTMLElement | null) => void;
  activeIndex: number | null;
}

const InputGroupContext = createContext<InputGroupContextValue | null>(null);

function useInputGroup() {
  const ctx = useContext(InputGroupContext);
  if (!ctx)
    throw new Error("useInputGroup must be used within an InputGroup");
  return ctx;
}

interface InputGroupProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  size?: SizeVariant;
}

const InputGroup = forwardRef<HTMLDivElement, InputGroupProps>(
  ({ children, size, className, ...props }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);

    const { activeIndex, handlers, registerItem } =
      useFluidHover(containerRef);

    const contextValue = useMemo(
      () => ({ registerItem, activeIndex }),
      [registerItem, activeIndex]
    );

    const group = (
      <InputGroupContext.Provider value={contextValue}>
        <div
          ref={(node) => {
            (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
          }}
          onMouseEnter={handlers.onMouseEnter}
          onMouseMove={handlers.onMouseMove}
          onMouseLeave={handlers.onMouseLeave}
          className={cn("relative flex flex-col gap-3 w-72 max-w-full", className)}
          {...props}
        >
          {children}
        </div>
      </InputGroupContext.Provider>
    );

    return size ? <SizeProvider size={size}>{group}</SizeProvider> : group;
  }
);

InputGroup.displayName = "InputGroup";

interface InputFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "index"> {
  label: string;
  labelHidden?: boolean;
  placeholder?: string;
  icon?: IconComponent;
  index: number;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
  multiline?: boolean;
  uncommitted?: boolean;
}

const InputField = forwardRef<HTMLDivElement, InputFieldProps>(
  (
    {
      label,
      labelHidden,
      placeholder,
      icon: Icon,
      index,
      value,
      onChange,
      error,
      disabled,
      className,
      multiline = false,
      uncommitted = false,
      ...props
    },
    ref
  ) => {
    const internalRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLElement | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const { registerItem, activeIndex } = useInputGroup();
    const [isFocused, setIsFocused] = useState(false);
    const shape = useShape();
    const sizeClasses = useSize();
    const compact = sizeClasses.variant === "compact";

    useRegisterFluidHoverItem(registerItem, index, internalRef);

    const isActive = activeIndex === index;
    const labelActive = isActive || isFocused;

    const handleFocus = () => {
      setIsFocused(true);
    };

    const handleBlur = () => {
      setIsFocused(false);
    };

    // Auto-expand textarea height according to content
    useEffect(() => {
      if (multiline && textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${Math.max(22, textareaRef.current.scrollHeight)}px`;
      }
    }, [value, multiline]);

    let bgClass: string;
    let ringClass: string;

    if (disabled) {
      bgClass = "bg-transparent";
      ringClass = "ring-border";
    } else if (error) {
      bgClass = isFocused ? "bg-card" : isActive ? "bg-destructive/10" : "bg-transparent";
      ringClass = isFocused || isActive ? "ring-destructive/50" : "ring-transparent";
    } else if (isFocused) {
      bgClass = "bg-card";
      ringClass = "ring-primary";
    } else if (isActive) {
      bgClass = "bg-secondary/40";
      ringClass = "ring-border";
    } else {
      bgClass = "bg-transparent";
      ringClass = "ring-border/40";
    }

    return (
      <Field.Root
        ref={(node) => {
          (internalRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        invalid={!!error}
        disabled={disabled}
        className={cn(
          "flex flex-col gap-1 cursor-text",
          disabled && "opacity-50 pointer-events-none",
          className
        )}
      >
        <div className={cn("flex items-center justify-between", labelHidden ? "sr-only" : (compact ? "px-2" : "px-2.5"))}>
          <Field.Label
            className={cn(
              "inline-grid",
              sizeClasses.text
            )}
          >
            <span
              className="col-start-1 row-start-1 invisible"
              style={{ fontVariationSettings: fontWeights.semibold }}
              aria-hidden="true"
            >
              {label}
            </span>
            <span
              className={cn(
                "col-start-1 row-start-1",
                error ? "text-destructive" : "text-muted-foreground"
              )}
              style={{
                fontVariationSettings: fontWeights.normal,
              }}
            >
              {label}
            </span>
          </Field.Label>
        </div>

        <div
          onMouseDown={(e) => {
            if (e.target === inputRef.current || e.target === textareaRef.current) return;
            e.preventDefault();
            (textareaRef.current || inputRef.current)?.focus();
          }}
          className={cn(
            multiline
              ? `flex items-start ${sizeClasses.gap} ${shape.input} ${
                  compact ? "px-2 py-1.5" : "px-2.5 py-2"
                } min-h-[36px] ring-1 transition-all duration-80`
              : `flex items-center ${sizeClasses.gap} ${shape.input} ${
                  compact ? "px-2" : "px-2.5"
                } ${sizeClasses.control} ring-1 transition-all duration-80`,
            bgClass,
            ringClass
          )}
        >
          {Icon && (
            <span className={cn("shrink-0", multiline && "pt-0.5")}>
              <Icon
                size={sizeClasses.icon}
                strokeWidth={labelActive ? 2 : 1.5}
                className={cn(
                  "transition-[color,stroke-width] duration-80",
                  labelActive
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              />
            </span>
          )}

          {multiline ? (
            <textarea
              ref={(node) => {
                textareaRef.current = node;
                inputRef.current = node;
              }}
              rows={1}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder={placeholder}
              className={cn(
                "w-full resize-none rounded-none bg-transparent text-foreground placeholder:text-muted-foreground/45 placeholder:italic placeholder:select-none dark:placeholder:text-zinc-500/70 outline-none font-[inherit] leading-relaxed overflow-hidden",
                sizeClasses.field
              )}
              style={{ fontVariationSettings: fontWeights.normal }}
              disabled={disabled}
            />
          ) : (
            <Field.Control
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder={placeholder}
              className={cn(
                "w-full rounded-none bg-transparent text-foreground placeholder:text-muted-foreground/45 placeholder:italic placeholder:select-none dark:placeholder:text-zinc-500/70 outline-none font-[inherit]",
                sizeClasses.field
              )}
              style={{ fontVariationSettings: fontWeights.normal }}
              {...props}
            />
          )}
        </div>

        {error && (
          <Field.Error
            match
            className={cn(
              "text-destructive",
              compact ? "text-[length:var(--fs-caption-compact,11px)] leading-[var(--lh-caption-compact,14px)] pl-2" : "text-[length:var(--fs-caption,12px)] leading-[var(--lh-caption,16px)] pl-2.5"
            )}
            style={{ fontVariationSettings: fontWeights.normal }}
          >
            {error}
          </Field.Error>
        )}
      </Field.Root>
    );
  }
);

InputField.displayName = "InputField";

export { InputGroup, InputField };
export default InputGroup;
