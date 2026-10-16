import { useState } from "react";
import { Text, TextInput, View, type TextInputProps } from "react-native";
import { Colors } from "@/constants/colors";

type TextFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: TextInputProps["keyboardType"];
  autoCapitalize?: TextInputProps["autoCapitalize"];
  autoComplete?: TextInputProps["autoComplete"];
};

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  autoComplete,
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const fieldClass = error ? "input-field-error" : focused ? "input-field-focus" : "input-field";

  return (
    <View className="mb-lg">
      <Text className="input-label">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        className={fieldClass}
      />
      {error ? <Text className="input-error-text">{error}</Text> : null}
    </View>
  );
}
