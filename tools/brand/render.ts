import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { silverStops, teslaMarkPath } from "../../src/lib/logo";

const root = path.join(import.meta.dir, "../..");
const chrome =
  process.env.CHROME_PATH ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const work = mkdtempSync(path.join(tmpdir(), "my-tesla-brand-"));
const screenshot = pathToFileURL(
  path.join(root, "public/landing/overview-dark.png"),
).href;

const stops = silverStops
  .map(([offset, color]) => `<stop offset="${offset}" stop-color="${color}"/>`)
  .join("");

function gradients(id: string): string {
  return `<defs>
    <linearGradient id="${id}-tile" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2c3037"/><stop offset="1" stop-color="#0a0b0d"/>
    </linearGradient>
    <linearGradient id="${id}-silver" gradientUnits="userSpaceOnUse" x1="3" y1="0" x2="21" y2="24">${stops}</linearGradient>
  </defs>`;
}

function mark(id: string, size: number, inset: number): string {
  const scale = (160 - 2 * inset) / 24;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 160 160">
  ${gradients(id)}
  <rect width="160" height="160" fill="url(#${id}-tile)"/>
  <g transform="translate(${inset} ${inset}) scale(${scale})"><path fill="url(#${id}-silver)" d="${teslaMarkPath}"/></g>
</svg>`;
}

function tile(id: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
  ${gradients(id)}
  <rect x="1" y="1" width="158" height="158" rx="36" fill="url(#${id}-tile)" stroke="#ffffff" stroke-opacity="0.12" stroke-width="2"/>
  <g transform="translate(28 28) scale(4.3333)"><path fill="url(#${id}-silver)" d="${teslaMarkPath}"/></g>
</svg>`;
}

const card = `<!doctype html>
<html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600&display=block" rel="stylesheet">
<style>
:root { --u: min(calc(100vw / 1200), calc(100vh / 630)); }
* { box-sizing: border-box; }
html, body { margin: 0; height: 100%; }
body {
  display: grid; place-items: center; overflow: hidden;
  font-family: Inter, system-ui, sans-serif; color: #f4f5f7;
  -webkit-font-smoothing: antialiased;
  background:
    radial-gradient(ellipse 70% 95% at 0% 0%, #22262d 0%, rgba(34, 38, 45, 0) 70%),
    radial-gradient(ellipse 55% 70% at 100% 100%, #16191d 0%, rgba(22, 25, 29, 0) 70%),
    #0a0b0d;
}
.card { position: relative; width: calc(var(--u) * 1200); height: calc(var(--u) * 630); }
.copy {
  position: absolute; left: calc(var(--u) * 76); top: calc(var(--u) * 76);
  bottom: calc(var(--u) * 70); width: calc(var(--u) * 470);
  display: flex; flex-direction: column;
}
.logo { width: calc(var(--u) * 84); height: calc(var(--u) * 84); filter: drop-shadow(0 calc(var(--u) * 12) calc(var(--u) * 24) rgba(0, 0, 0, 0.55)); }
h1 {
  margin: calc(var(--u) * 58) 0 0; font-size: calc(var(--u) * 92); font-weight: 600;
  line-height: 1; letter-spacing: -0.035em;
  background: linear-gradient(180deg, #ffffff 0%, #c4c9cf 100%);
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
.tagline {
  margin: calc(var(--u) * 22) 0 0; font-size: calc(var(--u) * 31); line-height: 1.28;
  letter-spacing: -0.01em; color: #a3a8b0; text-wrap: balance;
}
.chips { display: flex; gap: calc(var(--u) * 10); margin-top: calc(var(--u) * 34); }
.chip {
  padding: calc(var(--u) * 9) calc(var(--u) * 17); border-radius: 999px;
  border: calc(var(--u) * 1.5) solid rgba(255, 255, 255, 0.14); background: rgba(255, 255, 255, 0.04);
  font-size: calc(var(--u) * 19); font-weight: 500; color: #d3d7dc;
}
.url {
  margin-top: auto; display: flex; align-items: center; gap: calc(var(--u) * 10);
  font-size: calc(var(--u) * 21); font-weight: 500; color: #8c939c;
}
.url::before { content: ""; width: calc(var(--u) * 8); height: calc(var(--u) * 8); border-radius: 50%; background: #2fd073; }
.shot {
  position: absolute; left: calc(var(--u) * 598); top: calc(var(--u) * 84);
  width: calc(var(--u) * 800); aspect-ratio: 1440 / 900; overflow: hidden;
  border-radius: calc(var(--u) * 18);
  box-shadow: 0 0 0 calc(var(--u) * 1) rgba(255, 255, 255, 0.1), 0 calc(var(--u) * 40) calc(var(--u) * 90) rgba(0, 0, 0, 0.6);
}
.shot img { display: block; width: 100%; height: 100%; }
.shot::after {
  content: ""; position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
  box-shadow: inset 0 calc(var(--u) * 1) 0 rgba(255, 255, 255, 0.16);
}
</style></head>
<body><div class="card">
  <div class="copy">
    <div class="logo">${tile("card")}</div>
    <h1>My Tesla</h1>
    <p class="tagline">A dashboard for your TeslaMate data</p>
    <div class="chips"><span class="chip">Self-hosted</span><span class="chip">Read-only</span><span class="chip">Open source</span></div>
    <div class="url">mytesla.chele.bi</div>
  </div>
  <div class="shot"><img src="${screenshot}" alt=""></div>
</div></body></html>`;

