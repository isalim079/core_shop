import type { ReactNode } from "react";
import { Text, TouchableOpacity, View } from "react-native";

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  rightElement?: ReactNode;
  className?: string;
};

export function SectionHeader({
  title,
  subtitle,
  actionLabel,
  onActionPress,
  rightElement,
  className = "",
}: SectionHeaderProps) {
  return (
    <View
      className={`flex-row items-center justify-between px-4 pt-4 pb-2 ${className}`}
    >
      <View className="flex-1 pr-2">
        <Text className="font-poppins-semibold text-[16px] text-text-primary leading-[22px]">
          {title}
        </Text>
        {subtitle ? (
          <Text className="font-poppins-regular text-[12px] text-text-muted leading-[16px] mt-0.5">
            {subtitle}
          </Text>
        ) : null}
      </View>

      {rightElement ? (
        rightElement
      ) : actionLabel && onActionPress ? (
        <TouchableOpacity
          onPress={onActionPress}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <Text className="font-poppins-semibold text-[13px] text-primary">
            {actionLabel}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
