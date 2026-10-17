import { Stack } from "expo-router";
import { defaultStackScreenOptions } from "@/constants/navigation";

export default function AuthLayout() {
  return (
    <Stack screenOptions={defaultStackScreenOptions}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="reset-password" />
      <Stack.Screen name="verify-email" />
    </Stack>
  );
}
