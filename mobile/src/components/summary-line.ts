const noBreakSpace = "\u00a0";

export function summaryLine(parts: string[]): string {
  return parts.map((part) => part.replaceAll(" ", noBreakSpace)).join(" · ");
}
