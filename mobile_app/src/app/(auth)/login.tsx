import { useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAppDispatch } from "@/store/hooks";
import { loginState } from "@/store/features/auth/auth.slice";
import { APP_NAME } from "@/constants/app";
import { Colors } from "@/constants/colors";
import { Screen } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Card } from "@/components/ui/Card";
import { staticUsers } from "@/staticData";

export default function LoginScreen() {
  const dispatch = useAppDispatch();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = (userEmail = email, userName = "Store Staff") => {
    const finalEmail = userEmail.trim();
    if (!finalEmail || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }
    setError("");
    setLoading(true);

    setTimeout(() => {
      dispatch(
        loginState({
          user: { id: "1", name: userName, email: finalEmail },
          accessToken: "demo-token",
        })
      );
      router.replace("/(private)/(tabs)");
      setLoading(false);
    }, 600);
  };

  const handleFillDemo = (role: "owner" | "cashier") => {
    const user = staticUsers[role];
    setEmail(user.email);
    setPassword("coreshop2026");
    setError("");
  };

  return (
    <Screen keyboard edges={["top", "left", "right", "bottom"]}>
      <View className="flex-1 justify-between px-xl pb-4xl pt-2xl">
        <View className="mb-[32px]">
          <View className="mb-xl h-[56px] w-[56px] items-center justify-center rounded-2xl bg-primary">
            <Text className="font-poppins-bold text-[24px] text-white">C</Text>
          </View>
          <Text className="font-poppins-bold text-[26px] text-text-primary leading-[32px]">
            {APP_NAME}
          </Text>
          <Text className="font-poppins-regular text-[14px] text-text-secondary mt-1">
            Sign in to manage your retail store
          </Text>
        </View>

        <View className="flex-1">
          <TextField
            label="Email address"
            value={email}
            onChangeText={setEmail}
            placeholder="name@coreshop.dev"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            leftIcon={<Ionicons name="mail-outline" size={18} color={Colors.textMuted} />}
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
          <Button
            label="Sign in"
            onPress={() => handleLogin()}
            loading={loading}
            size="lg"
            className="mt-2"
          />

          <View className="mt-4 flex-row items-center justify-center">
            <Text className="font-poppins-regular text-[13px] text-text-secondary">
              Don&apos;t have an account?{" "}
            </Text>
            <Button
              label="Register"
              variant="link"
              onPress={() => router.push("/(auth)/register")}
            />
          </View>

          {/* Static Demo Role Presets (M01-UI02 DRY Demonstration) */}
          <Card variant="flat" padding="sm" className="mt-8 border border-[#E2E8F0]">
            <Text className="font-poppins-medium text-[11px] text-text-muted mb-2 uppercase tracking-wider">
              Quick Fill Demo Accounts:
            </Text>
            <View className="flex-row gap-2">
              <Button
                label="Owner (Salim)"
                size="sm"
                variant="outline"
                className="flex-1 py-1.5"
                onPress={() => handleFillDemo("owner")}
              />
              <Button
                label="Cashier (Sadia)"
                size="sm"
                variant="outline"
                className="flex-1 py-1.5"
                onPress={() => handleFillDemo("cashier")}
              />
            </View>
          </Card>
        </View>
      </View>
    </Screen>
  );
}
