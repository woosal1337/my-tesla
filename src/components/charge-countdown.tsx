"use client";

import { useEffect, useState } from "react";
import { durationText } from "@/lib/format";

const tickMs = 15_000;

export function ChargeCountdown({
  fullAt,
  renderedAt,
}: {
  fullAt: number;
  renderedAt: number;
}) {
  const [now, setNow] = useState(renderedAt);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), tickMs);
    return () => clearInterval(timer);
  }, []);

  const minutes = (fullAt - Math.max(now, renderedAt)) / 60_000;
  return (
    <span className="tabular">
      {minutes < 1 ? "Almost done" : `${durationText(minutes)} left`}
    </span>
  );
}
