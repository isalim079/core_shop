import { Redirect } from "expo-router";
import { useAppSelector } from "@/store/hooks";

export default function RootIndex() {
  const isLoggedIn = useAppSelector((s) => s.auth.isLoggedIn);

  if (isLoggedIn) {
    return <Redirect href="/(private)/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
