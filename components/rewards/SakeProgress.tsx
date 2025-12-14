import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
    Easing,
    interpolate,
    useAnimatedProps,
    useSharedValue,
    withRepeat,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import Svg, {
    ClipPath,
    Defs,
    G,
    LinearGradient,
    Path,
    Rect,
    Stop,
} from "react-native-svg";

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface Props {
  progress: number; // 0 to 1
}

// Bottle Dimensions
const VIEW_WIDTH = 200;
const VIEW_HEIGHT = 240;
const BOTTLE_MAX_WIDTH = 140;

export default function TokkuriProgress({ progress }: Props) {
  // --- Animation Values ---
  const fillLevel = useSharedValue(0);
  const wavePhase = useSharedValue(0);
  const sloshAmplitude = useSharedValue(0);

  // 1. Physics: Handle Fill & Slosh
  useEffect(() => {
    const target = Math.max(0, Math.min(progress, 1));

    // Fill animation
    fillLevel.value = withSpring(target, {
      damping: 15,
      stiffness: 80,
    });

    // Impact ripple when progress changes
    sloshAmplitude.value = withSpring(8, { damping: 5 }, () => {
      sloshAmplitude.value = withTiming(2, { duration: 1500 });
    });
  }, [progress]);

  // 2. Loop: Continuous Wave Motion
  useEffect(() => {
    wavePhase.value = withRepeat(
      withTiming(Math.PI * 2, {
        duration: 2500,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, []);

  // 3. Logic: Generate the Wave
  const liquidPathProps = useAnimatedProps(() => {
    // Map progress (0-1) to pixel height (Bottom: 220, Top: 40)
    // The bottle neck is at the top, body at bottom.
    const waterLevelY = interpolate(fillLevel.value, [0, 1], [220, 40]);
    
    const amplitude = sloshAmplitude.value;
    const frequency = 1.5;
    const phase = wavePhase.value;

    let d = `M 0 ${waterLevelY}`;
    
    // Draw wave across the entire view width to ensure it covers the wide body
    for (let x = 0; x <= VIEW_WIDTH; x += 10) {
      const y = waterLevelY + amplitude * Math.sin((x / VIEW_WIDTH) * Math.PI * frequency + phase);
      d += ` L ${x} ${y}`;
    }

    // Close the shape at the bottom
    d += ` L ${VIEW_WIDTH} ${VIEW_HEIGHT} L 0 ${VIEW_HEIGHT} Z`;

    return { d };
  });

  // --- Shapes ---

  // The Tokkuri Shape (Bulbous bottom, narrow neck, flared rim)
  // Constructed using Bezier curves
  const bottlePath = `
    M 70 30
    L 60 10  
    L 140 10 
    L 130 30 
    C 130 80, 150 100, 170 130 
    C 190 160, 180 230, 100 230 
    C 20 230, 10 160, 30 130 
    C 50 100, 70 80, 70 30 
    Z
  `;

  return (
    <View style={styles.container}>
      <Svg width={VIEW_WIDTH} height={VIEW_HEIGHT} viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}>
        <Defs>
          <ClipPath id="bottleClip">
            <Path d={bottlePath} />
          </ClipPath>

          {/* Liquid Gradient: Warm Amber/Gold (Aged Sake or Plum Wine) */}
          <LinearGradient id="goldLiquid" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FAD961" stopOpacity="0.9" />
            <Stop offset="0.5" stopColor="#F76B1C" stopOpacity="0.8" />
            <Stop offset="1" stopColor="#B84E14" stopOpacity="0.9" />
          </LinearGradient>

          {/* Glass Gradient: Cool Blue Tint */}
          <LinearGradient id="glassGradient" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#A1C4FD" stopOpacity="0.3" />
            <Stop offset="0.5" stopColor="#C2E9FB" stopOpacity="0.1" />
            <Stop offset="1" stopColor="#A1C4FD" stopOpacity="0.4" />
          </LinearGradient>
        </Defs>

        {/* 1. Back Glass Wall (Translucent) */}
        <Path d={bottlePath} fill="url(#glassGradient)" />

        {/* 2. The Liquid (Masked by Bottle Shape) */}
        <G clipPath="url(#bottleClip)">
            <AnimatedPath 
                animatedProps={liquidPathProps} 
                fill="url(#goldLiquid)" 
            />
        </G>

        {/* 3. Front Glass Glare & Reflections (Essential for "Glass" look) */}
        <G clipPath="url(#bottleClip)">
            {/* Left side highlight */}
            <Path 
                d="M 40 130 Q 30 180 50 210" 
                stroke="white" 
                strokeWidth="4" 
                strokeOpacity="0.4" 
                fill="none" 
            />
             {/* Neck highlight */}
            <Path 
                d="M 75 40 Q 75 60 60 80" 
                stroke="white" 
                strokeWidth="2" 
                strokeOpacity="0.3" 
                fill="none" 
            />
        </G>

        {/* 4. Bottle Outline (Stroke) */}
        <Path 
            d={bottlePath} 
            stroke="#5E83A8" 
            strokeWidth="3" 
            fill="none" 
        />

        {/* 5. Traditional Decoration: A Rope/Cord around the neck */}
        <Path 
            d="M 72 35 Q 100 45 128 35" 
            stroke="#8B4513" 
            strokeWidth="4" 
            fill="none"
        />
        {/* The Knot */}
        <Rect x="95" y="36" width="10" height="10" rx="2" fill="#8B4513" />

      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    height: 260,
    // Floor shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
});