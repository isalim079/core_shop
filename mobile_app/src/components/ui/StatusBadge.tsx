import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export type BadgeStatus =
  | "paid"
  | "due"
  | "partial"
  | "low_stock"
  | "warning"
  | "danger"
  | "active"
  | "pending"
  | "cancelled";

type StatusBadgeProps = {
  status: BadgeStatus;
  label?: string;
  size?: "sm" | "md";
  className?: string;
};

type StatusConfig = {
  defaultLabel: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
};

const statusConfigs: Record<BadgeStatus, StatusConfig> = {
  paid: {
    defaultLabel: "Paid",
    bgClass: "bg-[#F0FDF4]",
    borderClass: "border-[#BBF7D0]",
    textClass: "text-[#15803D]",
    iconName: "checkmark-circle",
    iconColor: "#16A34A",
  },
  due: {
    defaultLabel: "Due",
    bgClass: "bg-[#FEF2F2]",
    borderClass: "border-[#FECACA]",
    textClass: "text-[#B91C1C]",
    iconName: "alert-circle",
    iconColor: "#DC2626",
  },
  partial: {
    defaultLabel: "Partial",
    bgClass: "bg-[#FFFBEB]",
    borderClass: "border-[#FDE68A]",
    textClass: "text-[#B45309]",
    iconName: "time",
    iconColor: "#D97706",
  },
  low_stock: {
    defaultLabel: "Low Stock",
    bgClass: "bg-[#FFFBEB]",
    borderClass: "border-[#FDE68A]",
    textClass: "text-[#B45309]",
    iconName: "warning",
    iconColor: "#D97706",
  },
  warning: {
    defaultLabel: "Warning",
    bgClass: "bg-[#FFFBEB]",
    borderClass: "border-[#FDE68A]",
    textClass: "text-[#B45309]",
    iconName: "warning",
    iconColor: "#D97706",
  },
  danger: {
    defaultLabel: "Danger",
    bgClass: "bg-[#FEF2F2]",
    borderClass: "border-[#FECACA]",
    textClass: "text-[#B91C1C]",
    iconName: "alert-circle",
    iconColor: "#DC2626",
  },
  active: {
    defaultLabel: "Active",
    bgClass: "bg-[#EFF6FF]",
    borderClass: "border-[#BFDBFE]",
    textClass: "text-[#1D4ED8]",
    iconName: "radio-button-on",
    iconColor: "#2563EB",
  },
  pending: {
    defaultLabel: "Pending",
    bgClass: "bg-[#F8FAFC]",
    borderClass: "border-[#E2E8F0]",
    textClass: "text-[#475569]",
    iconName: "sync-outline",
    iconColor: "#64748B",
  },
  cancelled: {
    defaultLabel: "Cancelled",
    bgClass: "bg-[#F1F5F9]",
    borderClass: "border-[#CBD5E1]",
    textClass: "text-[#64748B]",
    iconName: "close-circle",
    iconColor: "#64748B",
  },
};

export function StatusBadge({
  status,
  label,
  size = "md",
  className = "",
}: StatusBadgeProps) {
  const config = statusConfigs[status] ?? statusConfigs.pending;
  const isSmall = size === "sm";

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={`Status: ${label ?? config.defaultLabel}`}
      className={`flex-row items-center self-start border rounded-full ${config.bgClass} ${config.borderClass} ${
        isSmall ? "px-2 py-0.5" : "px-2.5 py-1"
      } ${className}`}
    >
      <Ionicons
        name={config.iconName}
        size={isSmall ? 11 : 13}
        color={config.iconColor}
        style={{ marginRight: 4 }}
      />
      <Text
        className={`font-poppins-medium ${
          isSmall ? "text-[11px] leading-[15px]" : "text-[12px] leading-[17px]"
        } ${config.textClass}`}
      >
        {label ?? config.defaultLabel}
      </Text>
    </View>
  );
}
