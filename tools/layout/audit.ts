import { chromium, webkit, type Browser, type Page } from "playwright-core";

const base = (process.env.BASE_URL ?? "http://localhost:3000").replace(
  /\/$/,
  "",
);
const widths = [390, 768, 1007, 1280, 1440];
const settings = [
  { pressure: "bar", distance: "km", temperature: "c", currency: "none" },
  { pressure: "psi", distance: "mi", temperature: "f", currency: "TRY" },
].map((units) => ({ ...units, theme: "dark", splash: false }));
const engines: Record<string, () => Promise<Browser>> = {
  webkit: () => webkit.launch(),
  chromium: () => chromium.launch(),
};

type Report = { wrapped: string[]; cut: string[]; overflow: number };

function measure(): Report {
  const label = (element: Element) =>
    ((element as HTMLElement).innerText || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 30);
  const shown = (element: Element) => {
    const box = element.getBoundingClientRect();
    return (
      box.width > 0 &&
      box.height > 0 &&
      (element as HTMLElement).offsetParent !== null
    );
  };
  const lines = (element: Element) => {
    const tops = new Set<number>();
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (node.parentElement?.closest(".sr-only")) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      for (const rect of range.getClientRects()) {
        if (rect.width > 1 && rect.height > 1)
          tops.add(Math.round(rect.top / 4));
      }
    }
    return tops.size;
  };
  const wrapped = [
    ...document.querySelectorAll(
      "button.cursor-help, dd span.whitespace-nowrap, dd.truncate",
    ),
  ]
    .filter((element) => shown(element) && lines(element) > 1)
    .map(label);
  const cut = [...document.querySelectorAll("dd, dt, dl span")]
    .filter((element) => {
      const box = element as HTMLElement;
      return (
        shown(element) &&
        box.scrollWidth > box.clientWidth + 1 &&
        /\d/.test(box.innerText) &&
        box.innerText.length < 24
      );
    })
    .map(label);
  return {
    wrapped,
    cut,
    overflow: document.documentElement.scrollWidth - window.innerWidth,
  };
}

async function firstLink(page: Page, path: string, pattern: RegExp) {
  await page.goto(base + path, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("a[href]", { state: "attached" });
  const links = await page
    .locator("a[href]")
    .evaluateAll((anchors) => anchors.map((a) => a.getAttribute("href") ?? ""));
  return links.find((href) => pattern.test(href)) ?? null;
}

async function openPage(browser: Browser, width: number, preferences: object) {
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    colorScheme: "dark",
  });
  await context.addCookies([
    {
      name: "my-tesla-settings",
      value: encodeURIComponent(JSON.stringify(preferences)),
      url: base,
    },
  ]);
  return { context, page: await context.newPage() };
}

async function pagesToCheck(browser: Browser): Promise<string[]> {
  const { context, page } = await openPage(browser, 1280, settings[0]);
  const car = (await firstLink(page, "/", /^\/cars\/\d+$/)) ?? "/cars/1";
  const drive = await firstLink(page, `${car}/drives`, /\/drives\/\d+$/);
  const charge = await firstLink(page, `${car}/charging`, /\/charging\/\d+$/);
  await context.close();
  return [
    car,
    `${car}/drives`,
    drive,
    `${car}/drives/trip`,
    `${car}/charging`,
    charge,
    `${car}/charging/insights`,
    `${car}/battery`,
    `${car}/stats`,
    `${car}/places`,
    `${car}/timeline`,
    `${car}/settings`,
  ].filter((path): path is string => path !== null);
}

const chosen = process.argv.slice(2).filter((name) => name in engines);
const problems: string[] = [];
const finished = new Set<string>();
let lastProgress = Date.now();
const watchdog = setInterval(() => {
  if (Date.now() - lastProgress < 90_000) return;
  console.error("The check made no progress for 90 s. A browser stopped.");
  process.exit(2);
}, 10_000);
for (const name of chosen.length ? chosen : Object.keys(engines)) {
  const browser = await engines[name]();
  browser.on("disconnected", () => {
    if (finished.has(name)) return;
    console.error(`${name}: the browser closed during the check.`);
    process.exit(2);
  });
  const paths = await pagesToCheck(browser);
  for (const preferences of settings) {
    for (const width of widths) {
      const opened = await openPage(browser, width, preferences);
      const context = opened.context;
      let page = opened.page;
      for (const path of paths) {
        const where = `${name} ${width}px ${preferences.pressure} ${path}`;
        try {
          await page.goto(base + path, {
            waitUntil: "domcontentloaded",
            timeout: 60_000,
          });
          await page.waitForSelector("main", { timeout: 30_000 });
        } catch {
          problems.push(`${where}: the page did not load`);
          continue;
        }
        await page.waitForTimeout(1_200);
        const report = await Promise.race([
          page.evaluate(measure),
          new Promise<null>((resolve) =>
            setTimeout(() => resolve(null), 20_000),
          ),
        ]);
        lastProgress = Date.now();
        console.log(`checked ${where}`);
        if (report === null) {
          problems.push(`${where}: the page did not answer in 20 s`);
          await page.close();
          page = await context.newPage();
          continue;
        }
        const found = [
          report.overflow > 1 && `${report.overflow}px wider than the screen`,
          report.wrapped.length > 0 &&
            `wraps: ${[...new Set(report.wrapped)].join(" | ")}`,
          report.cut.length > 0 &&
            `cut off: ${[...new Set(report.cut)].join(" | ")}`,
        ].filter(Boolean);
        if (found.length) problems.push(`${where}: ${found.join("; ")}`);
      }
      await context.close();
    }
  }
  finished.add(name);
  await browser.close();
}

clearInterval(watchdog);
if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log("Layout check passed: no wrapped, cut, or overflowing values.");
