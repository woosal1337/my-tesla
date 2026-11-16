import { Stack } from "expo-router";
import { useStackOptions } from "@/navigation/header";

export const unstable_settings = { anchor: "index" };

export default function DrivesLayout() {
  return (
    <Stack screenOptions={useStackOptions()}>
      <Stack.Screen
        name="index"
        options={{ title: "Drives", headerLargeTitleEnabled: true }}
      />
      <Stack.Screen
        name="timeline"
        options={{ title: "Timeline", fullScreenGestureEnabled: false }}
      />
    </Stack>
  );
}
