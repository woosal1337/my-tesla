import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Splash } from "@/components/splash";
import { readAnalyticsConfig } from "@/lib/analytics";
import { isDemoMode } from "@/lib/demo/mode";
import { project } from "@/lib/project";
import { siteDescription, siteTagline, siteUrl } from "@/lib/site";
import { getPreferences } from "@/lib/viewer";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  axes: ["opsz"],
  variable: "--font-inter",
  display: "swap",
});

const shareTitle = `${project.name} · ${siteTagline}`;

export const metadata: Metadata = {
  metadataBase: siteUrl(process.env),
  title: { default: project.name, template: `%s · ${project.name}` },
  description: siteDescription,
  applicationName: project.name,
  authors: [
    { name: `${project.name} contributors`, url: project.repositoryUrl },
  ],
  keywords: [
    "Tesla",
    "TeslaMate",
    "dashboard",
    "self-hosted",
    "electric vehicle",
    "battery health",
    "charging",
    "MQTT",
  ],
  category: "technology",
  openGraph: {
    type: "website",
    siteName: project.name,
    locale: "en_US",
    title: shareTitle,
    description: siteDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: shareTitle,
    description: siteDescription,
  },
  appleWebApp: {
    capable: true,
    title: project.name,
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false, address: false, email: false },
  robots: { index: false, follow: false },
};

export const instant = false;

const themeColors = { light: "#ffffff", dark: "#111215" };

export async function generateViewport(): Promise<Viewport> {
  const { theme } = await getPreferences();
  return {
    viewportFit: "cover",
    themeColor:
      theme === "system"
        ? [
            {
              media: "(prefers-color-scheme: light)",
              color: themeColors.light,
            },
            { media: "(prefers-color-scheme: dark)", color: themeColors.dark },
          ]
        : themeColors[theme],
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const preferences = await getPreferences();
  const analytics = isDemoMode() ? readAnalyticsConfig(process.env) : null;
  return (
    <html
      lang="en"
      className={inter.variable}
      data-theme={
        preferences.theme === "system" ? undefined : preferences.theme
      }
      data-motion={preferences.motion}
    >
      <head>
        {analytics && (
          <script
            async
            src={`${analytics.collectorUrl}/oa.js`}
            data-key={analytics.key}
            data-collector={analytics.collectorUrl}
            data-respect-dnt="true"
            data-respect-gpc="true"
          />
        )}
      </head>
      <body className="min-h-dvh">
        {preferences.splash && <Splash />}
        {children}
      </body>
    </html>
  );
}
