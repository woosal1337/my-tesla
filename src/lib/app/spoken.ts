const per = (one: string, many: string, rest: string): [string, string] => [
  `${one} per ${rest}`,
  `${many} per ${rest}`,
];

const unitWords: Record<string, [one: string, many: string]> = {
  km: ["kilometer", "kilometers"],
  mi: ["mile", "miles"],
  min: ["minute", "minutes"],
  h: ["hour", "hours"],
  kW: ["kilowatt", "kilowatts"],
  kWh: ["kilowatt-hour", "kilowatt-hours"],
  "Wh/km": per("watt-hour", "watt-hours", "kilometer"),
  "Wh/mi": per("watt-hour", "watt-hours", "mile"),
  "kWh/100 km": per("kilowatt-hour", "kilowatt-hours", "100 kilometers"),
  "kWh/100 mi": per("kilowatt-hour", "kilowatt-hours", "100 miles"),
  "km/kWh": per("kilometer", "kilometers", "kilowatt-hour"),
  "mi/kWh": per("mile", "miles", "kilowatt-hour"),
};

const shortUnits = Object.keys(unitWords)
  .sort((a, b) => b.length - a.length)
  .map((unit) => unit.replace("/", "\\/"))
  .join("|");

const numberWithUnit = new RegExp(
  `(?<![\\d.,\\u00a0\\u202f])(\\d[\\d.,\\u00a0\\u202f]*)[ \\u00a0](${shortUnits})(?![\\w/])`,
  "g",
);

export function spokenLabel(
  parts: (string | null | undefined | false)[],
): string {
  return parts
    .filter(Boolean)
    .join(", ")
    .replaceAll(" · ", ", ")
    .replace(/ [→–] /g, " to ")
    .replace(numberWithUnit, (_, digits: string, unit: string) => {
      const count = digits.replace(/^0+(?=\d)/, "");
      const [one, many] = unitWords[unit]!;
      return `${count} ${count === "1" ? one : many}`;
    });
}
