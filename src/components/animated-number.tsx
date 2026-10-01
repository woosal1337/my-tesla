"use client";

import NumberFlow, { type Format } from "@number-flow/react";

type AnimatedNumberProps = {
  value: number | null;
  format?: Format;
  suffix?: string;
  locale?: string;
  animated?: boolean;
  className?: string;
};

export function AnimatedNumber({
  value,
  format,
  suffix,
  locale = "en-US",
  animated = true,
  className,
}: AnimatedNumberProps) {
  if (value === null || !Number.isFinite(value)) {
    return <span className={className}>—</span>;
  }
  return (
    <NumberFlow
      value={value}
      format={format}
      suffix={suffix}
      locales={locale}
      animated={animated}
      className={className}
      willChange
    />
  );
}
