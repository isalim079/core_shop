export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 48,
  screenPadding: 20,
  sectionGap: 24,
  cardPadding: 16,
  cardPaddingLarge: 20,
  bottomNavHeight: 64,
} as const;

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  full: 9999,
} as const;

export const FontSize = {
  display: 32,
  h1: 26,
  h2: 22,
  h3: 18,
  h4: 16,
  bodyLarge: 16,
  body: 14,
  bodySmall: 13,
  caption: 12,
  overline: 11,
  buttonLarge: 15,
  buttonSmall: 13,
} as const;

export const FontWeight = {
  light: "300",
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
} as const;

export const IconSize = {
  xs: 14,
  sm: 18,
  md: 20,
  lg: 24,
  xl: 28,
  "2xl": 36,
} as const;

export const HitSlop = {
  sm: { top: 8, bottom: 8, left: 8, right: 8 },
  md: { top: 12, bottom: 12, left: 12, right: 12 },
  lg: { top: 16, bottom: 16, left: 16, right: 16 },
} as const;

export const MinTouchTarget = 44;

export const Motion = {
  duration: {
    instant: 0,
    fast: 150,
    normal: 250,
    slow: 400,
    modal: 300,
  },
  spring: {
    bouncy: { tension: 65, friction: 6 },
    gentle: { tension: 40, friction: 7 },
    stiff: { tension: 120, friction: 14 },
  },
  scale: {
    pressed: 0.97,
    active: 1.0,
    hover: 1.02,
  },
} as const;

export const Elevation = {
  none: {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;
