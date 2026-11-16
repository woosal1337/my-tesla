# 0031: A small energy of a drive in watt-hours

Date: 2026-11-16

Status: Accepted.

## Context

The demo drive from Office to Home showed "Peak power 18 kW, Regen up to 5 kW" and also "Energy recovered 0.0 kWh, 2.5 kWh used". The two values seemed to disagree.

Both values were correct. `driveEnergy()` in `src/lib/drive-series.ts` integrates the power of the positions. For this drive it gives about 0.045 kWh recovered and 2.5 kWh used. A regen of 5 kW for about 30 seconds is 0.04 kWh. `energy()` of the formatter shows one decimal below 100 kWh, so 0.045 kWh read "0.0 kWh".

Every demo drive has a negative minimum power and recovers 2 to 50 Wh, so every demo drive showed "0.0 kWh". The demo drive model brakes only on the last two to four samples, at -1 to -7 kW. Real data has the same fault on a short drive: a 30 kW regen for 5 seconds is 0.04 kWh.

`driveEnergy()` had a second fault. It took the mean power of each pair of points and booked the whole interval as used or as recovered. One negative sample between two positive samples, such as 10, -4, and 10 kW, gave a positive mean on both sides. The drive then showed "Regen up to 4 kW" and no recovered energy. The net energy was correct, but the split between used and recovered was wrong.

## Decision

1. The formatter has `energyFine()`. It shows an energy that is not zero and is below 0.1 kWh in watt-hours with no decimal, for example "45 Wh" and "2 Wh". Every other value reads as `energy()` gives it, for example "0.0 kWh" and "2.5 kWh".
2. The "Energy recovered" stat of a drive uses `energyFine()` for the recovered energy and for the used energy under it. The web page and the app builder in `src/lib/app/drives.ts` change together.
3. When the power changes its sign between two points, `driveEnergy()` splits the interval at the zero crossing. The power is linear between two points, as the trapezoid rule already assumes. The net energy stays the same.

NIST SP 811 section 7.9 asks for a prefix that keeps the number between 0.1 and 1000. So the single stat uses Wh below 0.1 kWh. The same section asks for one prefix for values of one kind in a table. So the lists and the day totals keep kWh.

## Alternatives

1. Two decimals in kWh, such as "0.05 kWh". The smallest demo drive recovers 0.002 kWh and still reads "0.00 kWh".
2. The text "< 0.1 kWh". Every demo drive then shows the same text.
3. A change of `energy()` for all its call sites. It mixes Wh into the kWh lists of the charges and the day totals.
4. Stop-and-go traffic in the demo generator. It changes the speed, the battery level, every later record of the demo, and the README screenshots. It needs its own change. A demo-only fix also leaves the fault on every short real drive.

## Consequences

- The app contract does not change. The value is text, so an older app shows the new text with this server.
- One tile can mix two prefixes, for example "45 Wh" above "2.5 kWh used".
- A recovered energy below 0.5 Wh still reads "0 Wh".
- A negative sample with no usable neighbour, because its power is missing or the gap is longer than 5 minutes, still gives "0.0 kWh" next to "Regen up to N kW".
- The demo drives recover 2 to 50 Wh. A real commute recovers several hundred Wh. More realistic demo drives need a change of the demo generator.

## Sources

- [NIST Special Publication 811, chapter 7, section 7.9 "Choosing SI prefixes"](https://www.nist.gov/pml/special-publication-811/nist-guide-si-chapter-7-rules-and-style-conventions-expressing-values), read on 2026-11-16: prefix symbols "should be chosen in such a way that numerical values are between 0.1 and 1000", and in a table of values of one kind "only one prefix symbol should be used".
