# 0041: Connect continues the launch mark

Date: 2026-11-16

Status: Accepted.

## Context

The UI pass of 2026-10-23 found that Connect, the first screen after an install, did not look like the rest of the app.

1. Connect rendered through `Screen withoutHeader`, a scroll view that starts at the top. The title, one sentence, "Scan the code", a note, and "Open the demo" filled the top third. On a 874 pt screen, the last button ended near 390 pt, and the rest of the screen was empty.
2. The launch splash draws the T-mark of 56 pt at the center of the window and fades out after 1.15 s. Connect had no mark, so the mark disappeared and the content appeared in another place.
3. Connect showed a mark only in the waiting panel, at 36 pt.
4. The web sign-in card shows a still T-mark, then the title, then the intro, then the form.

## Decision

1. The start state of Connect shows a still T-mark of `launchMarkSize` (56 pt) at the center of the window, the place and the size of the splash mark. The splash fades out over an identical mark, so nothing moves.
2. The title "My Tesla" and the sign-in sentence sit centered under the mark, in the order of the web sign-in card.
3. The problem text, "Scan the code", "Open the demo", and one caption about the web sit at the bottom, inside the safe area.
4. `launchFrame()` in `mobile/src/components/launch-frame.ts` places the mark and starts the content one gap below it. So every button is in the lower half on every screen height. When the text is too large for the lower half, the screen scrolls, and the mark scrolls with the content.
5. The waiting panel and the link panel show alone, centered vertically, with the problem text under them. They show no large mark and no heading.
6. The content sits in a column of at most 480 pt. This is wider than every iPhone in portrait, so only an iPad changes.
7. `TeslaMark` has a third kind, `still`, with no motion. The splash keeps `draw`, and a loading screen keeps `breathe`.
8. Connect draws its own `ScrollView` with `contentInsetAdjustmentBehavior="never"`, and the `StatusBarStrip` of `Screen`.

## Alternatives

1. The mark at the center in the panel states too. The waiting panel is about 374 pt high, and the lower half of an iPhone 16e has about 320 pt. Cancel then falls below the fold.
2. The old top layout for the panel states, with a left heading. It needs two heading styles, and the heading jumps when a panel shows.
3. New props for `Screen`. `Screen` uses the automatic content inset of iOS. A content container with `flexGrow: 1` then scrolls by the height of the insets, and the place of the mark needs a platform branch.
4. A drawing mark on Connect. The splash already draws it, and a second drawing after each sign-out is decoration.
5. A logo in the native splash. It needs a new prebuild, and it would jump when the drawing starts.

## Consequences

- The launch flows into Connect with no jump on iOS. The splash, the native splash, and the timing of the splash do not change.
- Connect is the one screen with its own `ScrollView`. A change of `Screen` does not reach it.
- The labels "Scan the code" and "Open the demo" stay, so the docs and the test flows stay true.
- The waiting state needs an account server and a camera, so no simulator check covers it. Its panel content does not change.
- Android is not checked. The math has no platform branch, but an old Android without edge to edge can differ by the height of the status bar.
- No Apple or Material page states a thumb-zone rule. The place at the bottom rests on the full-width button guidance and the order of the web sign-in card.

## Sources

- [Apple HIG: launching](https://developer.apple.com/design/human-interface-guidelines/launching), read on 2026-11-16: "Design a launch screen that's nearly identical to the first screen of your app or game." Elements that look different cause "an unpleasant flash between the launch screen and your first screen".
- [Apple HIG: branding](https://developer.apple.com/design/human-interface-guidelines/branding), read on 2026-11-16: do not show a logo throughout the app unless it is essential for context.
- [Apple HIG: buttons](https://developer.apple.com/design/human-interface-guidelines/buttons), read on 2026-11-16: "Prefer buttons that span the width of the screen for primary actions in your app."
- [Apple HIG: layout](https://developer.apple.com/design/human-interface-guidelines/layout), read on 2026-11-16: "Be prepared for text-size changes", and respect the safe area.
- [Apple HIG: motion](https://developer.apple.com/design/human-interface-guidelines/motion) and [onboarding](https://developer.apple.com/design/human-interface-guidelines/onboarding), read on 2026-11-16.
- [Android Compose buttons](https://developer.android.com/develop/ui/compose/components/button), read on 2026-11-16: the filled button is for high emphasis and primary actions, and the outlined button for alternative, secondary actions.
- [WCAG 2.2 Understanding 1.4.4 Resize Text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html), [1.4.10 Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html), [1.3.2 Meaningful Sequence](https://www.w3.org/WAI/WCAG22/Understanding/meaningful-sequence.html), and [2.5.8 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html), read on 2026-11-16.
- [React Native ScrollView](https://reactnative.dev/docs/scrollview), read on 2026-11-16: `contentInsetAdjustmentBehavior` and `alwaysBounceVertical`.
- [react-native-safe-area-context](https://docs.expo.dev/versions/v58.0.0/sdk/safe-area-context/), read on 2026-11-16, and `useSafeAreaFrame` in the bundled version 5.10.1.
