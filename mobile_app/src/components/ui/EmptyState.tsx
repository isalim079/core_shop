import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { Button } from "./Button";

type EmptyStateProps = {
  title: string;
  description: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  customIcon?: ReactNode;
  actionLabel?: string;
  onActionPress?: () => void;
  onAction?: () => void;
  className?: string;
};

export function EmptyState({
  title,
  description,
  iconName = "cube-outline",
  customIcon,
  actionLabel,
  onActionPress,
  onAction,
  className = "",
}: EmptyStateProps) {
  const handleAction = onActionPress || onAction;
  return (
    <View
      className={`items-center justify-center p-8 text-center ${className}`}
    >
      <View className="w-16 h-16 rounded-full bg-[#F1F5F9] items-center justify-center mb-4">
        {customIcon ?? (
          <Ionicons name={iconName} size={32} color={Colors.textMuted} />
        )}
      </View>
      <Text className="font-poppins-semibold text-[17px] text-text-primary text-center mb-1.5">
        {title}
      </Text>
      <Text className="font-poppins-regular text-[13px] text-text-secondary text-center leading-[20px] max-w-[280px] mb-6">
        {description}
      </Text>
      {actionLabel && handleAction ? (
        <Button
          label={actionLabel}
          onPress={handleAction}
          size="sm"
          variant="primary"
          className="px-6"
        />
      ) : null}
    </View>
  );
}
