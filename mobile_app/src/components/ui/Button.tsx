import { ActivityIndicator, Text, TouchableOpacity } from "react-native";
import { Colors } from "@/constants/colors";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "link" | "danger";

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
};

const variantClass: Record<ButtonVariant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  outline: "btn-outline",
  ghost: "btn-ghost",
  link: "btn-link",
  danger: "btn-danger",
};

const labelClass: Record<ButtonVariant, string> = {
  primary: "text-button",
  secondary: "font-poppins-medium text-[15px] text-primary",
  outline: "font-poppins-medium text-[15px] text-primary",
  ghost: "font-poppins-medium text-[15px] text-primary underline",
  link: "font-poppins-semibold text-[14px] text-primary",
  danger: "font-poppins-medium text-[15px] text-error",
};

export function Button({
  label,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
}: ButtonProps) {
  const inactive = loading || disabled;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={inactive}
      activeOpacity={0.85}
      className={inactive ? "btn-disabled" : variantClass[variant]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? Colors.textOnPrimary : Colors.primary} />
      ) : (
        <Text className={inactive ? "font-poppins-medium text-[15px] text-primary" : labelClass[variant]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}
