import React from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout } from "@/store/features/auth/auth.slice";
import { Colors } from "@/constants/colors";
import { Screen } from "@/components/layout/Screen";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ListRow } from "@/components/ui/ListRow";
import { Button } from "@/components/ui/Button";
import { useStaticData } from "@/staticData";

export default function MoreScreen() {
  const dispatch = useAppDispatch();
  const authUser = useAppSelector((s) => s.auth.user);
  const { scenario } = useStaticData();

  const displayName = authUser?.name || scenario.currentUser.name;
  const displayEmail = authUser?.email || scenario.currentUser.email;
  const displayRole = scenario.currentUser.role;
  const activeOrg = scenario.organization;
  const activeBranch = activeOrg.branches[0]?.name ?? "Main Branch";

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
            dispatch(logout());
            router.replace("/(auth)/login");
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
          title="More & Settings"
          subtitle={`${activeOrg.name} • Hub`}
        />
      }
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 48, paddingTop: 12 }}
      >
        {/* User Profile Banner Card */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push("/profile")}
        >
          <Card padding="md" className="flex-row items-center justify-between mb-4 border border-[#CBD5E1]">
            <View className="flex-row items-center gap-3">
              <View className="w-12 h-12 rounded-full bg-[#ECFDF5] border border-primary items-center justify-center">
                <Text className="font-poppins-bold text-[18px] text-primary">
                  {displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View>
                <Text className="font-poppins-bold text-[15px] text-text-primary">
                  {displayName}
                </Text>
                <Text className="font-poppins-regular text-[12px] text-text-muted">
                  {displayEmail}
                </Text>
                <View className="mt-1 flex-row">
                  <StatusBadge status="active" label={displayRole} size="sm" />
                </View>
              </View>
            </View>

            <View className="flex-row items-center gap-1">
              <Text className="font-poppins-medium text-[11px] text-primary">Edit</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
            </View>
          </Card>
        </TouchableOpacity>

        {/* Active Branch Bar */}
        <Card padding="sm" className="flex-row items-center justify-between mb-4 bg-[#F8FAFC]">
          <View className="flex-row items-center gap-2 px-1">
            <Ionicons name="git-branch-outline" size={16} color={Colors.primary} />
            <Text className="font-poppins-medium text-[12px] text-text-secondary">
              Active Branch:{" "}
              <Text className="font-poppins-bold text-text-primary">{activeBranch}</Text>
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/(onboarding)/select-branch")}
            activeOpacity={0.7}
            className="px-2.5 py-1 rounded-lg bg-white border border-[#CBD5E1]"
          >
            <Text className="font-poppins-semibold text-[11px] text-primary">
              Switch
            </Text>
          </TouchableOpacity>
        </Card>

        {/* Section 1: Commerce & Parties */}
        <SectionHeader title="Commerce & Parties" />
        <Card padding="none" className="overflow-hidden mb-4">
          <ListRow
            title="Customers & Baki (Khata)"
            subtitle={`${scenario.customers.length} registered credit accounts`}
            leftIcon={
              <View className="w-10 h-10 rounded-full bg-[#ECFDF5] items-center justify-center">
                <Ionicons name="people-outline" size={18} color={Colors.primary} />
              </View>
            }
            showChevron={true}
            onPress={() =>
              Alert.alert(
                "Customers & Baki Khata",
                `Total Customers: ${scenario.customers.length}\nOutstanding Dues: ${scenario.organization.currencySymbol}${scenario.summary.totalCustomerDue.toLocaleString()}`
              )
            }
          />
          <ListRow
            title="Suppliers & Procurement"
            subtitle={`${scenario.suppliers.length} authorized vendors`}
            leftIcon={
              <View className="w-10 h-10 rounded-full bg-[#F1F5F9] items-center justify-center">
                <Ionicons name="business-outline" size={18} color={Colors.textSecondary} />
              </View>
            }
            showChevron={true}
            onPress={() =>
              Alert.alert(
                "Suppliers",
                `Active Suppliers: ${scenario.suppliers.map((s) => s.companyName).join(", ")}`
              )
            }
          />
          <ListRow
            title="Operational Expenses"
            subtitle={`${scenario.expenses.length} tracked expense entries`}
            leftIcon={
              <View className="w-10 h-10 rounded-full bg-[#FFFBEB] items-center justify-center">
                <Ionicons name="wallet-outline" size={18} color="#D97706" />
              </View>
            }
            showChevron={true}
            onPress={() =>
              Alert.alert(
                "Expenses",
                `Total tracked expenses: ${scenario.organization.currencySymbol}${scenario.expenses
                  .reduce((sum, e) => sum + e.amount, 0)
                  .toLocaleString()}`
              )
            }
          />
          <ListRow
            title="Financial Reports & Analytics"
            subtitle="Sales, P&L, Inventory Valuation"
            leftIcon={
              <View className="w-10 h-10 rounded-full bg-[#EFF6FF] items-center justify-center">
                <Ionicons name="pie-chart-outline" size={18} color="#1D4ED8" />
              </View>
            }
            showChevron={true}
            onPress={() =>
              Alert.alert(
                "Reports",
                `Today Sales: ${scenario.organization.currencySymbol}${scenario.summary.todaySales}\nEst Profit: ${scenario.organization.currencySymbol}${scenario.summary.todayProfit}\nLow Stock Items: ${scenario.summary.lowStockCount}`
              )
            }
          />
        </Card>

        {/* Section 2: Store Administration */}
        <SectionHeader title="Store Administration" />
        <Card padding="none" className="overflow-hidden mb-4">
          <ListRow
            title="Store Profile & Details"
            subtitle={`${activeOrg.name} • ${activeOrg.currency}`}
            leftIcon={
              <View className="w-10 h-10 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] items-center justify-center">
                <Ionicons name="storefront-outline" size={18} color={Colors.textSecondary} />
              </View>
            }
            showChevron={true}
            onPress={() =>
              Alert.alert(
                "Store Details",
                `Business: ${activeOrg.name}\nLegal Name: ${activeOrg.legalName}\nCurrency: ${activeOrg.currency}`
              )
            }
          />
          <ListRow
            title="Branches & Outlets"
            subtitle={`${activeOrg.branches.length} locations configured`}
            leftIcon={
              <View className="w-10 h-10 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] items-center justify-center">
                <Ionicons name="git-network-outline" size={18} color={Colors.textSecondary} />
              </View>
            }
            showChevron={true}
            onPress={() => router.push("/(onboarding)/select-branch")}
          />
          <ListRow
            title="Product Catalog"
            subtitle={`${scenario.products.length} registered products & variants`}
            leftIcon={
              <View className="w-10 h-10 rounded-full bg-[#ECFDF5] items-center justify-center">
                <Ionicons name="cube-outline" size={18} color={Colors.primary} />
              </View>
            }
            showChevron={true}
            onPress={() => router.push("/(private)/products")}
          />
          <ListRow
            title="Catalog Taxonomy"
            subtitle="Categories, brands, units of measure"
            leftIcon={
              <View className="w-10 h-10 rounded-full bg-[#F1F5F9] items-center justify-center">
                <Ionicons name="pricetags-outline" size={18} color={Colors.textSecondary} />
              </View>
            }
            showChevron={true}
            onPress={() => router.push("/(private)/settings/catalog")}
          />
          <ListRow
            title="Switch Organization"
            subtitle="Manage multi-store accounts"
            leftIcon={
              <View className="w-10 h-10 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] items-center justify-center">
                <Ionicons name="swap-horizontal-outline" size={18} color={Colors.textSecondary} />
              </View>
            }
            showChevron={true}
            onPress={() => router.push("/(onboarding)/organizations")}
          />
        </Card>

        {/* Section 3: App & System */}
        <SectionHeader title="App & Preferences" />
        <Card padding="none" className="overflow-hidden mb-6">
          <ListRow
            title="Language"
            subtitle="English (বাংলা available)"
            leftIcon={
              <View className="w-10 h-10 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] items-center justify-center">
                <Ionicons name="language-outline" size={18} color={Colors.textSecondary} />
              </View>
            }
            showChevron={true}
            onPress={() =>
              Alert.alert("Language", "App supports English and বাংলা (Bangla). Configurable per cashier.")
            }
          />
          <ListRow
            title="Offline Cache & Sync"
            subtitle="All static records cached locally"
            leftIcon={
              <View className="w-10 h-10 rounded-full bg-[#ECFDF5] items-center justify-center">
                <Ionicons name="cloud-done-outline" size={18} color={Colors.primary} />
              </View>
            }
            showChevron={false}
          />
          <ListRow
            title="About Core Shop"
            subtitle="Version 1.0.0 • Production Build"
            leftIcon={
              <View className="w-10 h-10 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] items-center justify-center">
                <Ionicons name="information-circle-outline" size={18} color={Colors.textSecondary} />
              </View>
            }
            showChevron={true}
            onPress={() =>
              Alert.alert("Core Shop", "Core Shop Mobile v1.0.0\nHigh-performance retail & POS engine.")
            }
          />
        </Card>

        {/* Sign Out Button */}
        <Button
          label="Sign Out"
          variant="danger"
          size="lg"
          leftIcon={<Ionicons name="log-out-outline" size={18} color="#FFFFFF" />}
          onPress={handleLogout}
        />
      </ScrollView>
    </Screen>
  );
}
