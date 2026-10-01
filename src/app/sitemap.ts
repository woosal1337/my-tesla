import type { MetadataRoute } from "next";
import { isDemoMode } from "@/lib/demo/mode";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const site = siteUrl(process.env);
  if (!isDemoMode() || !site) return [];
  return [
    {
      url: site.toString(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
