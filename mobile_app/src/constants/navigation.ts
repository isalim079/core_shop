import type { ComponentProps } from "react";
import type { Stack } from "expo-router";
import { Colors } from "./colors";

type StackScreenProps = ComponentProps<typeof Stack>;
type StackScreenOptions = NonNullable<StackScreenProps["screenOptions"]>;

/**
 * Global smooth, professional screen transition presets.
 * Uses native slide animation with interactive swipe gestures and pure white background.
 */
export const defaultStackScreenOptions: StackScreenOptions = {
  headerShown: false,
  animation: "slide_from_right",
  animationDuration: 280,
  gestureEnabled: true,
  gestureDirection: "horizontal",
  animationTypeForReplace: "push",
  contentStyle: {
    backgroundColor: Colors.surfaceApp,
  },
};
