export type DateStyle = {
  timeZone: string;
  clock: "24h" | "12h";
  dateOrder: "day-month" | "month-day" | "iso";
};

const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const partFormats = new Map<string, Intl.DateTimeFormat>();

export type LocalParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: number;
};

export function localParts(date: Date, timeZone: string): LocalParts {
  let format = partFormats.get(timeZone);
  if (!format) {
    format = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    });
    partFormats.set(timeZone, format);
  }
  const parts = format.formatToParts(date);
  const value = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);
  const year = value("year");
  const month = value("month");
  const day = value("day");
  return {
    year,
    month,
    day,
    hour: value("hour") % 24,
    minute: value("minute"),
    weekday: new Date(Date.UTC(year, month - 1, day)).getUTCDay(),
  };
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function clockText(parts: LocalParts, style: DateStyle): string {
  if (style.clock === "24h") return `${pad(parts.hour)}:${pad(parts.minute)}`;
  const hour = parts.hour % 12 || 12;
  return `${hour}:${pad(parts.minute)} ${parts.hour < 12 ? "AM" : "PM"}`;
}

export function hourText(hour: number, style: DateStyle): string {
  if (style.clock === "24h") return `${pad(hour)}:00`;
  const wrapped = hour % 24;
  return `${wrapped % 12 || 12} ${wrapped < 12 ? "AM" : "PM"}`;
}

export function dayText(
  parts: LocalParts,
  style: DateStyle,
  withWeekday = true,
): string {
  const weekday = weekdayNames[parts.weekday];
  const month = monthNames[parts.month - 1];
  if (style.dateOrder === "iso") {
    const iso = `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
    return withWeekday ? `${weekday} ${iso}` : iso;
  }
  const body =
    style.dateOrder === "month-day"
      ? `${month} ${parts.day}`
      : `${parts.day} ${month}`;
  if (!withWeekday) return body;
  return style.dateOrder === "month-day"
    ? `${weekday}, ${body}`
    : `${weekday} ${body}`;
}

function monthText(parts: LocalParts, style: DateStyle): string {
  if (style.dateOrder === "iso") return `${parts.year}-${pad(parts.month)}`;
  return `${monthNames[parts.month - 1]} ${String(parts.year).slice(2)}`;
}

export function formatClockAt(date: Date, style: DateStyle): string {
  return clockText(localParts(date, style.timeZone), style);
}

export function formatDayAt(
  date: Date,
  style: DateStyle,
  withWeekday = true,
): string {
  return dayText(localParts(date, style.timeZone), style, withWeekday);
}

export function formatMonthAt(date: Date, style: DateStyle): string {
  return monthText(localParts(date, style.timeZone), style);
}
