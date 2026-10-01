import {
  ArrowRight,
  BatteryCharging,
  BatteryMedium,
  CalendarClock,
  ChartNoAxesColumn,
  Database,
  EyeOff,
  Gauge,
  MapPin,
  Route,
  Server,
  Settings,
  ShieldCheck,
  Star,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { LogoTile } from "@/components/tesla-mark";
import { project } from "@/lib/project";
import { cn } from "@/lib/utils";

const demoHref = `/cars/${project.demoCarId}`;

const features = [
  {
    icon: Gauge,
    title: "Overview",
    text: "Battery, range, odometer, temperatures, tires, and the last position on a map.",
  },
  {
    icon: Route,
    title: "Drives",
    text: "Every drive by day, with distance, efficiency, and the route on a map.",
  },
  {
    icon: BatteryCharging,
    title: "Charging",
    text: "Each session with its power curve, voltage, current, and cost.",
  },
  {
    icon: CalendarClock,
    title: "Timeline",
    text: "One day at a time: driving, charging, parked, and asleep.",
  },
  {
    icon: BatteryMedium,
    title: "Battery",
    text: "Estimated health, capacity, range at 100 %, and idle drain.",
  },
  {
    icon: ChartNoAxesColumn,
    title: "Stats",
    text: "Distance, energy, cost, and efficiency against temperature.",
  },
  {
    icon: MapPin,
    title: "Places",
    text: "Visited places, charging places, and their cost on one map.",
  },
  {
    icon: Settings,
    title: "Settings",
    text: "Miles or kilometers, °F or °C, psi or bar, clock, theme, and tabs.",
  },
];

const gallery = [
  { src: "/landing/battery-dark.png", title: "Battery health and idle drain" },
  { src: "/landing/stats-dark.png", title: "Stats over any period" },
  { src: "/landing/places-dark.png", title: "Places and charging cost" },
];

const steps = [
  {
    title: "Create a read-only role",
    code: "CREATE ROLE teslamate_ro WITH LOGIN PASSWORD '…';\nGRANT SELECT ON ALL TABLES IN SCHEMA public TO teslamate_ro;",
  },
  {
    title: "Add one service to your TeslaMate Compose file",
    code: "dashboard:\n  image: ghcr.io/woosal1337/my-tesla:latest\n  environment:\n    DATABASE_URL: postgresql://teslamate_ro:…@database/teslamate",
  },
  {
    title: "Put a login in front of it",
    code: "Cloudflare Access, Tailscale, Authelia,\nAuthentik, or oauth2-proxy",
  },
];

const principles = [
  {
    icon: ShieldCheck,
    title: "Read-only by design",
    text: "The app connects with a role that can only read, and refuses the TeslaMate superuser.",
  },
  {
    icon: Server,
    title: "Your server, your data",
    text: "Every page renders on your server. No analytics and no telemetry.",
  },
  {
    icon: EyeOff,
    title: "Hide the maps",
    text: "One setting removes every map, route, and place before you share the screen.",
  },
];

function GitHubMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden
      className={cn("fill-current", className)}
    >
      <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8 8 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

function GitHubButton({ stars }: { stars: number | null }) {
  return (
    <a
      href={project.repositoryUrl}
      target="_blank"
      rel="noreferrer"
      className="inline-flex h-9 items-center gap-2 rounded bg-card px-3 text-sm font-medium transition-tesla hover:bg-accent"
    >
      <GitHubMark className="size-4" />
      <span className="hidden sm:inline">GitHub</span>
      {stars !== null && (
        <span className="flex items-center gap-1 border-l border-border pl-2 text-muted-foreground tabular">
          <Star className="size-3.5" />
          {stars.toLocaleString("en-US")}
        </span>
      )}
    </a>
  );
}

function DemoButton({ size = "md" }: { size?: "md" | "lg" }) {
  return (
    <Link
      href={demoHref}
      className={cn(
        "inline-flex items-center gap-2 rounded bg-primary font-medium text-primary-foreground transition-tesla hover:bg-primary/90",
        size === "lg" ? "h-11 px-6 text-base" : "h-9 px-4 text-sm",
      )}
    >
      Try the demo
      <ArrowRight className="size-4" />
    </Link>
  );
}

function Section({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20 py-20 md:py-28">
      <p className="text-sm font-medium text-primary">{eyebrow}</p>
      <h2 className="mt-2 max-w-2xl text-[28px] leading-tight font-medium md:text-[36px]">
        {title}
      </h2>
      <div className="mt-10">{children}</div>
    </section>
  );
}

function Screenshot({
  name,
  alt,
  preload = false,
}: {
  name: string;
  alt: string;
  preload?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <Image
        src={`/landing/${name}-light.png`}
        alt={alt}
        width={1440}
        height={900}
        preload={preload}
        className="block h-auto w-full dark:hidden"
      />
      <Image
        src={`/landing/${name}-dark.png`}
        alt={alt}
        width={1440}
        height={900}
        preload={preload}
        className="hidden h-auto w-full dark:block"
      />
    </div>
  );
}

export function Landing({ stars }: { stars: number | null }) {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-50 bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-5">
          <Link href="/" className="flex items-center gap-2.5">
            <LogoTile className="size-8" />
            <span className="font-medium">{project.name}</span>
          </Link>
          <nav
            aria-label="Page"
            className="hidden items-center gap-1 text-sm md:flex"
          >
            {[
              ["#features", "Features"],
              ["#self-host", "Self-host"],
              ["#privacy", "Privacy"],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="rounded px-3 py-1.5 text-muted-foreground transition-tesla hover:text-foreground"
              >
                {label}
              </a>
            ))}
            <a
              href={project.docsUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded px-3 py-1.5 text-muted-foreground transition-tesla hover:text-foreground"
            >
              Docs
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <GitHubButton stars={stars} />
            <DemoButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5">
        <section className="pt-16 text-center md:pt-24">
          <p className="text-sm text-muted-foreground">
            Open source · Self-hosted · Read-only
          </p>
          <h1 className="mx-auto mt-4 max-w-3xl text-[40px] leading-[1.1] font-medium tracking-tight md:text-[60px]">
            Every drive, charge, and kilometer of your Tesla.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            {project.name} is a dashboard for the data that TeslaMate records.
            It runs on your server, only reads your database, and looks like the
            Tesla app.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <DemoButton size="lg" />
            <a
              href={project.installUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center rounded bg-card px-6 text-base font-medium transition-tesla hover:bg-accent"
            >
              Install it
            </a>
          </div>
          <div className="mt-14 md:mt-20">
            <Screenshot
              name="overview"
              alt="The Overview page of the demo car"
              preload
            />
          </div>
        </section>

        <Section
          id="features"
          eyebrow="Features"
          title="Eight pages for everything TeslaMate records."
        >
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <li key={feature.title} className="rounded-xl bg-card p-5">
                <feature.icon
                  className="size-5 text-primary"
                  strokeWidth={1.75}
                />
                <p className="mt-4 font-medium">{feature.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {feature.text}
                </p>
              </li>
            ))}
          </ul>
          <ul className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            {gallery.map((image) => (
              <li key={image.src}>
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                  <Image
                    src={image.src}
                    alt={image.title}
                    width={1440}
                    height={900}
                    className="block h-auto w-full"
                  />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {image.title}
                </p>
              </li>
            ))}
          </ul>
        </Section>

        <Section
          id="self-host"
          eyebrow="Self-host"
          title="Next to your TeslaMate stack, in three steps."
        >
          <ol className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {steps.map((step, index) => (
              <li
                key={step.title}
                className="flex flex-col rounded-xl bg-card p-5"
              >
                <span className="grid size-7 place-items-center rounded-full bg-background text-sm font-medium tabular">
                  {index + 1}
                </span>
                <p className="mt-4 font-medium">{step.title}</p>
                <pre className="mt-4 flex-1 rounded bg-background p-4 text-xs leading-relaxed break-all whitespace-pre-wrap text-muted-foreground">
                  <code>{step.code}</code>
                </pre>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-sm text-muted-foreground">
            The{" "}
            <a
              href={project.installUrl}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-foreground underline underline-offset-4"
            >
              installation guide
            </a>{" "}
            covers Docker Compose, Coolify, and runs from source.
          </p>
        </Section>

        <Section
          id="privacy"
          eyebrow="Privacy"
          title="A location history deserves care."
        >
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {principles.map((principle) => (
              <li key={principle.title} className="rounded-xl bg-card p-5">
                <principle.icon
                  className="size-5 text-primary"
                  strokeWidth={1.75}
                />
                <p className="mt-4 font-medium">{principle.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {principle.text}
                </p>
              </li>
            ))}
          </ul>
        </Section>

        <section className="mb-20 rounded-2xl bg-card px-6 py-14 text-center md:py-20">
          <Database
            className="mx-auto size-6 text-primary"
            strokeWidth={1.75}
          />
          <h2 className="mx-auto mt-4 max-w-xl text-[28px] leading-tight font-medium md:text-[36px]">
            See it with 60 days of demo data.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            The demo uses synthetic drives around Phoenix, Arizona. Your
            settings in the demo stay in your browser.
          </p>
          <div className="mt-8 flex justify-center">
            <DemoButton size="lg" />
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl space-y-4 px-5 py-10 text-sm text-muted-foreground">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p>
              {project.name} ·{" "}
              <a
                href={project.licenseUrl}
                target="_blank"
                rel="noreferrer"
                className="hover:text-foreground"
              >
                AGPL-3.0-or-later
              </a>
            </p>
            <div className="flex gap-5">
              <a
                href={project.repositoryUrl}
                target="_blank"
                rel="noreferrer"
                className="hover:text-foreground"
              >
                GitHub
              </a>
              <a
                href={project.docsUrl}
                target="_blank"
                rel="noreferrer"
                className="hover:text-foreground"
              >
                Docs
              </a>
              <a
                href={project.teslamateUrl}
                target="_blank"
                rel="noreferrer"
                className="hover:text-foreground"
              >
                TeslaMate
              </a>
            </div>
          </div>
          <p className="text-xs text-subtle">
            This project is an unofficial community tool and is not affiliated
            with, endorsed by, or supported by the official TeslaMate project.
            &quot;Tesla&quot; and related marks are trademarks of Tesla, Inc.
            This project is not affiliated with Tesla, Inc.
          </p>
        </div>
      </footer>
    </div>
  );
}
