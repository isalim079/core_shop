import type { ReactNode } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  canGoBack?: boolean;
  onBackPress?: () => void;
  rightElement?: ReactNode;
  className?: string;
};

export function AppHeader({
  title,
  subtitle,
  canGoBack = false,
  onBackPress,
  rightElement,
  className = "",
}: AppHeaderProps) {
  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else if (router.canGoBack()) {
      router.back();
    }
  };

  return (
    <View
      className={`h-[56px] px-4 bg-white border-b border-[#E2E8F0] flex-row items-center justify-between ${className}`}
    >
      <View className="flex-row items-center flex-1 pr-2">
        {canGoBack ? (
          <TouchableOpacity
            onPress={handleBack}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            className="w-10 h-10 items-center justify-center rounded-full bg-[#F8FAFC] border border-[#E2E8F0] mr-3"
          >
            <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
        ) : null}
        <View className="flex-1 justify-center">
          <Text
            numberOfLines={1}
            className="font-poppins-semibold text-[17px] text-text-primary leading-[22px]"
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              numberOfLines={1}
              className="font-poppins-regular text-[12px] text-text-muted leading-[16px]"
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      {rightElement ? <View className="flex-row items-center">{rightElement}</View> : null}
    </View>
  );
}
