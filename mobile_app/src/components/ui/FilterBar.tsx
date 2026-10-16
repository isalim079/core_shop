import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";

export type FilterChipItem = {
  id: string;
  label: string;
  count?: number;
  icon?: keyof typeof Ionicons.glyphMap;
};

type FilterBarProps = {
  items: FilterChipItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  className?: string;
};

export function FilterBar({
  items,
  selectedId,
  onSelect,
  className = "",
}: FilterBarProps) {
  return (
    <View className={`py-2 ${className}`}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {items.map((item) => {
          const isSelected = item.id === selectedId;
          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => onSelect(item.id)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: isSelected }}
              className={`flex-row items-center rounded-full px-3.5 py-1.5 mr-2 border ${
                isSelected
                  ? "bg-primary border-primary"
                  : "bg-white border-[#E2E8F0]"
              }`}
            >
              {item.icon ? (
                <Ionicons
                  name={item.icon}
                  size={14}
                  color={isSelected ? "#FFFFFF" : Colors.textSecondary}
                  style={{ marginRight: 5 }}
                />
              ) : null}
              <Text
                className={`font-poppins-medium text-[13px] ${
                  isSelected ? "text-white" : "text-text-secondary"
                }`}
              >
                {item.label}
              </Text>
              {typeof item.count === "number" ? (
                <View
                  className={`ml-1.5 px-1.5 py-0.2 rounded-full ${
                    isSelected ? "bg-white/20" : "bg-[#F1F5F9]"
                  }`}
                >
                  <Text
                    className={`font-poppins-semibold text-[11px] ${
                      isSelected ? "text-white" : "text-text-muted"
                    }`}
                  >
                    {item.count}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
