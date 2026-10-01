import { ViewTransition, type ReactNode } from "react";

const directional = {
  "tab-forward": "tab-forward",
  "tab-back": "tab-back",
  "car-swap": "car-swap",
};

export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition
      enter={{ ...directional, default: "slide-up" }}
      exit={{ ...directional, default: "none" }}
      default="none"
    >
      <div>{children}</div>
    </ViewTransition>
  );
}
