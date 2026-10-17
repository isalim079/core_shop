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
import { useStaticData, type StaticProduct } from "@/staticData";

export default function SellScreen() {
  const { scenario } = useStaticData();
  const currency = scenario.organization.currencySymbol;
  const activeBranch = scenario.organization.branches[0]?.name ?? "Main Branch";

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [isCartModalVisible, setIsCartModalVisible] = useState(false);

  // Categories list
  const categoryOptions = [
    { id: "all", label: "All Items" },
    ...scenario.categories.map((c) => ({ id: c.id, label: c.name })),
  ];

  // Filter products by search and category
  const filteredProducts = scenario.products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchQuery));
    const matchesCat =
      selectedCategory === "all" || p.categoryId === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const addToCart = (product: StaticProduct) => {
    setCart((prev) => ({
      ...prev,
      [product.id]: (prev[product.id] ?? 0) + 1,
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => {
      const copy = { ...prev };
      if (copy[productId] > 1) {
        copy[productId] -= 1;
      } else {
        delete copy[productId];
      }
      return copy;
    });
  };

  const clearCart = () => {
    setCart({});
    setIsCartModalVisible(false);
  };

  const cartItemCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const cartSubtotal = Object.entries(cart).reduce((sum, [id, qty]) => {
    const prod = scenario.products.find((p) => p.id === id);
    return sum + (prod ? prod.salePrice * qty : 0);
  }, 0);

  const handleCheckoutSimulate = () => {
    Alert.alert(
      "Simulate Settlement",
      `Invoice Total: ${currency}${cartSubtotal.toLocaleString()}\nItems: ${cartItemCount}\n\nChoose payment method:`,
      [
        {
          text: "Cash (Paid)",
          onPress: () => {
            clearCart();
            Alert.alert("Success", "Cash sale finalized! Receipt #REC-9821 generated.");
          },
        },
        {
          text: "Baki (Customer Credit)",
          onPress: () => {
            clearCart();
            Alert.alert("Recorded", "Baki sale recorded to customer ledger account.");
          },
        },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  return (
    <Screen
      edges={["top", "left", "right"]}
      header={
        <AppHeader
          title="Sell (Point of Sale)"
          subtitle={`${activeBranch} • Counter POS`}
          rightElement={
            <TouchableOpacity
              onPress={() =>
                Alert.alert("Barcode Scanner", "Camera hardware barcode scanning mode ready.", [
                  { text: "OK" },
                ])
              }
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Barcode Scanner"
              className="w-10 h-10 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] items-center justify-center"
            >
              <Ionicons name="barcode-outline" size={20} color={Colors.primary} />
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
              placeholder="Search product, SKU, barcode..."
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

        {/* Category Horizontal Filter Bar */}
        <FilterBar
          items={categoryOptions}
          selectedId={selectedCategory}
          onSelect={setSelectedCategory}
        />

        {/* Product List */}
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: cartItemCount > 0 ? 100 : 32,
            gap: 8,
          }}
          ListEmptyComponent={
            <Card className="mt-4">
              <EmptyState
                title="No Products Found"
                description={`No items matched "${searchQuery}".`}
                actionLabel="Clear Filter"
                onAction={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
              />
            </Card>
          }
          renderItem={({ item }) => {
            const qtyInCart = cart[item.id] ?? 0;
            const isLowStock = item.currentStock <= item.reorderLevel;
            const unitName =
              scenario.units.find((u) => u.id === item.unitId)?.abbreviation ?? "pcs";

            return (
              <Card padding="md" className="flex-row items-center justify-between">
                <View className="flex-1 mr-3">
                  <View className="flex-row items-center gap-2 mb-1">
                    <Text className="font-poppins-semibold text-[14px] text-text-primary">
                      {item.name}
                    </Text>
                    {isLowStock && (
                      <StatusBadge status="warning" label="Low" size="sm" />
                    )}
                  </View>
                  <Text className="font-poppins-regular text-[12px] text-text-muted">
                    SKU: {item.sku} • Stock: {item.currentStock} {unitName}
                  </Text>
                  <Text className="font-poppins-bold text-[15px] text-primary mt-1">
                    {currency} {item.salePrice.toLocaleString()}{" "}
                    <Text className="font-poppins-regular text-[11px] text-text-muted">
                      / {unitName}
                    </Text>
                  </Text>
                </View>

                {qtyInCart > 0 ? (
                  <View className="flex-row items-center bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl px-2 py-1 gap-2">
                    <TouchableOpacity
                      onPress={() => removeFromCart(item.id)}
                      activeOpacity={0.7}
                      className="w-7 h-7 rounded-lg bg-white border border-[#CBD5E1] items-center justify-center"
                    >
                      <Ionicons name="remove" size={14} color={Colors.primary} />
                    </TouchableOpacity>
                    <Text className="font-poppins-bold text-[14px] text-primary min-w-[16px] text-center">
                      {qtyInCart}
                    </Text>
                    <TouchableOpacity
                      onPress={() => addToCart(item)}
                      activeOpacity={0.7}
                      className="w-7 h-7 rounded-lg bg-primary items-center justify-center"
                    >
                      <Ionicons name="add" size={14} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => addToCart(item)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`Add ${item.name} to cart`}
                    className="w-10 h-10 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] items-center justify-center"
                  >
                    <Ionicons name="add" size={20} color={Colors.primary} />
                  </TouchableOpacity>
                )}
              </Card>
            );
          }}
        />

        {/* Floating Cart Bottom Bar */}
        {cartItemCount > 0 && (
          <View className="absolute bottom-3 left-4 right-4 bg-primary rounded-2xl p-3 shadow-lg flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => setIsCartModalVisible(true)}
              activeOpacity={0.8}
              className="flex-row items-center gap-3 flex-1"
            >
              <View className="w-10 h-10 rounded-xl bg-white/20 items-center justify-center">
                <Ionicons name="cart" size={20} color="#FFFFFF" />
              </View>
              <View>
                <Text className="font-poppins-bold text-[16px] text-white">
                  {currency} {cartSubtotal.toLocaleString()}
                </Text>
                <Text className="font-poppins-medium text-[11px] text-white/80">
                  {cartItemCount} {cartItemCount === 1 ? "item" : "items"} in cart
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsCartModalVisible(true)}
              activeOpacity={0.8}
              className="bg-white rounded-xl px-4 py-2 flex-row items-center gap-1.5"
            >
              <Text className="font-poppins-semibold text-[13px] text-primary">
                Review Cart
              </Text>
              <Ionicons name="arrow-forward" size={14} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Cart Review Sheet / Modal */}
        <Modal
          visible={isCartModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setIsCartModalVisible(false)}
        >
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl max-h-[80%] p-5 pb-8">
              <View className="flex-row items-center justify-between pb-3 border-b border-[#E2E8F0] mb-3">
                <View>
                  <Text className="font-poppins-bold text-[18px] text-text-primary">
                    Current Sale Cart
                  </Text>
                  <Text className="font-poppins-regular text-[12px] text-text-muted">
                    {cartItemCount} items selected
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setIsCartModalVisible(false)}
                  className="w-8 h-8 rounded-full bg-[#F1F5F9] items-center justify-center"
                >
                  <Ionicons name="close" size={18} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView className="max-h-60 mb-4">
                {Object.entries(cart).map(([id, qty]) => {
                  const prod = scenario.products.find((p) => p.id === id);
                  if (!prod) return null;

                  return (
                    <View
                      key={id}
                      className="flex-row items-center justify-between py-2.5 border-b border-[#F1F5F9]"
                    >
                      <View className="flex-1 mr-2">
                        <Text className="font-poppins-medium text-[13px] text-text-primary">
                          {prod.name}
                        </Text>
                        <Text className="font-poppins-regular text-[11px] text-text-muted">
                          {currency} {prod.salePrice} x {qty} = {currency}{" "}
                          {(prod.salePrice * qty).toLocaleString()}
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-2">
                        <TouchableOpacity
                          onPress={() => removeFromCart(id)}
                          className="w-7 h-7 rounded-md bg-[#F1F5F9] items-center justify-center"
                        >
                          <Ionicons name="remove" size={14} color={Colors.textPrimary} />
                        </TouchableOpacity>
                        <Text className="font-poppins-semibold text-[13px] text-text-primary min-w-[14px] text-center">
                          {qty}
                        </Text>
                        <TouchableOpacity
                          onPress={() => addToCart(prod)}
                          className="w-7 h-7 rounded-md bg-primary items-center justify-center"
                        >
                          <Ionicons name="add" size={14} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>

              {/* Total & Checkout */}
              <View className="bg-[#F8FAFC] rounded-xl p-3 border border-[#E2E8F0] mb-4">
                <View className="flex-row justify-between mb-1">
                  <Text className="font-poppins-regular text-[12px] text-text-secondary">
                    Subtotal
                  </Text>
                  <Text className="font-poppins-medium text-[12px] text-text-primary">
                    {currency} {cartSubtotal.toLocaleString()}
                  </Text>
                </View>
                <View className="flex-row justify-between mb-1">
                  <Text className="font-poppins-regular text-[12px] text-text-secondary">
                    Estimated Tax (0%)
                  </Text>
                  <Text className="font-poppins-medium text-[12px] text-text-primary">
                    {currency} 0
                  </Text>
                </View>
                <View className="h-px bg-[#CBD5E1] my-1" />
                <View className="flex-row justify-between">
                  <Text className="font-poppins-bold text-[14px] text-text-primary">
                    Payable Total
                  </Text>
                  <Text className="font-poppins-bold text-[16px] text-primary">
                    {currency} {cartSubtotal.toLocaleString()}
                  </Text>
                </View>
              </View>

              <View className="flex-row gap-2">
                <Button
                  label="Clear"
                  variant="outline"
                  size="md"
                  className="flex-1"
                  onPress={clearCart}
                />
                <Button
                  label="Proceed to Settle"
                  variant="primary"
                  size="md"
                  className="flex-[2]"
                  onPress={handleCheckoutSimulate}
                />
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Screen>
  );
}
