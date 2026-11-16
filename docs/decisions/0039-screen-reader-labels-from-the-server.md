# 0039: Screen reader labels from the server

Date: 2026-11-16

Status: Accepted.

## Context

A UI pass of the mobile app read the accessibility tree of the Drives list with `maestro hierarchy`. It found three faults.

1. A drive row had the label "15:40, Home, from Saguaro Lake, 50 km, 135 Wh/km". The row shows the duration under the clock, and the label left it out. A charge row had the same fault. The Timeline rows, the trip steps, and the Settings rows held each value.
2. Each day heading was in the tree two times with the same bounds, for example "Mon 19 Oct" and "Mon 19 Oct". The summary line, a plain `Text`, was there two times too. `RCTParagraphComponentView.mm` of React Native 0.88 returns `NO` for `isAccessibilityElement` and gives one element in `accessibilityElements`. The tree lists the container and the element, and VoiceOver focuses only the element. [Decision 0038](0038-value-notes-route-under-labels-and-back-from-a-quick-action.md), item 3, records the same fact for the Overview.
3. No label said a unit in full words. The app joined the short texts of the row, such as "km" and "Wh/km". The server sent no spoken text, and the app keeps no formatter of its own.

## Decision

1. The server writes the label. `spokenLabel()` in `src/lib/app/spoken.ts` joins the visible texts of a row in the visible order with ", ". It writes each unit after a number in full words, for example "18 minutes", "1 hour 5 minutes", "18 kilometers", "+52 kilowatt-hours", and "134 watt-hours per kilometer". It says "→" and "–" as "to", and "·" as a comma. Its table holds only the units that a list row or a day heading shows: distance, duration, energy, power, and the six forms of efficiency.
2. Each row of Drives, Charging, the Report, and the Timeline, each step of a trip, and each day section gets the optional field `label`. The drive and charge rows hold the duration. A charge in progress says "Now" and "Ongoing…". A charge row of the Report uses the label of its `charge`.
3. The app uses the `label` of the server. With an older server, it joins the visible texts in the reading order, now with the duration. So the duration comes with every server, and the full units need this server.
4. A day heading is one accessible element. The `View` of `SectionHeading` has `accessible`, the role `header`, and the label of the section. Its `Text` has no role. The tree then lists each heading one time.
5. The visible text does not change, on the web and in the app.

## Alternatives

1. A second formatter that writes spoken text. It must change `createFormatter`, `durationText`, and each helper with a fixed "kWh" or "kW", for a text that only a screen reader uses. One function on the joined text covers every builder.
2. The expansion in the app. The app keeps no formatter of its own, and each unit style of the Settings would need a copy in the app.
3. The role and the label on the heading `Text` only. The `Text` stays a container with one element inside, so the tree keeps two nodes.
4. The short forms in the label. Each screen reader and each language reads a short form such as "Wh/km" in its own way, and the app cannot check how. Full words give one known text.

## Consequences

- A place name that ends in a number and a unit, such as "IONITY 350 kW", gets the full unit too. This reads correctly.
- Dates such as "Wed 21 Oct", "AC", "DC", "+", "%", and a missing value "—" stay as they are.
- With an older server, the labels keep the short units.
- VoiceOver speech was not checked: the simulator has no VoiceOver. The evidence is the accessibility tree and the React Native source. TalkBack on Android was not checked.
- The labels of stats, records, the summary line, the Overview, and the Settings rows still use the short units.

## Sources

- [WCAG 2.2 Understanding 2.5.3 Label in Name](https://www.w3.org/WAI/WCAG22/Understanding/label-in-name.html), read on 2026-11-16: "most punctuation are generally ignored when a user speaks a label", and "A best practice is to have the text of the label at the start of the name."
- [WCAG 2.2 Understanding 3.1.4 Abbreviations](https://www.w3.org/WAI/WCAG22/Understanding/abbreviations.html), read on 2026-11-16: "User agents that speak the text can use the expanded form to announce the abbreviation."
- [WCAG 2.2 Understanding 4.1.2 Name, Role, Value](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html) and [1.3.1 Info and Relationships](https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html), read on 2026-11-16: the heading role.
- [Apple VoiceOver evaluation criteria](https://developer.apple.com/help/app-store-connect/manage-app-accessibility/voiceover-evaluation-criteria/), read on 2026-11-16: "All controls should have concise, accurate labels", and users progress to each element "without skipping items or looping back to the same item repeatedly."
- [Apple HIG: accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) and [VoiceOver](https://developer.apple.com/design/human-interface-guidelines/voiceover).
- [WWDC19 session 254: Writing Great Accessibility Labels](https://developer.apple.com/videos/play/wwdc2019/254/): no element type and no redundant words in a label.
- [Android principles for improving app accessibility](https://developer.android.com/guide/topics/ui/accessibility/principles) and [Android Accessibility Help: content labels](https://support.google.com/accessibility/android/answer/7158690?hl=en): short labels without the type or the state of the element.
- [React Native accessibility](https://reactnative.dev/docs/accessibility): `accessible`, `accessibilityLabel`, and `accessibilityRole="header"`.
- `react-native/React/Fabric/Mounting/ComponentViews/Text/RCTParagraphComponentView.mm` of React Native 0.88: `isAccessibilityElement` and `accessibilityElements`.
