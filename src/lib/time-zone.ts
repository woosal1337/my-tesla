export const defaultTimeZone = "UTC";

export function readTimeZone(
  environment: Record<string, string | undefined>,
): string {
  const value = environment.DISPLAY_TIME_ZONE?.trim();
  if (!value) return defaultTimeZone;
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
  } catch {
    throw new Error(
      `Set DISPLAY_TIME_ZONE to an IANA time zone, not "${value}".`,
    );
  }
  return value;
}
