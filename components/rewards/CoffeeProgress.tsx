import React, { useEffect } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated, {
    Easing,
    Extrapolation,
    interpolate,
    useAnimatedProps,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSequence,
    withSpring,
    withTiming
} from "react-native-reanimated";
import Svg, {
    ClipPath,
    Defs,
    Ellipse,
    G,
    LinearGradient,
    Path,
    Rect,
    Stop
} from "react-native-svg";

const { width } = Dimensions.get("window");

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedG = Animated.createAnimatedComponent(G);

// --- Configuration ---
const MUG_WIDTH = 140;
const MUG_HEIGHT = 160;
const LIQUID_MAX_HEIGHT = 120; // Maximum fill height visually
const LIQUID_BASE_Y = 145; // The Y coordinate where the liquid starts (bottom)

// --- Steam Particle Component ---
const SteamParticle = ({ index }: { index: number }) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);

  useEffect(() => {
    const delay = index * 400;
    
    // Continuous loop of rising steam
    const float = () => {
      opacity.value = withSequence(
        withDelay(delay, withTiming(0.4, { duration: 1000 })), // Fade in
        withTiming(0, { duration: 1500 }) // Fade out
      );
      
      translateY.value = withDelay(
        delay,
        withSequence(
          withTiming(-60, { duration: 2500, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 0 }) // Reset immediately
        )
      );

      // Gentle sway
      translateX.value = withDelay(
        delay,
        withSequence(
          withTiming(10 * (index % 2 === 0 ? 1 : -1), { duration: 2500 }),
          withTiming(0, { duration: 0 })
        )
      );
    };

    // Run the animation loop
    const interval = setInterval(float, 2600 + index * 200);
    float(); // Initial run

    return () => clearInterval(interval);
  }, []);

  const animatedProps = useAnimatedProps(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
    ],
  }));

  return (
    <AnimatedPath
      d="M 0 0 Q 5 -10, 0 -20 T 0 -40"
      stroke="white"
      strokeWidth={3}
      fill="none"
      animatedProps={animatedProps}
      // Randomize start position slightly
      x={70 + (index - 1) * 20} 
      y={40}
    />
  );
};

export default function RealisticCoffeeProgress({ progress }: { progress: number }) {
  // Shared Values
  const fillProgress = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    // Clamp progress between 0 and 1
    const safeProgress = Math.max(0, Math.min(progress, 1));
    
    // Animate the fill level with a nice spring for "liquid" feel
    fillProgress.value = withSpring(safeProgress, {
      damping: 18,
      stiffness: 90,
    });

    // Subtle impact wobble on the mug when progress increases
    scale.value = withSequence(
      withTiming(1.02, { duration: 100 }),
      withSpring(1, { damping: 10 })
    );
  }, [progress]);

  // Calculated props for the main liquid body (The rectangle)
  const liquidRectProps = useAnimatedProps(() => {
    const currentHeight = interpolate(
      fillProgress.value,
      [0, 1],
      [0, LIQUID_MAX_HEIGHT],
      Extrapolation.CLAMP
    );

    return {
      y: LIQUID_BASE_Y - currentHeight,
      height: currentHeight,
    };
  });

  // Calculated props for the liquid surface (The ellipse on top)
  const liquidSurfaceProps = useAnimatedProps(() => {
    const currentHeight = interpolate(
      fillProgress.value,
      [0, 1],
      [0, LIQUID_MAX_HEIGHT],
      Extrapolation.CLAMP
    );
    
    return {
      cy: LIQUID_BASE_Y - currentHeight,
      rx: 55, // Fixed width matching the mug interior
      ry: 12, // Perspective height of the ellipse
      opacity: fillProgress.value > 0.05 ? 1 : 0, // Hide if empty
    };
  });

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={containerStyle}>
        <Svg width={200} height={220} viewBox="0 0 200 220">
          <Defs>
            {/* 1. Glass Gradient: Gives the mug a rounded, shiny look */}
            <LinearGradient id="glassGradient" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#ccc" stopOpacity="0.2" />
              <Stop offset="0.1" stopColor="#fff" stopOpacity="0.1" />
              <Stop offset="0.5" stopColor="#fff" stopOpacity="0" />
              <Stop offset="0.9" stopColor="#fff" stopOpacity="0.1" />
              <Stop offset="1" stopColor="#ccc" stopOpacity="0.2" />
            </LinearGradient>

            {/* 2. Coffee Gradient: Darker at bottom, lighter at top (richness) */}
            <LinearGradient id="coffeeGradient" x1="0" y1="1" x2="0" y2="0">
              <Stop offset="0" stopColor="#3b2f2f" />
              <Stop offset="1" stopColor="#6f4e37" />
            </LinearGradient>

            {/* 3. Surface Gradient: Makes the top liquid look shiny */}
            <LinearGradient id="surfaceGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#8a634b" />
              <Stop offset="1" stopColor="#5c4033" />
            </LinearGradient>

            {/* 4. ClipPath to confine liquid inside the mug shape */}
            <ClipPath id="mugInnerClip">
              <Path d="M 45 40 L 45 135 Q 45 160, 100 160 Q 155 160, 155 135 L 155 40 Z" />
            </ClipPath>
          </Defs>

          {/* --- LAYER 1: BACK OF MUG (The handle and back rim) --- */}
          {/* Handle */}
          <Path
            d="M 155 60 Q 190 60, 190 90 Q 190 120, 155 120"
            stroke="#ddd"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
          />
          
          {/* Back Rim (Inside view) */}
          <Ellipse cx="100" cy="40" rx="60" ry="15" fill="#e0e0e0" stroke="#ccc" strokeWidth="1"/>

          {/* --- LAYER 2: THE LIQUID --- */}
          <AnimatedG clipPath="url(#mugInnerClip)">
            {/* The rising body of coffee */}
            <AnimatedRect
              x="40"
              width="120"
              fill="url(#coffeeGradient)"
              animatedProps={liquidRectProps}
            />
          </AnimatedG>
          
          {/* The top surface of the coffee (Meniscus) */}
          {/* We render this OUTSIDE the clip path so the rim doesn't cut it off weirdly */}
          <AnimatedEllipse
            cx="100"
            fill="url(#surfaceGradient)"
            animatedProps={liquidSurfaceProps}
          />
          
          {/* --- LAYER 3: FRONT OF MUG (Glass effect) --- */}
          {/* Mug Body Outline & Glass Sheen */}
          <Path 
            d="M 40 40 L 40 135 Q 40 165, 100 165 Q 160 165, 160 135 L 160 40" 
            stroke="#ddd" 
            strokeWidth="2" 
            fill="url(#glassGradient)" 
          />
          
          {/* Front Rim (The part closest to viewer) */}
          <Path 
            d="M 40 40 A 60 15 0 0 0 160 40" 
            stroke="#ddd" 
            strokeWidth="2" 
            fill="none" 
          />

          {/* Reflections/Highlights on the glass */}
          <Path 
            d="M 45 50 Q 45 150, 60 150" 
            stroke="white" 
            strokeWidth="2" 
            strokeOpacity="0.3" 
            fill="none" 
          />

          {/* --- LAYER 4: STEAM --- */}
          {/* Only render steam if there is coffee */}
          {progress > 0 && (
             <G>
               <SteamParticle index={0} />
               <SteamParticle index={1} />
               <SteamParticle index={2} />
             </G>
          )}

        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    // Adding a subtle shadow to the whole component helps it pop
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
});