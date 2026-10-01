const defaultIdentityHeader = "cf-access-authenticated-user-email";
const ownerKey = "owner";

export function identityHeader(
  environment: Record<string, string | undefined> = process.env,
): string {
  const configured = environment.IDENTITY_HEADER?.trim().toLowerCase();
  if (!configured) return defaultIdentityHeader;
  if (!/^[a-z0-9-]{1,64}$/.test(configured)) {
    throw new Error(
      `Set IDENTITY_HEADER to an HTTP header name, not "${configured}".`,
    );
  }
  return configured;
}

export function viewerKey(email: string | null): string {
  const normalized = email?.trim().toLowerCase() ?? "";
  return /^[^\s@]{1,64}@[^\s@]{1,255}$/.test(normalized)
    ? normalized
    : ownerKey;
}
