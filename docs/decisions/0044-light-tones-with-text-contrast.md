# 0044: Light tones with text contrast

Date: 2026-11-17

Status: Accepted. It changes the light values of the green, amber, and red tokens of `research/ui-stack.md`. The tones of [decision 0013](0013-value-colors.md), [decision 0029](0029-warning-tone-for-a-value.md), and [decision 0035](0035-offline-time-on-the-hour-strip.md) stay.

## Context

The light values of the green, amber, and red tokens were fill colors. The web and the app also use them as text colors:

- Web: the value tones `text-good`, `text-bad`, and `text-warning` of `toneClass()`, the green `text-charge` of the charging list, the charge page, the battery panel, and the live panel, the red `text-destructive` of a form error, and the green status lines.
- App: `toneColor()` and `liveToneColor()` in `mobile/src/theme/tones.ts`, `Text` with `tone="charge"` from a 12 pt caption to a 24 pt heading, `Text` with `tone="destructive"` for the sign-out label and the error lines, and the callouts of `CarStage`.

A value is 20 pt medium in the app and 18 px medium on the web. Neither is large text, so WCAG 2.2 rule 1.4.3 asks for 4.5:1. The old light values missed it on the card, and green and amber missed it on the page too. On the dark surfaces, all three passed.

| Token | Old light | Page `#ffffff` | Card `#f4f4f4` |
| --- | --- | --- | --- |
| `good`, `charge`, `chart-2` | `#1fae5b` | 2.89 | 2.62 |
| `warning`, `chart-4` | `#e8a33d` | 2.15 | 1.96 |
| `bad`, `destructive` | `#d93c3c` | 4.50 | 4.09 |

Each ratio in this record uses the WCAG formula of `contrast()` in `mobile/src/theme/palette.test.ts` and is rounded down to two decimals. Decisions 0029 and 0035 rounded to the nearest value, so they give 2.63, 2.16, and 4.10.

The test of the palette checked 4.5:1 only for the gray text tokens. No test covered the colored tones.

## Decision

1. Each green, amber, and red token gets a darker light value. The dark values do not change. No token is added.
2. The new light value has the hue and the saturation (HSL) of the old one and a lower lightness, until it has 4.5:1 on `#eeeeee`. `#eeeeee` is the `muted` and `accent` surface, the darkest light surface: the row hover of the web and the bar tracks. So the card and the page pass with a margin.
3. Each theme keeps one green, one amber, and one red. `charge` and `chart-2` equal `good`, `destructive` equals `bad`, and `chart-4` equals `warning`.
4. `palette.test.ts` checks 4.5:1 for `good`, `bad`, `warning`, `charge`, and `destructive` on the page and on the card in both themes, and checks rule 3.

| Token | New light | HSL | Page `#ffffff` | Card `#f4f4f4` | Muted `#eeeeee` |
| --- | --- | --- | --- | --- | --- |
| `good`, `charge`, `chart-2` | `#167c41` | 145°, 70%, 29% | 5.25 | 4.78 | 4.53 |
| `warning`, `chart-4` | `#966112` | 36°, 79%, 33% | 5.22 | 4.75 | 4.50 |
| `bad`, `destructive` | `#cf2828` | 0°, 68%, 48% | 5.26 | 4.78 | 4.53 |

The old light values had a lightness of 40%, 58%, and 54%.

| Token | Dark, unchanged | Page `#111215` | Card `#1b1d22` |
| --- | --- | --- | --- |
| `good`, `charge`, `chart-2` | `#2fd073` | 9.26 | 8.34 |
| `warning`, `chart-4` | `#f0b453` | 10.13 | 9.11 |
| `bad`, `destructive` | `#ef5a5a` | 5.60 | 5.04 |

The change is in `src/app/globals.css` and in `mobile/src/theme/palette.ts`, which copies it. No component changes.

The fills gain too. On the light card, the old green and amber fills had 2.62:1 and 1.96:1, under the 3:1 of WCAG 2.2 rule 1.4.11 for a graphic that a person needs. A white symbol on the light `charge` fill goes from 2.89:1 to 5.25:1.

## Alternatives

1. A separate text token for each tone, so the fill stays vivid. It needs new tokens in both themes and an edit of each text use, and the green and amber fills stay under 3:1.
2. The increased-contrast system colors of Apple. The green `#008932` has only 4.12:1 on the card.
3. The 700 shades of Tailwind. The green `#15803d` has 4.56:1 on the card, but 4.32:1 on `muted`, and its hue leaves the palette.
4. 3:1 for the 20 pt value, which the Apple table allows from 18 pt. The same tones color text from 12 pt to 15 pt in the app and 18 px text on the web, so 4.5:1 is necessary.

## Consequences

- All fills, map markers, strips, bars, and chart lines in these colors are darker in the light theme. The dark theme does not change.
- Green and amber have almost the same lightness in light (1.00:1), as in dark (1.09:1). The key, the row text, and the value text carry the meaning.
- The amber reads as ochre in light. The offline amber of the hour strip has 5.22:1 on the light page, before 2.15:1. It now passes the 3:1 of WCAG 2.2 rule 1.4.11.
- The app bundles the palette, so an installed app keeps the old colors until its next build. The web changes with the server. The app and the server need no change of the contract.
- A new tone color must pass the test of the palette before it ships.
- Not covered: an increased-contrast variant of the palette, which Apple asks for a custom color, the gray `chart-3` line with 2.97:1 on the light card, and blue `primary` text with 4.38:1 on the light card.

## Sources

- [WCAG 2.2 Understanding 1.4.3 Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), read on 2026-11-17: text needs 4.5:1. Large text is 18 point, or 14 point bold, and 1 point is 1.333 CSS px, so 18 px and 20 pt medium text are not large. The rule covers text in a hover state, and a computed ratio must not be rounded up to meet it.
- [WCAG 2.2 Understanding 1.4.11 Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html), read on 2026-11-17: a graphic that a person needs, such as a chart line, needs 3:1 against the colors next to it.
- [Apple HIG: accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) (change log 2025-06-09), read on 2026-11-17: 4.5:1 for text up to 17 pt, and 3:1 from 18 pt or for bold text. Check the contrast in the light and in the dark appearance.
- [Apple HIG: color](https://developer.apple.com/design/human-interface-guidelines/color) (change log 2025-12-16), read on 2026-11-17: a custom color needs a light and a dark variant that both work, and the same color must not mean different things.
- [Android: make apps more accessible](https://developer.android.com/guide/topics/ui/accessibility/apps), read on 2026-11-17: 4.5:1 for text under 18 sp, or bold text under 14 sp, and 3:1 for other text. It links to [Material Design 3: color contrast](https://m3.material.io/foundations/designing/color-contrast), which did not load as text.
