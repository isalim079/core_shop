import { Dimensions, Platform } from "react-native";

interface KeyboardAvoidingConfig {
  behavior: "padding" | "height" | "position" | undefined;
  keyboardVerticalOffset: number;
  enabled: boolean;
}

export const useKeyboardAvoiding = (): KeyboardAvoidingConfig => {
  const { height: screenHeight, width: screenWidth } = Dimensions.get("window");
  const isSmallDevice = screenHeight < 700 || screenWidth < 400;
  const isVerySmallDevice = screenHeight < 600 || screenWidth < 350;

  if (Platform.OS === "ios") {
    return {
      behavior: "padding",
      keyboardVerticalOffset: isVerySmallDevice ? 30 : isSmallDevice ? 20 : 0,
      enabled: true,
    };
  }
  return {
    behavior: "height",
    keyboardVerticalOffset: isVerySmallDevice ? 60 : isSmallDevice ? 40 : 20,
    enabled: true,
  };
};

export const useModalKeyboardAvoiding = (): KeyboardAvoidingConfig => {
  const { height: screenHeight, width: screenWidth } = Dimensions.get("window");
  const isSmallDevice = screenHeight < 700 || screenWidth < 400;
  const isVerySmallDevice = screenHeight < 600 || screenWidth < 350;

  if (Platform.OS === "ios") {
    return {
      behavior: "padding",
      keyboardVerticalOffset: isVerySmallDevice ? 40 : isSmallDevice ? 30 : 0,
      enabled: true,
    };
  }
  return {
    behavior: "height",
    keyboardVerticalOffset: isVerySmallDevice ? 80 : isSmallDevice ? 60 : 40,
    enabled: true,
  };
};

export const useScrollKeyboardAvoiding = (): KeyboardAvoidingConfig => {
  const { height: screenHeight, width: screenWidth } = Dimensions.get("window");
  const isSmallDevice = screenHeight < 700 || screenWidth < 400;

  if (Platform.OS === "ios") {
    return {
      behavior: "padding",
      keyboardVerticalOffset: isSmallDevice ? 20 : 0,
      enabled: true,
    };
  }
  return {
    behavior: "height",
    keyboardVerticalOffset: isSmallDevice ? 30 : 20,
    enabled: true,
  };
};
