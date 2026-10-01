"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const minimumGapMs = 2_000;

export function LiveStream({ carId }: { carId: number }) {
  const router = useRouter();

  useEffect(() => {
    const source = new EventSource(`/api/cars/${carId}/live`);
    let last = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      timer = undefined;
      if (document.visibilityState !== "visible") return;
      last = Date.now();
      router.refresh();
    };
    source.addEventListener("change", () => {
      if (timer) return;
      timer = setTimeout(
        refresh,
        Math.max(0, last + minimumGapMs - Date.now()),
      );
    });
    return () => {
      source.close();
      clearTimeout(timer);
    };
  }, [carId, router]);

  return null;
}
