import { Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";

type AuthHeaderProps = {
  title: string;
  subtitle?: string;
  canGoBack?: boolean;
  onBackPress?: () => void;
  badgeText?: string;
  className?: string;
};

export function AuthHeader({
  title,
  subtitle,
  canGoBack = false,
  onBackPress,
  badgeText = "C",
  className = "",
}: AuthHeaderProps) {
  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(auth)/login");
    }
  };

  return (
    <View className={`mb-8 ${className}`}>
      {canGoBack ? (
        <TouchableOpacity
          onPress={handleBack}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="mb-6 h-11 w-11 items-center justify-center rounded-full border border-[#E2E8F0] bg-white shadow-sm"
        >
          <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
      ) : null}

      <View className="mb-4 h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-sm">
        <Text className="font-poppins-bold text-[24px] text-white">
          {badgeText}
        </Text>
      </View>

      <Text className="font-poppins-bold text-[26px] text-text-primary leading-[34px]">
        {title}
      </Text>
      {subtitle ? (
        <Text className="font-poppins-regular text-[14px] text-text-secondary leading-[20px] mt-1.5">
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
