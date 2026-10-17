import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { Screen } from "@/components/layout/Screen";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { FilterBar } from "@/components/ui/FilterBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { useStaticData, type StaticProduct } from "@/staticData";

export default function InventoryScreen() {
  const { scenario } = useStaticData();
  const currency = scenario.organization.currencySymbol;
  const activeBranch = scenario.organization.branches[0]?.name ?? "Main Branch";

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState<StaticProduct | null>(null);
  const [adjustmentReason, setAdjustmentReason] = useState("Damaged Stock");
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustType, setAdjustType] = useState<"add" | "remove">("remove");

  const filterOptions = [
    { id: "all", label: `All Items (${scenario.products.length})` },
    {
      id: "low",
      label: `Low Stock (${scenario.products.filter((p) => p.currentStock <= p.reorderLevel && p.currentStock > 0).length})`,
    },
    {
      id: "out",
      label: `Out of Stock (${scenario.products.filter((p) => p.currentStock === 0).length})`,
    },
  ];

  const filteredProducts = scenario.products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (activeFilter === "low") return p.currentStock <= p.reorderLevel && p.currentStock > 0;
    if (activeFilter === "out") return p.currentStock === 0;
    return true;
  });

  const handleSimulateAdjustment = () => {
    if (!adjustQty || isNaN(Number(adjustQty)) || Number(adjustQty) <= 0) {
      Alert.alert("Invalid Quantity", "Please enter a positive count.");
      return;
    }

    const qtyNumber = Number(adjustQty);
    const unitName =
      scenario.units.find((u) => u.id === selectedProduct?.unitId)?.abbreviation ?? "pcs";

    Alert.alert(
      "Confirm Stock Adjustment",
      `Product: ${selectedProduct?.name}\nType: ${adjustType === "add" ? "+" : "-"}${qtyNumber} ${unitName}\nReason: ${adjustmentReason}\nBranch: ${activeBranch}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm Adjustment",
          onPress: () => {
            setSelectedProduct(null);
            setAdjustQty("");
            Alert.alert("Adjustment Logged", "Audit ledger entry recorded successfully.");
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
          title="Inventory & Stock"
          subtitle={`${activeBranch} • Stock Ledger`}
          rightElement={
            <View className="flex-row items-center gap-1.5">
              <TouchableOpacity
                onPress={() => router.push("/(private)/products")}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Open Product Catalog"
                className="w-10 h-10 rounded-full bg-[#F8FAFC] border border-[#CBD5E1] items-center justify-center"
              >
                <Ionicons name="cube-outline" size={18} color={Colors.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  Alert.alert("Scan Stock", "Barcode scanner ready for stock audit.")
                }
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Scan stock"
                className="w-10 h-10 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] items-center justify-center"
              >
                <Ionicons name="scan-outline" size={18} color={Colors.primary} />
              </TouchableOpacity>
            </View>
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
              placeholder="Search items by name, SKU..."
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

        {/* Product Stock List */}
        <FlatList
          data={filteredProducts}
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
                title="No Items Found"
                description={`No inventory matched "${searchQuery}".`}
                actionLabel="Clear Filter"
                onAction={() => {
                  setSearchQuery("");
                  setActiveFilter("all");
                }}
              />
            </Card>
          }
          renderItem={({ item }) => {
            const isOutOfStock = item.currentStock === 0;
            const isLowStock = item.currentStock <= item.reorderLevel && !isOutOfStock;
            const categoryName =
              scenario.categories.find((c) => c.id === item.categoryId)?.name ?? "General";
            const unitName =
              scenario.units.find((u) => u.id === item.unitId)?.abbreviation ?? "pcs";

            return (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setSelectedProduct(item)}
              >
                <Card padding="md">
                  <View className="flex-row items-start justify-between mb-2">
                    <View className="flex-1 mr-2">
                      <Text className="font-poppins-bold text-[14px] text-text-primary">
                        {item.name}
                      </Text>
                      <Text className="font-poppins-regular text-[11px] text-text-muted mt-0.5">
                        Category: {categoryName} • SKU: {item.sku}
                      </Text>
                    </View>

                    <StatusBadge
                      status={isOutOfStock ? "danger" : isLowStock ? "warning" : "active"}
                      label={isOutOfStock ? "Out of Stock" : isLowStock ? "Low Stock" : "In Stock"}
                      size="sm"
                    />
                  </View>

                  <View className="flex-row items-center justify-between pt-2 border-t border-[#F1F5F9]">
                    <View>
                      <Text className="font-poppins-medium text-[11px] text-text-muted">
                        Available Balance
                      </Text>
                      <Text
                        className={`font-poppins-bold text-[16px] ${
                          isOutOfStock
                            ? "text-[#DC2626]"
                            : isLowStock
                            ? "text-[#D97706]"
                            : "text-text-primary"
                        }`}
                      >
                        {item.currentStock} {unitName}
                      </Text>
                    </View>

                    <View className="items-end">
                      <Text className="font-poppins-medium text-[11px] text-text-muted">
                        Cost / Sale Price
                      </Text>
                      <Text className="font-poppins-semibold text-[13px] text-text-primary">
                        {currency}{item.costPrice} / {currency}{item.salePrice}
                      </Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            );
          }}
        />

        {/* Stock Adjustment Sheet / Modal */}
        {selectedProduct && (
          <Modal
            visible={!!selectedProduct}
            animationType="slide"
            transparent
            onRequestClose={() => setSelectedProduct(null)}
          >
            <View className="flex-1 bg-black/50 justify-end">
              <View className="bg-white rounded-t-3xl max-h-[85%] p-5 pb-8">
                <View className="flex-row items-center justify-between pb-3 border-b border-[#E2E8F0] mb-3">
                  <View>
                    <Text className="font-poppins-bold text-[18px] text-text-primary">
                      Adjust Stock Count
                    </Text>
                    <Text className="font-poppins-regular text-[12px] text-text-muted">
                      {selectedProduct.name} ({selectedProduct.sku})
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setSelectedProduct(null)}
                    className="w-8 h-8 rounded-full bg-[#F1F5F9] items-center justify-center"
                  >
                    <Ionicons name="close" size={18} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* Current Stock Banner */}
                <View className="bg-[#F8FAFC] rounded-xl p-3 border border-[#E2E8F0] mb-4 flex-row items-center justify-between">
                  <Text className="font-poppins-medium text-[13px] text-text-secondary">
                    Current Recorded Stock:
                  </Text>
                  <Text className="font-poppins-bold text-[16px] text-text-primary">
                    {selectedProduct.currentStock}{" "}
                    {scenario.units.find((u) => u.id === selectedProduct.unitId)?.abbreviation ?? "pcs"}
                  </Text>
                </View>

                {/* Add or Remove Toggle */}
                <Text className="font-poppins-medium text-[12px] text-text-secondary mb-1.5">
                  Adjustment Type
                </Text>
                <View className="flex-row gap-2 mb-3">
                  <TouchableOpacity
                    onPress={() => setAdjustType("remove")}
                    className={`flex-1 py-2.5 rounded-xl items-center border ${
                      adjustType === "remove"
                        ? "bg-[#FEF2F2] border-[#FECACA]"
                        : "bg-white border-[#E2E8F0]"
                    }`}
                  >
                    <Text
                      className={`font-poppins-semibold text-[13px] ${
                        adjustType === "remove" ? "text-[#DC2626]" : "text-text-secondary"
                      }`}
                    >
                      - Deduct / Loss
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setAdjustType("add")}
                    className={`flex-1 py-2.5 rounded-xl items-center border ${
                      adjustType === "add"
                        ? "bg-[#ECFDF5] border-[#A7F3D0]"
                        : "bg-white border-[#E2E8F0]"
                    }`}
                  >
                    <Text
                      className={`font-poppins-semibold text-[13px] ${
                        adjustType === "add" ? "text-primary" : "text-text-secondary"
                      }`}
                    >
                      + Add Stock
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Quantity Input */}
                <Text className="font-poppins-medium text-[12px] text-text-secondary mb-1.5">
                  Quantity (
                  {scenario.units.find((u) => u.id === selectedProduct.unitId)?.abbreviation ?? "pcs"}
                  )
                </Text>
                <TextInput
                  value={adjustQty}
                  onChangeText={setAdjustQty}
                  keyboardType="numeric"
                  placeholder="e.g. 5"
                  placeholderTextColor={Colors.textMuted}
                  className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 h-12 font-poppins-medium text-[15px] text-text-primary mb-3"
                />

                {/* Reason Selection */}
                <Text className="font-poppins-medium text-[12px] text-text-secondary mb-1.5">
                  Reason for Adjustment
                </Text>
                <View className="flex-row flex-wrap gap-1.5 mb-5">
                  {[
                    "Damaged Stock",
                    "Expired Item",
                    "Physical Count Diff",
                    "Return to Vendor",
                    "Store Transfer",
                  ].map((r) => (
                    <TouchableOpacity
                      key={r}
                      onPress={() => setAdjustmentReason(r)}
                      className={`px-3 py-1.5 rounded-lg border ${
                        adjustmentReason === r
                          ? "bg-primary border-primary"
                          : "bg-white border-[#E2E8F0]"
                      }`}
                    >
                      <Text
                        className={`font-poppins-medium text-[11px] ${
                          adjustmentReason === r ? "text-white" : "text-text-secondary"
                        }`}
                      >
                        {r}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View className="flex-row gap-2 mb-2">
                  <Button
                    label="Cancel"
                    variant="outline"
                    size="md"
                    className="flex-1"
                    onPress={() => setSelectedProduct(null)}
                  />
                  <Button
                    label="Confirm Adjustment"
                    variant="primary"
                    size="md"
                    className="flex-[2]"
                    onPress={handleSimulateAdjustment}
                  />
                </View>

                <TouchableOpacity
                  onPress={() => {
                    const id = selectedProduct.id;
                    setSelectedProduct(null);
                    router.push(`/(private)/products/${id}`);
                  }}
                  activeOpacity={0.7}
                  className="py-2 items-center"
                >
                  <Text className="font-poppins-medium text-[12px] text-primary">
                    View Full Product Details →
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </Screen>
  );
}
