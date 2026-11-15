const noBreakSpace = "\u00a0";

export function summaryLine(parts: string[]): string {
  return parts.map((part) => part.replaceAll(" ", noBreakSpace)).join(" · ");
}

export function headingLine(section: {
  title: string;
  total?: string[];
}): string {
  return summaryLine([section.title, ...(section.total ?? [])]);
}
