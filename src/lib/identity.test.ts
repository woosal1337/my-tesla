import { describe, expect, test } from "bun:test";
import { identityHeader, viewerKey } from "./identity";

describe("identityHeader", () => {
  test("uses the Cloudflare Access header by default", () => {
    expect(identityHeader({})).toBe("cf-access-authenticated-user-email");
    expect(identityHeader({ IDENTITY_HEADER: "  " })).toBe(
      "cf-access-authenticated-user-email",
    );
  });

  test("accepts another header name in any case", () => {
    expect(identityHeader({ IDENTITY_HEADER: "Remote-Email" })).toBe(
      "remote-email",
    );
  });

  test("refuses a value that is not a header name", () => {
    expect(() => identityHeader({ IDENTITY_HEADER: "x: y" })).toThrow(
      "Set IDENTITY_HEADER",
    );
  });
});

describe("viewerKey", () => {
  test("keys the settings by the lowercase email", () => {
    expect(viewerKey(" Driver@Example.com ")).toBe("driver@example.com");
  });

  test("falls back to the shared owner key", () => {
    expect(viewerKey(null)).toBe("owner");
    expect(viewerKey("not an email")).toBe("owner");
  });
});
