import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { Screen } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Card } from "@/components/ui/Card";
import { AuthHeader } from "@/components/auth/AuthHeader";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSent, setIsSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSubmit = (targetEmail = email) => {
    const finalEmail = targetEmail.trim();
    if (!finalEmail || !finalEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setError("");
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setIsSent(true);
      setCooldown(60);
    }, 700);
  };

  const handleResend = () => {
    if (cooldown > 0) return;
    handleSubmit();
  };

  return (
    <Screen keyboard edges={["top", "left", "right", "bottom"]}>
      <View className="flex-1 justify-between px-6 pb-8 pt-4">
        <AuthHeader
          title={isSent ? "Check your email" : "Forgot password"}
          subtitle={
            isSent
              ? `We have sent password recovery instructions to ${email}`
              : "Enter your registered email address and we will send you a recovery link"
          }
          canGoBack
          onBackPress={() => {
            if (isSent) {
              setIsSent(false);
            } else {
              router.back();
            }
          }}
        />

        <View className="flex-1">
          {isSent ? (
            /* Success / Instructions State */
            <View>
              <Card variant="tinted" padding="lg" className="mb-6 items-center">
                <View className="w-14 h-14 rounded-full bg-[#DCFCE7] items-center justify-center mb-3">
                  <Ionicons name="mail-open-outline" size={28} color={Colors.primary} />
                </View>
                <Text className="font-poppins-semibold text-[16px] text-text-primary text-center mb-1">
                  Recovery link sent
                </Text>
                <Text className="font-poppins-regular text-[13px] text-text-secondary text-center leading-[19px]">
                  Please check your inbox or spam folder. Click the link inside to set a new password.
                </Text>
              </Card>

              <Button
                label={cooldown > 0 ? `Resend email in ${cooldown}s` : "Resend recovery email"}
                variant="outline"
                onPress={handleResend}
                disabled={cooldown > 0}
                size="md"
                className="mb-3"
              />

              <Button
                label="Back to Sign In"
                variant="primary"
                onPress={() => router.replace("/(auth)/login")}
                size="lg"
              />

              {/* Development Shortcut to simulate clicking reset link */}
              <Card variant="flat" padding="sm" className="mt-8 border border-[#E2E8F0]">
                <Text className="font-poppins-medium text-[11px] text-text-muted mb-2 uppercase tracking-wider">
                  Static Prototype Demo Shortcut:
                </Text>
                <Button
                  label="Simulate Opening Reset Link"
                  size="sm"
                  variant="secondary"
                  onPress={() =>
                    router.push({
                      pathname: "/(auth)/reset-password",
                      params: { email, token: "demo-valid-token-123" },
                    })
                  }
                />
              </Card>
            </View>
          ) : (
            /* Input Form State */
            <View>
              <TextField
                label="Email address"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (error) setError("");
                }}
                placeholder="salim@coreshop.dev"
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                error={error}
                leftIcon={<Ionicons name="mail-outline" size={18} color={Colors.textMuted} />}
              />

              <Button
                label="Send recovery link"
                onPress={() => handleSubmit()}
                loading={loading}
                size="lg"
                className="mt-2"
              />

              <View className="mt-5 flex-row items-center justify-center">
                <Text className="font-poppins-regular text-[13px] text-text-secondary">
                  Remembered your password?{" "}
                </Text>
                <Button
                  label="Sign in"
                  variant="link"
                  onPress={() => router.replace("/(auth)/login")}
                />
              </View>

              {/* Quick Fill Demo */}
              <Card variant="flat" padding="sm" className="mt-8 border border-[#E2E8F0]">
                <Text className="font-poppins-medium text-[11px] text-text-muted mb-2 uppercase tracking-wider">
                  Quick Fill Email:
                </Text>
                <Button
                  label="salim@coreshop.dev"
                  size="sm"
                  variant="outline"
                  onPress={() => {
                    setEmail("salim@coreshop.dev");
                    setError("");
                  }}
                />
              </Card>
            </View>
          )}
        </View>
      </View>
    </Screen>
  );
}
