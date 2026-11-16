import type { Assessment } from "../assessment";
import type { AppStat, AppValue } from "./contract";

export function appValue(
  text: string,
  assessment: Assessment | null = null,
): AppValue {
  if (!assessment) return { text, tone: null, note: null };
  return {
    text,
    tone: assessment.tone === "typical" ? null : assessment.tone,
    note: `${assessment.verdict}. ${assessment.meaning} ${assessment.expected}`,
  };
}

export function appStat(
  label: string,
  text: string,
  options: { detail?: string | null; assessment?: Assessment | null } = {},
): AppStat {
  return {
    label,
    value: appValue(text, options.assessment ?? null),
    detail: options.detail ?? null,
  };
}

export const noRecordCell: AppValue = appValue("No record");

export function hasValue(text: string): boolean {
  return /[\p{L}\p{N}]/u.test(text);
}

export function statsWithValue(stats: AppStat[]): AppStat[] {
  return stats.filter(
    (stat) => hasValue(stat.value.text) || stat.detail !== null,
  );
}

export function levelsText(start: number | null, end: number | null): string {
  return `${start ?? "—"}% → ${end ?? "—"}%`;
}
