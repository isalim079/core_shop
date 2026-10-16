import { Text, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";

export default function NotFoundScreen() {
  return (
    <Screen edges={["top", "left", "right", "bottom"]}>
      <View className="flex-1 items-center justify-center px-xl">
        <Text className="font-poppins-bold text-[80px] text-tint">404</Text>
        <Text className="text-h2 mb-sm">Page not found</Text>
        <Text className="text-body mb-3xl text-center">
          The screen you are looking for doesn&apos;t exist or has been moved.
        </Text>
        <Button label="Go home" onPress={() => router.replace("/")} />
      </View>
    </Screen>
  );
}
