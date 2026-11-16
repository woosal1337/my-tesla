# 0029: A warning tone for a value

Date: 2026-11-16

Status: Accepted. It changes point 1 of [decision 0013](0013-value-colors.md).

## Context

The tire panel of the Overview showed a green value next to a warning. The rear left tire of the demo car read 2.8 bar in green, because 2.8 bar is close to the recommended 2.9 bar. Under the values, the panel warned that the same tire was down 0.1 bar against the other tires in 13 days. The value and the warning disagreed.

The tone of a value came only from the pressure. The leak test sent its result as text only. Decision 0013 allowed three tones and no amber. The amber `warning` color already marks the warning icon of the tire panel, the low battery callout, and the live notices of the app.

## Decision

1. A value can have a fourth tone, `warning`, in the amber `warning` color of the palette. Only a value that has a warning of its own gets it.
2. A tire with a slow-leak warning gets the warning tone and the verdict "Possible slow leak". Its explanation adds the leak sentence to the pressure.
3. A tire whose pressure is already red stays red, because red is the stronger signal. Its explanation adds the leak sentence too.
4. `assessTire()` in `src/lib/assessment.ts` gives the tone and the text for the web and the app. `AppTone` in `src/lib/app/contract.ts` takes `warning`, and `toneColor()` in the app draws it in amber.

Apple asks to avoid the same color for different meanings, so the value and its warning icon now share one color. The value text and the warning sentence under the values say the meaning, so the color is never the only signal (WCAG 2.2 rule 1.4.1).

## Alternatives

1. Red for a tire with a leak. It needs no contract change. But 2.8 bar is in the correct range, and red means a measured fault of the pressure. A suspected leak is not that.
2. A list of the leaking tires in the answer, such as `leaking: ["rearLeft"]`. The `Stat` component of the app then needs special code. A tone of `AppValue` needs one line in `toneColor()`.

## Consequences

- An older app with this server shows the tire in the default color, because `toneColor()` falls back to the foreground. The app with an older server shows green, as before.
- On the light card, the amber value text has a contrast of 1.96:1. Green has 2.63:1 and red 4.10:1. All three are under the 4.5:1 of WCAG 2.2 rule 1.4.3 for text of this size. On the dark card, amber has 9.12:1, green 8.34:1, and red 5.04:1. A change of the palette needs its own decision for the web and the app together.
- Another value with a warning of its own can use the same tone. A value without such a warning keeps the three tones of decision 0013.

## Sources

- [Apple HIG: color](https://developer.apple.com/design/human-interface-guidelines/color), read on 2026-11-16: "Avoid using the same color to mean different things." and "Avoid relying solely on color to differentiate between objects, indicate interactivity, or communicate essential information."
- [WCAG 2.2 Understanding 1.4.1 Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html), read on 2026-11-16
- [WCAG 2.2 Understanding 1.4.3 Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), read on 2026-11-16
