import React, { useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { Screen } from "@/components/layout/Screen";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card } from "@/components/ui/Card";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useStaticData } from "@/staticData";

export default function NewProductScreen() {
  const { scenario } = useStaticData();
  const currency = scenario.organization.currencySymbol;

  const [name, setName] = useState("");
  const [nameBn, setNameBn] = useState("");
  const [sku, setSku] = useState("PRD-1080");
  const [barcode, setBarcode] = useState("8901234567899");
  const [categoryId, setCategoryId] = useState(scenario.categories[1]?.id ?? "cat-grocery");
  const [brandId, setBrandId] = useState(scenario.brands[0]?.id ?? "brand-fortune");
  const [unitId, setUnitId] = useState(scenario.units[0]?.id ?? "unit-pcs");
  const [costPrice, setCostPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [initialStock, setInitialStock] = useState("10");
  const [reorderLevel, setReorderLevel] = useState("5");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const numCost = parseFloat(costPrice) || 0;
  const numSale = parseFloat(salePrice) || 0;
  const marginAmt = numSale - numCost;
  const marginPct = numSale > 0 ? Math.round((marginAmt / numSale) * 100) : 0;

  const handleScanBarcode = () => {
    const randomBarcode = "890" + Math.floor(1000000000 + Math.random() * 9000000000);
    setBarcode(randomBarcode);
    Alert.alert("Barcode Scanned", `Captured code: ${randomBarcode}`);
  };

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
        "Product Created",
        `"${name}" has been added to the store catalog.`,
        [
          {
            text: "Done",
            onPress: () => router.replace("/(private)/products"),
          },
        ]
      );
    }, 500);
  };

  return (
    <Screen
      edges={["top", "left", "right"]}
      header={
        <AppHeader
          title="Add New Product"
          subtitle="Catalog entry form"
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
            placeholder="e.g. ACI Pure Salt 1kg"
            error={errors.name}
            className="mb-3"
          />

          <TextField
            label="Product Name (বাংলা / Bangla)"
            value={nameBn}
            onChangeText={setNameBn}
            placeholder="যেমন: এসিআই পিওর লবণ ১ কেজি"
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
                placeholder="SKU-100"
                error={errors.sku}
              />
            </View>

            <View className="flex-1">
              <TextField
                label="Barcode / EAN"
                value={barcode}
                onChangeText={setBarcode}
                placeholder="Barcode"
                rightIcon={
                  <TouchableOpacity onPress={handleScanBarcode} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="barcode-outline" size={18} color={Colors.primary} />
                  </TouchableOpacity>
                }
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

        {/* Section 3: Pricing & Inventory Thresholds */}
        <SectionHeader title="3. Pricing & Stock" />
        <Card padding="md" className="mb-4">
          <View className="flex-row gap-3 mb-3">
            <View className="flex-1">
              <TextField
                label={`Cost / Buy Price (${currency}) *`}
                value={costPrice}
                onChangeText={(t) => {
                  setCostPrice(t);
                  if (errors.costPrice) setErrors((e) => ({ ...e, costPrice: "" }));
                }}
                keyboardType="numeric"
                placeholder="0.00"
                error={errors.costPrice}
              />
            </View>

            <View className="flex-1">
              <TextField
                label={`Retail Sale Price (${currency}) *`}
                value={salePrice}
                onChangeText={(t) => {
                  setSalePrice(t);
                  if (errors.salePrice) setErrors((e) => ({ ...e, salePrice: "" }));
                }}
                keyboardType="numeric"
                placeholder="0.00"
                error={errors.salePrice}
              />
            </View>
          </View>

          {/* Real-time Profit Margin Indicator */}
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

          <View className="flex-row gap-3">
            <View className="flex-1">
              <TextField
                label="Opening Stock Qty"
                value={initialStock}
                onChangeText={setInitialStock}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>

            <View className="flex-1">
              <TextField
                label="Reorder Alert Level *"
                value={reorderLevel}
                onChangeText={setReorderLevel}
                keyboardType="numeric"
                placeholder="5"
              />
            </View>
          </View>
        </Card>

        {/* Action Buttons */}
        <View className="gap-2.5">
          <Button
            label="Save & Add to Catalog"
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
      </ScrollView>
    </Screen>
  );
}
