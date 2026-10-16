import React, { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TextField } from "@/components/ui/TextField";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ListRow } from "@/components/ui/ListRow";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { FilterBar } from "@/components/ui/FilterBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { useStaticData, type ScenarioPreset } from "@/staticData";

/**
 * Development-only Gallery component showcasing all design system tokens,
 * reusable primitives, and dynamic scenario preview switcher.
 */
export function DesignSystemGallery() {
  const { scenario, preset, setPreset } = useStaticData();
  const [testInput, setTestInput] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("cat-all");

  const scenarioPresetsList: { id: ScenarioPreset; label: string }[] = [
    { id: "happy", label: "Happy / Full" },
    { id: "low_stock", label: "Low Stock Alert" },
    { id: "empty", label: "Empty State" },
    { id: "error", label: "Error State" },
    { id: "offline", label: "Offline Mode" },
  ];

  return (
    <ScrollView className="flex-1 bg-[#F8FAFC]" contentContainerStyle={{ padding: 16 }}>
      {/* 1. Scenario Controller */}
      <Card className="mb-6 border-primary/30 bg-[#F0FDF4]">
        <Text className="font-poppins-bold text-[16px] text-primary mb-1">
          Scenario Switcher (M01-UI02 Foundation)
        </Text>
        <Text className="font-poppins-regular text-[12px] text-text-secondary mb-3">
          Active Scenario: <Text className="font-poppins-semibold text-primary uppercase">{preset}</Text> • Currency: {scenario.organization.currencySymbol}
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {scenarioPresetsList.map((item) => (
            <Button
              key={item.id}
              label={item.label}
              size="sm"
              variant={preset === item.id ? "primary" : "outline"}
              onPress={() => setPreset(item.id)}
            />
          ))}
        </View>
      </Card>

      {/* 2. Status Badges */}
      <SectionHeader title="Status Badges" subtitle="Semantic status indicators with WCAG AA compliance" />
      <Card className="mb-6 flex-row flex-wrap gap-2">
        <StatusBadge status="paid" label="Paid (পরিশোধিত)" />
        <StatusBadge status="due" label="Due (বাকি)" />
        <StatusBadge status="partial" label="Partial (আংশিক)" />
        <StatusBadge status="low_stock" label="Low Stock (স্বল্প স্টক)" />
        <StatusBadge status="active" label="Active" />
        <StatusBadge status="pending" label="Pending Sync" />
      </Card>

      {/* 3. Buttons Showcase */}
      <SectionHeader title="Buttons" subtitle="Standard sizes, icons, and variants" />
      <Card className="mb-6 gap-3">
        <Button
          label="Primary Action"
          size="lg"
          leftIcon={<Ionicons name="cart-outline" size={20} color="#FFFFFF" />}
          onPress={() => {}}
        />
        <Button
          label="Secondary Action"
          size="md"
          variant="secondary"
          onPress={() => {}}
        />
        <Button
          label="Outline with Icon"
          size="md"
          variant="outline"
          leftIcon={<Ionicons name="add-circle-outline" size={18} color={Colors.primary} />}
          onPress={() => {}}
        />
        <Button
          label="Destructive / Danger"
          size="sm"
          variant="danger"
          onPress={() => {}}
        />
        <Button label="Disabled State" disabled onPress={() => {}} />
      </Card>

      {/* 4. TextFields Showcase */}
      <SectionHeader title="Form Inputs" subtitle="Accessible inputs with prefixes, icons, and validation" />
      <Card className="mb-6">
        <TextField
          label="Product Sale Price"
          value={testInput}
          onChangeText={setTestInput}
          prefix="৳"
          placeholder="0.00"
          helperText="Standard retail price including VAT"
        />
        <TextField
          label="Search Product"
          value=""
          onChangeText={() => {}}
          placeholder="Search by name, SKU or scan barcode..."
          leftIcon={<Ionicons name="search-outline" size={18} color={Colors.textMuted} />}
        />
        <TextField
          label="Password Field"
          value="secret123"
          onChangeText={() => {}}
          secureTextEntry
        />
      </Card>

      {/* 5. Filter Chips */}
      <SectionHeader title="Filter Chips" subtitle="Horizontal category switcher" />
      <FilterBar
        items={scenario.categories.map((c) => ({
          id: c.id,
          label: c.name,
          count: c.productCount,
        }))}
        selectedId={selectedFilter}
        onSelect={setSelectedFilter}
        className="mb-4"
      />

      {/* 6. List Rows from Static Data */}
      <SectionHeader title="List Rows" subtitle="Displaying current scenario records" />
      <Card padding="none" className="mb-6 overflow-hidden">
        {scenario.products.slice(0, 3).map((product) => (
          <ListRow
            key={product.id}
            title={product.name}
            subtitle={`SKU: ${product.sku} • Stock: ${product.currentStock}`}
            amount={`৳${product.salePrice}`}
            amountColor={Colors.primary}
            badge={
              product.currentStock <= product.reorderLevel ? (
                <StatusBadge status="low_stock" size="sm" />
              ) : undefined
            }
            leftIcon={
              <View className="w-9 h-9 rounded-lg bg-[#F0FDF4] items-center justify-center">
                <Ionicons name="cube-outline" size={18} color={Colors.primary} />
              </View>
            }
            onPress={() => {}}
          />
        ))}
      </Card>

      {/* 7. Feedback States */}
      <SectionHeader title="System States" subtitle="Empty, error, and loading primitives" />
      <Card className="mb-6">
        {scenario.preset === "empty" ? (
          <EmptyState
            title="No Products Found"
            description="Your inventory is empty. Start by adding your first product to begin sales."
            actionLabel="Add Product"
            onActionPress={() => {}}
          />
        ) : scenario.preset === "error" ? (
          <ErrorState
            title="Connection Interrupted"
            message={scenario.errorMessage ?? "An unexpected error occurred."}
            onRetry={() => setPreset("happy")}
          />
        ) : (
          <LoadingState message="Demonstrating loading spinner..." size="small" />
        )}
      </Card>
    </ScrollView>
  );
}
