import { useState, type ReactNode } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type TextInputProps,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";

type TextFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  error?: string;
  helperText?: string;
  prefix?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  secureTextEntry?: boolean;
  keyboardType?: TextInputProps["keyboardType"];
  autoCapitalize?: TextInputProps["autoCapitalize"];
  autoComplete?: TextInputProps["autoComplete"];
  editable?: boolean;
  accessibilityLabel?: string;
  className?: string;
};

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  helperText,
  prefix,
  leftIcon,
  rightIcon,
  secureTextEntry = false,
  keyboardType,
  autoCapitalize,
  autoComplete,
  editable = true,
  accessibilityLabel,
  className = "",
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(!secureTextEntry);

  const isPassword = secureTextEntry;

  const borderClass = error
    ? "border-[#DC2626] bg-[#FEF2F2]"
    : focused
    ? "border-primary bg-white ring-1 ring-primary/20"
    : editable
    ? "border-[#E2E8F0] bg-[#F8FAFC]"
    : "border-[#E2E8F0] bg-[#F1F5F9] opacity-70";

  return (
    <View className={`mb-4 ${className}`}>
      <Text className="font-poppins-medium text-[13px] text-text-primary mb-1.5">
        {label}
      </Text>
      <View
        className={`flex-row items-center border rounded-xl px-3.5 min-h-[48px] ${borderClass}`}
      >
        {leftIcon ? <View className="mr-2.5">{leftIcon}</View> : null}
        {prefix ? (
          <Text className="font-poppins-medium text-[14px] text-text-muted mr-1.5">
            {prefix}
          </Text>
        ) : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          secureTextEntry={isPassword ? !showPassword : false}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          editable={editable}
          accessibilityLabel={accessibilityLabel ?? label}
          className="flex-1 font-poppins-regular text-[14px] text-text-primary py-3"
        />
        {isPassword ? (
          <TouchableOpacity
            onPress={() => setShowPassword((prev) => !prev)}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? "Hide password" : "Show password"}
            className="p-1"
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={Colors.textMuted}
            />
          </TouchableOpacity>
        ) : rightIcon ? (
          <View className="ml-2">{rightIcon}</View>
        ) : null}
      </View>
      {error ? (
        <Text className="font-poppins-regular text-[12px] text-[#DC2626] mt-1.5">
          {error}
        </Text>
      ) : helperText ? (
        <Text className="font-poppins-regular text-[12px] text-text-muted mt-1.5">
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}
