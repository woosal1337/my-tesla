import { PanResponder } from "react-native";
import { swipeStep } from "./swipe-step";

export function useSwipe(onStep: (step: -1 | 1) => void) {
  return PanResponder.create({
    onMoveShouldSetPanResponderCapture: (_, { dx, dy }) =>
      swipeStep(dx, dy, 12) !== 0,
    onPanResponderTerminationRequest: () => false,
    onPanResponderRelease: (_, { dx, dy }) => {
      const step = swipeStep(dx, dy, 48);
      if (step !== 0) onStep(step);
    },
  }).panHandlers;
}
