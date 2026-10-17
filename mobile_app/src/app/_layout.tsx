import "../global.css";
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Appearance } from "react-native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { Provider } from "react-redux";
import { useFonts } from "expo-font";
import {
  Poppins_300Light,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { store } from "@/store/store";
import { Colors } from "@/constants/colors";
import { defaultStackScreenOptions } from "@/constants/navigation";
import { AnimatedSplashScreen } from "@/components/layout/AnimatedSplashScreen";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { hydrateAuth, readPersistedAuth, selectIsHydrated } from "@/store/features/auth/auth.slice";

import { StaticDataProvider } from "@/staticData";

SplashScreen.preventAutoHideAsync();

function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider preload={false}>
        <Provider store={store}>
          <StaticDataProvider>{children}</StaticDataProvider>
        </Provider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

function RootLayoutNav() {
  const dispatch = useAppDispatch();
  const isHydrated = useAppSelector(selectIsHydrated);
  const [fontsLoaded, fontError] = useFonts({
    Poppins_300Light,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    Appearance.setColorScheme?.("light");
    SystemUI.setBackgroundColorAsync("#FFFFFF").catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;
    readPersistedAuth().then((session) => {
      if (!active) return;
      dispatch(hydrateAuth(session));
    });
    return () => {
      active = false;
    };
  }, [dispatch]);

  const [splashAnimationDone, setSplashAnimationDone] = useState(false);
  const isAppReady = Boolean((fontsLoaded || fontError) && isHydrated);

  useEffect(() => {
    if (isAppReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isAppReady]);

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <StatusBar style="dark" />
      {isAppReady ? (
        <Stack screenOptions={defaultStackScreenOptions}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="(private)" />
          <Stack.Screen name="+not-found" />
        </Stack>
      ) : (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" }}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      )}
      {!splashAnimationDone ? (
        <AnimatedSplashScreen
          isAppReady={isAppReady}
          onAnimationFinish={() => setSplashAnimationDone(true)}
        />
      ) : null}
    </View>
  );
}

export default function RootLayout() {
  return (
    <AppProviders>
      <RootLayoutNav />
    </AppProviders>
  );
}
