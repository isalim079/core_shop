import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { Screen } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { AuthHeader } from "@/components/auth/AuthHeader";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = () => {
    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!agreeTerms) {
      setError("Please agree to the Terms of Service to continue.");
      return;
    }

    setError("");
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      // Navigate to email verification with the registered email
      router.push({
        pathname: "/(auth)/verify-email",
        params: { email: email.trim() },
      });
    }, 700);
  };

  return (
    <Screen keyboard edges={["top", "left", "right", "bottom"]}>
      <View className="flex-1 px-6 pb-8 pt-4">
        <AuthHeader
          title="Create account"
          subtitle="Join Core Shop to manage your store inventory and sales"
          canGoBack
          onBackPress={() => router.back()}
        />

        <View className="flex-1">
          <TextField
            label="Full name"
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (error) setError("");
            }}
            placeholder="Salim Reza"
            autoCapitalize="words"
            leftIcon={<Ionicons name="person-outline" size={18} color={Colors.textMuted} />}
          />

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
            leftIcon={<Ionicons name="mail-outline" size={18} color={Colors.textMuted} />}
          />

          <TextField
            label="Password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (error) setError("");
            }}
            placeholder="At least 8 characters"
            secureTextEntry
            helperText="Must be at least 8 characters"
          />

          <TextField
            label="Confirm password"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (error) setError("");
            }}
            placeholder="Repeat your password"
            secureTextEntry
            error={error}
          />

          {/* Terms Agreement Checkbox */}
          <TouchableOpacity
            onPress={() => setAgreeTerms(!agreeTerms)}
            activeOpacity={0.8}
            className="flex-row items-center my-3"
            accessibilityRole="checkbox"
            accessibilityState={{ checked: agreeTerms }}
            accessibilityLabel="Agree to Terms of Service and Privacy Policy"
          >
            <View
              className={`w-5 h-5 rounded-md border items-center justify-center mr-2.5 ${
                agreeTerms ? "bg-primary border-primary" : "border-[#CBD5E1] bg-white"
              }`}
            >
              {agreeTerms ? (
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              ) : null}
            </View>
            <Text className="flex-1 font-poppins-regular text-[12px] text-text-secondary leading-[18px]">
              I agree to the{" "}
              <Text className="font-poppins-medium text-primary">Terms of Service</Text>{" "}
              and <Text className="font-poppins-medium text-primary">Privacy Policy</Text>
            </Text>
          </TouchableOpacity>

          <Button
            label="Create account"
            onPress={handleRegister}
            loading={loading}
            size="lg"
            className="mt-2"
          />

          <View className="mt-5 flex-row items-center justify-center">
            <Text className="font-poppins-regular text-[13px] text-text-secondary">
              Already have an account?{" "}
            </Text>
            <Button
              label="Sign in"
              variant="link"
              onPress={() => router.replace("/(auth)/login")}
            />
          </View>
        </View>
      </View>
    </Screen>
  );
}
