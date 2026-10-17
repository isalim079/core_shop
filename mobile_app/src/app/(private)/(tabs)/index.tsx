import React from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAppSelector } from "@/store/hooks";
import { Colors } from "@/constants/colors";
import { Screen } from "@/components/layout/Screen";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ListRow } from "@/components/ui/ListRow";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { InsightSlider, type InsightItem } from "@/components/ui/InsightSlider";
import { useStaticData, type ScenarioPreset } from "@/staticData";

export default function DashboardScreen() {
  const authUser = useAppSelector((s) => s.auth.user);
  const { scenario, preset, setPreset } = useStaticData();

  const currency = scenario.organization.currencySymbol;
  const activeBranch = scenario.organization.branches[0];

  // Dynamic Insight Items based on Scenario
  const insightItems: InsightItem[] = [
    {
      id: "sales-target",
      tag: "Performance",
      tagVariant: "success",
      title: "Daily Target Progress",
      description: `Today's revenue is ${currency}${scenario.summary.todaySales.toLocaleString()} across ${scenario.summary.todayTransactions} sales.`,
      icon: "trending-up",
      iconColor: Colors.success,
      actionLabel: "View Sales Feed",
      onAction: () => router.push("/(private)/(tabs)/activity"),
    },
    {
      id: "stock-alert",
      tag: "Inventory",
      tagVariant: scenario.summary.lowStockCount > 0 ? "warning" : "neutral",
      title: scenario.summary.lowStockCount > 0 ? "Reorder Alert" : "Stock Status",
      description:
        scenario.summary.lowStockCount > 0
          ? `${scenario.summary.lowStockCount} items have fallen below safe branch stock thresholds.`
          : "All registered items currently have healthy branch stock levels.",
      icon: "cube-outline",
      iconColor: scenario.summary.lowStockCount > 0 ? Colors.warning : Colors.textMuted,
      actionLabel: "Audit Stock",
      onAction: () => router.push("/(private)/(tabs)/inventory"),
    },
    {
      id: "baki-due",
      tag: "Credit (Baki)",
      tagVariant: scenario.summary.totalCustomerDue > 0 ? "danger" : "neutral",
      title: "Outstanding Customer Dues",
      description:
        scenario.summary.totalCustomerDue > 0
          ? `${currency}${scenario.summary.totalCustomerDue.toLocaleString()} receivable across ${
              scenario.customers.filter((c) => c.dueAmount > 0).length
            } customer ledger accounts.`
          : "All customer credit accounts are currently settled in full.",
      icon: "wallet-outline",
      iconColor: scenario.summary.totalCustomerDue > 0 ? Colors.error : Colors.textMuted,
      actionLabel: "Review Accounts",
      onAction: () => router.push("/(private)/(tabs)/activity"),
    },
  ];

  return (
    <Screen
      edges={["top", "left", "right"]}
      header={
        <AppHeader
          title={scenario.organization.name}
          subtitle={`${activeBranch?.name ?? "Main Branch"} • ${
            authUser?.name ? authUser.name.split(" ")[0] : scenario.currentUser.name
          }`}
          leftElement={
            <TouchableOpacity
              onPress={() => router.push("/(onboarding)/select-branch")}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Select Branch"
              className="w-10 h-10 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] items-center justify-center mr-2"
            >
              <Ionicons name="storefront" size={18} color={Colors.primary} />
            </TouchableOpacity>
          }
          rightElement={
            <TouchableOpacity
              onPress={() => router.push("/profile")}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="View Profile"
              className="w-10 h-10 rounded-full bg-[#F8FAFC] border border-[#CBD5E1] items-center justify-center"
            >
              <Ionicons name="person-circle-outline" size={26} color={Colors.primary} />
            </TouchableOpacity>
          }
        />
      }
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 48 }}
      >
        {/* Scenario Switcher Pill Bar (Development / Testing) */}
        <View className="px-4 pt-3 pb-1 flex-row items-center justify-between">
          <Text className="font-poppins-medium text-[11px] text-text-muted uppercase tracking-wider">
            Demo Scenario:
          </Text>
          <View className="flex-row gap-1.5">
            {(["happy", "low_stock", "empty", "error"] as ScenarioPreset[]).map((p) => (
              <TouchableOpacity
                key={p}
                onPress={() => setPreset(p)}
                activeOpacity={0.7}
                className={`px-2.5 py-0.5 rounded-full border ${
                  preset === p
                    ? "bg-primary border-primary"
                    : "bg-white border-[#E2E8F0]"
                }`}
              >
                <Text
                  className={`font-poppins-medium text-[10px] ${
                    preset === p ? "text-white" : "text-text-secondary"
                  }`}
                >
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Error State Fallback */}
        {preset === "error" ? (
          <Card className="m-4">
            <ErrorState
              title="Dashboard Data Unavailable"
              message={scenario.errorMessage ?? "Failed to load store metrics."}
              onRetry={() => setPreset("happy")}
            />
          </Card>
        ) : (
          <>
            {/* Horizontal Insight & Action Slider */}
            <InsightSlider items={insightItems} />

            {/* KPI Summary Cards */}
            <View className="px-4 pt-1">
              <View className="flex-row gap-3 mb-3">
                {/* Today's Sales */}
                <Card variant="tinted" padding="md" className="flex-1">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="font-poppins-medium text-[12px] text-text-secondary">
                      Today&apos;s Sales
                    </Text>
                    <Ionicons name="trending-up" size={16} color={Colors.primary} />
                  </View>
                  <Text className="font-poppins-bold text-[22px] text-primary">
                    {currency} {scenario.summary.todaySales.toLocaleString()}
                  </Text>
                  <Text className="font-poppins-regular text-[11px] text-[#15803D] mt-0.5">
                    {scenario.summary.todayTransactions} transactions
                  </Text>
                </Card>

                {/* Today's Profit */}
                <Card padding="md" className="flex-1">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="font-poppins-medium text-[12px] text-text-secondary">
                      Today&apos;s Profit
                    </Text>
                    <Ionicons name="wallet-outline" size={16} color={Colors.textSecondary} />
                  </View>
                  <Text className="font-poppins-bold text-[22px] text-text-primary">
                    {currency} {scenario.summary.todayProfit.toLocaleString()}
                  </Text>
                  <Text className="font-poppins-regular text-[11px] text-text-muted mt-0.5">
                    Est. gross margin
                  </Text>
                </Card>
              </View>

              <View className="flex-row gap-3">
                {/* Total Customer Baki (Credit) */}
                <Card padding="md" className="flex-1">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="font-poppins-medium text-[12px] text-text-secondary">
                      Customer Baki
                    </Text>
                    <StatusBadge status="due" size="sm" label="Due" />
                  </View>
                  <Text className="font-poppins-bold text-[20px] text-[#DC2626]">
                    {currency} {scenario.summary.totalCustomerDue.toLocaleString()}
                  </Text>
                  <Text className="font-poppins-regular text-[11px] text-text-muted mt-0.5">
                    {scenario.customers.filter((c) => c.dueAmount > 0).length} parties
                  </Text>
                </Card>

                {/* Low Stock Warning */}
                <Card padding="md" className="flex-1">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="font-poppins-medium text-[12px] text-text-secondary">
                      Stock Alerts
                    </Text>
                    <Ionicons
                      name="warning-outline"
                      size={16}
                      color={scenario.summary.lowStockCount > 0 ? Colors.warning : Colors.textMuted}
                    />
                  </View>
                  <Text
                    className={`font-poppins-bold text-[20px] ${
                      scenario.summary.lowStockCount > 0 ? "text-[#D97706]" : "text-text-primary"
                    }`}
                  >
                    {scenario.summary.lowStockCount} Products
                  </Text>
                  <Text className="font-poppins-regular text-[11px] text-text-muted mt-0.5">
                    {scenario.summary.lowStockCount > 0 ? "Need reorder" : "Stock healthy"}
                  </Text>
                </Card>
              </View>
            </View>

            {/* Quick Actions Shortcuts */}
            <SectionHeader title="Quick Actions" className="mt-4" />
            <View className="px-4 flex-row gap-2.5">
              <Button
                label="+ New Sale"
                size="md"
                variant="primary"
                className="flex-1"
                leftIcon={<Ionicons name="cart-outline" size={17} color="#FFFFFF" />}
                onPress={() => router.push("/(private)/(tabs)/sell")}
              />
              <Button
                label="Stock Audit"
                size="md"
                variant="outline"
                className="flex-1"
                leftIcon={<Ionicons name="cube-outline" size={17} color={Colors.primary} />}
                onPress={() => router.push("/(private)/(tabs)/inventory")}
              />
              <Button
                label="Collect Baki"
                size="md"
                variant="outline"
                className="flex-1"
                leftIcon={<Ionicons name="cash-outline" size={17} color={Colors.primary} />}
                onPress={() => router.push("/(private)/(tabs)/activity")}
              />
            </View>

            {/* Recent Sales List */}
            <SectionHeader
              title="Recent Sales"
              subtitle="Latest in-store transactions"
              actionLabel="View All"
              onActionPress={() => router.push("/(private)/(tabs)/activity")}
              className="mt-4"
            />
            <Card padding="none" className="mx-4 overflow-hidden">
              {scenario.sales.length === 0 ? (
                <EmptyState
                  title="No Sales Today"
                  description="Begin billing items by tapping New Sale."
                  actionLabel="Go to Register"
                  onAction={() => router.push("/(private)/(tabs)/sell")}
                />
              ) : (
                scenario.sales.slice(0, 3).map((sale) => (
                  <ListRow
                    key={sale.id}
                    title={sale.receiptNumber}
                    subtitle={`${sale.customerName ?? "Counter Customer"} • ${sale.lines.length} items`}
                    caption={`Cashier: ${sale.cashierName} • ${sale.paymentMethod}`}
                    amount={`${currency}${sale.totalAmount.toLocaleString()}`}
                    amountColor={Colors.textPrimary}
                    badge={
                      <StatusBadge
                        status={
                          sale.paymentStatus === "PAID"
                            ? "paid"
                            : sale.paymentStatus === "DUE"
                            ? "due"
                            : "partial"
                        }
                        size="sm"
                      />
                    }
                    leftIcon={
                      <View className="w-10 h-10 rounded-full bg-[#F0FDF4] items-center justify-center">
                        <Ionicons name="receipt-outline" size={18} color={Colors.primary} />
                      </View>
                    }
                    onPress={() => {
                      Alert.alert(
                        sale.receiptNumber,
                        `Customer: ${sale.customerName ?? "Walk-in"}\nTotal: ${currency}${sale.totalAmount}\nStatus: ${sale.paymentStatus}\nLines:\n${sale.lines
                          .map((l) => `• ${l.productName} (${l.quantity}x ${currency}${l.unitPrice})`)
                          .join("\n")}`,
                        [{ text: "Done" }]
                      );
                    }}
                  />
                ))
              )}
            </Card>

            {/* Low Stock Watchlist */}
            <SectionHeader
              title="Low Stock Watchlist"
              subtitle="Products near minimum threshold"
              actionLabel="Audit All"
              onActionPress={() => router.push("/(private)/(tabs)/inventory")}
              className="mt-4"
            />
            <Card padding="none" className="mx-4 overflow-hidden">
              {scenario.products.filter((p) => p.currentStock <= p.reorderLevel).length === 0 ? (
                <EmptyState
                  title="Stock Levels Healthy"
                  description="No items have fallen below reorder safety thresholds."
                />
              ) : (
                scenario.products
                  .filter((p) => p.currentStock <= p.reorderLevel)
                  .map((product) => {
                    const categoryName =
                      scenario.categories.find((c) => c.id === product.categoryId)?.name ?? "General";
                    const unitName =
                      scenario.units.find((u) => u.id === product.unitId)?.abbreviation ?? "pcs";

                    return (
                      <ListRow
                        key={product.id}
                        title={product.name}
                        subtitle={`Category: ${categoryName} • SKU: ${product.sku}`}
                        caption={`Safety Threshold: ${product.reorderLevel} ${unitName}`}
                        amount={`${product.currentStock} ${unitName}`}
                        amountColor={Colors.error}
                        badge={<StatusBadge status="warning" label="Low" size="sm" />}
                        leftIcon={
                          <View className="w-10 h-10 rounded-full bg-[#FFFBEB] items-center justify-center">
                            <Ionicons name="alert-circle-outline" size={18} color="#D97706" />
                          </View>
                        }
                        onPress={() => router.push("/(private)/(tabs)/inventory")}
                      />
                    );
                  })
              )}
            </Card>

            {/* Stock Movements Feed */}
            <SectionHeader
              title="Stock Movements"
              subtitle="Audited ledger activity"
              className="mt-4"
            />
            <Card padding="none" className="mx-4 overflow-hidden">
              {scenario.stockMovements.length === 0 ? (
                <EmptyState
                  title="No Stock Movements"
                  description="Adjustments and receipts will appear here."
                />
              ) : (
                scenario.stockMovements.slice(0, 3).map((mov) => (
                  <ListRow
                    key={mov.id}
                    title={mov.productName}
                    subtitle={`${mov.type} • Ref: ${mov.referenceId}`}
                    caption={mov.reason ?? `By ${mov.createdByName}`}
                    amount={`${mov.quantity > 0 ? "+" : ""}${mov.quantity}`}
                    amountColor={mov.quantity > 0 ? Colors.success : Colors.error}
                    showChevron={false}
                    leftIcon={
                      <View className="w-10 h-10 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] items-center justify-center">
                        <Ionicons
                          name={mov.quantity > 0 ? "arrow-down" : "arrow-up"}
                          size={16}
                          color={mov.quantity > 0 ? Colors.success : Colors.error}
                        />
                      </View>
                    }
                  />
                ))
              )}
            </Card>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
