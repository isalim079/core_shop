import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
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
import { AuthHeader } from "@/components/auth/AuthHeader";
import { staticUsers } from "@/staticData";

export default function LoginScreen() {
  const dispatch = useAppDispatch();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = (userEmail = email, userName = "Store Staff") => {
    const finalEmail = userEmail.trim();
    if (!finalEmail) {
      setError("Please enter your email address.");
      return;
    }
    if (!password.trim()) {
      setError("Please enter your account password.");
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

  const handleFillDemo = (role: "owner" | "cashier" | "manager") => {
    const user = staticUsers[role];
    setEmail(user.email);
    setPassword("coreshop2026");
    setError("");
  };

  return (
    <Screen keyboard edges={["top", "left", "right", "bottom"]}>
      <View className="flex-1 justify-between px-6 pb-8 pt-4">
        <AuthHeader
          title={APP_NAME}
          subtitle="Sign in to manage your retail store"
        />

        <View className="flex-1">
          <TextField
            label="Email address"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (error) setError("");
            }}
            placeholder="name@coreshop.dev"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            leftIcon={<Ionicons name="mail-outline" size={18} color={Colors.textMuted} />}
          />
          <TextField
            label="Password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (error) setError("");
            }}
            placeholder="••••••••"
            secureTextEntry
            autoComplete="password"
            error={error}
          />

          <View className="flex-row justify-end mb-4">
            <TouchableOpacity
              onPress={() => router.push("/(auth)/forgot-password")}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Forgot password"
            >
              <Text className="font-poppins-medium text-[13px] text-primary">
                Forgot password?
              </Text>
            </TouchableOpacity>
          </View>

          <Button
            label="Sign in"
            onPress={() => handleLogin()}
            loading={loading}
            size="lg"
            className="mt-1"
          />

          <View className="mt-5 flex-row items-center justify-center">
            <Text className="font-poppins-regular text-[13px] text-text-secondary">
              Don&apos;t have an account?{" "}
            </Text>
            <Button
              label="Register"
              variant="link"
              onPress={() => router.push("/(auth)/register")}
            />
          </View>

          {/* Quick Demo Role Autofill (Static Prototype Showcase) */}
          <Card variant="flat" padding="sm" className="mt-8 border border-[#E2E8F0]">
            <Text className="font-poppins-medium text-[11px] text-text-muted mb-2.5 uppercase tracking-wider">
              Quick Fill Demo Accounts:
            </Text>
            <View className="flex-row gap-2">
              <Button
                label="Owner"
                size="sm"
                variant="outline"
                className="flex-1 py-1.5"
                onPress={() => handleFillDemo("owner")}
              />
              <Button
                label="Cashier"
                size="sm"
                variant="outline"
                className="flex-1 py-1.5"
                onPress={() => handleFillDemo("cashier")}
              />
              <Button
                label="Manager"
                size="sm"
                variant="outline"
                className="flex-1 py-1.5"
                onPress={() => handleFillDemo("manager")}
              />
            </View>
          </Card>
        </View>
      </View>
    </Screen>
  );
}
