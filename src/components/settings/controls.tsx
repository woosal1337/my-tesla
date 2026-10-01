"use client";

import { ChevronDown } from "lucide-react";
import { motion } from "motion/react";
import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const spring = {
  type: "spring",
  stiffness: 560,
  damping: 44,
  mass: 0.7,
} as const;

export function SettingsSection({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-xl font-medium">{title}</h2>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
      <div className="mt-4 rounded-xl bg-card px-5 md:px-6">{children}</div>
    </section>
  );
}

export function SettingRow({
  label,
  hint,
  control,
  inline = false,
}: {
  label: string;
  hint?: string;
  control: ReactNode;
  inline?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex gap-3 border-t border-border py-4 first:border-t-0",
        inline
          ? "flex-row items-center justify-between gap-6"
          : "flex-col sm:flex-row sm:items-center sm:justify-between sm:gap-6",
      )}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-subtle">{hint}</p>}
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

export function Choice<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly { id: T; label: string }[];
  onChange: (value: T) => void;
}) {
  const group = useId();
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex max-w-full flex-wrap rounded bg-background p-1 text-sm font-medium"
    >
      {options.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.id)}
            className={cn(
              "relative rounded px-3 py-1.5 whitespace-nowrap transition-tesla focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              active
                ? "text-background"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active && (
              <motion.span
                layoutId={`choice-${group}`}
                transition={spring}
                className="absolute inset-0 rounded bg-foreground"
              />
            )}
            <span className="relative">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function Select<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
}: {
  label: string;
  value: T;
  options: readonly { id: T; label: string }[];
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="h-9 w-full appearance-none rounded bg-background pr-9 pl-3 text-sm font-medium transition-tesla hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:w-64"
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 transition-tesla focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        checked ? "bg-primary" : "bg-input",
      )}
    >
      <motion.span
        layout
        transition={spring}
        className={cn(
          "size-6 rounded-full bg-white",
          checked ? "ml-auto" : "ml-0",
        )}
      />
    </button>
  );
}
