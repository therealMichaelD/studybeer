import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
    Extrapolation,
    interpolate,
    useAnimatedProps,
    useSharedValue,
    withSpring
} from "react-native-reanimated";
import Svg, { Circle, Defs, G, LinearGradient, Path, Stop } from "react-native-svg";

// 1. Create Animated Components for SVG elements
const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);

// Configuration for spring physics
const SPRING_CONFIG = { damping: 12, stiffness: 120 };

export default function TacoBuilder({ progress }: { progress: number }) {
  // Shared value to track smooth progress (0 to 1)
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    // Smoothly interpolate to the new progress value
    animatedProgress.value = withSpring(Math.min(Math.max(progress, 0), 1), SPRING_CONFIG);
  }, [progress]);

  // --- Animation Logic for Each Ingredient ---

  // 1. Shell: Always visible, but scales/breathes slightly at the start
  const shellStyle = useAnimatedProps(() => {
    const scale = interpolate(animatedProgress.value, [0, 0.2], [0.8, 1], Extrapolation.CLAMP);
    return {
      transform: [{ scale: scale }, { translateY: (1 - scale) * 100 }], // Pop up effect
      opacity: interpolate(animatedProgress.value, [0, 0.1], [0, 1]),
    };
  });

  // 2. Meat: Falls in between 20% and 40%
  const meatStyle = useAnimatedProps(() => {
    const drop = interpolate(animatedProgress.value, [0.1, 0.4], [-50, 0], Extrapolation.CLAMP);
    const opacity = interpolate(animatedProgress.value, [0.1, 0.3], [0, 1], Extrapolation.CLAMP);
    return {
      transform: [{ translateY: drop }],
      opacity: opacity,
    };
  });

  // 3. Lettuce: Sprinkles in between 40% and 65%
  const lettuceStyle = useAnimatedProps(() => {
    const drop = interpolate(animatedProgress.value, [0.4, 0.65], [-40, 0], Extrapolation.CLAMP);
    const opacity = interpolate(animatedProgress.value, [0.4, 0.6], [0, 1], Extrapolation.CLAMP);
    return {
      transform: [{ translateY: drop }],
      opacity: opacity,
    };
  });

  // 4. Cheese: Falls in between 50% and 75%
  const cheeseStyle = useAnimatedProps(() => {
    const drop = interpolate(animatedProgress.value, [0.5, 0.75], [-60, 0], Extrapolation.CLAMP);
    const opacity = interpolate(animatedProgress.value, [0.5, 0.7], [0, 1], Extrapolation.CLAMP);
    return {
      transform: [{ translateY: drop }],
      opacity: opacity,
    };
  });

  // 5. Tomatoes: The final touch between 75% and 100%
  const tomatoStyle = useAnimatedProps(() => {
    const drop = interpolate(animatedProgress.value, [0.75, 1], [-80, 0], Extrapolation.CLAMP);
    const opacity = interpolate(animatedProgress.value, [0.75, 0.9], [0, 1], Extrapolation.CLAMP);
    return {
      transform: [{ translateY: drop }],
      opacity: opacity,
    };
  });

  return (
    <View style={styles.container}>
      <Svg width={220} height={180} viewBox="0 0 220 180">
        <Defs>
            {/* Gradients make it look more realistic */}
            <LinearGradient id="shellGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#F4A460" stopOpacity="1" />
                <Stop offset="1" stopColor="#CD853F" stopOpacity="1" />
            </LinearGradient>
            <LinearGradient id="meatGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#8B4513" stopOpacity="1" />
                <Stop offset="1" stopColor="#5D4037" stopOpacity="1" />
            </LinearGradient>
        </Defs>

        {/* 1. The Taco Shell (Back half) */}
        <AnimatedG animatedProps={shellStyle} origin="110, 120">
             <Path 
                d="M 40 100 Q 110 170, 180 100 L 180 80 Q 110 150, 40 80 Z" 
                fill="url(#shellGrad)" 
                stroke="#A0522D" 
                strokeWidth="2"
            />
        </AnimatedG>

        {/* 2. The Meat (Layered inside) */}
        <AnimatedG animatedProps={meatStyle}>
            <Path 
                d="M 50 100 Q 65 115, 80 100 T 110 100 T 140 100 T 170 95 L 170 110 Q 110 150, 50 110 Z" 
                fill="url(#meatGrad)"
            />
            {/* Texture dots for meat */}
            <Circle cx="70" cy="110" r="3" fill="#3E2723" opacity="0.5"/>
            <Circle cx="100" cy="115" r="4" fill="#3E2723" opacity="0.5"/>
            <Circle cx="140" cy="108" r="3" fill="#3E2723" opacity="0.5"/>
        </AnimatedG>

        {/* 3. Lettuce (Jagged organic shapes) */}
        <AnimatedG animatedProps={lettuceStyle}>
            <Path d="M 55 95 L 65 85 L 75 95 L 85 80 L 95 95 L 105 85 L 115 95" stroke="#4CAF50" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M 100 95 L 110 80 L 120 95 L 130 85 L 140 95 L 150 85" stroke="#81C784" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </AnimatedG>

        {/* 4. Cheese (Yellow shreds) */}
        <AnimatedG animatedProps={cheeseStyle}>
            <Path d="M 60 90 L 70 95" stroke="#FFD700" strokeWidth="3" strokeLinecap="round" />
            <Path d="M 80 85 L 85 95" stroke="#FFD700" strokeWidth="3" strokeLinecap="round" />
            <Path d="M 120 85 L 115 95" stroke="#FFEB3B" strokeWidth="3" strokeLinecap="round" />
            <Path d="M 140 90 L 150 95" stroke="#FFD700" strokeWidth="3" strokeLinecap="round" />
            <Path d="M 95 80 L 105 90" stroke="#FFEB3B" strokeWidth="3" strokeLinecap="round" />
        </AnimatedG>

        {/* 5. Tomatoes (Juicy red circles) */}
        <AnimatedG animatedProps={tomatoStyle}>
            <Circle cx="75" cy="85" r="6" fill="#FF5252" stroke="#B71C1C" strokeWidth="1"/>
            <Circle cx="110" cy="75" r="7" fill="#FF5252" stroke="#B71C1C" strokeWidth="1"/>
            <Circle cx="145" cy="85" r="6" fill="#FF5252" stroke="#B71C1C" strokeWidth="1"/>
            {/* Highlight on tomato */}
            <Circle cx="77" cy="83" r="2" fill="white" opacity="0.4"/>
            <Circle cx="112" cy="73" r="2" fill="white" opacity="0.4"/>
        </AnimatedG>

        {/* 1. The Taco Shell (Front Lip - covers bottom of ingredients) */}
        <AnimatedG animatedProps={shellStyle} origin="110, 120">
             <Path 
                d="M 40 100 Q 110 170, 180 100" 
                fill="none" 
                stroke="#CD853F" 
                strokeWidth="4"
                strokeLinecap="round"
            />
        </AnimatedG>

      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    height: 200, // Explicit height to prevent layout jumps
  },
});