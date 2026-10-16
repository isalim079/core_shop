import type { ReactNode } from "react";
import {
  ScrollView,
  View,
  type RefreshControlProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Colors } from "@/constants/colors";

type ScreenProps = {
  children: ReactNode;
  className?: string;
  keyboard?: boolean;
  scroll?: boolean;
  edges?: Edge[];
  header?: ReactNode;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  backgroundColor?: string;
  statusBarStyle?: "dark" | "light";
  contentContainerStyle?: StyleProp<ViewStyle>;
};

export function Screen({
  children,
  className,
  keyboard = false,
  scroll = false,
  edges = ["top", "left", "right"],
  header,
  refreshControl,
  backgroundColor = Colors.surfaceApp,
  statusBarStyle = "dark",
  contentContainerStyle,
}: ScreenProps) {
  return (
    <SafeAreaView
      edges={edges}
      className={`flex-1 ${className ?? ""}`}
      style={{ backgroundColor }}
    >
      <StatusBar style={statusBarStyle} />
      {header}
      {keyboard ? (
        <KeyboardAwareScrollView
          bottomOffset={24}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
          contentContainerStyle={[{ flexGrow: 1 }, contentContainerStyle]}
        >
          {children}
        </KeyboardAwareScrollView>
      ) : scroll ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
          contentContainerStyle={[{ flexGrow: 1, paddingBottom: 32 }, contentContainerStyle]}
        >
          {children}
        </ScrollView>
      ) : (
        <View className="flex-1" style={contentContainerStyle}>
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}
