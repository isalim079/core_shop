import React, { useRef, useState } from "react";
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { Card } from "@/components/ui/Card";

export type InsightItem = {
  id: string;
  tag: string;
  tagVariant?: "neutral" | "success" | "warning" | "danger" | "info";
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  actionLabel: string;
  onAction: () => void;
};

type InsightSliderProps = {
  items: InsightItem[];
  className?: string;
};

const tagStyles: Record<
  NonNullable<InsightItem["tagVariant"]>,
  { bg: string; text: string; border: string }
> = {
  neutral: { bg: "#F1F5F9", text: "#475569", border: "#E2E8F0" },
  success: { bg: "#ECFDF5", text: "#065F46", border: "#A7F3D0" },
  warning: { bg: "#FFFBEB", text: "#92400E", border: "#FDE68A" },
  danger: { bg: "#FEF2F2", text: "#991B1B", border: "#FECACA" },
  info: { bg: "#EFF6FF", text: "#1E40AF", border: "#BFDBFE" },
};

export function InsightSlider({ items, className = "" }: InsightSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const { width } = useWindowDimensions();

  // Width of each slide card (padding 16px on each side = 32px off screen width)
  const cardWidth = Math.max(280, width - 32);

  if (!items || items.length === 0) {
    return null;
  }

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (cardWidth + 12));
    if (index >= 0 && index < items.length && index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  const navigateTo = (index: number) => {
    if (index >= 0 && index < items.length) {
      flatListRef.current?.scrollToIndex({ index, animated: true });
      setActiveIndex(index);
    }
  };

  return (
    <View className={`my-2 ${className}`}>
      {/* Header controls: Counter + explicit previous/next buttons */}
      <View className="px-4 pb-2 flex-row items-center justify-between">
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="sparkles" size={14} color={Colors.primary} />
          <Text className="font-poppins-semibold text-[12px] text-text-secondary uppercase tracking-wider">
            Daily Insights
          </Text>
        </View>

        {/* Position counter & Explicit accessible controls (no-swipe-required) */}
        <View className="flex-row items-center gap-2">
          <Text className="font-poppins-medium text-[11px] text-text-muted">
            {activeIndex + 1} of {items.length}
          </Text>
          <View className="flex-row items-center gap-1">
            <TouchableOpacity
              onPress={() => navigateTo(activeIndex - 1)}
              disabled={activeIndex === 0}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Previous insight"
              className={`w-7 h-7 rounded-full items-center justify-center border ${
                activeIndex === 0
                  ? "border-[#E2E8F0] bg-[#F8FAFC] opacity-40"
                  : "border-[#CBD5E1] bg-white"
              }`}
            >
              <Ionicons
                name="chevron-back"
                size={14}
                color={activeIndex === 0 ? Colors.textMuted : Colors.textPrimary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigateTo(activeIndex + 1)}
              disabled={activeIndex === items.length - 1}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Next insight"
              className={`w-7 h-7 rounded-full items-center justify-center border ${
                activeIndex === items.length - 1
                  ? "border-[#E2E8F0] bg-[#F8FAFC] opacity-40"
                  : "border-[#CBD5E1] bg-white"
              }`}
            >
              <Ionicons
                name="chevron-forward"
                size={14}
                color={
                  activeIndex === items.length - 1
                    ? Colors.textMuted
                    : Colors.textPrimary
                }
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Horizontal Carousel */}
      <FlatList
        ref={flatListRef}
        data={items}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardWidth + 12}
        decelerationRate="fast"
        onMomentumScrollEnd={handleScroll}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const variant = (item.tagVariant || "neutral") as keyof typeof tagStyles;
          const tagTheme = tagStyles[variant] || tagStyles.neutral;

          return (
            <View style={{ width: cardWidth }}>
              <Card padding="md" className="border border-[#E2E8F0]">
                <View className="flex-row items-start justify-between mb-2">
                  <View
                    style={{
                      backgroundColor: tagTheme.bg,
                      borderColor: tagTheme.border,
                      borderWidth: 1,
                    }}
                    className="px-2 py-0.5 rounded-full"
                  >
                    <Text
                      style={{ color: tagTheme.text }}
                      className="font-poppins-semibold text-[10px] uppercase tracking-wider"
                    >
                      {item.tag}
                    </Text>
                  </View>

                  <View className="w-8 h-8 rounded-full bg-[#F8FAFC] items-center justify-center border border-[#E2E8F0]">
                    <Ionicons
                      name={item.icon}
                      size={16}
                      color={item.iconColor ?? Colors.primary}
                    />
                  </View>
                </View>

                <Text className="font-poppins-bold text-[14px] text-text-primary mb-0.5">
                  {item.title}
                </Text>
                <Text
                  numberOfLines={2}
                  className="font-poppins-regular text-[12px] text-text-secondary mb-3 leading-[18px]"
                >
                  {item.description}
                </Text>

                <View className="flex-row justify-end">
                  <TouchableOpacity
                    onPress={item.onAction}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={item.actionLabel}
                    className="flex-row items-center gap-1 px-3 py-1.5 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0]"
                  >
                    <Text className="font-poppins-semibold text-[12px] text-primary">
                      {item.actionLabel}
                    </Text>
                    <Ionicons name="arrow-forward" size={13} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
              </Card>
            </View>
          );
        }}
      />

      {/* Accessible Pagination Dot Indicators */}
      <View className="flex-row items-center justify-center gap-1.5 pt-2">
        {items.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => navigateTo(index)}
            accessibilityRole="button"
            accessibilityLabel={`Go to slide ${index + 1}`}
            activeOpacity={0.7}
            className={`h-1.5 rounded-full transition-all ${
              activeIndex === index ? "w-5 bg-primary" : "w-1.5 bg-[#CBD5E1]"
            }`}
          />
        ))}
      </View>
    </View>
  );
}
