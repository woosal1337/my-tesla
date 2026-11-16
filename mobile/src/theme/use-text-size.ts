import { useWindowDimensions } from "react-native";
import { axisScale, iconScale, isLargeText } from "./text-size";

export function useLargeText(): boolean {
  return isLargeText(useWindowDimensions().fontScale);
}

export function useIconScale(): number {
  return iconScale(useWindowDimensions().fontScale);
}

export function useAxisScale(): number {
  return axisScale(useWindowDimensions().fontScale);
}
