export const Colors = {
  primary: "#059669",
  primaryHover: "#047857",
  primaryLight: "#D1FAE5",
  secondary: "#34D399",
  tint: "#A7F3D0",
  dark: "#0F172A",
  surface: "#FFFFFF",

  // Typography tokens (WCAG AA Compliant on #FFFFFF)
  textPrimary: "#0F172A",      // 16.1:1 ratio
  textSecondary: "#475569",    // 5.8:1 ratio
  textMuted: "#64748B",        // 4.6:1 ratio
  textDisabled: "#94A3B8",
  textOnPrimary: "#FFFFFF",

  // Background and Surfaces
  surfaceApp: "#FFFFFF",
  surfaceCard: "#FFFFFF",
  surfaceMuted: "#F8FAFC",
  surfaceTint: "#F0FDF4",
  borderDefault: "#E2E8F0",
  borderLight: "#F1F5F9",
  borderFocus: "#059669",

  // Semantic Status Accents & Surfaces
  success: "#16A34A",
  successBg: "#F0FDF4",
  successBorder: "#BBF7D0",
  successText: "#15803D",

  error: "#DC2626",
  errorBg: "#FEF2F2",
  errorBorder: "#FECACA",
  errorText: "#B91C1C",

  warning: "#D97706",
  warningBg: "#FFFBEB",
  warningBorder: "#FDE68A",
  warningText: "#B45309",

  info: "#2563EB",
  infoBg: "#EFF6FF",
  infoBorder: "#BFDBFE",
  infoText: "#1D4ED8",

  // Baki / Credit tokens
  due: "#DC2626",
  dueBg: "#FEF2F2",
  paid: "#16A34A",
  paidBg: "#F0FDF4",
} as const;

export type ColorKey = keyof typeof Colors;
