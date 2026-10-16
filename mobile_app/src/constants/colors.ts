export const Colors = {
  primary: "#059669",
  primaryHover: "#047857",
  secondary: "#34D399",
  tint: "#A7F3D0",
  dark: "#1C2D24",
  surface: "#F0FFF4",

  textPrimary: "#1C2D24",
  textSecondary: "#4B5563",
  textMuted: "#9CA3AF",
  textDisabled: "#D1D5DB",
  textOnPrimary: "#FFFFFF",

  surfaceApp: "#F0FFF4",
  surfaceCard: "#FFFFFF",
  surfaceTint: "#D1FAE5",
  borderDefault: "#D1FAE5",
  borderFocus: "#059669",

  success: "#059669",
  error: "#EF4444",
  warning: "#F59E0B",
  info: "#3B82F6",
} as const;

export type ColorKey = keyof typeof Colors;
