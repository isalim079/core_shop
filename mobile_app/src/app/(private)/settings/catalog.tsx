import React, { useState } from "react";
import { Alert, FlatList, Modal, Text, TextInput, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { Screen } from "@/components/layout/Screen";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ListRow } from "@/components/ui/ListRow";
import { useStaticData, type StaticBrand, type StaticCategory, type StaticUnit } from "@/staticData";

type TaxonomyTab = "categories" | "brands" | "units";

export default function CatalogSettingsScreen() {
  const { scenario } = useStaticData();

  const [activeTab, setActiveTab] = useState<TaxonomyTab>("categories");
  const [categories, setCategories] = useState<StaticCategory[]>(scenario.categories);
  const [brands, setBrands] = useState<StaticBrand[]>(scenario.brands);
  const [units, setUnits] = useState<StaticUnit[]>(scenario.units);

  // Add modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemExtra, setNewItemExtra] = useState("");

  const handleOpenAddModal = () => {
    setNewItemName("");
    setNewItemExtra("");
    setIsModalOpen(true);
  };

  const handleAddItem = () => {
    if (!newItemName.trim()) {
      Alert.alert("Error", "Please enter a name.");
      return;
    }

    if (activeTab === "categories") {
      const newCat: StaticCategory = {
        id: `cat-${Date.now()}`,
        name: newItemName.trim(),
        nameBn: newItemExtra.trim() || undefined,
        productCount: 0,
        icon: "folder-outline",
      };
      setCategories((prev) => [...prev, newCat]);
    } else if (activeTab === "brands") {
      const newBrand: StaticBrand = {
        id: `brand-${Date.now()}`,
        name: newItemName.trim(),
      };
      setBrands((prev) => [...prev, newBrand]);
    } else {
      const newUnit: StaticUnit = {
        id: `unit-${Date.now()}`,
        name: newItemName.trim(),
        abbreviation: newItemExtra.trim() || newItemName.toLowerCase().slice(0, 3),
      };
      setUnits((prev) => [...prev, newUnit]);
    }

    setIsModalOpen(false);
    Alert.alert("Success", `${activeTab.slice(0, -1)} added successfully.`);
  };

  return (
    <Screen
      edges={["top", "left", "right"]}
      header={
        <AppHeader
          title="Catalog Management"
          subtitle="Taxonomy, Brands & Units"
          canGoBack
          onBackPress={() => router.back()}
          rightElement={
            <Button
              label="+ Add"
              size="sm"
              variant="primary"
              className="px-3 py-1.5"
              onPress={handleOpenAddModal}
            />
          }
        />
      }
    >
      <View className="flex-1">
        {/* Segmented Filter Bar */}
        <View className="px-4 pt-3 pb-2 flex-row gap-2">
          {(
            [
              { id: "categories", label: `Categories (${categories.length})` },
              { id: "brands", label: `Brands (${brands.length})` },
              { id: "units", label: `Units (${units.length})` },
            ] as const
          ).map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.7}
              className={`flex-1 py-2 rounded-xl items-center border ${
                activeTab === tab.id
                  ? "bg-primary border-primary"
                  : "bg-white border-[#CBD5E1]"
              }`}
            >
              <Text
                className={`font-poppins-semibold text-[11px] ${
                  activeTab === tab.id ? "text-white" : "text-text-secondary"
                }`}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content Lists */}
        <View className="flex-1 px-4 pt-2">
          {activeTab === "categories" && (
            <FlatList
              data={categories}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: 32, gap: 8 }}
              renderItem={({ item }) => (
                <Card padding="none" className="overflow-hidden">
                  <ListRow
                    title={item.name}
                    subtitle={item.nameBn ? `বাংলা: ${item.nameBn}` : "Standard Category"}
                    caption={`Assigned Products: ${item.productCount}`}
                    leftIcon={
                      <View className="w-10 h-10 rounded-full bg-[#ECFDF5] items-center justify-center">
                        <Ionicons
                          name={(item.icon as keyof typeof Ionicons.glyphMap) ?? "folder-outline"}
                          size={18}
                          color={Colors.primary}
                        />
                      </View>
                    }
                    showChevron={false}
                  />
                </Card>
              )}
            />
          )}

          {activeTab === "brands" && (
            <FlatList
              data={brands}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: 32, gap: 8 }}
              renderItem={({ item }) => (
                <Card padding="none" className="overflow-hidden">
                  <ListRow
                    title={item.name}
                    subtitle="Registered Brand Manufacturer"
                    leftIcon={
                      <View className="w-10 h-10 rounded-full bg-[#F1F5F9] items-center justify-center">
                        <Ionicons name="pricetag-outline" size={18} color={Colors.textSecondary} />
                      </View>
                    }
                    showChevron={false}
                  />
                </Card>
              )}
            />
          )}

          {activeTab === "units" && (
            <FlatList
              data={units}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: 32, gap: 8 }}
              renderItem={({ item }) => (
                <Card padding="none" className="overflow-hidden">
                  <ListRow
                    title={`${item.name} (${item.abbreviation})`}
                    subtitle="Measurement unit for inventory count"
                    leftIcon={
                      <View className="w-10 h-10 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] items-center justify-center">
                        <Ionicons name="scale-outline" size={18} color={Colors.textSecondary} />
                      </View>
                    }
                    showChevron={false}
                  />
                </Card>
              )}
            />
          )}
        </View>

        {/* Add Modal */}
        <Modal
          visible={isModalOpen}
          animationType="slide"
          transparent
          onRequestClose={() => setIsModalOpen(false)}
        >
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl p-5 pb-8">
              <View className="flex-row items-center justify-between pb-3 border-b border-[#E2E8F0] mb-4">
                <Text className="font-poppins-bold text-[18px] text-text-primary capitalize">
                  Add {activeTab.slice(0, -1)}
                </Text>
                <TouchableOpacity
                  onPress={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-[#F1F5F9] items-center justify-center"
                >
                  <Ionicons name="close" size={18} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <Text className="font-poppins-medium text-[12px] text-text-secondary mb-1">
                Name (English) *
              </Text>
              <TextInput
                value={newItemName}
                onChangeText={setNewItemName}
                placeholder={`e.g. ${activeTab === "categories" ? "Snacks" : activeTab === "brands" ? "Nestle" : "Gram"}`}
                placeholderTextColor={Colors.textMuted}
                className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 h-12 font-poppins-regular text-[14px] text-text-primary mb-3"
              />

              {activeTab === "categories" && (
                <>
                  <Text className="font-poppins-medium text-[12px] text-text-secondary mb-1">
                    Name (বাংলা / Bangla)
                  </Text>
                  <TextInput
                    value={newItemExtra}
                    onChangeText={setNewItemExtra}
                    placeholder="যেমন: স্ন্যাকস"
                    placeholderTextColor={Colors.textMuted}
                    className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 h-12 font-poppins-regular text-[14px] text-text-primary mb-4"
                  />
                </>
              )}

              {activeTab === "units" && (
                <>
                  <Text className="font-poppins-medium text-[12px] text-text-secondary mb-1">
                    Abbreviation / Symbol *
                  </Text>
                  <TextInput
                    value={newItemExtra}
                    onChangeText={setNewItemExtra}
                    placeholder="e.g. gm"
                    placeholderTextColor={Colors.textMuted}
                    className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 h-12 font-poppins-regular text-[14px] text-text-primary mb-4"
                  />
                </>
              )}

              <View className="flex-row gap-2 mt-2">
                <Button
                  label="Cancel"
                  variant="outline"
                  size="md"
                  className="flex-1"
                  onPress={() => setIsModalOpen(false)}
                />
                <Button
                  label="Save"
                  variant="primary"
                  size="md"
                  className="flex-[2]"
                  onPress={handleAddItem}
                />
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Screen>
  );
}