function render(
  name: string,
  html: string,
  width: number,
  height: number,
): string {
  const source = path.join(work, `${name}.html`);
  const output = path.join(work, `${name}.png`);
  writeFileSync(source, html);
  execFileSync(
    chrome,
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      "--default-background-color=00000000",
      "--virtual-time-budget=8000",
      `--window-size=${width},${height}`,
      `--screenshot=${output}`,
      pathToFileURL(source).href,
    ],
    { stdio: "ignore" },
  );
  return output;
}

function page(svg: string): string {
  return `<!doctype html><html><body style="margin:0;background:transparent">${svg.replace("<svg ", '<svg style="display:block;width:100vw;height:100vh" ')}</body></html>`;
}

function convert(
  input: string,
  format: "jpeg" | "png" | "ico",
  output: string,
  quality?: number,
) {
  mkdirSync(path.dirname(output), { recursive: true });
  const options = quality ? ["-s", "formatOptions", String(quality)] : [];
  execFileSync(
    "sips",
    ["-s", "format", format, ...options, input, "--out", output],
    { stdio: "ignore" },
  );
}

function icon(name: string, svg: string, size: number, output: string) {
  const large = render(name, page(svg), 1024, 1024);
  const sized = path.join(work, `${name}-${size}.png`);
  execFileSync(
    "sips",
    ["-z", String(size), String(size), large, "--out", sized],
    { stdio: "ignore" },
  );
  const target = path.join(root, output);
  if (target.endsWith(".ico")) {
    convert(sized, "ico", target);
    return;
  }
  mkdirSync(path.dirname(target), { recursive: true });
  copyFileSync(sized, target);
}

const preview = render("preview", card, 1200, 630);
convert(preview, "jpeg", path.join(root, "src/app/opengraph-image.jpg"), 86);
copyFileSync(
  path.join(root, "src/app/opengraph-image.jpg"),
  path.join(root, "src/app/twitter-image.jpg"),
);
convert(
  render("social", card, 1280, 640),
  "png",
  path.join(root, "docs/images/social-preview.png"),
);
icon("apple", mark("apple", 1024, 34), 180, "src/app/apple-icon.png");
icon("favicon", tile("favicon"), 32, "src/app/favicon.ico");
icon("icon-192", tile("icon"), 192, "public/icons/icon-192.png");
icon("icon-512", tile("icon"), 512, "public/icons/icon-512.png");
icon(
  "maskable",
  mark("maskable", 1024, 44),
  512,
  "public/icons/icon-maskable-512.png",
);

rmSync(work, { recursive: true, force: true });
for (const file of [
  "src/app/opengraph-image.jpg",
  "src/app/twitter-image.jpg",
  "src/app/apple-icon.png",
  "src/app/favicon.ico",
  "public/icons/icon-192.png",
  "public/icons/icon-512.png",
  "public/icons/icon-maskable-512.png",
  "docs/images/social-preview.png",
]) {
  console.log(
    `${file} ${Math.round(statSync(path.join(root, file)).size / 1024)} KB`,
  );
}
