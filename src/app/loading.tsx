import { ViewTransition } from "react";
import { TeslaMark } from "@/components/tesla-mark";

export default function Loading() {
  return (
    <ViewTransition exit="slide-down" default="none">
      <div className="grid min-h-dvh place-items-center">
        <TeslaMark motion="breathe" className="size-14 text-foreground" />
      </div>
    </ViewTransition>
  );
}
