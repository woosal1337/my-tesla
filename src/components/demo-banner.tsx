import Link from "next/link";
import { analyticsEvents, eventProps } from "@/lib/analytics";
import { project } from "@/lib/project";

export function DemoBanner() {
  return (
    <div className="demo-banner bg-primary text-primary-foreground">
      <div className="mx-auto flex h-9 max-w-5xl items-center justify-between gap-4 px-5 text-xs sm:text-sm">
        <p className="truncate">
          Demo with synthetic data around Phoenix, Arizona
        </p>
        <div className="flex shrink-0 items-center gap-4 font-medium">
          <Link
            href="/"
            {...eventProps(analyticsEvents.landingOpen)}
            className="underline-offset-4 hover:underline"
          >
            About {project.name}
          </Link>
          <a
            href={project.installUrl}
            {...eventProps(analyticsEvents.installOpen, { place: "banner" })}
            target="_blank"
            rel="noreferrer"
            className="hidden underline-offset-4 hover:underline sm:inline"
          >
            Install it
          </a>
        </div>
      </div>
    </div>
  );
}
