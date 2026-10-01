"use client";

import { useLinkStatus } from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { TeslaMark } from "@/components/tesla-mark";
import { cn } from "@/lib/utils";

type PendingState = {
  pending: boolean;
  report: (pending: boolean) => void;
};

const PendingContext = createContext<PendingState>({
  pending: false,
  report: () => {},
});

export function NavigationPendingProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [count, setCount] = useState(0);
  const report = useCallback((pending: boolean) => {
    setCount((current) => Math.max(0, current + (pending ? 1 : -1)));
  }, []);
  const value = useMemo(
    () => ({ pending: count > 0, report }),
    [count, report],
  );
  return (
    <PendingContext.Provider value={value}>{children}</PendingContext.Provider>
  );
}

export function PendingTrace({ className }: { className?: string }) {
  const { pending } = useLinkStatus();
  const { report } = useContext(PendingContext);

  useEffect(() => {
    if (!pending) return;
    report(true);
    return () => report(false);
  }, [pending, report]);

  return (
    <span
      aria-hidden
      className={cn(
        "skeleton pointer-events-none absolute h-0.5 rounded-full opacity-0 transition-tesla",
        pending && "opacity-100",
        className,
      )}
    />
  );
}

export function HeaderMark() {
  const { pending } = useContext(PendingContext);
  return (
    <TeslaMark
      motion={pending ? "breathe" : "none"}
      className="size-5 text-foreground"
      title={pending ? "Loading" : "Home"}
    />
  );
}
