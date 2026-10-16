import { Text, View } from "react-native";
import { router } from "expo-router";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout } from "@/store/features/auth/auth.slice";
import { Screen } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";

export default function ProfileScreen() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);

  const handleLogout = () => {
    dispatch(logout());
    router.replace("/(auth)/login");
  };

  return (
    <Screen edges={["top", "left", "right"]}>
      <View className="flex-1 px-xl pt-2xl">
        <Text className="text-h1 mb-2xl">Profile</Text>
        <View className="card mb-2xl">
          <View className="mb-md h-[56px] w-[56px] items-center justify-center rounded-full bg-tint">
            <Text className="font-poppins-bold text-[22px] text-primary">
              {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
            </Text>
          </View>
          <Text className="text-h3">{user?.name ?? "Demo User"}</Text>
          <Text className="text-body mt-1">{user?.email ?? "demo@example.com"}</Text>
        </View>
        <Button label="Sign out" variant="danger" onPress={handleLogout} />
      </View>
    </Screen>
  );
}
