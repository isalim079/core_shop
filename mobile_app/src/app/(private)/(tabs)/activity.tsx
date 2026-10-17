import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { Screen } from "@/components/layout/Screen";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { FilterBar } from "@/components/ui/FilterBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { useStaticData, type StaticSale } from "@/staticData";

type UnifiedActivityItem = {
  id: string;
  type: "sale" | "baki" | "purchase" | "expense";
  title: string;
  subtitle: string;
  caption: string;
  amount: string;
  amountColor: string;
  statusBadge?: {
    status: "paid" | "due" | "partial" | "warning";
    label: string;
  };
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  originalSale?: StaticSale;
};

export default function ActivityScreen() {
  const { scenario } = useStaticData();
  const currency = scenario.organization.currencySymbol;
  const activeBranch = scenario.organization.branches[0]?.name ?? "Main Branch";

  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSale, setSelectedSale] = useState<StaticSale | null>(null);

  const filterOptions = [
    { id: "all", label: "All Feed" },
    { id: "sales", label: "Sales" },
    { id: "baki", label: "Customer Dues (Baki)" },
    { id: "purchases", label: "Purchases" },
    { id: "expenses", label: "Expenses" },
  ];

  // Map fixtures into unified timeline items
  const allItems: UnifiedActivityItem[] = [
    // Sales
    ...scenario.sales.map((sale) => ({
      id: `sale-${sale.id}`,
      type: "sale" as const,
      title: `${sale.receiptNumber} • ${sale.customerName ?? "Counter Customer"}`,
      subtitle: `${sale.lines.length} items sold • ${sale.paymentMethod}`,
      caption: `Cashier: ${sale.cashierName} • Today`,
      amount: `+${currency}${sale.totalAmount.toLocaleString()}`,
      amountColor: Colors.primary,
      statusBadge: {
        status:
          sale.paymentStatus === "PAID"
            ? ("paid" as const)
            : sale.paymentStatus === "DUE"
            ? ("due" as const)
            : ("partial" as const),
        label: sale.paymentStatus,
      },
      icon: "receipt-outline" as const,
      iconBg: "#ECFDF5",
      iconColor: Colors.primary,
      originalSale: sale,
    })),

    // Customer Dues / Baki
    ...scenario.customers
      .filter((c) => c.dueAmount > 0)
      .map((c) => ({
        id: `baki-${c.id}`,
        type: "baki" as const,
        title: `${c.name} — Outstanding Dues`,
        subtitle: `Credit account phone: ${c.phone}`,
        caption: `Receivable • Khata Ledger`,
        amount: `-${currency}${c.dueAmount.toLocaleString()}`,
        amountColor: Colors.error,
        statusBadge: {
          status: "due" as const,
          label: "Baki Due",
        },
        icon: "wallet-outline" as const,
        iconBg: "#FEF2F2",
        iconColor: Colors.error,
      })),

    // Purchases
    ...scenario.purchases.map((pur) => ({
      id: `pur-${pur.id}`,
      type: "purchase" as const,
      title: `${pur.purchaseNumber} • ${pur.supplierName}`,
      subtitle: `Status: ${pur.status} • Total ${currency}${pur.totalAmount.toLocaleString()}`,
      caption: `Paid: ${currency}${pur.paidAmount.toLocaleString()} • Due: ${currency}${pur.payableAmount.toLocaleString()}`,
      amount: `-${currency}${pur.totalAmount.toLocaleString()}`,
      amountColor: "#991B1B",
      statusBadge: {
        status: pur.payableAmount === 0 ? ("paid" as const) : ("due" as const),
        label: pur.status,
      },
      icon: "cart-outline" as const,
      iconBg: "#F1F5F9",
      iconColor: "#475569",
    })),

    // Expenses
    ...scenario.expenses.map((exp) => ({
      id: `exp-${exp.id}`,
      type: "expense" as const,
      title: `${exp.category} Expense`,
      subtitle: exp.note,
      caption: `Payee: ${exp.payee} • Paid via ${exp.paymentMethod}`,
      amount: `-${currency}${exp.amount.toLocaleString()}`,
      amountColor: Colors.error,
      icon: "cash-outline" as const,
      iconBg: "#FFFBEB",
      iconColor: "#D97706",
    })),
  ];

  const filteredItems = allItems.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (activeFilter === "sales") return item.type === "sale";
    if (activeFilter === "baki") return item.type === "baki";
    if (activeFilter === "purchases") return item.type === "purchase";
    if (activeFilter === "expenses") return item.type === "expense";
    return true;
  });

  return (
    <Screen
      edges={["top", "left", "right"]}
      header={
        <AppHeader
          title="Activity & Transactions"
          subtitle={`${activeBranch} • Operational Log`}
          rightElement={
            <TouchableOpacity
              onPress={() =>
                Alert.alert("Activity Export", "Transaction statement download initiated.", [
                  { text: "OK" },
                ])
              }
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Export Activity"
              className="w-10 h-10 rounded-full bg-[#F8FAFC] border border-[#CBD5E1] items-center justify-center"
            >
              <Ionicons name="download-outline" size={18} color={Colors.textPrimary} />
            </TouchableOpacity>
          }
        />
      }
    >
      <View className="flex-1">
        {/* Search Bar */}
        <View className="px-4 pt-3 pb-2">
          <View className="flex-row items-center bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 h-11">
            <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search receipt, party, expense..."
              placeholderTextColor={Colors.textMuted}
              className="flex-1 font-poppins-regular text-[13px] text-text-primary ml-2 py-0"
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter Bar */}
        <FilterBar
          items={filterOptions}
          selectedId={activeFilter}
          onSelect={setActiveFilter}
        />

        {/* Activity Feed List */}
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 40,
            gap: 8,
          }}
          ListEmptyComponent={
            <Card className="mt-4">
              <EmptyState
                title="No Transactions Found"
                description={`No activity recorded matching "${searchQuery}".`}
                actionLabel="Clear Filter"
                onAction={() => {
                  setSearchQuery("");
                  setActiveFilter("all");
                }}
              />
            </Card>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                if (item.originalSale) {
                  setSelectedSale(item.originalSale);
                } else {
                  Alert.alert(item.title, `${item.subtitle}\n${item.caption}\nAmount: ${item.amount}`, [
                    { text: "OK" },
                  ]);
                }
              }}
            >
              <Card padding="md" className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3 flex-1 mr-2">
                  <View
                    style={{ backgroundColor: item.iconBg }}
                    className="w-10 h-10 rounded-full items-center justify-center"
                  >
                    <Ionicons name={item.icon} size={18} color={item.iconColor} />
                  </View>
                  <View className="flex-1">
                    <Text
                      numberOfLines={1}
                      className="font-poppins-semibold text-[13px] text-text-primary"
                    >
                      {item.title}
                    </Text>
                    <Text
                      numberOfLines={1}
                      className="font-poppins-regular text-[11px] text-text-muted mt-0.5"
                    >
                      {item.subtitle}
                    </Text>
                    <Text className="font-poppins-medium text-[10px] text-text-muted mt-0.5">
                      {item.caption}
                    </Text>
                  </View>
                </View>

                <View className="items-end">
                  <Text
                    style={{ color: item.amountColor }}
                    className="font-poppins-bold text-[14px]"
                  >
                    {item.amount}
                  </Text>
                  {item.statusBadge && (
                    <View className="mt-1">
                      <StatusBadge
                        status={item.statusBadge.status}
                        label={item.statusBadge.label}
                        size="sm"
                      />
                    </View>
                  )}
                </View>
              </Card>
            </TouchableOpacity>
          )}
        />

        {/* Sale Detail Modal */}
        {selectedSale && (
          <Modal
            visible={!!selectedSale}
            animationType="slide"
            transparent
            onRequestClose={() => setSelectedSale(null)}
          >
            <View className="flex-1 bg-black/50 justify-end">
              <View className="bg-white rounded-t-3xl max-h-[80%] p-5 pb-8">
                <View className="flex-row items-center justify-between pb-3 border-b border-[#E2E8F0] mb-3">
                  <View>
                    <Text className="font-poppins-bold text-[18px] text-text-primary">
                      {selectedSale.receiptNumber}
                    </Text>
                    <Text className="font-poppins-regular text-[12px] text-text-muted">
                      {selectedSale.customerName ?? "Counter Customer"} • {selectedSale.paymentMethod}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setSelectedSale(null)}
                    className="w-8 h-8 rounded-full bg-[#F1F5F9] items-center justify-center"
                  >
                    <Ionicons name="close" size={18} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <ScrollView className="max-h-60 mb-3">
                  {selectedSale.lines.map((l, i) => (
                    <View
                      key={i}
                      className="flex-row items-center justify-between py-2 border-b border-[#F8FAFC]"
                    >
                      <View>
                        <Text className="font-poppins-medium text-[13px] text-text-primary">
                          {l.productName}
                        </Text>
                        <Text className="font-poppins-regular text-[11px] text-text-muted">
                          {currency}{l.unitPrice} x {l.quantity}
                        </Text>
                      </View>
                      <Text className="font-poppins-semibold text-[13px] text-text-primary">
                        {currency} {l.totalPrice.toLocaleString()}
                      </Text>
                    </View>
                  ))}
                </ScrollView>

                <View className="bg-[#F8FAFC] rounded-xl p-3 border border-[#E2E8F0] mb-4">
                  <View className="flex-row justify-between mb-1">
                    <Text className="font-poppins-regular text-[12px] text-text-secondary">
                      Payment Status
                    </Text>
                    <StatusBadge
                      status={
                        selectedSale.paymentStatus === "PAID"
                          ? "paid"
                          : selectedSale.paymentStatus === "DUE"
                          ? "due"
                          : "partial"
                      }
                      label={selectedSale.paymentStatus}
                      size="sm"
                    />
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="font-poppins-bold text-[14px] text-text-primary">
                      Total Invoice
                    </Text>
                    <Text className="font-poppins-bold text-[16px] text-primary">
                      {currency} {selectedSale.totalAmount.toLocaleString()}
                    </Text>
                  </View>
                </View>

                <View className="flex-row gap-2">
                  <Button
                    label="Print Receipt"
                    variant="outline"
                    size="md"
                    className="flex-1"
                    leftIcon={<Ionicons name="print-outline" size={16} color={Colors.primary} />}
                    onPress={() => Alert.alert("Receipt", "Print receipt sent to thermal printer.")}
                  />
                  <Button
                    label="Close"
                    variant="primary"
                    size="md"
                    className="flex-1"
                    onPress={() => setSelectedSale(null)}
                  />
                </View>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </Screen>
  );
}
