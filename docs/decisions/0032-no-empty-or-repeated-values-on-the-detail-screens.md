# 0032: No empty, repeated, or misplaced values on the detail screens

Date: 2026-11-16

Status: Accepted. Since 2026-11-16, the rule also covers the insight heroes, the idle table of Battery, and the web trip page (points 7 to 9).

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
7. The heroes of Battery, Stats, Year, and Places and the stats of the Battery panel "Idle drain" use `statsWithValue()`. A detail must give the reason. "Charge cycles" and "Most time" carry their detail ("N kWh added", "at X") only with a value, so without a value they leave the answer. "Health —" keeps its detail, which names the long charges that the estimate needs.
8. A row of the Battery idle table says "No record" in one cell after the last known value. A period without a range gives the time and "No record". A period with a range and without a power gives the time, the range, and "No record". The row stays. `noRecordCell` in `src/lib/app/values.ts` gives this table and the "Charging time" table the same words.
9. The web trip page leaves out "Charging cost" when the trip has no recorded cost, as the app does. The stat does not apply to such a trip. The other web values keep "—", because each shows a missing measurement in a fixed place.

## Alternatives

1. For the cost: remove only the detail of the stat. The label "Cost" still shows two times.
2. For the cost: move the amount into the panel. The amount goes below the fold, and a charge without a breakdown needs the stat anyway.
3. For the Report: add only `levels` to the drive row. The badge, the subtitle, and the "—" cost still differ.
4. For the switch: draw two cards for the last drive and charge on Status. They repeat the values of the Overview menu, against "each value has one place" of decision 0025.
5. For the switch: remove it. The web Overview uses the same preference for its two cards.
6. For the empty values: a check in the app for the text "—". The server writes the text, so the rule belongs to the server, and the app keeps no magic text.
7. For the idle table: remove a row without a range. The person then does not see that the car was parked at that time.
8. For the idle table: say "Battery cold". It is true for one of the two causes only, and it is a new text.
9. For the web trip page: keep "—" with the detail "No charge on this trip". It is wrong for a charge without a price, and the web then differs from the app.
10. For the web trip page: hide the stat only for a trip without a charge. A charge without a cost still gives "—" without a reason.

## Consequences

- A released app reads none of the removed fields, so it works with this server. It draws the old Report charge row, because it does not know `charge`. A new app with an older server draws the old row too. Only a new app with this server draws the shared row.
- An older app with this server shows the source of the cost one time, and keeps the panel title "Cost".
- The web trip, drive, and Report pages keep "—" for a missing measurement in their fixed grids. The web Battery, Stats, and Places heroes and the web idle table keep "—" too.
- A released app draws the shorter heroes and the shorter table rows without a change. Its table draws a row with any number of cells, as it does for "Charging time".
- `docs/mobile.md` names the car figures on Status, the map on Location, and the last drive and charge in the menu rows.

## Sources

- [WCAG 2.2 Understanding 3.2.4 Consistent Identification](https://www.w3.org/WAI/WCAG22/Understanding/consistent-identification.html), read on 2026-11-16: components with the same function are identified consistently.
- [WCAG 2.2 Understanding 1.3.1 Info and Relationships](https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html), read on 2026-11-16: a detail sits with the value that it describes.
- [University of Colorado Boulder, Accessibility Minute, January 2026](https://www.colorado.edu/digital-accessibility/newsletter/accessibility-minute-january-2026), read on 2026-11-16: avoid empty data cells, and say why a cell has no value.
- [Apple HIG: lists and tables](https://developer.apple.com/design/human-interface-guidelines/lists-and-tables) and [writing](https://developer.apple.com/design/human-interface-guidelines/writing), read on 2026-11-16: keep row text succinct, and let each word earn its place.
