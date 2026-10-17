import React, { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  ScrollView,
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
import { useStaticData } from "@/staticData";

type SortOption = "name" | "price_asc" | "price_desc" | "stock_asc";
type StockFilter = "all" | "in_stock" | "low_stock" | "out_of_stock";

export default function ProductsListScreen() {
  const { scenario } = useStaticData();
  const currency = scenario.organization.currencySymbol;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Category filter items
  const categoryFilterItems = useMemo(
    () => [
      { id: "all", label: "All Items" },
      ...scenario.categories.map((c) => ({ id: c.id, label: c.name })),
    ],
    [scenario.categories]
  );

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let list = [...scenario.products];

    // Search query
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.nameBn && p.nameBn.toLowerCase().includes(q)) ||
          p.sku.toLowerCase().includes(q) ||
          p.barcode.includes(q)
      );
    }

    // Category
    if (selectedCategory !== "all") {
      list = list.filter((p) => p.categoryId === selectedCategory);
    }

    // Brand
    if (selectedBrand !== "all") {
      list = list.filter((p) => p.brandId === selectedBrand);
    }

    // Stock status
    if (stockFilter === "low_stock") {
      list = list.filter((p) => p.currentStock <= p.reorderLevel && p.currentStock > 0);
    } else if (stockFilter === "out_of_stock") {
      list = list.filter((p) => p.currentStock === 0);
    } else if (stockFilter === "in_stock") {
      list = list.filter((p) => p.currentStock > 0);
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "price_asc") {
        return a.salePrice - b.salePrice;
      }
      if (sortBy === "price_desc") {
        return b.salePrice - a.salePrice;
      }
      if (sortBy === "stock_asc") {
        return a.currentStock - b.currentStock;
      }
      return 0;
    });

    return list;
  }, [
    scenario.products,
    searchQuery,
    selectedCategory,
    selectedBrand,
    stockFilter,
    sortBy,
  ]);

  const activeFiltersCount =
    (selectedBrand !== "all" ? 1 : 0) +
    (stockFilter !== "all" ? 1 : 0) +
    (sortBy !== "name" ? 1 : 0);

  const handleResetFilters = () => {
    setSelectedBrand("all");
    setStockFilter("all");
    setSortBy("name");
    setIsFilterModalOpen(false);
  };

  return (
    <Screen
      edges={["top", "left", "right"]}
      header={
        <AppHeader
          title="Product Catalog"
          subtitle={`${scenario.products.length} registered items`}
          canGoBack
          onBackPress={() => router.back()}
          rightElement={
            <Button
              label="+ Add"
              size="sm"
              variant="primary"
              className="px-3 py-1.5"
              onPress={() => router.push("/(private)/products/new")}
            />
          }
        />
      }
    >
      <View className="flex-1">
        {/* Search Bar & Filter Button */}
        <View className="px-4 pt-3 pb-2 flex-row items-center gap-2">
          <View className="flex-1 flex-row items-center bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 h-11">
            <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by name, বাংলা, SKU, barcode..."
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

          <TouchableOpacity
            onPress={() => setIsFilterModalOpen(true)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Filter and sort catalog"
            className={`w-11 h-11 rounded-xl items-center justify-center border ${
              activeFiltersCount > 0
                ? "bg-[#ECFDF5] border-primary"
                : "bg-[#F8FAFC] border-[#CBD5E1]"
            }`}
          >
            <Ionicons
              name="options-outline"
              size={20}
              color={activeFiltersCount > 0 ? Colors.primary : Colors.textPrimary}
            />
            {activeFiltersCount > 0 && (
              <View className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary items-center justify-center">
                <Text className="font-poppins-bold text-[9px] text-white">
                  {activeFiltersCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Category Filter Bar */}
        <FilterBar
          items={categoryFilterItems}
          selectedId={selectedCategory}
          onSelect={setSelectedCategory}
        />

        {/* Summary Info Bar */}
        <View className="px-4 py-1.5 flex-row items-center justify-between">
          <Text className="font-poppins-medium text-[11px] text-text-muted">
            Showing {filteredProducts.length} of {scenario.products.length} items
          </Text>
          {activeFiltersCount > 0 && (
            <TouchableOpacity onPress={handleResetFilters}>
              <Text className="font-poppins-medium text-[11px] text-primary">
                Clear Filters
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Product List */}
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 4,
            paddingBottom: 40,
            gap: 10,
          }}
          ListEmptyComponent={
            <Card className="mt-4">
              <EmptyState
                title="No Products Found"
                description={`No items match your query "${searchQuery}" or active filters.`}
                actionLabel="Reset All Filters"
                onAction={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                  handleResetFilters();
                }}
              />
            </Card>
          }
          renderItem={({ item }) => {
            const categoryName =
              scenario.categories.find((c) => c.id === item.categoryId)?.name ?? "General";
            const unitName =
              scenario.units.find((u) => u.id === item.unitId)?.abbreviation ?? "pcs";
            const isOutOfStock = item.currentStock === 0;
            const isLowStock = item.currentStock <= item.reorderLevel && !isOutOfStock;

            return (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => router.push(`/(private)/products/${item.id}`)}
              >
                <Card padding="md">
                  <View className="flex-row items-start justify-between mb-2">
                    <View className="flex-1 mr-3">
                      <Text
                        numberOfLines={1}
                        className="font-poppins-semibold text-[14px] text-text-primary"
                      >
                        {item.name}
                      </Text>
                      {item.nameBn ? (
                        <Text
                          numberOfLines={1}
                          className="font-poppins-regular text-[12px] text-text-muted mt-0.5"
                        >
                          {item.nameBn}
                        </Text>
                      ) : null}

                      <View className="flex-row items-center gap-1.5 mt-1.5 flex-wrap">
                        <View className="px-2 py-0.5 rounded-md bg-[#F1F5F9] border border-[#E2E8F0]">
                          <Text className="font-poppins-medium text-[10px] text-text-secondary">
                            {categoryName}
                          </Text>
                        </View>
                        <Text className="font-poppins-regular text-[11px] text-text-muted">
                          SKU: {item.sku}
                        </Text>
                      </View>
                    </View>

                    <StatusBadge
                      status={isOutOfStock ? "danger" : isLowStock ? "warning" : "active"}
                      label={
                        isOutOfStock
                          ? "Out of Stock"
                          : isLowStock
                          ? "Low Stock"
                          : "In Stock"
                      }
                      size="sm"
                    />
                  </View>

                  <View className="flex-row items-center justify-between pt-2.5 border-t border-[#F1F5F9]">
                    <View className="flex-row items-baseline gap-1">
                      <Text className="font-poppins-bold text-[16px] text-primary">
                        {currency} {item.salePrice.toLocaleString()}
                      </Text>
                      <Text className="font-poppins-regular text-[11px] text-text-muted">
                        / {unitName}
                      </Text>
                    </View>

                    <View className="flex-row items-center gap-2">
                      {item.variants && item.variants.length > 0 && (
                        <View className="px-2 py-0.5 rounded-full bg-[#ECFDF5] border border-[#A7F3D0]">
                          <Text className="font-poppins-medium text-[10px] text-primary">
                            {item.variants.length} variants
                          </Text>
                        </View>
                      )}
                      <Text
                        className={`font-poppins-semibold text-[13px] ${
                          isOutOfStock
                            ? "text-[#DC2626]"
                            : isLowStock
                            ? "text-[#D97706]"
                            : "text-text-primary"
                        }`}
                      >
                        {item.currentStock} {unitName}
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={Colors.textMuted}
                      />
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            );
          }}
        />

        {/* Sort & Filter Bottom Sheet / Modal */}
        <Modal
          visible={isFilterModalOpen}
          animationType="slide"
          transparent
          onRequestClose={() => setIsFilterModalOpen(false)}
        >
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl max-h-[85%] p-5 pb-8">
              <View className="flex-row items-center justify-between pb-3 border-b border-[#E2E8F0] mb-4">
                <Text className="font-poppins-bold text-[18px] text-text-primary">
                  Filter & Sort Catalog
                </Text>
                <TouchableOpacity
                  onPress={() => setIsFilterModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-[#F1F5F9] items-center justify-center"
                >
                  <Ionicons name="close" size={18} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView className="max-h-96">
                {/* Sort By */}
                <Text className="font-poppins-semibold text-[13px] text-text-secondary uppercase tracking-wider mb-2">
                  Sort Order
                </Text>
                <View className="flex-row flex-wrap gap-2 mb-4">
                  {[
                    { id: "name", label: "Name (A-Z)" },
                    { id: "price_asc", label: "Price: Low to High" },
                    { id: "price_desc", label: "Price: High to Low" },
                    { id: "stock_asc", label: "Stock: Low to High" },
                  ].map((s) => (
                    <TouchableOpacity
                      key={s.id}
                      onPress={() => setSortBy(s.id as SortOption)}
                      className={`px-3 py-2 rounded-xl border ${
                        sortBy === s.id
                          ? "bg-primary border-primary"
                          : "bg-[#F8FAFC] border-[#CBD5E1]"
                      }`}
                    >
                      <Text
                        className={`font-poppins-medium text-[12px] ${
                          sortBy === s.id ? "text-white" : "text-text-primary"
                        }`}
                      >
                        {s.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Filter by Stock Level */}
                <Text className="font-poppins-semibold text-[13px] text-text-secondary uppercase tracking-wider mb-2">
                  Stock Status
                </Text>
                <View className="flex-row flex-wrap gap-2 mb-4">
                  {[
                    { id: "all", label: "All Items" },
                    { id: "in_stock", label: "In Stock" },
                    { id: "low_stock", label: "Low Stock Alert" },
                    { id: "out_of_stock", label: "Out of Stock" },
                  ].map((f) => (
                    <TouchableOpacity
                      key={f.id}
                      onPress={() => setStockFilter(f.id as StockFilter)}
                      className={`px-3 py-2 rounded-xl border ${
                        stockFilter === f.id
                          ? "bg-primary border-primary"
                          : "bg-[#F8FAFC] border-[#CBD5E1]"
                      }`}
                    >
                      <Text
                        className={`font-poppins-medium text-[12px] ${
                          stockFilter === f.id ? "text-white" : "text-text-primary"
                        }`}
                      >
                        {f.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Filter by Brand */}
                <Text className="font-poppins-semibold text-[13px] text-text-secondary uppercase tracking-wider mb-2">
                  Brand
                </Text>
                <View className="flex-row flex-wrap gap-2 mb-6">
                  {[{ id: "all", name: "All Brands" }, ...scenario.brands].map((b) => (
                    <TouchableOpacity
                      key={b.id}
                      onPress={() => setSelectedBrand(b.id)}
                      className={`px-3 py-2 rounded-xl border ${
                        selectedBrand === b.id
                          ? "bg-primary border-primary"
                          : "bg-[#F8FAFC] border-[#CBD5E1]"
                      }`}
                    >
                      <Text
                        className={`font-poppins-medium text-[12px] ${
                          selectedBrand === b.id ? "text-white" : "text-text-primary"
                        }`}
                      >
                        {b.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <View className="flex-row gap-2 pt-2 border-t border-[#E2E8F0]">
                <Button
                  label="Reset"
                  variant="outline"
                  size="md"
                  className="flex-1"
                  onPress={handleResetFilters}
                />
                <Button
                  label="Apply Filters"
                  variant="primary"
                  size="md"
                  className="flex-[2]"
                  onPress={() => setIsFilterModalOpen(false)}
                />
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Screen>
  );
}
