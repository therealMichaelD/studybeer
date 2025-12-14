import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

interface Props {
  progress: number; // 0 to 1
}

export default function GamingProgress({ progress }: Props) {
  // Animation Values
  const animatedWidth = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  
  // Track previous progress to detect "Level Up" or "Gain"
  const [isLevelUp, setIsLevelUp] = useState(false);

  useEffect(() => {
    // 1. Smooth Fill Animation (Spring physics for "weight")
    Animated.spring(animatedWidth, {
      toValue: Math.min(progress, 1),
      friction: 7,
      tension: 40,
      useNativeDriver: false, // Width cannot use native driver
    }).start();

    // 2. Check for Level Up (Full Bar)
    if (progress >= 1) {
      setIsLevelUp(true);
    } else {
      setIsLevelUp(false);
    }
  }, [progress]);

  useEffect(() => {
    // 3. Continuous Breathing/Pulse Effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 4. Shimmer/Glare Loop
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  // Interpolate Color based on Width (Red -> Yellow -> Green)
  const barColor = animatedWidth.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ["#FF3B30", "#FFD700", "#00FF00"], // Red, Gold, Green
  });

  // Interpolate Width %
  const widthInterpolate = animatedWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  // Moving shimmer transform
  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200], // Moves across the bar
  });

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: pulseAnim }] }]}>
      <Text style={styles.pixelText}>
        {isLevelUp ? "MAX LEVEL!" : "XP GAINED"}
      </Text>

      <View style={styles.barBorder}>
        {/* The Moving Fill */}
        <Animated.View
          style={[
            styles.barFill,
            {
              width: widthInterpolate,
              backgroundColor: barColor,
              // Add a glow shadow matching the current color
              shadowColor: barColor,
            },
          ]}
        >
          {/* Internal Stripes/Texture for realism */}
          <View style={styles.patternOverlay} />
          
          {/* The Leading Edge (Bright Tip) */}
          <View style={styles.leadingEdge} />
        </Animated.View>

        {/* Moving Glare/Reflection */}
        <Animated.View 
          style={[
            styles.glare, 
            { transform: [{ translateX: shimmerTranslate }] }
          ]} 
        />
      </View>

      <Text style={styles.pixelEmoji}>
        {isLevelUp ? "🏆" : "🎮"}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    height: 120,
    gap: 12,
  },
  pixelText: {
    color: "#FFD700", // Gold
    fontWeight: "800",
    fontSize: 12,
    letterSpacing: 4,
    fontFamily: "Courier", // Monospace adds to retro feel
    textShadowColor: "rgba(255, 215, 0, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  barBorder: {
    width: 240,
    height: 32,
    borderWidth: 4,
    borderColor: "#333", // Dark Grey border
    borderRadius: 6,
    backgroundColor: "#111", // Very dark background
    position: "relative",
    overflow: "hidden", // Keeps the glare inside
    // Retro Box Shadow
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 0,
  },
  barFill: {
    height: "100%",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8, // Glow effect
    position: 'relative',
  },
  leadingEdge: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#FFFFFF',
    opacity: 0.8,
  },
  patternOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
    // In a real app, use an image background or SVG here for diagonal stripes
    // For now, simple opacity change simulates texture
    borderRightWidth: 2,
    borderRightColor: 'rgba(0,0,0,0.2)',
  },
  glare: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    transform: [{ skewX: "-20deg" }], // Slanted light reflection
  },
  pixelEmoji: {
    fontSize: 40,
    marginTop: 4,
  },
});