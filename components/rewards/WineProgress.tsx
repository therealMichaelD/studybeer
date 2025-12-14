import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
    Easing,
    interpolate,
    useAnimatedProps,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
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

interface Props {
  progress: number; // 0.0 to 1.0
}

// Create Animated components
const AnimatedPath = Animated.createAnimatedComponent(Path);

export default function WineProgress({ progress }: Props) {
  // --- Animation Values ---
  const fillLevel = useSharedValue(0);
  const waveAnim = useSharedValue(0);
  const toastAnim = useSharedValue(0);

  // --- 1. Manage Progress & Toast Trigger ---
  useEffect(() => {
    const clamped = Math.min(Math.max(progress, 0), 1);

    // Animate Liquid Level
    fillLevel.value = withSpring(clamped, {
      damping: 15,
      stiffness: 90,
    });

    // Trigger "Toast" Animation when complete
    if (clamped >= 1) {
      toastAnim.value = withSequence(
        withTiming(1, { duration: 200 }), // Tilt
        withSpring(0, { damping: 8 })     // Return
      );
    }
  }, [progress]);

  // --- 2. Infinite Wave Loop ---
  useEffect(() => {
    waveAnim.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  // --- 3. View Animations (The Glass Movement) ---
  // We animate the VIEW, not the SVG group, to prevent clipping issues
  const animatedGlassStyle = useAnimatedStyle(() => {
    const rotate = interpolate(toastAnim.value, [0, 1], [0, 15]); // Tilt 15 degrees
    const scale = interpolate(toastAnim.value, [0, 1], [1, 1.1]); // Scale up 10%

    return {
      transform: [{ scale }, { rotate: `${rotate}deg` }],
    };
  });

  // --- 4. Wave Path Logic (Worklet) ---
  // Coordinates are based on a 100x150 viewBox
  const createWavePath = (phase: number, amplitude: number) => {
    "worklet";
    
    // 0% progress = Y: 90 (Bottom of bowl)
    // 100% progress = Y: 35 (Top of bowl)
    const currentY = interpolate(fillLevel.value, [0, 1], [90, 35]);

    const shift = phase * 50; // Shift wave horizontally

    // Draw a wide path that slides left/right
    return `
      M ${-50 + shift} ${currentY}
      Q ${-25 + shift} ${currentY - amplitude} ${0 + shift} ${currentY}
      Q ${25 + shift} ${currentY + amplitude} ${50 + shift} ${currentY}
      Q ${75 + shift} ${currentY - amplitude} ${100 + shift} ${currentY}
      Q ${125 + shift} ${currentY + amplitude} ${150 + shift} ${currentY}
      V 150
      H -50
      Z
    `;
  };

  // Animated Props for SVG Paths
  const backWaveProps = useAnimatedProps(() => ({
    d: createWavePath(waveAnim.value, 3), // Smaller amplitude for back wave
  }));

  const frontWaveProps = useAnimatedProps(() => ({
    d: createWavePath(waveAnim.value + 0.3, 5), // Larger amplitude, offset phase
  }));

  return (
    <View style={styles.container}>
      {/* Animated Wrapper for the Toast Effect */}
      <Animated.View style={[styles.glassWrapper, animatedGlassStyle]}>
        
        {/* viewBox="0 0 100 150" defines our coordinate system.
           This ensures the glass scales to fit the View perfectly 
           without getting cut off.
        */}
        <Svg width="100%" height="100%" viewBox="0 0 100 150">
          <Defs>
            <LinearGradient id="wineGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#D43F4F" stopOpacity="1" />
              <Stop offset="1" stopColor="#722F37" stopOpacity="1" />
            </LinearGradient>

            {/* The Bowl Shape Mask */}
            <ClipPath id="bowlMask">
              <Path d="M 15 30 Q 15 90 50 90 Q 85 90 85 30 Z" />
            </ClipPath>
          </Defs>

          {/* --- LIQUID LAYER --- */}
          {/* We apply the clip path here so the waves are cut into the bowl shape */}
          <G clipPath="url(#bowlMask)">
            {/* Background Rect to fill gaps if waves dip too low */}
            <Rect x="0" y="0" width="100" height="150" fillOpacity={0} />
            
            {/* Back Wave (Darker) */}
            <AnimatedPath
              animatedProps={backWaveProps}
              fill="#521d26"
            />
            {/* Front Wave (Gradient) */}
            <AnimatedPath
              animatedProps={frontWaveProps}
              fill="url(#wineGradient)"
            />
          </G>

          {/* --- GLASS LAYER (Overlays) --- */}
          
          {/* Bowl Outline */}
          <Path
            d="M 15 30 Q 15 90 50 90 Q 85 90 85 30"
            fill="none"
            stroke="rgba(255,255,255,0.8)"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Stem */}
          <Path
            d="M 50 90 L 50 140"
            stroke="rgba(255,255,255,0.8)"
            strokeWidth="3"
          />

          {/* Base */}
          <Path
            d="M 30 140 L 70 140"
            stroke="rgba(255,255,255,0.8)"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Reflection / Glare */}
          <Path
            d="M 75 40 Q 82 50 78 70"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 180, 
    justifyContent: "center",
    alignItems: "center",
  },
  glassWrapper: {
    width: 100,
    height: 150,
    // Shadows for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5, // Android shadow
  },
});