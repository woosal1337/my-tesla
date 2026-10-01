# Demo site

The public site at https://mytesla.chele.bi runs the app with `DEMO_MODE=1`. It shows a landing page on `/` and the full dashboard on synthetic data. [Decision 0006](decisions/0006-built-in-demo-database.md) explains the design.

## What demo mode changes

| Part | Normal install | Demo mode |
|---|---|---|
| Database | TeslaMate PostgreSQL, through `DATABASE_URL` | PGlite inside the server process, filled with 60 days of demo data |
| `/` | Opens the start car | Shows the landing page |
| Settings | Saved in `PREFERENCES_FILE` for each user | Saved in a cookie for each visitor |
| Dashboard | No banner | A banner that says the data is synthetic |
| Live card | From the MQTT feed, if `MQTT_URL` is set | Fixed demo values, with no live stream |

The demo data ends when the server process starts. A process builds new data after 6 hours.

## Run it locally

```bash
DEMO_MODE=1 DISPLAY_TIME_ZONE=America/Phoenix bun run dev
```

You need no database. Open http://localhost:3000.

## Deploy your own demo on Vercel

1. Import the repository in Vercel. Vercel detects Next.js and Bun.
2. Set the environment variables for Production and Preview:

   | Name | Value |
   |---|---|
   | `DEMO_MODE` | `1` |
   | `DISPLAY_TIME_ZONE` | `America/Phoenix` |
   | `SITE_URL` | Your domain, such as `https://mytesla.chele.bi` |
   | `OPEN_ANALYTICS_URL`, `OPEN_ANALYTICS_KEY` | Optional, for Production only. Read [Analytics on the demo site](#analytics-on-the-demo-site). |

3. Deploy. Each push to `main` deploys to production. Each push to another branch gets a preview URL.
4. Add your domain in the project settings, and point a `CNAME` record at `cname.vercel-dns.com`.
5. Set the `vercel.app` domain of the project to redirect to your domain with status 308. Then the site has one public address.

Do not set `DATABASE_URL` on a public deployment. The app has no login, so a public deployment must never read real car data.

## Update the landing page screenshots

The images in `public/landing/` come from the demo pages at 1440 × 900 pixels, in light and dark. Take them from a local demo server, and hide the demo banner first.

## Link previews and icons

A shared link shows a 1200 × 630 preview image, the title, and the description. These files set it:

| File | Use |
|---|---|
| `src/app/opengraph-image.jpg`, `twitter-image.jpg`, and their `.alt.txt` files | The preview image for Open Graph and the X card, under 100 KB, so WhatsApp shows it too |
| `src/app/layout.tsx` | Title, description, Open Graph, X card, application name, and Apple web app settings |
| `src/app/page.tsx` | The landing page title, the canonical link, and JSON-LD for a `SoftwareApplication` |
| `src/app/icon.svg`, `favicon.ico`, `apple-icon.png` | The browser icons and the iPhone home screen icon |
| `src/app/manifest.ts`, `public/icons/` | The web app manifest with 192, 512, and maskable icons |
| `src/app/robots.ts`, `sitemap.ts` | In demo mode, search engines may index `/`. A normal install blocks them all. |

`bun run brand:render` builds every image from the T mark in `src/lib/logo.ts` and the screenshot `public/landing/overview-dark.png`. It needs macOS, for `sips`, and Google Chrome. Run it again after a change to the logo or the screenshot.

The script also writes `docs/images/social-preview.png` at 1280 × 640. GitHub has no API for the repository social preview. Upload the file by hand: open the repository settings, then Social preview, then Edit.

Messaging apps keep a preview for days. After an image change, refresh the preview in the [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/). WhatsApp uses the same data.

## Analytics on the demo site

The public demo counts visits with [Open Analytics](https://github.com/openlabs-so/openanalytics), on a self-hosted server. [Decision 0009](decisions/0009-demo-analytics.md) explains the limits.

1. Make a site in Open Analytics, and allow only your demo domain.
2. Set `OPEN_ANALYTICS_URL` to the collector and `OPEN_ANALYTICS_KEY` to the public tracking key, for Production only.
3. Deploy. The root layout then loads `oa.js` from the collector, with Do Not Track and Global Privacy Control respected. The landing page footer says that the site counts visits.

The tracker counts each page view, also the tab changes in the dashboard. `src/lib/analytics.ts` holds the event names, because the reports and the funnels match on these strings:

| Event | Sent when | Property |
|---|---|---|
| `demo_open` | A visitor presses "Try the demo" | `place`: `header`, `hero`, or `cta` |
| `install_open` | A visitor opens the install guide | `place`: `hero`, `self_host`, or `banner` |
| `github_open` | A visitor opens the repository | `place`: `header` or `footer` |
| `docs_open` | A visitor opens the docs | `place`: `nav` or `footer` |
| `section_jump` | A visitor presses a section in the landing page navbar | `section` |
| `landing_open` | A visitor goes from the demo back to the landing page | |
| `outbound_click` | A visitor opens the license or TeslaMate | `host` |
| `settings_change` | A visitor changes a setting in the demo | `setting` |

A click sends an event through the `data-oa-event` attribute, with no extra code. Settings calls `trackEvent()`, because a change is not a click on a link. Without the tracker, `trackEvent()` does nothing.

