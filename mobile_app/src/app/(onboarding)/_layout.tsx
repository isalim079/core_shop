import { Stack } from "expo-router";
import { defaultStackScreenOptions } from "@/constants/navigation";

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={defaultStackScreenOptions}>
      <Stack.Screen name="organizations" />
      <Stack.Screen name="create-business" />
      <Stack.Screen name="join-business" />
      <Stack.Screen name="select-branch" />
    </Stack>
  );
}
