import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { Button } from "./Button";

type ErrorStateProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
};

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  retryLabel = "Try Again",
  className = "",
}: ErrorStateProps) {
  return (
    <View
      className={`items-center justify-center p-8 text-center ${className}`}
    >
      <View className="w-16 h-16 rounded-full bg-[#FEF2F2] border border-[#FECACA] items-center justify-center mb-4">
        <Ionicons name="alert-circle-outline" size={32} color={Colors.error} />
      </View>
      <Text className="font-poppins-semibold text-[17px] text-text-primary text-center mb-1.5">
        {title}
      </Text>
      <Text className="font-poppins-regular text-[13px] text-text-secondary text-center leading-[20px] max-w-[280px] mb-6">
        {message}
      </Text>
      {onRetry ? (
        <Button
          label={retryLabel}
          onPress={onRetry}
          size="sm"
          variant="outline"
          className="px-6 border-[#DC2626]"
          leftIcon={<Ionicons name="refresh-outline" size={16} color={Colors.error} />}
        />
      ) : null}
    </View>
  );
}
