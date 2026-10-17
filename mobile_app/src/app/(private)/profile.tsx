import React, { useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout } from "@/store/features/auth/auth.slice";
import { Colors } from "@/constants/colors";
import { Screen } from "@/components/layout/Screen";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ListRow } from "@/components/ui/ListRow";
import { useStaticData } from "@/staticData";

export default function ProfileScreen() {
  const dispatch = useAppDispatch();
  const authUser = useAppSelector((s) => s.auth.user);
  const { scenario } = useStaticData();
  const [signingOut, setSigningOut] = useState(false);

  const displayName = authUser?.name || scenario.currentUser.name;
  const displayEmail = authUser?.email || scenario.currentUser.email;
  const displayRole = scenario.currentUser.role;
  const activeOrg = scenario.organization;
  const activeBranch = activeOrg.branches[0];

  const handleLogout = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out of Core Shop?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: () => {
            setSigningOut(true);
            setTimeout(() => {
              dispatch(logout());
              router.replace("/(auth)/login");
            }, 400);
          },
        },
      ]
    );
  };

  return (
    <Screen
      edges={["top", "left", "right"]}
      header={
        <AppHeader
          title="Account Profile"
          subtitle="User identity & security"
          showBack
          onBackPress={() => router.back()}
        />
      }
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 48, paddingTop: 16 }}
      >
        {/* User Identity Card */}
        <Card padding="lg" className="items-center mb-4">
          <View className="w-20 h-20 rounded-full bg-[#ECFDF5] border-2 border-primary items-center justify-center mb-3">
            <Text className="font-poppins-bold text-[28px] text-primary">
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>

          <Text className="font-poppins-bold text-[20px] text-text-primary text-center">
            {displayName}
          </Text>
          <Text className="font-poppins-regular text-[13px] text-text-secondary text-center mt-0.5 mb-2">
            {displayEmail}
          </Text>

          <View className="flex-row items-center gap-2">
            <StatusBadge status="active" label={displayRole} size="sm" />
            <View className="px-2 py-0.5 rounded-full bg-[#F1F5F9] border border-[#E2E8F0]">
              <Text className="font-poppins-medium text-[11px] text-text-secondary">
                {activeOrg.name}
              </Text>
            </View>
          </View>
        </Card>

        {/* Current Store Context */}
        <SectionHeader title="Active Store Context" />
        <Card padding="none" className="overflow-hidden mb-4">
          <ListRow
            title={activeOrg.name}
            subtitle={`Branch: ${activeBranch?.name ?? "Main Branch"}`}
            caption={`Branch Code: ${activeBranch?.code ?? "MAIN"} • Currency: ${activeOrg.currencySymbol} (${activeOrg.currency})`}
            leftIcon={
              <View className="w-10 h-10 rounded-full bg-[#ECFDF5] items-center justify-center">
                <Ionicons name="business" size={18} color={Colors.primary} />
              </View>
            }
            showChevron={true}
            onPress={() => router.push("/(onboarding)/organizations")}
          />
          <ListRow
            title="Switch Branch"
            subtitle={`Currently operating in ${activeBranch?.name ?? "Main Branch"}`}
            leftIcon={
              <View className="w-10 h-10 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] items-center justify-center">
                <Ionicons name="git-branch-outline" size={18} color={Colors.textSecondary} />
              </View>
            }
            showChevron={true}
            onPress={() => router.push("/(onboarding)/select-branch")}
          />
        </Card>

        {/* Security & Access */}
        <SectionHeader title="Security & Credentials" />
        <Card padding="none" className="overflow-hidden mb-4">
          <ListRow
            title="Change Password"
            subtitle="Update account password"
            leftIcon={
              <View className="w-10 h-10 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] items-center justify-center">
                <Ionicons name="key-outline" size={18} color={Colors.textSecondary} />
              </View>
            }
            showChevron={true}
            onPress={() => router.push("/(auth)/forgot-password")}
          />
          <ListRow
            title="Active Sessions"
            subtitle="1 active mobile session on this device"
            leftIcon={
              <View className="w-10 h-10 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] items-center justify-center">
                <Ionicons name="phone-portrait-outline" size={18} color={Colors.textSecondary} />
              </View>
            }
            showChevron={true}
            onPress={() => {}}
          />
        </Card>

        {/* Sign Out Action */}
        <View className="mt-4">
          <Button
            label="Sign Out of Core Shop"
            variant="danger"
            size="lg"
            loading={signingOut}
            leftIcon={<Ionicons name="log-out-outline" size={18} color="#FFFFFF" />}
            onPress={handleLogout}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
