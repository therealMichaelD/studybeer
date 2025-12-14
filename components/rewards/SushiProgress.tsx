import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
    useAnimatedProps,
    useSharedValue,
    withSpring
} from "react-native-reanimated";
import Svg, {
    Circle,
    ClipPath,
    Defs,
    G,
    Path,
    Rect
} from "react-native-svg";

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedG = Animated.createAnimatedComponent(G);

// Constants for sizing
const WIDTH = 300;
const HEIGHT = 100;
const PADDING = 20;

export default function SushiProgress({ progress }: { progress: number }) {
  // 1. Shared Values
  const revealWidth = useSharedValue(0);
  const chopstickPos = useSharedValue(0);

  // 2. Animation Logic
  useEffect(() => {
    // Clamp progress between 0 and 1
    const safeProgress = Math.min(Math.max(progress, 0), 1);
    
    // Animate the reveal mask
    revealWidth.value = withSpring(safeProgress * WIDTH, {
      damping: 18,
      stiffness: 90,
    });

    // Animate the chopsticks to follow the lead edge
    chopstickPos.value = withSpring(safeProgress * WIDTH, {
      damping: 20,
      stiffness: 80,
    });
  }, [progress]);

  // Props for the masking rectangle
  const clipProps = useAnimatedProps(() => ({
    width: revealWidth.value,
  }));

  // Props for the chopsticks movement
  const chopstickStyle = useAnimatedProps(() => ({
    transform: [{ translateX: chopstickPos.value }],
  }));

  return (
    <View style={styles.container}>
      <Svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        <Defs>
          <ClipPath id="sushiReveal">
            {/* The mask starts at x=0 and expands width based on progress */}
            <AnimatedRect x="0" y="0" height={HEIGHT} animatedProps={clipProps} />
          </ClipPath>
        </Defs>

        {/* --- LAYER 1: The Empty Wooden Board (Background) --- */}
        {/* Main Board */}
        <Rect
          x="10"
          y="20"
          width={WIDTH - 20}
          height="60"
          rx="10"
          fill="#C19A6B" // Light Wood
          stroke="#8B5A2B" // Dark Wood border
          strokeWidth="2"
        />
        {/* Wood Grain details */}
        <Path d="M 30 30 L 270 30" stroke="#A07850" strokeWidth="2" strokeOpacity="0.5" />
        <Path d="M 30 70 L 270 70" stroke="#A07850" strokeWidth="2" strokeOpacity="0.5" />
        
        {/* Legs of the board (Geta) */}
        <Rect x="30" y="20" width="10" height="60" fill="#8B5A2B" opacity="0.3" />
        <Rect x={WIDTH - 40} y="20" width="10" height="60" fill="#8B5A2B" opacity="0.3" />

        {/* --- LAYER 2: The Sushi (Revealed by ClipPath) --- */}
        <G clipPath="url(#sushiReveal)">
          {/* Sushi 1: Salmon Roll (Left) */}
          <SushiRoll x={50} y={50} fillingColor="#FF6B6B" /> 

          {/* Sushi 2: Tuna Roll (Center) */}
          <SushiRoll x={150} y={50} fillingColor="#D32F2F" />

          {/* Sushi 3: Cucumber Roll (Right) */}
          <SushiRoll x={250} y={50} fillingColor="#66BB6A" />
        </G>

        {/* --- LAYER 3: Chopsticks (The Indicator) --- */}
        <AnimatedG animatedProps={chopstickStyle}>
          {/* We offset X by -10 so the tips sit right on the progress line */}
          <G rotation="-15" x={-10} y={-20}>
            {/* Top Stick */}
            <Rect x="0" y="0" width="120" height="6" rx="3" fill="#EDD9A3" stroke="#C5A66F" />
            {/* Bottom Stick */}
            <Rect x="0" y="15" width="120" height="6" rx="3" fill="#EDD9A3" stroke="#C5A66F" />
            {/* Shadow for depth */}
            <Rect x="5" y="6" width="110" height="2" fill="black" opacity="0.1" />
          </G>
        </AnimatedG>
      </Svg>
    </View>
  );
}

// Helper Component for a single Realistic Roll
const SushiRoll = ({ x, y, fillingColor }: { x: number; y: number; fillingColor: string }) => {
  return (
    <G x={x} y={y}>
      {/* 1. Nori (Seaweed) - Outer dark ring */}
      <Circle cx="0" cy="0" r="28" fill="#2F3530" />
      
      {/* 2. Rice - White textured circle */}
      <Circle cx="0" cy="0" r="24" fill="#FDFDFD" stroke="#E0E0E0" strokeWidth="1" />
      
      {/* 3. Rice Texture (Grains) - Subtle dots */}
      <Circle cx="-10" cy="-10" r="2" fill="#EEE" />
      <Circle cx="12" cy="5" r="2" fill="#EEE" />
      <Circle cx="-5" cy="12" r="2" fill="#EEE" />

      {/* 4. Filling (The Ingredient) */}
      <Circle cx="0" cy="0" r="10" fill={fillingColor} />
      
      {/* 5. Highlight on Filling (Shine) */}
      <Circle cx="-3" cy="-3" r="3" fill="white" opacity="0.3" />
    </G>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
  },
});