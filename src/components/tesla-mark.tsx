import { silverStops, teslaMarkPath } from "@/lib/logo";
import { project } from "@/lib/project";
import { cn } from "@/lib/utils";

type TeslaMarkProps = {
  className?: string;
  motion?: "draw" | "breathe" | "none";
  title?: string;
};

export function TeslaMark({
  className,
  motion = "none",
  title = "Tesla",
}: TeslaMarkProps) {
  return (
    <svg
      viewBox="-0.5 -0.5 25 25"
      role="img"
      aria-label={title}
      className={cn(
        "fill-current",
        motion === "draw" && "mark-draw",
        motion === "breathe" && "mark-breathe",
        className,
      )}
    >
      <path
        d={teslaMarkPath}
        pathLength={1}
        stroke="currentColor"
        strokeWidth={0.35}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LogoTile({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 160 160"
      role="img"
      aria-label={project.name}
      className={className}
    >
      <defs>
        <linearGradient id="logo-tile" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2c3037" />
          <stop offset="1" stopColor="#0a0b0d" />
        </linearGradient>
        <linearGradient
          id="logo-silver"
          gradientUnits="userSpaceOnUse"
          x1="3"
          y1="0"
          x2="21"
          y2="24"
        >
          {silverStops.map(([offset, color]) => (
            <stop key={offset} offset={offset} stopColor={color} />
          ))}
        </linearGradient>
      </defs>
      <rect
        x="1"
        y="1"
        width="158"
        height="158"
        rx="36"
        fill="url(#logo-tile)"
        stroke="#ffffff"
        strokeOpacity="0.12"
        strokeWidth="2"
      />
      <g transform="translate(28 28) scale(4.3333)">
        <path fill="url(#logo-silver)" d={teslaMarkPath} />
      </g>
    </svg>
  );
}
