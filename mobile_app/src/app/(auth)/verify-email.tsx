import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { Screen } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Card } from "@/components/ui/Card";
import { AuthHeader } from "@/components/auth/AuthHeader";

export default function VerifyEmailScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const email = params.email ?? "salim@coreshop.dev";

  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(45);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleVerify = (codeToVerify = otpCode) => {
    const code = codeToVerify.trim();
    if (code.length < 6) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    setError("");
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      if (code === "123456" || code === "999999") {
        setIsSuccess(true);
      } else if (code === "000000") {
        setError("Verification code has expired. Please request a new one.");
      } else {
        setError("Invalid code. Please enter the correct 6-digit code.");
      }
    }, 700);
  };

  const handleResend = () => {
    if (cooldown > 0) return;
    setCooldown(60);
    setError("");
  };

  const handleProceed = () => {
    // Navigate to Login or Onboarding
    router.replace("/(auth)/login");
  };

  return (
    <Screen keyboard edges={["top", "left", "right", "bottom"]}>
      <View className="flex-1 justify-between px-6 pb-8 pt-4">
        <AuthHeader
          title={isSuccess ? "Email verified" : "Verify your email"}
          subtitle={
            isSuccess
              ? "Your email has been verified. Welcome to Core Shop!"
              : `We sent a 6-digit verification code to ${email}`
          }
          canGoBack={!isSuccess}
          onBackPress={() => router.back()}
        />

        <View className="flex-1">
          {isSuccess ? (
            /* Success State */
            <View>
              <Card variant="tinted" padding="lg" className="mb-6 items-center">
                <View className="w-14 h-14 rounded-full bg-[#DCFCE7] items-center justify-center mb-3">
                  <Ionicons name="checkmark-circle-outline" size={32} color={Colors.success} />
                </View>
                <Text className="font-poppins-semibold text-[17px] text-text-primary text-center mb-1">
                  Verification Complete
                </Text>
                <Text className="font-poppins-regular text-[13px] text-text-secondary text-center leading-[19px]">
                  Your account is verified and ready. Sign in to choose your store and start trading.
                </Text>
              </Card>

              <Button
                label="Proceed to Sign In"
                size="lg"
                variant="primary"
                onPress={handleProceed}
              />
            </View>
          ) : (
            /* OTP Entry Form */
            <View>
              <TextField
                label="Verification Code (6-digits)"
                value={otpCode}
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^0-9]/g, "").slice(0, 6);
                  setOtpCode(cleaned);
                  if (error) setError("");
                  if (cleaned.length === 6) {
                    handleVerify(cleaned);
                  }
                }}
                placeholder="123456"
                keyboardType="number-pad"
                autoComplete="one-time-code"
                error={error}
                leftIcon={<Ionicons name="key-outline" size={18} color={Colors.textMuted} />}
                helperText="Enter the 6-digit code sent to your inbox"
              />

              <Button
                label="Verify email"
                onPress={() => handleVerify()}
                loading={loading}
                size="lg"
                className="mt-2"
              />

              {/* Resend Cooldown Section */}
              <View className="mt-5 items-center">
                {cooldown > 0 ? (
                  <Text className="font-poppins-regular text-[13px] text-text-muted">
                    Resend code in{" "}
                    <Text className="font-poppins-semibold text-text-primary">
                      {cooldown}s
                    </Text>
                  </Text>
                ) : (
                  <TouchableOpacity
                    onPress={handleResend}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Resend code"
                  >
                    <Text className="font-poppins-semibold text-[13px] text-primary">
                      Resend code
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Static Prototype Demo Triggers */}
              <Card variant="flat" padding="sm" className="mt-8 border border-[#E2E8F0]">
                <Text className="font-poppins-medium text-[11px] text-text-muted mb-2.5 uppercase tracking-wider">
                  Static Test Scenarios:
                </Text>
                <View className="gap-2">
                  <Button
                    label="Autofill Valid Code (123456)"
                    size="sm"
                    variant="outline"
                    onPress={() => {
                      setOtpCode("123456");
                      handleVerify("123456");
                    }}
                  />
                  <Button
                    label="Simulate Expired Code (000000)"
                    size="sm"
                    variant="outline"
                    onPress={() => {
                      setOtpCode("000000");
                      handleVerify("000000");
                    }}
                  />
                </View>
              </Card>
            </View>
          )}
        </View>
      </View>
    </Screen>
  );
}
