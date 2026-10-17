import { useState } from "react";
import { Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { Screen } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { AuthHeader } from "@/components/auth/AuthHeader";

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ email?: string; token?: string }>();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // Scenario toggle for testing expired link vs valid link
  const [tokenStatus, setTokenStatus] = useState<"valid" | "expired">("valid");

  // Real-time password criteria
  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasUppercase = /[A-Z]/.test(password);

  const handleSubmit = () => {
    if (!hasMinLength) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (!hasNumber) {
      setError("Password must contain at least one number.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setIsSuccess(true);
    }, 700);
  };

  return (
    <Screen keyboard edges={["top", "left", "right", "bottom"]}>
      <View className="flex-1 justify-between px-6 pb-8 pt-4">
        <AuthHeader
          title={
            isSuccess
              ? "Password updated"
              : tokenStatus === "expired"
              ? "Link expired"
              : "Reset password"
          }
          subtitle={
            isSuccess
              ? "Your password has been successfully reset. You can now sign in."
              : tokenStatus === "expired"
              ? "This password reset link is invalid or has expired."
              : `Set a new secure password for ${params.email ?? "your account"}`
          }
          canGoBack={!isSuccess}
          onBackPress={() => router.replace("/(auth)/login")}
        />

        <View className="flex-1">
          {tokenStatus === "expired" ? (
            /* Expired Link State */
            <View>
              <Card className="mb-6">
                <ErrorState
                  title="Link Expired"
                  message="For your security, password reset links expire after 15 minutes. Please request a new link."
                  retryLabel="Request New Link"
                  onRetry={() => router.replace("/(auth)/forgot-password")}
                />
              </Card>

              {/* Toggle back to valid for testing */}
              <Button
                label="Switch to Valid Token State (Demo)"
                size="sm"
                variant="outline"
                onPress={() => setTokenStatus("valid")}
              />
            </View>
          ) : isSuccess ? (
            /* Success State */
            <View>
              <Card variant="tinted" padding="lg" className="mb-6 items-center">
                <View className="w-14 h-14 rounded-full bg-[#DCFCE7] items-center justify-center mb-3">
                  <Ionicons name="checkmark-circle-outline" size={32} color={Colors.success} />
                </View>
                <Text className="font-poppins-semibold text-[17px] text-text-primary text-center mb-1">
                  All done!
                </Text>
                <Text className="font-poppins-regular text-[13px] text-text-secondary text-center leading-[19px]">
                  Your password has been reset. Please use your new password to sign in.
                </Text>
              </Card>

              <Button
                label="Continue to Sign In"
                size="lg"
                variant="primary"
                onPress={() => router.replace("/(auth)/login")}
              />
            </View>
          ) : (
            /* Valid Token Input Form */
            <View>
              <TextField
                label="New password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (error) setError("");
                }}
                placeholder="At least 8 characters"
                secureTextEntry
              />

              <TextField
                label="Confirm new password"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (error) setError("");
                }}
                placeholder="Repeat new password"
                secureTextEntry
                error={error}
              />

              {/* Password Requirements Checklist */}
              <Card variant="flat" padding="sm" className="mb-5 border border-[#E2E8F0]">
                <Text className="font-poppins-medium text-[11px] text-text-muted mb-2 uppercase tracking-wider">
                  Password Requirements:
                </Text>

                <View className="gap-1.5">
                  <View className="flex-row items-center">
                    <Ionicons
                      name={hasMinLength ? "checkmark-circle" : "ellipse-outline"}
                      size={15}
                      color={hasMinLength ? Colors.success : Colors.textMuted}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      className={`font-poppins-regular text-[12px] ${
                        hasMinLength ? "text-text-primary" : "text-text-muted"
                      }`}
                    >
                      At least 8 characters
                    </Text>
                  </View>

                  <View className="flex-row items-center">
                    <Ionicons
                      name={hasNumber ? "checkmark-circle" : "ellipse-outline"}
                      size={15}
                      color={hasNumber ? Colors.success : Colors.textMuted}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      className={`font-poppins-regular text-[12px] ${
                        hasNumber ? "text-text-primary" : "text-text-muted"
                      }`}
                    >
                      Contains at least one number
                    </Text>
                  </View>

                  <View className="flex-row items-center">
                    <Ionicons
                      name={hasUppercase ? "checkmark-circle" : "ellipse-outline"}
                      size={15}
                      color={hasUppercase ? Colors.success : Colors.textMuted}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      className={`font-poppins-regular text-[12px] ${
                        hasUppercase ? "text-text-primary" : "text-text-muted"
                      }`}
                    >
                      Contains an uppercase letter (optional)
                    </Text>
                  </View>
                </View>
              </Card>

              <Button
                label="Reset password"
                onPress={handleSubmit}
                loading={loading}
                size="lg"
              />

              {/* Scenario Testing Controls */}
              <Card variant="flat" padding="sm" className="mt-8 border border-[#E2E8F0]">
                <Text className="font-poppins-medium text-[11px] text-text-muted mb-2 uppercase tracking-wider">
                  Static Scenario Testing:
                </Text>
                <Button
                  label="Simulate Expired Token Scenario"
                  size="sm"
                  variant="outline"
                  onPress={() => setTokenStatus("expired")}
                />
              </Card>
            </View>
          )}
        </View>
      </View>
    </Screen>
  );
}
