import { describe, expect, test } from "bun:test";
import { SiteUrlError, siteLink, siteUrl, softwareApplication } from "./site";

describe("siteUrl", () => {
  test("prefers SITE_URL", () => {
    expect(
      siteUrl({
        SITE_URL: "https://tesla.example.com/",
        VERCEL_PROJECT_PRODUCTION_URL: "my-tesla.vercel.app",
      })?.toString(),
    ).toBe("https://tesla.example.com/");
  });

  test("uses the Vercel production domain without SITE_URL", () => {
    expect(
      siteUrl({
        VERCEL_PROJECT_PRODUCTION_URL: "mytesla.chele.bi",
      })?.toString(),
    ).toBe("https://mytesla.chele.bi/");
  });

  test("keeps a base path and drops a trailing slash", () => {
    expect(
      siteUrl({ SITE_URL: "https://example.com/tesla/" })?.toString(),
    ).toBe("https://example.com/tesla");
  });

  test("is empty without a value", () => {
    expect(siteUrl({})).toBeNull();
    expect(siteUrl({ SITE_URL: " " })).toBeNull();
  });

  test.each(["https://", "ftp://example.com"])("refuses %s", (value) => {
    expect(() => siteUrl({ SITE_URL: value })).toThrow(SiteUrlError);
  });
});

describe("siteLink", () => {
  test("joins a path to the root and to a base path", () => {
    expect(siteLink(new URL("https://mytesla.chele.bi"), "/sitemap.xml")).toBe(
      "https://mytesla.chele.bi/sitemap.xml",
    );
    expect(siteLink(new URL("https://example.com/tesla"), "sitemap.xml")).toBe(
      "https://example.com/tesla/sitemap.xml",
    );
  });
});

describe("softwareApplication", () => {
  test("links the site and its preview image", () => {
    const data = softwareApplication(new URL("https://mytesla.chele.bi"));
    expect(data["@type"]).toBe("SoftwareApplication");
    expect(data.url).toBe("https://mytesla.chele.bi/");
    expect(data.image).toBe("https://mytesla.chele.bi/opengraph-image.jpg");
  });

  test("keeps a base path in the image link", () => {
    const data = softwareApplication(new URL("https://example.com/tesla"));
    expect(data.image).toBe("https://example.com/tesla/opengraph-image.jpg");
  });

  test("leaves out the links without a site", () => {
    const data = softwareApplication(null);
    expect("url" in data).toBe(false);
    expect(data.offers.price).toBe("0");
  });
});
