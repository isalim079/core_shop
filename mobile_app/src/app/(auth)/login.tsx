import { useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { useAppDispatch } from "@/store/hooks";
import { loginState } from "@/store/features/auth/auth.slice";
import { APP_NAME } from "@/constants/app";
import { Screen } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";

export default function LoginScreen() {
  const dispatch = useAppDispatch();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = () => {
    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }
    setError("");
    setLoading(true);

    setTimeout(() => {
      dispatch(
        loginState({
          user: { id: "1", name: "Demo User", email: email.trim() },
          accessToken: "demo-token",
        })
      );
      router.replace("/(private)/(tabs)");
      setLoading(false);
    }, 800);
  };

  return (
    <Screen keyboard edges={["top", "left", "right", "bottom"]}>
      <View className="flex-1 justify-between px-xl pb-4xl pt-2xl">
        <View className="mb-[40px]">
          <View className="mb-xl h-[56px] w-[56px] items-center justify-center rounded-md bg-primary">
            <Text className="font-poppins-bold text-[24px] text-text-on-primary">C</Text>
          </View>
          <Text className="text-h1">{APP_NAME}</Text>
          <Text className="text-body mt-[6px]">Sign in to your account to continue</Text>
        </View>

        <View className="flex-1">
          <TextField
            label="Email address"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            autoComplete="password"
            error={error}
          />
          <Button label="Sign in" onPress={handleLogin} loading={loading} />
          <View className="mt-sm flex-row items-center justify-center">
            <Text className="text-body">Don&apos;t have an account? </Text>
            <Button label="Register" variant="link" onPress={() => router.push("/(auth)/register")} />
          </View>
        </View>
      </View>
    </Screen>
  );
}
