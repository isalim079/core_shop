import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { APP_NAME } from "@/constants/app";
import { Screen } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoToLogin = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(auth)/login");
    }
  };

  const handleRegister = () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      handleGoToLogin();
    }, 800);
  };

  return (
    <Screen keyboard edges={["top", "left", "right", "bottom"]}>
      <View className="flex-1 px-xl pb-4xl pt-2xl">
        <View className="mb-[32px]">
          <TouchableOpacity
            onPress={handleGoToLogin}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            className="mb-lg h-[40px] w-[40px] items-center justify-center rounded-full bg-surface-tint"
            accessibilityLabel="Back to sign in"
          >
            <Text className="font-poppins-semibold text-[20px] text-primary">‹</Text>
          </TouchableOpacity>
          <View className="mb-xl h-[56px] w-[56px] items-center justify-center rounded-md bg-primary">
            <Text className="font-poppins-bold text-[24px] text-text-on-primary">C</Text>
          </View>
          <Text className="text-h1">Create account</Text>
          <Text className="text-body mt-[6px]">Join {APP_NAME} today</Text>
        </View>

        <TextField
          label="Full name"
          value={name}
          onChangeText={setName}
          placeholder="John Doe"
          autoCapitalize="words"
        />
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
          error={error}
        />
        <Button label="Create account" onPress={handleRegister} loading={loading} />
        <View className="mt-sm flex-row items-center justify-center">
          <Text className="text-body">Already have an account? </Text>
          <Button label="Sign in" variant="link" onPress={handleGoToLogin} />
        </View>
      </View>
    </Screen>
  );
}
