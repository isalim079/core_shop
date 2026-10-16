import type { ReactNode } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";

type ListRowProps = {
  title: string;
  subtitle?: string;
  caption?: string;
  amount?: string;
  amountColor?: string;
  badge?: ReactNode;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  showChevron?: boolean;
  onPress?: () => void;
  className?: string;
  accessibilityLabel?: string;
};

export function ListRow({
  title,
  subtitle,
  caption,
  amount,
  amountColor = Colors.textPrimary,
  badge,
  leftIcon,
  rightIcon,
  showChevron = true,
  onPress,
  className = "",
  accessibilityLabel,
}: ListRowProps) {
  const content = (
    <View
      className={`flex-row items-center justify-between py-3.5 px-4 min-h-[60px] bg-white border-b border-[#F1F5F9] ${className}`}
    >
      <View className="flex-row items-center flex-1 pr-3">
        {leftIcon ? <View className="mr-3">{leftIcon}</View> : null}
        <View className="flex-1 justify-center">
          <Text
            numberOfLines={1}
            className="font-poppins-medium text-[15px] text-text-primary leading-[20px]"
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              numberOfLines={1}
              className="font-poppins-regular text-[13px] text-text-secondary leading-[18px] mt-0.5"
            >
              {subtitle}
            </Text>
          ) : null}
          {caption ? (
            <Text
              numberOfLines={1}
              className="font-poppins-regular text-[11px] text-text-muted leading-[15px] mt-0.5"
            >
              {caption}
            </Text>
          ) : null}
        </View>
      </View>

      <View className="flex-row items-center">
        {badge ? <View className="mr-2.5">{badge}</View> : null}
        {amount ? (
          <Text
            className="font-poppins-semibold text-[15px] mr-2"
            style={{ color: amountColor }}
          >
            {amount}
          </Text>
        ) : null}
        {rightIcon ? (
          rightIcon
        ) : showChevron && onPress ? (
          <Ionicons name="chevron-forward" size={18} color={Colors.textDisabled} />
        ) : null}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}
