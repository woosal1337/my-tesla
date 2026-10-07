# Value colors

Some values on the dashboard have a color and a tooltip.

| Color | Meaning |
|---|---|
| Green | Better than usual |
| Default | A usual value |
| Red | Worse than usual, or a problem |

Move the pointer over a value with a dotted underline, or tap it on a phone. The tooltip gives your value, what it means, and the expected value. A value without a dotted underline has no rule.

## The rules

| Value | Pages | Green | Default | Red |
|---|---|---|---|---|
| Consumption | Drives, a drive, Stats, Trip | 3% or more under the rated value | Up to 35% over the rated value | More than 35% over the rated value |
| Charging efficiency | A charge, Battery | AC 90% or more, DC 95% or more | AC 80 to 90%, DC 88 to 95% | AC under 80%, DC under 88% |
| Voltage of an AC charge | A charge | No green | 207 to 253 V | Under 207 V or over 253 V |
| Battery health | Battery | At most 1 point under the fleet average for the distance | 1 to 6 points under | More than 6 points under |
| Battery lost while parked | Battery | 1% a day or less | Up to 3% a day | More than 3% a day |
| Average power while parked | Battery, the idle drain list | 30 W or less | Up to 150 W | More than 150 W |
| Time asleep while parked | Battery | 80% or more | 40 to 80% | Under 40% |
| Tire pressure | Overview | At most 0.15 bar from 2.9 bar | At most 0.35 bar from 2.9 bar | More than 0.35 bar from 2.9 bar |
| Battery level | Overview | No green | 20% or more, or charging | Under 20% and not charging |

Notes:

1. The rated consumption is the car efficiency that TeslaMate calculates from the charges. A drive under 3 km gets no color, because the car uses more energy in the first minutes.
2. The fleet average of battery health is a line through 100% at 0 km, 95% at 50,000 km, and 85% at 320,000 km.
3. Most Model 3 and Model Y wheels need 2.9 bar cold. Some wheels need another value. The label in the door frame gives the value for your wheels.
4. The charge levels and the charge limit have no color. An LFP battery and an NMC battery need different charge limits, and TeslaMate does not record which one the car has.
5. Distances, durations, speeds, temperatures, costs, and places have no color.

## Sources

| Rule | Source |
|---|---|
| Consumption | Real-world range is 15 to 30% under the WLTP value for a Model Y: [Electra](https://www.go-electra.com/en/newsroom/tesla-model-y-range/) |
| Charging efficiency | ADAC measured a loss of 15.2% at a household socket and 7.7% at an 11 kW wallbox for a Model 3: [ADAC](https://www.adac.de/rund-ums-fahrzeug/elektromobilitaet/laden/ladeverluste-elektroauto-studie/) |
| Voltage | EN 50160 sets 230 V with a tolerance of 10% for low-voltage networks: [EN 50160 summary](https://leonardo-energy.pl/wp-content/uploads/2016/07/EIM01201-Norma-EN-50160-ang..pdf) |
| Battery health | The Tesla Impact Report 2023 shows about 85% after 200,000 miles for Model 3 and Model Y: [Electrek](https://electrek.co/2023/04/25/tesla-update-battery-degradation/) |
| Parked drain | A sleeping Tesla loses about 1% a day, and Sentry Mode uses about 250 to 350 W: [owner reports](https://skillsphere.blog/stop-tesla-battery-drain-while-parked) |
| Tire pressure | 42 psi, or 290 kPa, cold for Model 3: [Tesla Owner's Manual](https://www.tesla.com/ownersmanual/model3/en_cn/GUID-FDDB10EF-FFA9-46EB-B8CC-03614AE92B6B.html) |

The rules live in `src/lib/assessment.ts`. [Decision 0013](decisions/0013-value-colors.md) explains the design.
