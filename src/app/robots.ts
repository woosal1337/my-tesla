import type { MetadataRoute } from "next";
import { isDemoMode } from "@/lib/demo/mode";
import { siteLink, siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  if (!isDemoMode()) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  const site = siteUrl(process.env);
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: site ? siteLink(site, "sitemap.xml") : undefined,
  };
}
