# 0013: Value colors and tooltips

Date: 2026-10-07

Status: Accepted. It replaces the "no advice colors" rule in the UI research for values with a known reference.

## Context

The owner asked for colors that show at a glance whether a value is usual, better, or a problem, with a tooltip that explains the expected value. The first UI rule used no advice colors, because the charge limit depends on the battery chemistry, which TeslaMate does not record.

## Decision

1. Three tones: green for better than usual, the default color for usual, and red for worse than usual or a problem. No amber, so that the page stays calm.
2. Only values with a published or car-specific reference get a tone. [Value colors](../value-colors.md) lists each rule and its source. The charge levels and the charge limit stay neutral.
3. `src/lib/assessment.ts` holds the rules as pure functions with tests. Each function gives the tone, a short verdict, the meaning of the value, and the expected value, in the units of the user.
4. `Assessed` shows the tooltip with a Base UI popover that opens on hover and on tap, so it also works on a phone. The value gets a dotted underline. The verdict is also in the text for screen readers, so the color is not the only signal.
5. A value inside a link, such as a row of the drive list, gets the tone and a plain `title` text, because a button inside a link is not valid.

## Alternatives

1. A tone for every value. Most values, such as distance or cost, have no reference, so a tone would only be noise.
2. A separate legend. The tooltip at the value is closer to the question.

## Consequences

The references are approximate fleet values. A change of a threshold happens in one module, and the tests show the boundaries.
