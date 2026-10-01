const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const hours = Array.from({ length: 24 }, (_, hour) => hour);

export function WeekHeatmap({
  grid,
  sundayFirst,
  hourLabel,
}: {
  grid: number[][];
  sundayFirst: boolean;
  hourLabel: (hour: number) => string;
}) {
  const order = sundayFirst ? [6, 0, 1, 2, 3, 4, 5] : [0, 1, 2, 3, 4, 5, 6];
  const max = Math.max(1, ...grid.flat());
  return (
    <div>
      <div className="grid grid-cols-[2.25rem_1fr] gap-x-2 gap-y-1">
        {order
          .map((day) => ({ day, row: grid[day] }))
          .map(({ day, row }) => (
            <div key={weekdays[day]} className="contents">
              <span className="self-center text-xs text-subtle">
                {weekdays[day]}
              </span>
              <div className="grid grid-cols-24 gap-0.5 sm:gap-1">
                {hours.map((hour) => {
                  const count = row[hour];
                  return (
                    <span
                      key={hour}
                      title={`${weekdays[day]} ${hourLabel(hour)} · ${count} ${count === 1 ? "drive" : "drives"}`}
                      className="aspect-square rounded-[2px] bg-muted"
                    >
                      {count > 0 && (
                        <span
                          className="block size-full rounded-[2px] bg-primary"
                          style={{ opacity: 0.2 + (count / max) * 0.8 }}
                        />
                      )}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
      </div>
      <div className="mt-2 grid grid-cols-[2.25rem_1fr] gap-x-2">
        <span />
        <div className="flex justify-between text-[11px] text-subtle tabular">
          {[0, 6, 12, 18, 24].map((hour) => (
            <span key={hour}>{hourLabel(hour)}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
