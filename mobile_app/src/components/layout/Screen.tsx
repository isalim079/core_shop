import type { ReactNode } from "react";
import { ScrollView, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

type ScreenProps = {
  children: ReactNode;
  className?: string;
  keyboard?: boolean;
  scroll?: boolean;
  edges?: Edge[];
};

export function Screen({
  children,
  className,
  keyboard = false,
  scroll = false,
  edges = ["top", "left", "right"],
}: ScreenProps) {
  return (
    <SafeAreaView edges={edges} className={`flex-1 bg-surface-app ${className ?? ""}`}>
      {keyboard ? (
        <KeyboardAwareScrollView
          bottomOffset={20}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          {children}
        </KeyboardAwareScrollView>
      ) : scroll ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}
        >
          {children}
        </ScrollView>
      ) : (
        <View className="flex-1">{children}</View>
      )}
    </SafeAreaView>
  );
}
