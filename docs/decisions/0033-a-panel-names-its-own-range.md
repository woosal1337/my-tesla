# 0033: A panel names its own range, and the Report keeps its ranges

Date: 2026-11-16

Status: Accepted.

## Context

The UI pass of 2026-10-23 found two faults with the period on the web and in the mobile app.

1. The period control of Battery, Stats, Places, and Charging insights gives 7 days, 30 days, 90 days, 1 year, and All. The Report gives 7 days, 30 days, this month, and this year. A person who learns one control must learn the other again, and no document gave the reason.
2. On Charging insights, the panel "Charging time" reads the charges of the last 2 years ([decision 0014](0014-charging-time.md), point 4). It sits under a control that says "30 days", and only a small note on the right said "Charges of the last 2 years". The panel "Software" on Stats has the same fault: it shows the newest 12 updates and has no note.

Each query of the four insight pages was checked against the period:

| Page | Panel | Range | State before |
|---|---|---|---|
| Charging insights | Charging time | The last 730 days | Fault: only a small note |
| Stats | Software | The newest 12 updates | Fault: no note |
| Places | Every road driven | All records | Correct: the title says "Every", and the note says "All records" |
| Places | Geofences | A setting | Correct: the section "Saved places" holds it, and its counts follow the period |
| Stats | Leak notice of Tire pressure | 14 days | Correct: a notice, and its text names its days |
| Battery | Capacity, Range at 100%, Charging energy | All records | Correct: they sit above the section "Habits", which holds the period control |

All other panels follow the period.

## Decision

1. The Report keeps its four ranges. The period control sets a rolling time for statistics and charts, with no limit. The Report sets whole calendar days in the display time zone, up to 366 days, because it lists every trip, draws every route, and exports the range as CSV. "All" cannot exist on the Report, and "This month" and "This year" are the units of a logbook. The shared choices come first, with the same words. The "Report range" row of [the app research](../../research/mobile-ui.md#navigation) gives the full reason and the sources.
2. A panel that does not follow the period of its page names its own range in its title, or it sits in a section outside the period control, as on Battery.
3. "Charging time" becomes "Charging time, last 2 years", and its note goes away. "Software" becomes "Software, last 12 updates". `chargeTimeTitle` in `src/lib/charge-time.ts` and `softwareTitle` in `src/lib/stats-figures.ts` hold the titles, and the web pages and the app builders use them. The query of the updates reads its limit from `softwareUpdateLimit`, so the title and the query agree.

## Alternatives

1. One set of choices for both controls. The first four period choices on the Report give no calendar month and differ from the web Report. The union of both sets has seven choices, and Apple asks for about five segments at most on iPhone.
2. The labels "This month" and "This year" in the app. By an estimate, "This month" does not fit a quarter of the compact control on a 375 pt screen.
3. A section of its own for "Charging time", without the period control. Its heading repeats the panel title, and the panel leaves the other charge panels of the page.

## Consequences

- The app contract does not change. The title is text from the server, so an older app shows the new titles with this server.
- "Charging time" stays between panels that follow the period. The title is the only signal.
- A car with fewer than 12 updates also shows "Software, last 12 updates".
- When the period has no charge, Charging insights shows only "No charge in this period.", so "Charging time" does not show, although it does not follow the period.

## Sources

- [Apple HIG: segmented controls](https://developer.apple.com/design/human-interface-guidelines/segmented-controls), read on 2026-11-16: closely related choices in one control, about five segments at most on iPhone, and content of a similar size in each segment.
- [Apple HIG: charting data](https://developer.apple.com/design/human-interface-guidelines/charting-data), read on 2026-11-16: descriptive titles help people understand a chart.
- [WCAG 2.2 Understanding 3.2.4 Consistent Identification](https://www.w3.org/WAI/WCAG22/Understanding/consistent-identification.html), read on 2026-11-16: components with different functions or results need not have the same name.
- [WCAG 2.2 Understanding 2.4.6 Headings and Labels](https://www.w3.org/WAI/WCAG22/Understanding/headings-and-labels.html), read on 2026-11-16: headings and labels describe their topic or purpose.
