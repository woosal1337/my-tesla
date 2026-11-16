# 0028: The car fills the stage

Date: 2026-11-16

Status: Accepted.

## Context

The car stage of the mobile Overview had five problems. The callouts sat 8 pt from the screen edge, while all other content keeps the 20 pt margin. A 24 pt line under each callout stopped in empty space. The car was small. The glow under the car was almost invisible in dark and did not show in light. Until the image loaded, the stage was empty, and on a wide screen the stage sat at the top of the right pane.

The compositor render is 1440 by 810 px, and the car covers only a part of it. One render for each generation, measured with sharp at an alpha above 80 of 255, shows that the car covers 45% to 69% of the render width: 45% for the Model X from 2016, 56% for the Model Y from 2025, and 69% for the Model 3 from 2017. The image box was 84% of the stage, so the Model Y filled about 47% of the stage. [Car images](../../research/car-images.md#where-the-car-sits-in-the-render) has the table.

## Decision

1. The server sends the part of the image that the car fills. `car.imageFrame` in `GET /api/app/cars/{carId}/overview` holds `left`, `top`, `width`, and `height` as fractions of the image width and height. `carImage()` in `src/lib/car-image.ts` keeps one measured frame for each generation. The server knows the generation, and the app cannot read the pixels without a native package.
2. The app scales and places the image from that frame. `carSlot()` in `mobile/src/components/car-frame.ts` gives a slot with the aspect ratio of the car, and the image box around it keeps 16:9. The car spans the content width, the screen width minus the two 20 pt margins, up to 440 pt. That is 89.7% of the screen at 390 pt and 90.9% at 440 pt.
3. The stage has no lines. The callouts sit in the normal layout flow above the car: the top callout in the center, then the left and the right callout in one row at the 20 pt margins. The row wraps at a large text size. The label uses `mutedForeground`, and a long value wraps.
4. The T-mark breathes in the car area until the image loads. The area has its final size from the frame, so nothing moves when the image shows.
5. The glow uses the colors of the web hero: the foreground color at 6% in light and at 9% in dark, as a flat ellipse under the car. The ellipse is 1.08 car widths wide, so it stays inside the 20 pt bleed of the stage.
6. On a wide screen, the right pane is as high as the row of the sidebar, the stage grows to fill the pane, and the callouts and the car sit in its center.

## Alternatives

1. One fixed scale in the app. It needs no contract change, but no scale fits all generations: 1.45 makes the Model Y 81% wide, cuts 6 pt from the nose of the Model 3 from 2017, and leaves the Model X from 2016 at 66%.
2. The `crop` parameter of the compositor. The configurator compositor crops and rescales, and `v1/compositor` ignores the same value. Tesla does not document the parameter.
3. A larger render (`size=2048`). Both compositors stop at 1920 by 1080, and the configurator compositor then sends a PNG with a color palette.
4. A glow of 1.24 car widths, as on the web hero. The stage clips it at its 20 pt bleed, and the clip showed as a hard edge next to the iPad sidebar.
5. A right pane as high as the window. It needs the real top inset of the scroll view. On the iPad the tab bar is at the top, and `useSafeAreaInsets()` reads the root provider, so the sum can be wrong and the Overview can scroll without a reason. Later work owns the insets and the iPad layout.

## Consequences

- An older server sends no `imageFrame`. The app then shows the whole render at the content width, so the car is about half as wide as the screen, and nothing is cut.
- A new generation in `car-image.ts` needs a measured frame. The `Profile` type makes the frame mandatory.
- The car is drawn at about 1.3 times its pixels on a 3x phone, because the car covers about 800 px of the render.
- The quick actions and the empty state now use the content width, so each quick action moves at most 7 pt toward the center.
- [Decision 0025](0025-the-tesla-app-layout.md) keeps the layout of the Overview. This decision replaces its lines and the size of the car.
