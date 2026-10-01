import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Splash } from "@/components/splash";
import { getPreferences } from "@/lib/viewer";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  axes: ["opsz"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "My Tesla", template: "%s · My Tesla" },
  description: "A self-hosted, read-only dashboard for TeslaMate data.",
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
  return (
    <html
      lang="en"
      className={inter.variable}
      data-theme={
        preferences.theme === "system" ? undefined : preferences.theme
      }
      data-motion={preferences.motion}
    >
      <body className="min-h-dvh">
        {preferences.splash && <Splash />}
        {children}
      </body>
    </html>
  );
}
