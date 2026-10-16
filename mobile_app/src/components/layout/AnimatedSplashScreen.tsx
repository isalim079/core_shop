import React, { useEffect, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Colors } from "@/constants/colors";
import { APP_NAME } from "@/constants/app";

type AnimatedSplashScreenProps = {
  isAppReady: boolean;
  onAnimationFinish?: () => void;
};

export function AnimatedSplashScreen({
  isAppReady,
  onAnimationFinish,
}: AnimatedSplashScreenProps) {
  // Entrance values (initialized once with useState to satisfy React Compiler)
  const [logoScale] = useState(() => new Animated.Value(0.7));
  const [logoOpacity] = useState(() => new Animated.Value(0));
  const [pulseScale] = useState(() => new Animated.Value(1));
  const [pulseOpacity] = useState(() => new Animated.Value(0.5));

  const [textTranslateY] = useState(() => new Animated.Value(20));
  const [textOpacity] = useState(() => new Animated.Value(0));

  const [taglineOpacity] = useState(() => new Animated.Value(0));
  const [progressAnim] = useState(() => new Animated.Value(0));

  // Exit values
  const [exitOpacity] = useState(() => new Animated.Value(1));
  const [exitScale] = useState(() => new Animated.Value(1));

  useEffect(() => {
    // 1. Subtle expanding pulse loop behind the logo
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseScale, {
            toValue: 1.5,
            duration: 1800,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0,
            duration: 1800,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(pulseScale, {
          toValue: 1,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.timing(pulseOpacity, {
          toValue: 0.5,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    // 2. Entrance choreography
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 45,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();

    // 3. Brand Text Entrance
    Animated.sequence([
      Animated.delay(180),
      Animated.parallel([
        Animated.timing(textTranslateY, {
          toValue: 0,
          duration: 450,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
      ]),
      // 4. Tagline & Progress Bar
      Animated.parallel([
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
      ]),
    ]).start();

    return () => {
      pulseLoop.stop();
    };
  }, [logoScale, logoOpacity, pulseScale, pulseOpacity, textTranslateY, textOpacity, taglineOpacity, progressAnim]);

  // Handle smooth exit transition when app is ready
  useEffect(() => {
    if (!isAppReady) return;

    // Minimum delay so the user sees the beautiful splash entrance animation
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(exitScale, {
          toValue: 1.08,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(exitOpacity, {
          toValue: 0,
          duration: 420,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(() => {
        onAnimationFinish?.();
      });
    }, 1800);

    return () => clearTimeout(timer);
  }, [isAppReady, exitScale, exitOpacity, onAnimationFinish]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        styles.container,
        {
          opacity: exitOpacity,
          transform: [{ scale: exitScale }],
        },
      ]}
    >
      {/* Decorative ambient top glow */}
      <View style={styles.ambientGlow} />

      <View style={styles.centerContent}>
        {/* Animated pulse ring */}
        <Animated.View
          style={[
            styles.pulseRing,
            {
              transform: [{ scale: pulseScale }],
              opacity: pulseOpacity,
            },
          ]}
        />

        {/* Hero Logo Badge */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [{ scale: logoScale }],
              opacity: logoOpacity,
            },
          ]}
        >
          <Image
            source={require("@/../assets/images/cs-icon.png")}
            style={styles.logoImage}
            resizeMode="cover"
          />
        </Animated.View>

        {/* Brand Name */}
        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: textOpacity,
              transform: [{ translateY: textTranslateY }],
            },
          ]}
        >
          <View style={styles.titleRow}>
            <Text style={styles.titleText}>{APP_NAME}</Text>
            <View style={styles.titleDot} />
          </View>
        </Animated.View>

        {/* Tagline */}
        <Animated.View style={{ opacity: taglineOpacity, marginTop: 8 }}>
          <View style={styles.taglineBadge}>
            <Text style={styles.taglineText}>MODERN COMMERCE</Text>
          </View>
        </Animated.View>
      </View>

      {/* Bottom Progress Bar & Brand Footer */}
      <View style={styles.footerContainer}>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progressWidth,
              },
            ]}
          />
        </View>
        <Text style={styles.footerText}>Secure • Fast • Reliable</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    zIndex: 99999,
    justifyContent: "center",
    alignItems: "center",
  },
  ambientGlow: {
    position: "absolute",
    top: -120,
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: "#F0FDF4",
    opacity: 0.8,
  },
  centerContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  pulseRing: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 36,
    backgroundColor: Colors.surfaceTint,
  },
  logoContainer: {
    width: 88,
    height: 88,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 8,
    backgroundColor: Colors.primary,
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
  textContainer: {
    marginTop: 22,
    alignItems: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  titleText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 28,
    color: Colors.textPrimary,
    letterSpacing: -0.4,
  },
  titleDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.primary,
    marginLeft: 4,
    marginBottom: 2,
  },
  taglineBadge: {
    backgroundColor: Colors.surfaceTint,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  taglineText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 10,
    letterSpacing: 1.4,
    color: Colors.primary,
  },
  footerContainer: {
    position: "absolute",
    bottom: 50,
    alignItems: "center",
  },
  progressTrack: {
    width: 140,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#F3F4F6",
    overflow: "hidden",
    marginBottom: 12,
  },
  progressBar: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  footerText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 0.8,
  },
});
