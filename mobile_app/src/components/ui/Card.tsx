import type { ReactNode } from "react";
import { TouchableOpacity, View, type ViewStyle } from "react-native";
import { Elevation } from "@/constants/theme";

export type CardVariant = "default" | "tinted" | "outlined" | "flat";
export type CardPadding = "none" | "sm" | "md" | "lg";

type CardProps = {
  children: ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  onPress?: () => void;
  className?: string;
  style?: ViewStyle;
  accessibilityLabel?: string;
};

const paddingClasses: Record<CardPadding, string> = {
  none: "p-0",
  sm: "p-3",
  md: "p-4",
  lg: "p-5",
};

const variantClasses: Record<CardVariant, string> = {
  default: "bg-white border border-[#E2E8F0] rounded-2xl",
  tinted: "bg-[#F0FDF4] border border-[#BBF7D0] rounded-2xl",
  outlined: "bg-transparent border border-[#E2E8F0] rounded-2xl",
  flat: "bg-[#F8FAFC] border-0 rounded-2xl",
};

export function Card({
  children,
  variant = "default",
  padding = "md",
  onPress,
  className = "",
  style,
  accessibilityLabel,
}: CardProps) {
  const shadowStyle = variant === "default" ? Elevation.sm : Elevation.none;

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        className={`${variantClasses[variant]} ${paddingClasses[padding]} ${className}`}
        style={[shadowStyle, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View
      className={`${variantClasses[variant]} ${paddingClasses[padding]} ${className}`}
      style={[shadowStyle, style]}
    >
      {children}
    </View>
  );
}
