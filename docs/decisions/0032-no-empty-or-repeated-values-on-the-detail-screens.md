# 0032: No empty, repeated, or misplaced values on the detail screens

Date: 2026-11-16

Status: Accepted.

## Context

The pass of 2026-11-15 on an iPhone with real data and on the simulator with the demo found six content faults on the detail screens of the mobile app.

1. A trip without a charge showed "Charging cost —". The builders in `src/lib/app/` always added each stat, and `f.cost(null)` gives "—". A drive, a charge, the Report totals, and the car figures of Status had the same fault.
2. The "Charging time" table of Charging insights showed "—" in the Typical and the Slow cell of a leg without full records. The web and [decision 0014](0014-charging-time.md) say "No record".
3. A charge showed the label "Cost" and the source "Recorded in TeslaMate" two times: under the amount of the stat "Cost", and as the note of the panel "Cost" directly below it. The web charge page had the same repeat.
4. The detail "Climate off" stood under "Outside" on Status and on the web Overview. The climate state belongs to the cabin.
5. The Report drew a charge as a drive row with a full green trip strip, another subtitle, and "—" for a missing cost. The Charging list drew the same charge with the AC or DC badge and a level bar.
6. The Settings switch "Last drive and charge" changed nothing in the app. The server built `lastDrive` and `lastCharge` in the Overview answer, and no app screen drew them. The app shows the last drive and charge in the summaries of the Drives and Charging rows ([decision 0025](0025-the-tesla-app-layout.md), points 4 and 7), and the server built these summaries without a look at the switch. `docs/mobile.md` said that Status shows a map and the last drive and charge. Status has neither.

## Decision

1. An app answer leaves out a stat when its value has no letter and no digit and the stat has no detail. `hasValue()` and `statsWithValue()` in `src/lib/app/values.ts` hold the rule. The drive, the trip, the charge (the hero, the stats, and the cost breakdown), the Report totals, the car figures of Status, and the hero of Charging insights use it. A stat with "—" and a detail stays, because the detail gives the reason, for example "Cost —, Set a price in Settings on the web". The rule also covers "—% → —%".
2. A leg without full records says "No record" in one cell after the levels. The row stays, so the person sees which range has no data.
3. The source of the cost shows one time, as the detail of the stat "Cost" under the amount. The panel is "Cost breakdown" and has no note, in the app and on the web. `ChargeDetail.cost` has no `source`.
4. The climate state is the detail of "Cabin", in the app answer and on the web Overview.
5. One charge row for Charging and the Report. `chargeRow()` in `src/lib/app/charges.ts` builds the row of the charge list, and a Report charge row carries it in the optional field `charge`. The app draws it with `ChargeListRow`, the component of the Charging list. The old fields of the Report row stay.
6. The switch "Last drive and charge" off gives the Drives and Charging rows of the Overview menu no summary. The Overview answer drops `lastDrive` and `lastCharge`.

## Alternatives

1. For the cost: remove only the detail of the stat. The label "Cost" still shows two times.
2. For the cost: move the amount into the panel. The amount goes below the fold, and a charge without a breakdown needs the stat anyway.
3. For the Report: add only `levels` to the drive row. The badge, the subtitle, and the "—" cost still differ.
4. For the switch: draw two cards for the last drive and charge on Status. They repeat the values of the Overview menu, against "each value has one place" of decision 0025.
5. For the switch: remove it. The web Overview uses the same preference for its two cards.
6. For the empty values: a check in the app for the text "—". The server writes the text, so the rule belongs to the server, and the app keeps no magic text.

## Consequences

- A released app reads none of the removed fields, so it works with this server. It draws the old Report charge row, because it does not know `charge`. A new app with an older server draws the old row too. Only a new app with this server draws the shared row.
- An older app with this server shows the source of the cost one time, and keeps the panel title "Cost".
- The web trip, drive, and Report pages keep "—" in their fixed grids. The web trip page still shows "Charging cost —" for a trip without a charge.
- The heroes of Battery, Stats, and Places and the idle table of Battery can still show "—" without a detail.
- `docs/mobile.md` names the car figures on Status, the map on Location, and the last drive and charge in the menu rows.

## Sources

- [WCAG 2.2 Understanding 3.2.4 Consistent Identification](https://www.w3.org/WAI/WCAG22/Understanding/consistent-identification.html), read on 2026-11-16: components with the same function are identified consistently.
- [WCAG 2.2 Understanding 1.3.1 Info and Relationships](https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html), read on 2026-11-16: a detail sits with the value that it describes.
- [Apple HIG: lists and tables](https://developer.apple.com/design/human-interface-guidelines/lists-and-tables) and [writing](https://developer.apple.com/design/human-interface-guidelines/writing), read on 2026-11-16: keep row text succinct, and let each word earn its place.
