# 0035: Offline time on the hour strip

Date: 2026-11-16

Status: Accepted. Since [decision 0044](0044-light-tones-with-text-contrast.md), the offline amber is darker in light and has 5.22:1 on the light page.

## Context

A pass on a phone with real data on 2026-11-15 found three faults on the Timeline and on Status.

1. The car was offline from 00:00 to 17:39. The hour strip drew this time in the subtle gray at 15%. On the strip background, that shade has a contrast of 1.15:1 in dark and 1.16:1 in light, so the strip looked as if the app had no data.
2. The fourth stat said "Asleep 0% of the recorded time". The recorded time counted the offline time, but the stat counted only sleep. It read as if the car stayed awake all day.
3. The Overview title said "Offline", the state of the car. The Live panel of Status said "Connected", the state of the MQTT feed. The same words named two different things.

The demo wrote only `online` and `asleep` states, so the demo pass did not find the fault.

## Decision

1. Offline time on the hour strip has the amber `warning` token, on the web (`bg-warning`) and in the app (`palette.warning`). The key under the strip uses the same color. The TeslaMate Grafana dashboard "States" also draws `offline` in orange. In the app, amber already means that a value can be missing or old, and TeslaMate records nothing while the car is offline.
2. The fourth stat of the day shows the larger of the two shares under its own name. When the car was offline longer than asleep, the label is "Offline", else "Asleep". The percent is the share of that kind in the recorded time. The detail is "of the recorded time", and it adds the other share when it rounds to 1% or more, for example "of the recorded time · offline 30%". `restShare()` in `src/lib/timeline-view.ts` gives the label, the percent, and the detail to the web page and to the app answer.
3. The header of the Live card says "Feed connected" or "Feed offline", on the web and in the app.
4. The demo parks one day in seven offline, so the demo shows the offline color. The rule uses no random number, so every other demo value stays the same.

## Alternatives

1. A brighter gray for offline time. Awake, Asleep, and Offline would then be three grays that are hard to tell apart.
2. Red. It reads as a fault of the car.
3. Amber at half strength. It has only 1.45:1 on the light strip.
4. A hatch pattern. It needs SVG in the app and a gradient on the web.
5. The label "Asleep or offline". It is too long for the one-line stat label at a large text size.
6. A field in the app answer for the feed label. An older server would need a fallback for no gain.

## Consequences

- Contrast of amber against the strip background: 10.13:1 in dark and 2.16:1 in light. Awake has 3.83:1 and 3.28:1, and Asleep 1.48:1 and 1.44:1. WCAG 2.2 rule 1.4.11 asks for 3:1 for a graphic that a person needs. The key, the row text "offline …", and the stat carry the meaning, so the color is not the only signal.
- Amber and the green of a charge have almost the same lightness in dark (1.09:1). A person with a red-green color deficiency tells them apart by the key and the rows.
- An older app with this server shows the new stat and the old faint shade. This app with an older server shows amber and the old stat "Asleep".
- The idle drain of Battery still counts offline time together with sleep, as the TeslaMate dashboards do.

## Sources

- [WCAG 2.2 Understanding 1.4.11 Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html), read on 2026-11-16: a graphic that a person needs to understand the content needs 3:1 against adjacent colors.
- [WCAG 2.2 Understanding 1.4.1 Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html): a text label next to each color.
- [Apple HIG: color](https://developer.apple.com/design/human-interface-guidelines/color), read on 2026-11-16 (change log 2025-12-16): avoid the same color for different meanings, and do not rely on color alone.
- [Apple HIG: charting data](https://developer.apple.com/design/human-interface-guidelines/charting-data), read on 2026-11-16: consistent colors and descriptive text for a chart.
- [TeslaMate Grafana dashboard "States"](https://github.com/teslamate-org/teslamate/blob/main/grafana/dashboards/states.json), read on 2026-11-16: `offline` has the color `#FFB357`, `asleep` `#56A64B`, and `online` `#6ED0E0`.
