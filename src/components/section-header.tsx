export function SectionHeader({
  title,
  summary,
}: {
  title: string;
  summary?: string;
}) {
  return (
    <header className="pt-8 pb-8 md:pt-14">
      <h1 className="text-[40px] leading-[1.2] font-medium">{title}</h1>
      {summary && (
        <p className="mt-2 text-sm text-muted-foreground tabular">{summary}</p>
      )}
    </header>
  );
}
