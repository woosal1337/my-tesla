import { beforeAll, describe, expect, test } from "bun:test";
import {
  createLocalJWKSet,
  exportJWK,
  generateKeyPair,
  SignJWT,
  type JWTVerifyGetKey,
} from "jose";
import {
  AccessConfigError,
  readAccessConfig,
  verifyAccessToken,
} from "./access";

const access = { teamDomain: "team.cloudflareaccess.com", audience: "aud-1" };
let keys: JWTVerifyGetKey;
let sign: (
  claims: Record<string, unknown>,
  options?: { issuer?: string; audience?: string; expires?: string },
) => Promise<string>;

beforeAll(async () => {
  const { publicKey, privateKey } = await generateKeyPair("RS256");
  const jwk = { ...(await exportJWK(publicKey)), kid: "key-1", alg: "RS256" };
  keys = createLocalJWKSet({ keys: [jwk] });
  sign = (claims, options = {}) =>
    new SignJWT(claims)
      .setProtectedHeader({ alg: "RS256", kid: "key-1" })
      .setIssuer(options.issuer ?? "https://team.cloudflareaccess.com")
      .setAudience(options.audience ?? "aud-1")
      .setIssuedAt()
      .setExpirationTime(options.expires ?? "5m")
      .sign(privateKey);
});

describe("readAccessConfig", () => {
  test("is off without both values", () => {
    expect(readAccessConfig({})).toBeNull();
  });

  test("reads the team domain and the audience", () => {
    expect(
      readAccessConfig({
        CF_ACCESS_TEAM_DOMAIN: "https://Team.cloudflareaccess.com/",
        CF_ACCESS_AUD: " aud-1 ",
      }),
    ).toEqual(access);
  });

  test.each([
    [{ CF_ACCESS_TEAM_DOMAIN: "team.cloudflareaccess.com" }],
    [{ CF_ACCESS_AUD: "aud-1" }],
    [{ CF_ACCESS_TEAM_DOMAIN: "evil.example.com", CF_ACCESS_AUD: "aud-1" }],
  ])("refuses %p", (environment) => {
    expect(() => readAccessConfig(environment)).toThrow(AccessConfigError);
  });
});

describe("verifyAccessToken", () => {
  test("accepts a signed token and gives the email", async () => {
    const token = await sign({ email: "owner@example.com" });
    expect(await verifyAccessToken(token, keys, access)).toEqual({
      ok: true,
      email: "owner@example.com",
    });
  });

  test("accepts a service token without an email", async () => {
    const token = await sign({ common_name: "client-id" });
    expect(await verifyAccessToken(token, keys, access)).toEqual({
      ok: true,
      email: null,
    });
  });

  test("refuses a missing token", async () => {
    expect(await verifyAccessToken(null, keys, access)).toEqual({ ok: false });
  });

  test("refuses another audience, another issuer, and an old token", async () => {
    for (const token of [
      await sign({ email: "a@example.com" }, { audience: "other" }),
      await sign(
        { email: "a@example.com" },
        { issuer: "https://evil.cloudflareaccess.com" },
      ),
      await sign({ email: "a@example.com" }, { expires: "-1m" }),
      "not.a.token",
    ]) {
      expect(await verifyAccessToken(token, keys, access)).toEqual({
        ok: false,
      });
    }
  });

  test("refuses a token signed with another key", async () => {
    const other = await generateKeyPair("RS256");
    const token = await new SignJWT({ email: "a@example.com" })
      .setProtectedHeader({ alg: "RS256", kid: "key-1" })
      .setIssuer("https://team.cloudflareaccess.com")
      .setAudience("aud-1")
      .setExpirationTime("5m")
      .sign(other.privateKey);
    expect(await verifyAccessToken(token, keys, access)).toEqual({ ok: false });
  });
});
