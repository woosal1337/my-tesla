import { periods, type PeriodId } from "@/lib/insights";
import { SegmentedLinks } from "./segmented-links";

export function PeriodLinks({
  base,
  active,
}: {
  base: string;
  active: PeriodId;
}) {
  return (
    <SegmentedLinks
      label="Period"
      active={active}
      items={periods.map((period) => ({
        id: period.id,
        label: period.label,
        href: `${base}?period=${period.id}`,
      }))}
    />
  );
}
