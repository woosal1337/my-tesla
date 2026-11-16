export type MapCover = "loading" | "failed" | "lifted";

export type MapSignal = "rendered" | "failed" | "timeout";

export function coverAfter(cover: MapCover, signal: MapSignal): MapCover {
  if (cover === "lifted" || signal === "rendered") return "lifted";
  if (cover === "failed" || signal === "failed") return "failed";
  return "lifted";
}
