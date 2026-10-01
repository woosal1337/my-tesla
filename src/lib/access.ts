import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";

export type AccessConfig = { teamDomain: string; audience: string };

export type AccessResult = { ok: true; email: string | null } | { ok: false };

export class AccessConfigError extends Error {
  name = "AccessConfigError";
}

type Environment = Record<string, string | undefined>;

export function readAccessConfig(
  environment: Environment,
): AccessConfig | null {
  const teamDomain = environment.CF_ACCESS_TEAM_DOMAIN?.trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "")
    .toLowerCase();
  const audience = environment.CF_ACCESS_AUD?.trim();
  if (!teamDomain && !audience) return null;
  if (!teamDomain || !audience) {
    throw new AccessConfigError(
      "Set both CF_ACCESS_TEAM_DOMAIN and CF_ACCESS_AUD.",
    );
  }
  if (!/^[a-z0-9-]+\.cloudflareaccess\.com$/.test(teamDomain)) {
    throw new AccessConfigError(
      "Set CF_ACCESS_TEAM_DOMAIN to your team domain, for example myteam.cloudflareaccess.com.",
    );
  }
  return { teamDomain, audience };
}

export function accessKeys(config: AccessConfig): JWTVerifyGetKey {
  return createRemoteJWKSet(
    new URL(`https://${config.teamDomain}/cdn-cgi/access/certs`),
  );
}

export async function verifyAccessToken(
  token: string | null,
  keys: JWTVerifyGetKey,
  config: AccessConfig,
): Promise<AccessResult> {
  if (!token) return { ok: false };
  try {
    const { payload } = await jwtVerify(token, keys, {
      issuer: `https://${config.teamDomain}`,
      audience: config.audience,
    });
    return {
      ok: true,
      email: typeof payload.email === "string" ? payload.email : null,
    };
  } catch {
    return { ok: false };
  }
}
