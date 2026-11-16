# Car images

Research date: 2026-10-18. This page checks the car image of every model, color, and wheel that TeslaMate can report, and decides where the image comes from.

## Result

- 154 combinations of the values below. 57 showed the right car before this check. 97 had no image or the wrong wheels, and now show the right model and color. None is missing.
- Model S, Model X, and the Cybertruck had no image before. They now have one for each generation: the Model S from 2012, 2021, and 2025, the Model X from 2015, 2021, and 2025, and the Cybertruck.
- Every image comes from the Tesla compositor. No combination needs an image that My Tesla hosts.
- My Tesla keeps the direct link to the compositor. It does not copy Tesla images into the repository, and it does not serve them from a server route. Read [Hosting](#hosting).

## What TeslaMate reports

`identify/1` in [`elixir/lib/teslamate/vehicles/vehicle.ex`][tm-vehicle] fills the `cars` table from `vehicle_config` of the Tesla API:

| Column | Value |
|---|---|
| `model` | From `car_type`: `models`, `models2`, and `lychee` give `S`. `model3` gives `3`. `modelx` and `tamarind` give `X`. `modely` gives `Y`. `cybertruck` gives `Cybertruck`. |
| `trim_badging` | The badge in capitals, such as `50`, `74D`, `P74D`, `100D`, and `P100D` |
| `exterior_color` | The API value as it is, such as `PearlWhite` or `StealthGrey` |
| `wheel_type` | The API value as it is, such as `Pinwheel18CapKit` or `NewTurbine22Black` |

TeslaMate keeps no option codes, and the model does not tell the generation. A Highland Model 3 is `3`, and a refreshed Model S is `S`. TeslaMate itself maps none of these values to an image.

The values in the table come from cars that people pasted in issues ("car" in the Source column), and from the mapping tables of other projects ("table"). [vide/matedroid][matedroid] and [Kemmey-TeslaWatch][kemmey] have the most complete tables. [tn9design/tesla-vehicle-config-decoder][tn9] has the trim and wheel codes of the refreshed Model S and Model X, and [svenger87/tesla_order_tracker][tracker] has the Cybertruck codes. No car has reported a value for the Model S and Model X from 2025 or for the Cybertruck ("no report found"), so those rows use the configurator codes and the colors that the cars of the same year report.

## How `carImageUrl()` picks the image

1. The model picks the compositor model: `my`, `m3`, `ms`, `mx`, or `ct`.
2. The color picks the paint code. A Cybertruck is always stainless steel (`$PDD`), whatever the color says.
3. The generations of the model that have this paint are the candidates, from the oldest to the newest. The first one that knows the wheel name wins. A wheel name matches by its start, the longest name first, so `Pinwheel18CapKit` finds `Pinwheel18`.
4. When no candidate knows the wheel, or the wheel is empty, the newest candidate shows its usual wheels. A new wheel name most likely comes from a new car. Before this check, a color of two generations gave no image in this case.
5. A color that no generation of the model has gives no image. The page then shows the car without a picture.

## Method

1. A script in the scratchpad built the URL of each combination with `carImageUrl()`, requested it with a delay of 0.7 s, and saved the PNG. 197 requests went to `static-assets.tesla.com` in total, with the probes for the new codes.
2. The check needs HTTP 200 and `image/png`. It decodes the PNG with sharp, takes the median color of the doors, and compares its color family with the paint. A contact sheet for each generation was checked by eye: the right body, the paint, and wheels in the wheel arches.
3. The web page and the app API were checked in demo mode. The Overview hero showed each new model at 1280 and 390 px wide, and `/api/app/cars/2/overview` gives the app the same URL as the page.

## Findings

1. Akamai answers 403 when a client that is not a browser sends a browser `User-Agent`, such as Chrome or Safari from curl, Node.js, or Bun. The default `User-Agent` of curl and Node.js, and `Mozilla/5.0 (compatible; …)`, get 200. The image optimizer of Next.js sends `node` and gets 200. This replaces the note in `ui-stack.md` that Akamai refuses curl and Node.js.
2. The configurator compositor answers HTTP 412 with an HTML page for an option that it does not know, and for a paint that the trim does not have. The browser and the app then hide the image. It never sent a default car for a wrong option.
3. The older compositor at `v1/compositor/` answers 200 with a black silhouette for a paint that the model does not have, such as `PMTG` on a Model X. It draws a Model S without wheels for `WTAB`, `WTDS`, and `WTTC`, so the dark 19 and 21 inch wheels of the Model S before 2021 use a silver wheel of the same size.
4. The Model S and Model X from 2012 to 2020 come from `v1/compositor/` with a paint and a wheel code only. They show the Model S front from 2016 and a camera that is a little closer than the newer renders. Both fit the hero at 1280 and 390 px.
5. The Model S trim from 2021 (`MTS13`) draws the colors from 2021 to 2024, Lunar Silver (`PN02`) included. Diamond Black (`PX02`) and Frost Blue (`PB00`) need the trim from 2025 (`MTS22`).
6. The Model X trim from 2021 (`MTX10`) draws only the five colors from 2021. Stealth Grey, Ultra Red, Lunar Silver, Diamond Black, and Frost Blue need the trim from 2025 (`MTX22`) with its 20 inch wheel (`WX02`). A Model X from 2024 in these colors therefore shows the wheels from 2025.
7. The Cybertruck needs the trim, the paint, the wheel, and the interior (`$MTC03,$PDD,$WH0B,$IG01`). A shorter list gives 412.
8. Marine Blue (`PB02`) also renders on the Model 3 from 2024. Glacier Blue (`PB01`) does not.
9. `MTY61` and `MTY68` both draw the Model Y Standard with the separate headlights and the Aperture wheel covers, and `MTY60` draws the light bar of the Premium. The table keeps `MTY61` for the badge `50`.

## Where the car sits in the render

The render is 1440 by 810 px, and the car covers only a part of it. `carImage()` returns the URL and the frame of the generation: the box that the car fills, in fractions of the image width and height. The app API sends the frame as `car.imageFrame`, and the app scales the image so that the car spans the stage. Read [decision 0028](../docs/decisions/0028-the-car-fills-the-stage.md).

| Generation (profile in `car-image.ts`) | left | top | width | height |
|---|---|---|---|---|
| Model Y 2020 to 2025, `v1/compositor`, `STUD_3QTR` | 0.234 | 0.281 | 0.535 | 0.416 |
| Model Y from 2025, `FRONT34` | 0.227 | 0.275 | 0.558 | 0.422 |
| Model 3 2017 to 2023, `v1/compositor` | 0.144 | 0.294 | 0.688 | 0.446 |
| Model 3 from 2024, `STUD_FRONT34` | 0.242 | 0.325 | 0.523 | 0.370 |
| Model S 2012 to 2020, `v1/compositor` | 0.203 | 0.184 | 0.590 | 0.559 |
| Model S 2021 to 2025 | 0.222 | 0.330 | 0.556 | 0.370 |
| Model S from 2025 | 0.222 | 0.330 | 0.556 | 0.370 |
| Model X 2016 to 2020, `v1/compositor` | 0.265 | 0.285 | 0.453 | 0.406 |
| Model X 2021 to 2025 | 0.217 | 0.275 | 0.566 | 0.425 |
| Model X from 2025 | 0.217 | 0.275 | 0.566 | 0.427 |
| Cybertruck | 0.187 | 0.258 | 0.637 | 0.501 |

Method: one render for each generation from `carImageUrl()` at `size=1440`, measured with sharp on 2026-11-16. The frame is the box of the pixels with an alpha above 80 of 255, so the soft ground shadow of some renders stays outside it. Two wheel and trim sets of the Model Y from 2025 differ by 0.003, so one frame for each generation is enough. A new generation needs a measured frame, and the `Profile` type makes it mandatory.

Findings:

1. The `crop` parameter is not usable for this. The configurator compositor crops and rescales the image, and `v1/compositor` ignores the same value. Tesla does not document the parameter.
2. A larger render does not help. Both compositors stop at 1920 by 1080 for `size=2048`, and the configurator compositor then sends a PNG with a color palette. `size` stays at 1440.

## Known limits

1. The wheel name and the color cannot tell some generations apart. Since TSLA-64 the model year from the tenth character of the VIN rules out a generation that was not built that year: the legacy Model 3 ends with 2023 and Highland starts with 2024, the legacy Model Y runs from 2020 to 2025 and Juniper starts with 2025, the Model S and Model X change in 2021 and 2025, and the Cybertruck starts with 2024. So a white Model 3 Performance of 2024 that reports `Performance20` and a Highland that reports `Pinwheel18CapKit` now show the new body. A year that two generations share, such as a 2025 Model Y, still follows the wheel name: a white 2025 Model Y Performance that reports `Uberturbine21` can show the older body. The VIN stays on the server; only the year reaches the image rule.
2. The wheel names of the Model S and Model X from 2025, the Model Y L, the Juniper Performance, and the Cybertruck are not known. These cars show the usual wheels of the newest generation that has their color.
3. The color names `LunarSilver` and `FrostBlue` follow the pattern of the other names. No car has reported them yet.
4. A color that is not in the table, such as a new paint, gives no image until the table learns it.

## Hosting

Decision: keep the direct link from the browser and the app to the Tesla compositor. Do not commit Tesla images, and do not add a server route that copies them.

1. Nothing is missing. Every combination above has a compositor render, so no image needs a hosted copy, and the fallback for an unknown color stays "no image".
2. The images belong to Tesla. Tesla's legal page says that the content of its sites is protected by copyright, that it may not be copied for commercial use, distributed, changed, or posted again, and that a visit grants no licence ([Tesla legal resources][tesla-legal]). A copy in this public AGPL repository would distribute the images under a licence that the project cannot grant. MateDroid bundles them in its GPL app, and this project does not follow it.
3. The short cache costs little. The compositor sends `max-age=60` with no `ETag` or `Last-Modified`, so a full page load after a minute downloads the 290 KB PNG again. A navigation inside the web app keeps the open document, and the browser reuses an image that the document already loaded, and the app keeps it in the memory and disk cache of `expo-image`, which does not follow `max-age` ([mobile UI research](mobile-ui.md)).
4. A server route costs more than it saves now. Every route except a few public ones needs a session, so the app would have to send its token with each image request, which is a change in `mobile/`. The image optimizer of Next.js at `/_next/image` sits outside the login check, so turning it on for the compositor would let anyone make the server fetch any compositor image.
5. Tesla sees the address of the browser or the phone and the car configuration. [Privacy](../docs/privacy.md) lists this, and Settings, Overview, Car image turns it off.

Reconsider when Tesla blocks direct links, retires the compositor, or the owners want to hide their address from Tesla. Then the server can fetch `carImageUrl(car)` once with a plain `User-Agent`, keep the PNG next to the Settings file under a hash of the URL, and answer with `Cache-Control: private, max-age=31536000, immutable`. The app would send its token with the image through the `headers` of the `expo-image` source. That change needs a decision record.

## Combinations

A paint code and a wheel code do not depend on each other within a generation, so each row checks one color with the usual wheel, or one wheel with one color. Result "right" means the URL did not change and was right. "fixed" means the car had no image or showed other wheels before.

| Generation | Field | TeslaMate value (other field) | Source | Compositor, model, options | Result |
|---|---|---|---|---|---|
| Y-2020 | color | PearlWhite (Gemini19) | [car][md40] | v1 `my` `$MTY09,$PPSW,$WY19B,$INPB0` | right |
| Y-2020 | color | SolidBlack (Gemini19) | [table][matedroid] | v1 `my` `$MTY09,$PBSB,$WY19B,$INPB0` | right |
| Y-2020 | color | MidnightSilver (Gemini19) | [car][tm3565] | v1 `my` `$MTY09,$PMNG,$WY19B,$INPB0` | right |
| Y-2020 | color | DeepBlue (Gemini19) | [table][matedroid] | v1 `my` `$MTY09,$PPSB,$WY19B,$INPB0` | right |
| Y-2020 | color | RedMulticoat (Gemini19) | [table][matedroid] | v1 `my` `$MTY09,$PPMR,$WY19B,$INPB0` | right |
| Y-2020 | color | Quicksilver (Gemini19) | [table][matedroid] | v1 `my` `$MTY09,$PN00,$WY19B,$INPB0` | right |
| Y-2020 | color | StealthGrey (Gemini19) | [table][matedroid] | v1 `my` `$MTY09,$PN01,$WY19B,$INPB0` | right |
| Y-2020 | color | MidnightCherryRed (Gemini19) | [table][matedroid] | v1 `my` `$MTY09,$PR00,$WY19B,$INPB0` | right |
| Y-2020 | color | UltraRed (Gemini19) | [table][matedroid] | v1 `my` `$MTY09,$PR01,$WY19B,$INPB0` | right |
| Y-2020 | wheel | Apollo19 (PearlWhite) | [car][md134] | v1 `my` `$MTY09,$PPSW,$WY19B,$INPB0` | right |
| Y-2020 | wheel | Apollo19CapKit (PearlWhite) | [table][matedroid] | v1 `my` `$MTY09,$PPSW,$WY19B,$INPB0` | right |
| Y-2020 | wheel | Apollo19MetallicShadow (PearlWhite) | [car][evcc16624] | v1 `my` `$MTY09,$PPSW,$WY19C,$INPB0` | right |
| Y-2020 | wheel | Induction20 (PearlWhite) | [table][matedroid] | v1 `my` `$MTY09,$PPSW,$WY20P,$INPB0` | right |
| Y-2020 | wheel | Induction20Black (PearlWhite) | [car][tm3565] | v1 `my` `$MTY09,$PPSW,$WY20P,$INPB0` | right |
| Y-2020 | wheel | UberTurbine21 (PearlWhite) | [table][matedroid] | v1 `my` `$MTY12,$PPSW,$WY21P,$INPB0` | right |
| Y-2020 | wheel | UberTurbine21Black (PearlWhite) | [table][matedroid] | v1 `my` `$MTY12,$PPSW,$WY21P,$INPB0` | right |
| Y-2025 | color | StealthGrey (Crossflow19) | [car][md1] | configurator `my` `$MTY48,$PN01,$WY19P,$IPB12` | right |
| Y-2025 | color | PearlWhite (Crossflow19) | [car][md40] | configurator `my` `$MTY48,$PPSW,$WY19P,$IPB12` | right |
| Y-2025 | color | DiamondBlack (Crossflow19) | [car][md293] | configurator `my` `$MTY48,$PX02,$WY19P,$IPB12` | right |
| Y-2025 | color | BlackDiamond (Crossflow19) | [table][matedroid] | configurator `my` `$MTY48,$PX02,$WY19P,$IPB12` | right |
| Y-2025 | color | Quicksilver (Crossflow19) | [table][matedroid] | configurator `my` `$MTY48,$PN00,$WY19P,$IPB12` | right |
| Y-2025 | color | UltraRed (Crossflow19) | [car][tma477] | configurator `my` `$MTY48,$PR01,$WY19P,$IPB12` | right |
| Y-2025 | color | GlacierBlue (Crossflow19) | [table][matedroid] | configurator `my` `$MTY48,$PB01,$WY19P,$IPB12` | right |
| Y-2025 | color | MarineBlue (Crossflow19) | [table][matedroid] | configurator `my` `$MTY48,$PB02,$WY19P,$IPB12` | right |
| Y-2025 | color | DeepBlue (Crossflow19) | [car][md1] | configurator `my` `$MTY48,$PPSB,$WY19P,$IPB12` | right |
| Y-2025 | wheel | Aperture18 (StealthGrey) | [table][matedroid] | configurator `my` `$MTY77,$PN01,$WY18P,$IBB3` | right |
| Y-2025 | wheel | Photon18 (StealthGrey) | [table][matedroid] | configurator `my` `$MTY77,$PN01,$WY18P,$IBB3` | right |
| Y-2025 | wheel | Helix20 (StealthGrey) | [table][matedroid] | configurator `my` `$MTY48,$PN01,$WY20B,$IPB12` | right |
| Y-2025 | wheel | Arachnid21 (StealthGrey) | [table][kemmey] | configurator `my` `$MTY70,$PN01,$WY21A,$IPB14` | right |
| Y-2025 | wheel | Aperture18 (StealthGrey) | [table][matedroid] | configurator `my` `$MTY61,$PN01,$WY18P,$IBB3` | right |
| 3-2017 | color | PearlWhite (Pinwheel18) | [car][md40] | v1 `m3` `$PPSW,$W38B` | right |
| 3-2017 | color | SolidBlack (Pinwheel18) | [table][matedroid] | v1 `m3` `$PBSB,$W38B` | right |
| 3-2017 | color | MidnightSilver (Pinwheel18) | [table][matedroid] | v1 `m3` `$PMNG,$W38B` | right |
| 3-2017 | color | DeepBlue (Pinwheel18) | [car][ha] | v1 `m3` `$PPSB,$W38B` | right |
| 3-2017 | color | RedMulticoat (Pinwheel18) | [table][matedroid] | v1 `m3` `$PPMR,$W38B` | right |
| 3-2017 | color | ObsidianBlack (Pinwheel18) | [table][matedroid] | v1 `m3` `$PMBL,$W38B` | right |
| 3-2017 | color | SilverMetallic (Pinwheel18) | [table][matedroid] | v1 `m3` `$PMSS,$W38B` | right |
| 3-2017 | wheel | Pinwheel18CapKit (PearlWhite) | [car][ha] | v1 `m3` `$PPSW,$W38B` | right |
| 3-2017 | wheel | Aero18 (PearlWhite) | [table][matedroid] | v1 `m3` `$PPSW,$W38B` | fixed: had no image |
| 3-2017 | wheel | PinwheelRefresh18 (PearlWhite) | [table][kemmey] | v1 `m3` `$PPSW,$W40B` | fixed: had no image |
| 3-2017 | wheel | Stiletto19 (PearlWhite) | [table][matedroid] | v1 `m3` `$PPSW,$W39B` | right |
| 3-2017 | wheel | Sportwheel19 (PearlWhite) | [table][kemmey] | v1 `m3` `$PPSW,$W39B` | fixed: had no image |
| 3-2017 | wheel | Sport19 (PearlWhite) | [table][matedroid] | v1 `m3` `$PPSW,$W39B` | right |
| 3-2017 | wheel | AeroTurbine19 (PearlWhite) | [table][matedroid] | v1 `m3` `$PPSW,$W39B` | fixed: had no image |
| 3-2017 | wheel | Gemini19Square (PearlWhite) | [table][kemmey] | v1 `m3` `$PPSW,$W39B` | fixed: had no image |
| 3-2017 | wheel | StilettoRefresh19 (PearlWhite) | [table][kemmey] | v1 `m3` `$PPSW,$W41B` | fixed: had no image |
| 3-2017 | wheel | Stiletto20 (PearlWhite) | [table][matedroid] | v1 `m3` `$PPSW,$W32P` | right |
| 3-2017 | wheel | Stiletto20DarkSquare (PearlWhite) | [car][tm2494] | v1 `m3` `$PPSW,$W32D` | fixed: was $PPSW,$W32P |
| 3-2017 | wheel | Stiletto20DarkStaggered (PearlWhite) | [table][kemmey] | v1 `m3` `$PPSW,$W32D` | fixed: was $PPSW,$W32P |
| 3-2017 | wheel | Performancewheel20 (PearlWhite) | [table][kemmey] | v1 `m3` `$PPSW,$W32P` | fixed: had no image |
| 3-2017 | wheel | Performance20 (PearlWhite) | [table][matedroid] | v1 `m3` `$PPSW,$W32P` | right |
| 3-2017 | wheel | UberTurbine20Gunpowder (PearlWhite) | [car][md185] | v1 `m3` `$PPSW,$W33D` | right |
| 3-2017 | wheel | ZeroG20Gunpowder (PearlWhite) | [table][kemmey] | v1 `m3` `$PPSW,$W33D` | fixed: had no image |
| 3-2024 | color | StealthGrey (Photon18) | [car][tm3565] | configurator `m3` `$MT369,$PN01,$W38A,$IPB2` | right |
| 3-2024 | color | PearlWhite (Photon18) | [car][md40] | configurator `m3` `$MT369,$PPSW,$W38A,$IPB2` | right |
| 3-2024 | color | DeepBlue (Photon18) | [table][matedroid] | configurator `m3` `$MT369,$PPSB,$W38A,$IPB2` | right |
| 3-2024 | color | SolidBlack (Photon18) | [table][matedroid] | configurator `m3` `$MT369,$PBSB,$W38A,$IPB2` | right |
| 3-2024 | color | UltraRed (Photon18) | [car][tm3887] | configurator `m3` `$MT369,$PR01,$W38A,$IPB2` | right |
| 3-2024 | color | Quicksilver (Photon18) | [table][matedroid] | configurator `m3` `$MT369,$PN00,$W38A,$IPB2` | right |
| 3-2024 | color | DiamondBlack (Photon18) | [table][matedroid] | configurator `m3` `$MT369,$PX02,$W38A,$IPB2` | right |
| 3-2024 | color | MarineBlue (Photon18) | [table][matedroid] | configurator `m3` `$MT369,$PB02,$W38A,$IPB2` | fixed: had no image |
| 3-2024 | wheel | Prismata18 (StealthGrey) | [table][matedroid] | configurator `m3` `$MT367,$PN01,$W38C,$IBB4` | right |
| 3-2024 | wheel | Glider18 (StealthGrey) | [car][tm3565] | configurator `m3` `$MT369,$PN01,$W38A,$IPB2` | right |
| 3-2024 | wheel | Nova18 (StealthGrey) | [table][matedroid] | configurator `m3` `$MT369,$PN01,$W38A,$IPB2` | right |
| 3-2024 | wheel | Nova19 (StealthGrey) | [table][matedroid] | configurator `m3` `$MT369,$PN01,$W39G,$IPB2` | right |
| 3-2024 | wheel | Helix19 (StealthGrey) | [table][matedroid] | configurator `m3` `$MT369,$PN01,$W39G,$IPB2` | right |
| 3-2024 | wheel | Warp20 (StealthGrey) | [table][matedroid] | configurator `m3` `$MT371,$PN01,$W30A,$IPB4` | right |
| 3-2024 | wheel | Performance20 (StealthGrey) | [table][matedroid] | configurator `m3` `$MT371,$PN01,$W30A,$IPB4` | right |
| S-2012 | color | PearlWhite (Base19) | [table][kemmey] | v1 `ms` `$PPSW,$WT19` | fixed: had no image |
| S-2012 | color | Pearl (Base19) | [table][kemmey] | v1 `ms` `$PPSW,$WT19` | fixed: had no image |
| S-2012 | color | White (Base19) | [car][timdorr] | v1 `ms` `$PPSW,$WT19` | fixed: had no image |
| S-2012 | color | SolidWhite (Base19) | [table][kemmey] | v1 `ms` `$PBCW,$WT19` | fixed: had no image |
| S-2012 | color | SolidBlack (Base19) | [table][kemmey] | v1 `ms` `$PBSB,$WT19` | fixed: had no image |
| S-2012 | color | Black (Base19) | [car][tm2193] | v1 `ms` `$PBSB,$WT19` | fixed: had no image |
| S-2012 | color | MetallicBlack (Base19) | [table][kemmey] | v1 `ms` `$PMBL,$WT19` | fixed: had no image |
| S-2012 | color | ObsidianBlack (Base19) | [table][kemmey] | v1 `ms` `$PMBL,$WT19` | fixed: had no image |
| S-2012 | color | MidnightSilver (Base19) | [table][kemmey] | v1 `ms` `$PMNG,$WT19` | fixed: had no image |
| S-2012 | color | SteelGrey (Base19) | [table][kemmey] | v1 `ms` `$PMNG,$WT19` | fixed: had no image |
| S-2012 | color | SilverMetallic (Base19) | [table][kemmey] | v1 `ms` `$PMSS,$WT19` | fixed: had no image |
| S-2012 | color | Silver (Base19) | [table][kemmey] | v1 `ms` `$PMSS,$WT19` | fixed: had no image |
| S-2012 | color | DolphinGrey (Base19) | [table][kemmey] | v1 `ms` `$PMTG,$WT19` | fixed: had no image |
| S-2012 | color | TitaniumCopper (Base19) | [table][kemmey] | v1 `ms` `$PPTI,$WT19` | fixed: had no image |
| S-2012 | color | MetallicBrown (Base19) | [table][kemmey] | v1 `ms` `$PMAB,$WT19` | fixed: had no image |
| S-2012 | color | Brown (Base19) | [table][kemmey] | v1 `ms` `$PMAB,$WT19` | fixed: had no image |
| S-2012 | color | MetallicGreen (Base19) | [table][kemmey] | v1 `ms` `$PMSG,$WT19` | fixed: had no image |
| S-2012 | color | Green (Base19) | [table][kemmey] | v1 `ms` `$PMSG,$WT19` | fixed: had no image |
| S-2012 | color | DeepBlue (Base19) | [table][kemmey] | v1 `ms` `$PPSB,$WT19` | fixed: had no image |
| S-2012 | color | SignatureBlue (Base19) | [table][kemmey] | v1 `ms` `$PPSB,$WT19` | fixed: had no image |
| S-2012 | color | MetallicBlue (Base19) | [table][kemmey] | v1 `ms` `$PMMB,$WT19` | fixed: had no image |
| S-2012 | color | RedMulticoat (Base19) | [table][kemmey] | v1 `ms` `$PPMR,$WT19` | fixed: had no image |
| S-2012 | color | Red (Base19) | [table][kemmey] | v1 `ms` `$PPMR,$WT19` | fixed: had no image |
| S-2012 | color | SignatureRed (Base19) | [table][kemmey] | v1 `ms` `$PPSR,$WT19` | fixed: had no image |
| S-2012 | wheel | Slipstream19Carbon (PearlWhite) | [car][tm2193] | v1 `ms` `$PPSW,$WT19` | fixed: had no image |
| S-2012 | wheel | Slipstream19Silver (PearlWhite) | [table][kemmey] | v1 `ms` `$PPSW,$WT19` | fixed: had no image |
| S-2012 | wheel | Aero19 (PearlWhite) | [table][kemmey] | v1 `ms` `$PPSW,$WTAS` | fixed: had no image |
| S-2012 | wheel | AeroTurbine19 (PearlWhite) | [car][timdorr] | v1 `ms` `$PPSW,$WTAS` | fixed: had no image |
| S-2012 | wheel | Turbine19 (PearlWhite) | [table][kemmey] | v1 `ms` `$PPSW,$WTAS` | fixed: had no image |
| S-2012 | wheel | Turbine19Dark (PearlWhite) | [table][kemmey] | v1 `ms` `$PPSW,$WTAS` | fixed: had no image |
| S-2012 | wheel | Arachnid21Grey (PearlWhite) | [table][kemmey] | v1 `ms` `$PPSW,$WTSG` | fixed: had no image |
| S-2012 | wheel | Arachnid21Silver (PearlWhite) | [table][kemmey] | v1 `ms` `$PPSW,$WTAS` | fixed: had no image |
| S-2012 | wheel | Arachnid21Black (PearlWhite) | [table][kemmey] | v1 `ms` `$PPSW,$WTSG` | fixed: had no image |
| S-2012 | wheel | Super21Gray (PearlWhite) | [table][kemmey] | v1 `ms` `$PPSW,$WTSG` | fixed: had no image |
| S-2012 | wheel | Super21Silver (PearlWhite) | [table][kemmey] | v1 `ms` `$PPSW,$WTSS` | fixed: had no image |
| S-2012 | wheel | Silver21 (PearlWhite) | [table][kemmey] | v1 `ms` `$PPSW,$WT21` | fixed: had no image |
| S-2012 | wheel | Silver21Euro (PearlWhite) | [table][kemmey] | v1 `ms` `$PPSW,$WT21` | fixed: had no image |
| S-2012 | wheel | Charcoal21 (PearlWhite) | [table][kemmey] | v1 `ms` `$PPSW,$WTSG` | fixed: had no image |
| S-2012 | wheel | Charcoal21Euro (PearlWhite) | [table][kemmey] | v1 `ms` `$PPSW,$WTSG` | fixed: had no image |
| S-2012 | wheel | TwinTurbine21Carbon (PearlWhite) | [table][kemmey] | v1 `ms` `$PPSW,$WTTB` | fixed: had no image |
| S-2012 | wheel | TwinTurbine21Silver (PearlWhite) | [table][kemmey] | v1 `ms` `$PPSW,$WTTB` | fixed: had no image |
| S-2021 | color | SolidBlack (Cardenio19) | [car][tm2193] | configurator `ms` `$MTS13,$PBSB,$WS90,$IBE00` | fixed: had no image |
| S-2021 | color | PearlWhite (Cardenio19) | [table][kemmey] | configurator `ms` `$MTS13,$PPSW,$WS90,$IBE00` | fixed: had no image |
| S-2021 | color | MidnightSilver (Cardenio19) | [table][kemmey] | configurator `ms` `$MTS13,$PMNG,$WS90,$IBE00` | fixed: had no image |
| S-2021 | color | DeepBlue (Cardenio19) | [table][kemmey] | configurator `ms` `$MTS13,$PPSB,$WS90,$IBE00` | fixed: had no image |
| S-2021 | color | RedMulticoat (Cardenio19) | [table][kemmey] | configurator `ms` `$MTS13,$PPMR,$WS90,$IBE00` | fixed: had no image |
| S-2021 | color | StealthGrey (Cardenio19) | [table][kemmey] | configurator `ms` `$MTS13,$PN01,$WS90,$IBE00` | fixed: had no image |
| S-2021 | color | UltraRed (Cardenio19) | [table][kemmey] | configurator `ms` `$MTS13,$PR01,$WS90,$IBE00` | fixed: had no image |
| S-2021 | color | LunarSilver (Cardenio19) | no report found | configurator `ms` `$MTS13,$PN02,$WS90,$IBE00` | fixed: had no image |
| S-2021 | wheel | Tempest19 (SolidBlack) | [table][kemmey] | configurator `ms` `$MTS13,$PBSB,$WS90,$IBE00` | fixed: had no image |
| S-2021 | wheel | Arachnid21 (SolidBlack) | [table][kemmey] | configurator `ms` `$MTS13,$PBSB,$WS11,$IBE00` | fixed: had no image |
| S-2025 | color | DiamondBlack (no wheel) | no report found | configurator `ms` `$MTS22,$PX02,$WS93,$IBE01` | fixed: had no image |
| S-2025 | color | FrostBlue (no wheel) | no report found | configurator `ms` `$MTS22,$PB00,$WS93,$IBE01` | fixed: had no image |
| S-2025 | color | StealthGrey (no wheel) | no report found | configurator `ms` `$MTS22,$PN01,$WS93,$IBE01` | fixed: had no image |
| S-2025 | color | PearlWhite (no wheel) | no report found | configurator `ms` `$MTS22,$PPSW,$WS93,$IBE01` | fixed: had no image |
| X-2015 | color | PearlWhite (AeroTurbine20) | [table][kemmey] | v1 `mx` `$PPSW,$WT20` | fixed: had no image |
| X-2015 | color | SolidWhite (AeroTurbine20) | [table][kemmey] | v1 `mx` `$PBCW,$WT20` | fixed: had no image |
| X-2015 | color | SolidBlack (AeroTurbine20) | [table][kemmey] | v1 `mx` `$PBSB,$WT20` | fixed: had no image |
| X-2015 | color | MetallicBlack (AeroTurbine20) | [car][timdorr] | v1 `mx` `$PMBL,$WT20` | fixed: had no image |
| X-2015 | color | SteelGrey (AeroTurbine20) | [car][md90] | v1 `mx` `$PMNG,$WT20` | fixed: had no image |
| X-2015 | color | MidnightSilver (AeroTurbine20) | [table][kemmey] | v1 `mx` `$PMNG,$WT20` | fixed: had no image |
| X-2015 | color | SilverMetallic (AeroTurbine20) | [table][kemmey] | v1 `mx` `$PMSS,$WT20` | fixed: had no image |
| X-2015 | color | DeepBlue (AeroTurbine20) | [table][kemmey] | v1 `mx` `$PPSB,$WT20` | fixed: had no image |
| X-2015 | color | RedMulticoat (AeroTurbine20) | [table][kemmey] | v1 `mx` `$PPMR,$WT20` | fixed: had no image |
| X-2015 | wheel | Slipstream20Carbon (PearlWhite) | [car][md90] | v1 `mx` `$PPSW,$WTSC` | fixed: had no image |
| X-2015 | wheel | Slipstream20Dark (PearlWhite) | [table][kemmey] | v1 `mx` `$PPSW,$WTSC` | fixed: had no image |
| X-2015 | wheel | Slipstream20Silver (PearlWhite) | [table][kemmey] | v1 `mx` `$PPSW,$WT20` | fixed: had no image |
| X-2015 | wheel | AeroTurbine22 (PearlWhite) | [table][kemmey] | v1 `mx` `$PPSW,$WT22` | fixed: had no image |
| X-2015 | wheel | Turbine22 (PearlWhite) | [car][timdorr] | v1 `mx` `$PPSW,$WT22` | fixed: had no image |
| X-2015 | wheel | Turbine22Dark (PearlWhite) | [table][kemmey] | v1 `mx` `$PPSW,$WTUT` | fixed: had no image |
| X-2015 | wheel | Turbine22Light (PearlWhite) | [table][kemmey] | v1 `mx` `$PPSW,$WT22` | fixed: had no image |
| X-2015 | wheel | Onyx22Black (PearlWhite) | [table][kemmey] | v1 `mx` `$PPSW,$WTUT` | fixed: had no image |
| X-2021 | color | DeepBlue (Cyberstream20) | [car][tm2494] | configurator `mx` `$MTX10,$PPSB,$WX00,$IBE00` | fixed: had no image |
| X-2021 | color | PearlWhite (Cyberstream20) | [table][kemmey] | configurator `mx` `$MTX10,$PPSW,$WX00,$IBE00` | fixed: had no image |
| X-2021 | color | SolidBlack (Cyberstream20) | [table][kemmey] | configurator `mx` `$MTX10,$PBSB,$WX00,$IBE00` | fixed: had no image |
| X-2021 | color | MidnightSilver (Cyberstream20) | [table][kemmey] | configurator `mx` `$MTX10,$PMNG,$WX00,$IBE00` | fixed: had no image |
| X-2021 | color | RedMulticoat (Cyberstream20) | [table][kemmey] | configurator `mx` `$MTX10,$PPMR,$WX00,$IBE00` | fixed: had no image |
| X-2021 | wheel | NewTurbine22Black (DeepBlue) | [car][tm2494] | configurator `mx` `$MTX10,$PPSB,$WX20,$IBE00` | fixed: had no image |
| X-2025 | color | StealthGrey (no wheel) | no report found | configurator `mx` `$MTX22,$PN01,$WX02,$IBE01` | fixed: had no image |
| X-2025 | color | UltraRed (no wheel) | no report found | configurator `mx` `$MTX22,$PR01,$WX02,$IBE01` | fixed: had no image |
| X-2025 | color | LunarSilver (no wheel) | no report found | configurator `mx` `$MTX22,$PN02,$WX02,$IBE01` | fixed: had no image |
| X-2025 | color | DiamondBlack (no wheel) | no report found | configurator `mx` `$MTX22,$PX02,$WX02,$IBE01` | fixed: had no image |
| X-2025 | color | FrostBlue (no wheel) | no report found | configurator `mx` `$MTX22,$PB00,$WX02,$IBE01` | fixed: had no image |
| X-2025 | color | PearlWhite (no wheel) | no report found | configurator `mx` `$MTX22,$PPSW,$WX02,$IBE01` | fixed: had no image |
| Cybertruck | color | Stainless (no wheel) | no report found | configurator `ct` `$MTC03,$PDD,$WH0B,$IG01` | fixed: had no image |
| Cybertruck | wheel | CybertruckPremium (no color) | no report found | configurator `ct` `$MTC03,$PDD,$WH0B,$IG01` | fixed: had no image |

## Sources

[tm-vehicle]: https://github.com/teslamate-org/teslamate/blob/main/elixir/lib/teslamate/vehicles/vehicle.ex
[matedroid]: https://github.com/vide/matedroid/blob/main/docs/ASSETS.md
[kemmey]: https://github.com/Kemmey/Kemmey-TeslaWatch-Public/blob/master/Compositor/compositorV3.json
[tn9]: https://github.com/tn9design/tesla-vehicle-config-decoder
[tracker]: https://github.com/svenger87/tesla_order_tracker/blob/master/src/app/api/admin/seed-compositor-codes/route.ts
[tesla-legal]: https://www.tesla.com/en_gb/legal/additional-resources
[tm2193]: https://github.com/teslamate-org/teslamate/issues/2193
[tm2494]: https://github.com/teslamate-org/teslamate/issues/2494
[tm3565]: https://github.com/teslamate-org/teslamate/issues/3565
[tm3887]: https://github.com/teslamate-org/teslamate/issues/3887
[md1]: https://github.com/vide/matedroid/issues/1
[md40]: https://github.com/vide/matedroid/discussions/40
[md90]: https://github.com/vide/matedroid/issues/90
[md134]: https://github.com/vide/matedroid/issues/134
[md185]: https://github.com/vide/matedroid/pull/185
[md293]: https://github.com/vide/matedroid/pull/293
[evcc16624]: https://github.com/evcc-io/evcc/discussions/16624
[tma477]: https://github.com/tobiasehlert/teslamateapi/issues/477
[ha]: https://github.com/home-assistant/core/blob/dev/tests/components/teslemetry/fixtures/vehicle_data.json
[timdorr]: https://github.com/timdorr/tesla-api/blob/master/docs/vehicle/state/vehicleconfig.md

- TeslaMate: [`vehicle.ex`][tm-vehicle], issues [#2193][tm2193], [#2494][tm2494], [#3565][tm3565], and [#3887][tm3887]
- MateDroid: [assets][matedroid], [#1][md1], [#40][md40], [#90][md90], [#134][md134], [#185][md185], and [#293][md293]
- [evcc discussion #16624][evcc16624], [teslamateapi #477][tma477], the [Home Assistant Teslemetry fixture][ha], and the [Tesla API docs of timdorr][timdorr]
- Code tables: [Kemmey-TeslaWatch][kemmey], [tesla-vehicle-config-decoder][tn9], and [tesla_order_tracker][tracker]
- [Tesla legal resources][tesla-legal]
