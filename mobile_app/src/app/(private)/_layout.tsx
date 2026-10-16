import { Redirect, Stack } from "expo-router";
import { useAuth } from "@/hooks/useAuth";

export default function PrivateLayout() {
  const isLoggedIn = useAuth();

  if (!isLoggedIn) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
