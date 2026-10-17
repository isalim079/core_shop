import React, { useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "@/components/layout/Screen";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card } from "@/components/ui/Card";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { useStaticData } from "@/staticData";

export default function EditProductScreen() {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const { scenario } = useStaticData();
  const currency = scenario.organization.currencySymbol;

  const product = scenario.products.find((p) => p.id === productId);

  const [name, setName] = useState(product?.name ?? "");
  const [nameBn, setNameBn] = useState(product?.nameBn ?? "");
  const [sku, setSku] = useState(product?.sku ?? "");
  const [barcode, setBarcode] = useState(product?.barcode ?? "");
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? scenario.categories[1]?.id);
  const [brandId, setBrandId] = useState(product?.brandId ?? scenario.brands[0]?.id);
  const [unitId, setUnitId] = useState(product?.unitId ?? scenario.units[0]?.id);
  const [costPrice, setCostPrice] = useState(product?.costPrice ? String(product.costPrice) : "");
  const [salePrice, setSalePrice] = useState(product?.salePrice ? String(product.salePrice) : "");
  const [reorderLevel, setReorderLevel] = useState(product?.reorderLevel ? String(product.reorderLevel) : "5");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!product) {
    return (
      <Screen edges={["top", "left", "right"]}>
        <AppHeader
          title="Edit Product"
          canGoBack
          onBackPress={() => router.back()}
        />
        <View className="flex-1 justify-center px-4">
          <EmptyState
            title="Product Not Found"
            description="Could not locate product record to edit."
            actionLabel="Return to Catalog"
            onAction={() => router.replace("/(private)/products")}
          />
        </View>
      </Screen>
    );
  }

  const numCost = parseFloat(costPrice) || 0;
  const numSale = parseFloat(salePrice) || 0;
  const marginAmt = numSale - numCost;
  const marginPct = numSale > 0 ? Math.round((marginAmt / numSale) * 100) : 0;

  const handleSave = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Product name is required";
    if (!sku.trim()) newErrors.sku = "SKU is required";
    if (!costPrice.trim() || isNaN(Number(costPrice))) newErrors.costPrice = "Valid cost price required";
    if (!salePrice.trim() || isNaN(Number(salePrice))) newErrors.salePrice = "Valid sale price required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      Alert.alert(
        "Product Updated",
        `Changes to "${name}" have been saved successfully.`,
        [
          {
            text: "Done",
            onPress: () => router.back(),
          },
        ]
      );
    }, 450);
  };

  const handleArchive = () => {
    Alert.alert(
      "Archive Product",
      `Archive "${name}"? It will no longer appear in POS search, but past transactions remain intact.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Archive",
          style: "destructive",
          onPress: () => {
            Alert.alert("Product Archived", "Moved to archived catalog.", [
              { text: "OK", onPress: () => router.replace("/(private)/products") },
            ]);
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
          title="Edit Product"
          subtitle={product.sku}
          canGoBack
          onBackPress={() => router.back()}
        />
      }
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 48, paddingTop: 12 }}
      >
        {/* Section 1: Basic Information */}
        <SectionHeader title="1. Product Identity" />
        <Card padding="md" className="mb-4">
          <TextField
            label="Product Name (English) *"
            value={name}
            onChangeText={(t) => {
              setName(t);
              if (errors.name) setErrors((e) => ({ ...e, name: "" }));
            }}
            error={errors.name}
            className="mb-3"
          />

          <TextField
            label="Product Name (বাংলা / Bangla)"
            value={nameBn}
            onChangeText={setNameBn}
            className="mb-3"
          />

          <View className="flex-row gap-3">
            <View className="flex-1">
              <TextField
                label="SKU Code *"
                value={sku}
                onChangeText={(t) => {
                  setSku(t);
                  if (errors.sku) setErrors((e) => ({ ...e, sku: "" }));
                }}
                error={errors.sku}
              />
            </View>

            <View className="flex-1">
              <TextField
                label="Barcode / EAN"
                value={barcode}
                onChangeText={setBarcode}
              />
            </View>
          </View>
        </Card>

        {/* Section 2: Taxonomy & Classification */}
        <SectionHeader title="2. Category, Brand & Unit" />
        <Card padding="md" className="mb-4">
          <Text className="font-poppins-medium text-[12px] text-text-secondary mb-1.5">
            Category *
          </Text>
          <View className="flex-row flex-wrap gap-1.5 mb-3">
            {scenario.categories.filter((c) => c.id !== "cat-all").map((cat) => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setCategoryId(cat.id)}
                className={`px-3 py-1.5 rounded-xl border ${
                  categoryId === cat.id
                    ? "bg-primary border-primary"
                    : "bg-[#F8FAFC] border-[#CBD5E1]"
                }`}
              >
                <Text
                  className={`font-poppins-medium text-[11px] ${
                    categoryId === cat.id ? "text-white" : "text-text-primary"
                  }`}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="font-poppins-medium text-[12px] text-text-secondary mb-1.5">
            Brand *
          </Text>
          <View className="flex-row flex-wrap gap-1.5 mb-3">
            {scenario.brands.map((b) => (
              <TouchableOpacity
                key={b.id}
                onPress={() => setBrandId(b.id)}
                className={`px-3 py-1.5 rounded-xl border ${
                  brandId === b.id
                    ? "bg-primary border-primary"
                    : "bg-[#F8FAFC] border-[#CBD5E1]"
                }`}
              >
                <Text
                  className={`font-poppins-medium text-[11px] ${
                    brandId === b.id ? "text-white" : "text-text-primary"
                  }`}
                >
                  {b.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="font-poppins-medium text-[12px] text-text-secondary mb-1.5">
            Unit of Measure *
          </Text>
          <View className="flex-row flex-wrap gap-1.5">
            {scenario.units.map((u) => (
              <TouchableOpacity
                key={u.id}
                onPress={() => setUnitId(u.id)}
                className={`px-3 py-1.5 rounded-xl border ${
                  unitId === u.id
                    ? "bg-primary border-primary"
                    : "bg-[#F8FAFC] border-[#CBD5E1]"
                }`}
              >
                <Text
                  className={`font-poppins-medium text-[11px] ${
                    unitId === u.id ? "text-white" : "text-text-primary"
                  }`}
                >
                  {u.name} ({u.abbreviation})
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Section 3: Pricing & Reorder Point */}
        <SectionHeader title="3. Pricing & Alert Levels" />
        <Card padding="md" className="mb-4">
          <View className="flex-row gap-3 mb-3">
            <View className="flex-1">
              <TextField
                label={`Cost Price (${currency}) *`}
                value={costPrice}
                onChangeText={(t) => {
                  setCostPrice(t);
                  if (errors.costPrice) setErrors((e) => ({ ...e, costPrice: "" }));
                }}
                keyboardType="numeric"
                error={errors.costPrice}
              />
            </View>

            <View className="flex-1">
              <TextField
                label={`Sale Price (${currency}) *`}
                value={salePrice}
                onChangeText={(t) => {
                  setSalePrice(t);
                  if (errors.salePrice) setErrors((e) => ({ ...e, salePrice: "" }));
                }}
                keyboardType="numeric"
                error={errors.salePrice}
              />
            </View>
          </View>

          {numSale > 0 && (
            <View className="p-2.5 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] mb-3 flex-row items-center justify-between">
              <Text className="font-poppins-medium text-[12px] text-[#15803D]">
                Projected Profit Margin:
              </Text>
              <Text className="font-poppins-bold text-[13px] text-primary">
                +{currency}{marginAmt.toFixed(2)} ({marginPct}%)
              </Text>
            </View>
          )}

          <TextField
            label="Reorder Alert Threshold *"
            value={reorderLevel}
            onChangeText={setReorderLevel}
            keyboardType="numeric"
          />
        </Card>

        {/* Action Buttons */}
        <View className="gap-2.5 mb-6">
          <Button
            label="Save Changes"
            variant="primary"
            size="lg"
            loading={saving}
            leftIcon={<Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />}
            onPress={handleSave}
          />
          <Button
            label="Cancel"
            variant="outline"
            size="lg"
            onPress={() => router.back()}
          />
        </View>

        {/* Danger Zone: Archiving */}
        <SectionHeader title="Danger Zone" />
        <Card padding="md" className="border border-[#FECACA] bg-[#FEF2F2]">
          <Text className="font-poppins-bold text-[13px] text-[#991B1B] mb-1">
            Archive This Product
          </Text>
          <Text className="font-poppins-regular text-[11px] text-[#7F1D1D] mb-3 leading-[16px]">
            Archiving removes the item from counter POS search and inventory reorder lists. All existing sales receipts and customer records referencing this item are preserved.
          </Text>
          <Button
            label="Archive Product"
            variant="danger"
            size="md"
            leftIcon={<Ionicons name="archive-outline" size={16} color="#FFFFFF" />}
            onPress={handleArchive}
          />
        </Card>
      </ScrollView>
    </Screen>
  );
}
