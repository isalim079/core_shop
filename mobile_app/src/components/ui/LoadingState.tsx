import { ActivityIndicator, Text, View } from "react-native";
import { Colors } from "@/constants/colors";

type LoadingStateProps = {
  message?: string;
  size?: "small" | "large";
  className?: string;
};

export function LoadingState({
  message = "Loading...",
  size = "large",
  className = "",
}: LoadingStateProps) {
  return (
    <View
      className={`items-center justify-center p-8 text-center ${className}`}
    >
      <ActivityIndicator size={size} color={Colors.primary} />
      {message ? (
        <Text className="font-poppins-regular text-[13px] text-text-muted text-center mt-3">
          {message}
        </Text>
      ) : null}
    </View>
  );
}
