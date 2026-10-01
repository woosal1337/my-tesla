import { project } from "./project";

type Environment = Record<string, string | undefined>;

export class SiteUrlError extends Error {
  name = "SiteUrlError";
}

export const siteDescription =
  "A self-hosted, read-only dashboard for the car data that TeslaMate records.";

export const siteTagline = "A dashboard for your TeslaMate data";

function withScheme(value: string): string {
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `https://${value}`;
}

export function siteUrl(environment: Environment): URL | null {
  const value =
    environment.SITE_URL?.trim() ||
    environment.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (!value) return null;
  let url: URL;
  try {
    url = new URL(withScheme(value));
  } catch {
    throw new SiteUrlError(
      "Set SITE_URL to the public address, for example https://tesla.example.com.",
    );
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new SiteUrlError("Use the https or http scheme in SITE_URL.");
  }
  return new URL(url.origin + url.pathname.replace(/\/+$/, ""));
}

export function siteLink(site: URL, path: string): string {
  const base = site.toString();
  return new URL(
    path.replace(/^\/+/, ""),
    base.endsWith("/") ? base : `${base}/`,
  ).toString();
}

export function softwareApplication(site: URL | null) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: project.name,
    description: siteDescription,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Linux, macOS, Windows (Docker)",
    isAccessibleForFree: true,
    license: "https://www.gnu.org/licenses/agpl-3.0.html",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    sameAs: [project.repositoryUrl],
    ...(site && {
      url: site.toString(),
      image: siteLink(site, "opengraph-image.jpg"),
    }),
  };
}
