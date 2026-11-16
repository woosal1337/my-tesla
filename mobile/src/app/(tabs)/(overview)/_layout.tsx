import { Stack } from "expo-router";
import { overviewHeaderShown, useStackOptions } from "@/navigation/header";

export const unstable_settings = { anchor: "index" };

export default function OverviewLayout() {
  return (
    <Stack screenOptions={useStackOptions()}>
      <Stack.Screen
        name="index"
        options={{ title: "Overview", headerShown: overviewHeaderShown }}
      />
      <Stack.Screen name="status" options={{ title: "Status" }} />
      <Stack.Screen name="location" options={{ title: "Location" }} />
    </Stack>
  );
}
