export function isDemoMode(
  environment: Record<string, string | undefined> = process.env,
): boolean {
  const value = environment.DEMO_MODE?.trim().toLowerCase();
  return value === "1" || value === "true";
}
