const noBreakSpace = "\u00a0";
const separator = " · ";
const boundSeparator = ` ·${noBreakSpace}`;

export function summaryLine(parts: string[]): string {
  return parts
    .map((part) => part.replaceAll(" ", noBreakSpace))
    .join(boundSeparator);
}

export function dottedLine(text: string): string {
  return text
    .split(separator)
    .map((part) => part.replace(/(\d) /g, `$1${noBreakSpace}`))
    .join(boundSeparator);
}

export function headingLine(section: {
  title: string;
  total?: string[];
}): string {
  return summaryLine([section.title, ...(section.total ?? [])]);
}
