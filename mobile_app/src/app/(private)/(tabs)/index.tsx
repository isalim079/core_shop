import { Text, View } from "react-native";
import { router } from "expo-router";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout } from "@/store/features/auth/auth.slice";
import { APP_NAME } from "@/constants/app";
import { Screen } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";

const StatCard = ({ label, value, accent }: { label: string; value: string; accent?: boolean }) => (
  <View
    className={`mx-1 flex-1 rounded-lg p-lg ${
      accent ? "border border-primary bg-primary" : "border border-border-default bg-surface-card"
    }`}
  >
    <Text className={accent ? "font-poppins-bold text-[22px] text-text-on-primary" : "text-h2"}>{value}</Text>
    <Text className={`mt-[2px] font-sans text-[12px] ${accent ? "text-tint" : "text-text-secondary"}`}>{label}</Text>
  </View>
);

const actions = [
  { label: "Browse Products", desc: "Explore the product catalog" },
  { label: "Manage Orders", desc: "View and update orders" },
  { label: "View Reports", desc: "Sales and performance data" },
];

export default function DashboardScreen() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);

  const handleLogout = () => {
    dispatch(logout());
    router.replace("/(auth)/login");
  };

  return (
    <Screen scroll edges={["top", "left", "right"]}>
      <View className="bg-dark px-xl pb-2xl pt-lg">
        <Text className="text-overline mb-1 text-tint">{APP_NAME}</Text>
        <Text className="font-poppins-bold text-[26px] tracking-[-0.3px] text-text-on-primary">
          Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
        </Text>
        <Text className="mt-1 font-sans text-[14px] text-secondary">{user?.email}</Text>
      </View>

      <View className="px-xl pt-2xl">
        <Text className="text-h4 mb-md">Overview</Text>
        <View className="-mx-1 mb-2xl flex-row">
          <StatCard label="Orders" value="0" accent />
          <StatCard label="Products" value="0" />
          <StatCard label="Revenue" value="$0" />
        </View>

        <Text className="text-h4 mb-md">Quick actions</Text>
        {actions.map((item) => (
          <View key={item.label} className="card mb-md flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="font-poppins-semibold text-[15px] text-text-primary">{item.label}</Text>
              <Text className="text-body-small mt-[2px]">{item.desc}</Text>
            </View>
            <Text className="text-body-large text-text-muted">›</Text>
          </View>
        ))}

        <View className="mt-sm">
          <Button label="Sign out" variant="danger" onPress={handleLogout} />
        </View>
      </View>
    </Screen>
  );
}
