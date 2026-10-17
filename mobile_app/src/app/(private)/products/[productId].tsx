import React, { useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { Screen } from "@/components/layout/Screen";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { useStaticData } from "@/staticData";

export default function ProductDetailScreen() {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const { scenario } = useStaticData();
  const currency = scenario.organization.currencySymbol;
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);

  const product = scenario.products.find((p) => p.id === productId);

  if (!product) {
    return (
      <Screen edges={["top", "left", "right"]}>
        <AppHeader
          title="Product Details"
          canGoBack
          onBackPress={() => router.back()}
        />
        <View className="flex-1 justify-center px-4">
          <EmptyState
            title="Product Not Found"
            description="The requested product record could not be found in active catalog."
            actionLabel="Return to Catalog"
            onAction={() => router.replace("/(private)/products")}
          />
        </View>
      </Screen>
    );
  }

  const categoryName =
    scenario.categories.find((c) => c.id === product.categoryId)?.name ?? "General";
  const brandName =
    scenario.brands.find((b) => b.id === product.brandId)?.name ?? "Generic";
  const unitName =
    scenario.units.find((u) => u.id === product.unitId)?.abbreviation ?? "pcs";

  const profitMargin = product.salePrice - product.costPrice;
  const marginPercentage =
    product.salePrice > 0 ? Math.round((profitMargin / product.salePrice) * 100) : 0;
  const isOutOfStock = product.currentStock === 0;
  const isLowStock = product.currentStock <= product.reorderLevel && !isOutOfStock;

  const handleArchive = () => {
    Alert.alert(
      "Archive Product",
      `Are you sure you want to archive "${product.name}"? It will no longer appear in POS search, but existing sales history is preserved.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Archive",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Product Archived",
              "Product has been moved to archived catalog.",
              [{ text: "OK", onPress: () => router.back() }]
            );
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
          title="Product Details"
          subtitle={product.sku}
          canGoBack
          onBackPress={() => router.back()}
          rightElement={
            <TouchableOpacity
              onPress={() => router.push(`/(private)/products/${product.id}/edit`)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Edit product"
              className="w-10 h-10 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] items-center justify-center"
            >
              <Ionicons name="pencil" size={17} color={Colors.primary} />
            </TouchableOpacity>
          }
        />
      }
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 48, paddingTop: 12 }}
      >
        {/* Product Fallback Gallery Banner */}
        <Card padding="lg" className="items-center mb-4 bg-[#F8FAFC]">
          <View className="w-24 h-24 rounded-2xl bg-white border border-[#CBD5E1] items-center justify-center mb-3 shadow-sm">
            <Ionicons name="cube-outline" size={44} color={Colors.primary} />
          </View>

          <View className="flex-row items-center gap-2 mb-2">
            <View className="px-2.5 py-0.5 rounded-full bg-[#F1F5F9] border border-[#E2E8F0]">
              <Text className="font-poppins-semibold text-[11px] text-text-secondary">
                {categoryName}
              </Text>
            </View>
            <View className="px-2.5 py-0.5 rounded-full bg-[#F1F5F9] border border-[#E2E8F0]">
              <Text className="font-poppins-semibold text-[11px] text-text-secondary">
                {brandName}
              </Text>
            </View>
          </View>

          <Text className="font-poppins-bold text-[18px] text-text-primary text-center">
            {product.name}
          </Text>
          {product.nameBn ? (
            <Text className="font-poppins-medium text-[14px] text-text-secondary text-center mt-0.5">
              {product.nameBn}
            </Text>
          ) : null}
        </Card>

        {/* Pricing & Margin KPI Row */}
        <View className="flex-row gap-3 mb-4">
          <Card padding="md" className="flex-1 bg-[#F0FDF4] border-[#BBF7D0]">
            <Text className="font-poppins-medium text-[11px] text-text-muted">
              Retail Price
            </Text>
            <Text className="font-poppins-bold text-[20px] text-primary mt-0.5">
              {currency} {product.salePrice.toLocaleString()}
            </Text>
            <Text className="font-poppins-regular text-[10px] text-[#15803D] mt-0.5">
              Per {unitName}
            </Text>
          </Card>

          <Card padding="md" className="flex-1">
            <Text className="font-poppins-medium text-[11px] text-text-muted">
              Buy / Cost
            </Text>
            <Text className="font-poppins-bold text-[20px] text-text-primary mt-0.5">
              {currency} {product.costPrice.toLocaleString()}
            </Text>
            <Text className="font-poppins-regular text-[10px] text-text-muted mt-0.5">
              Est. acquisition
            </Text>
          </Card>

          <Card padding="md" className="flex-1">
            <Text className="font-poppins-medium text-[11px] text-text-muted">
              Margin
            </Text>
            <Text className="font-poppins-bold text-[20px] text-[#0284C7] mt-0.5">
              +{marginPercentage}%
            </Text>
            <Text className="font-poppins-regular text-[10px] text-text-muted mt-0.5">
              +{currency}{profitMargin}
            </Text>
          </Card>
        </View>

        {/* Stock Status Card */}
        <SectionHeader title="Inventory & Stock Balance" />
        <Card padding="md" className="mb-4">
          <View className="flex-row items-center justify-between pb-3 border-b border-[#F1F5F9]">
            <View>
              <Text className="font-poppins-medium text-[12px] text-text-muted">
                Available In Branch
              </Text>
              <Text
                className={`font-poppins-bold text-[22px] mt-0.5 ${
                  isOutOfStock
                    ? "text-[#DC2626]"
                    : isLowStock
                    ? "text-[#D97706]"
                    : "text-text-primary"
                }`}
              >
                {product.currentStock} {unitName}
              </Text>
            </View>

            <StatusBadge
              status={isOutOfStock ? "danger" : isLowStock ? "warning" : "active"}
              label={
                isOutOfStock
                  ? "Out of Stock"
                  : isLowStock
                  ? "Reorder Needed"
                  : "Stock Healthy"
              }
              size="md"
            />
          </View>

          <View className="flex-row items-center justify-between pt-3">
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="warning-outline" size={16} color={Colors.textMuted} />
              <Text className="font-poppins-regular text-[12px] text-text-secondary">
                Reorder Alert Level:
              </Text>
            </View>
            <Text className="font-poppins-semibold text-[13px] text-text-primary">
              {product.reorderLevel} {unitName}
            </Text>
          </View>
        </Card>

        {/* Identification & Barcode */}
        <SectionHeader title="Item Identifiers" />
        <Card padding="none" className="overflow-hidden mb-4">
          <View className="px-4 py-3 flex-row items-center justify-between border-b border-[#F1F5F9]">
            <Text className="font-poppins-medium text-[13px] text-text-secondary">
              Stock Keeping Unit (SKU)
            </Text>
            <Text className="font-poppins-bold text-[13px] text-text-primary font-mono">
              {product.sku}
            </Text>
          </View>

          <View className="px-4 py-3 flex-row items-center justify-between border-b border-[#F1F5F9]">
            <Text className="font-poppins-medium text-[13px] text-text-secondary">
              Barcode / EAN-13
            </Text>
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="barcode-outline" size={16} color={Colors.primary} />
              <Text className="font-poppins-semibold text-[13px] text-text-primary font-mono">
                {product.barcode}
              </Text>
            </View>
          </View>

          <View className="px-4 py-3 flex-row items-center justify-between">
            <Text className="font-poppins-medium text-[13px] text-text-secondary">
              Measurement Unit
            </Text>
            <Text className="font-poppins-semibold text-[13px] text-text-primary">
              {unitName}
            </Text>
          </View>
        </Card>

        {/* Product Variants (if any) */}
        <SectionHeader
          title={`Product Variants (${product.variants ? product.variants.length : 0})`}
        />
        <Card padding="none" className="overflow-hidden mb-6">
          {!product.variants || product.variants.length === 0 ? (
            <View className="p-4 items-center">
              <Text className="font-poppins-regular text-[13px] text-text-muted">
                No extra variants defined for this item.
              </Text>
            </View>
          ) : (
            product.variants.map((variant, index) => (
              <TouchableOpacity
                key={variant.id}
                onPress={() => setSelectedVariantIndex(index)}
                activeOpacity={0.7}
                className={`p-3.5 border-b border-[#F1F5F9] flex-row items-center justify-between ${
                  selectedVariantIndex === index ? "bg-[#F0FDF4]" : "bg-white"
                }`}
              >
                <View className="flex-1 mr-2">
                  <Text className="font-poppins-semibold text-[13px] text-text-primary">
                    {variant.name}
                  </Text>
                  <Text className="font-poppins-regular text-[11px] text-text-muted">
                    SKU: {variant.sku} • Stock: {variant.currentStock}
                  </Text>
                </View>

                <View className="items-end">
                  <Text className="font-poppins-bold text-[14px] text-primary">
                    {currency} {variant.salePrice.toLocaleString()}
                  </Text>
                  <Text className="font-poppins-regular text-[10px] text-text-muted">
                    Cost: {currency}{variant.costPrice}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </Card>

        {/* Primary Action Buttons */}
        <View className="gap-2.5">
          <Button
            label="Edit Product Details"
            variant="primary"
            size="lg"
            leftIcon={<Ionicons name="create-outline" size={18} color="#FFFFFF" />}
            onPress={() => router.push(`/(private)/products/${product.id}/edit`)}
          />

          <Button
            label="Archive Product"
            variant="outline"
            size="lg"
            leftIcon={<Ionicons name="archive-outline" size={18} color={Colors.error} />}
            className="border-[#FECACA]"
            onPress={handleArchive}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
