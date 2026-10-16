import type { ReactNode } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { Colors } from "@/constants/colors";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "link" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  accessibilityLabel?: string;
};

const variantContainerClasses: Record<ButtonVariant, string> = {
  primary: "bg-primary border border-transparent",
  secondary: "bg-[#D1FAE5] border border-transparent",
  outline: "bg-transparent border border-primary",
  ghost: "bg-transparent border border-transparent",
  link: "bg-transparent border border-transparent",
  danger: "bg-transparent border border-[#DC2626]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-[36px] py-[6px] px-3 rounded-lg",
  md: "min-h-[44px] py-3 px-5 rounded-xl",
  lg: "min-h-[52px] py-[14px] px-6 rounded-2xl",
};

const labelClasses: Record<ButtonVariant, string> = {
  primary: "font-poppins-semibold text-white",
  secondary: "font-poppins-semibold text-primary",
  outline: "font-poppins-semibold text-primary",
  ghost: "font-poppins-semibold text-primary",
  link: "font-poppins-semibold text-primary underline",
  danger: "font-poppins-semibold text-[#DC2626]",
};

const textSizeClasses: Record<ButtonSize, string> = {
  sm: "text-[13px] leading-[18px]",
  md: "text-[15px] leading-[22px]",
  lg: "text-[16px] leading-[24px]",
};

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  leftIcon,
  rightIcon,
  loading = false,
  disabled = false,
  className = "",
  accessibilityLabel,
}: ButtonProps) {
  const inactive = loading || disabled;

  const baseContainer = "flex-row items-center justify-center";
  const disabledContainer = "bg-[#E2E8F0] border-transparent opacity-70";
  const disabledText = "font-poppins-medium text-[#94A3B8]";

  const containerStyle = inactive
    ? `${baseContainer} ${sizeClasses[size]} ${disabledContainer} ${className}`
    : `${baseContainer} ${sizeClasses[size]} ${variantContainerClasses[variant]} ${className}`;

  const textStyle = inactive
    ? `${textSizeClasses[size]} ${disabledText}`
    : `${textSizeClasses[size]} ${labelClasses[variant]}`;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={inactive}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      className={containerStyle}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "primary" ? Colors.textOnPrimary : Colors.primary}
        />
      ) : (
        <View className="flex-row items-center justify-center">
          {leftIcon ? <View className="mr-2">{leftIcon}</View> : null}
          <Text className={textStyle}>{label}</Text>
          {rightIcon ? <View className="ml-2">{rightIcon}</View> : null}
        </View>
      )}
    </TouchableOpacity>
  );
}
