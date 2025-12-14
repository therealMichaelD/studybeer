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
    ZoomIn,
} from "react-native-reanimated";
import Svg, {
    Circle,
    ClipPath,
    Defs,
    Ellipse,
    G,
    LinearGradient,
    Path,
    RadialGradient,
    Rect,
    Stop,
} from "react-native-svg";

// --- Animated Components ---
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedG = Animated.createAnimatedComponent(G);

// --- Constants ---
const WIDTH = 220;
const HEIGHT = 260;
const CENTER_X = WIDTH / 2;

// Glass Boundaries for Liquid Calculation
const GLASS_TOP_Y = 60;
const GLASS_BOTTOM_Y = 190;

interface Props {
  progress: number; // 0.0 to 1.0
}

// --- Helper: Bubble Particle System ---
const Bubble = ({ active, delay }: { active: boolean; delay: number }) => {
  const y = useSharedValue(GLASS_BOTTOM_Y);
  const opacity = useSharedValue(0);
  const xOffset = Math.random() * 40 - 20;
  const size = Math.random() * 3 + 2;

  useEffect(() => {
    if (active) {
      // Delay start to desynchronize bubbles
      const timeout = setTimeout(() => {
        y.value = withRepeat(
          withTiming(GLASS_TOP_Y + 40, { duration: 2500, easing: Easing.linear }),
          -1,
          false
        );
        opacity.value = withRepeat(
          withTiming(0, { duration: 2500, easing: Easing.inOut(Easing.quad) }),
          -1,
          false
        );
      }, delay);
      return () => clearTimeout(timeout);
    }
  }, [active, delay]); // Added delay dependency

  const animatedProps = useAnimatedProps(() => ({
    cy: y.value,
    opacity: interpolate(y.value, [GLASS_BOTTOM_Y, GLASS_TOP_Y + 40], [0.5, 0]),
  }));

  return <AnimatedCircle cx={CENTER_X + xOffset} r={size} fill="#fff" fillOpacity={0.4} animatedProps={animatedProps} />;
};

export default function CocktailProgress({ progress }: Props) {
  // 1. Animation Values
  const fillLevel = useSharedValue(0);
  const wavePhase = useSharedValue(0);

  useEffect(() => {
    // Smooth spring animation for fill level
    fillLevel.value = withSpring(Math.max(0, Math.min(progress, 1)), {
      damping: 15,
      stiffness: 70,
    });
  }, [progress]);

  useEffect(() => {
    // Continuous wave loop
    wavePhase.value = withRepeat(
      withTiming(Math.PI * 2, { duration: 2000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  // 2. Wave & Liquid Logic
  const liquidProps = useAnimatedProps(() => {
    // Calculate current liquid height based on progress
    const currentY = interpolate(fillLevel.value, [0, 1], [GLASS_BOTTOM_Y, GLASS_TOP_Y]);
    
    // Wave Physics
    const amp = 4; // Wave height
    const freq = 0.05; // Wave frequency
    
    // Draw a wide block for liquid, with a wavy top
    let path = `M 0 ${currentY}`;
    for (let x = 0; x <= WIDTH; x += 10) {
      const y = currentY + amp * Math.sin(x * freq + wavePhase.value);
      path += ` L ${x} ${y}`;
    }
    // Close the shape at the bottom
    path += ` L ${WIDTH} ${HEIGHT} L 0 ${HEIGHT} Z`;

    return { d: path };
  });

  // 3. Shape Definitions (The "Apple Emoji" Style)
  const glassPath = `
    M ${CENTER_X - 45} 60
    C ${CENTER_X - 45} 100, ${CENTER_X - 10} 120, ${CENTER_X - 55} 160
    C ${CENTER_X - 65} 180, ${CENTER_X - 30} 200, ${CENTER_X} 200
    C ${CENTER_X + 30} 200, ${CENTER_X + 65} 180, ${CENTER_X + 55} 160
    C ${CENTER_X + 10} 120, ${CENTER_X + 45} 100, ${CENTER_X + 45} 60
    Z
  `;

  return (
    <View style={styles.container}>
      <Svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        <Defs>
          <ClipPath id="glassClip">
            <Path d={glassPath} />
          </ClipPath>

          {/* Liquid Gradient: Orange to Red (Sunrise/Rum Punch) */}
          {/* REMOVED INLINE COMMENTS HERE TO FIX TS ERROR */}
          <LinearGradient id="liquidGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFC107" />
            <Stop offset="0.5" stopColor="#FF9800" />
            <Stop offset="1" stopColor="#FF3D00" />
          </LinearGradient>

          {/* Lime Gradient */}
          <RadialGradient id="limeGradient" cx="50%" cy="50%" r="50%">
            <Stop offset="0.7" stopColor="#AED581" /> 
            <Stop offset="1" stopColor="#558B2F" /> 
          </RadialGradient>
        </Defs>

        {/* --- 1. GLASS BACK LAYER (Stem & Base) --- */}
        <Path 
          d={`M ${CENTER_X} 200 L ${CENTER_X} 225`} 
          stroke="#E0E0E0" strokeWidth="12" 
        />
        <Ellipse 
          cx={CENTER_X} cy="230" rx="40" ry="6" 
          fill="#E0E0E0" stroke="#BDBDBD" strokeWidth="1"
        />

        {/* --- 2. STRAW (Behind liquid, but inside glass) --- */}
        <Path
          d={`M ${CENTER_X + 20} 200 Q ${CENTER_X + 40} 100, ${CENTER_X + 60} 40 L ${CENTER_X + 90} 20`}
          stroke="#00B0FF" 
          strokeWidth="8" 
          fill="none" 
          strokeLinecap="round"
        />

        {/* --- 3. LIQUID CONTENT (Clipped) --- */}
        <G clipPath="url(#glassClip)">
          {/* Background fill for empty glass */}
          <Rect x="0" y="0" width={WIDTH} height={HEIGHT} fill="#fff" fillOpacity="0.1" />
          
          {/* The Wavy Liquid */}
          <AnimatedPath fill="url(#liquidGradient)" animatedProps={liquidProps} />
          
          {/* Bubbles */}
          <Bubble active={progress > 0.1} delay={0} />
          <Bubble active={progress > 0.3} delay={500} />
          <Bubble active={progress > 0.5} delay={1000} />
          <Bubble active={progress > 0.7} delay={1500} />
        </G>

        {/* --- 4. GLASS FOREGROUND (Reflections & Rim) --- */}
        <Path d={glassPath} stroke="white" strokeWidth="3" fill="none" strokeOpacity={0.6} />
        
        {/* Specular Highlight (The "Shininess") */}
        <Path 
          d={`M ${CENTER_X - 35} 70 Q ${CENTER_X - 35} 120, ${CENTER_X - 45} 160`} 
          stroke="white" strokeWidth="4" strokeOpacity="0.3" strokeLinecap="round" fill="none"
        />
        <Path 
          d={`M ${CENTER_X + 35} 70 Q ${CENTER_X + 35} 120, ${CENTER_X + 45} 160`} 
          stroke="white" strokeWidth="2" strokeOpacity="0.2" strokeLinecap="round" fill="none"
        />
        
        {/* Top Rim */}
        <Ellipse 
          cx={CENTER_X} cy="60" rx="45" ry="6" 
          stroke="white" strokeWidth="2" fill="none" strokeOpacity="0.5" 
        />

        {/* --- 5. GARNISHES (Lime & Cherry) --- */}
        {/* Only show garnishes when task is complete */}
        {progress >= 1 && (
          <AnimatedG entering={ZoomIn.duration(600).delay(200)}>
            {/* Lime Wedge (Sits on left rim) */}
            <G transform={`translate(${CENTER_X - 50}, 45) rotate(-15)`}>
              {/* Rind */}
              <Path d="M 0 0 A 25 25 0 0 0 50 0 Z" fill="#689F38" />
              {/* Flesh */}
              <Path d="M 4 0 A 21 21 0 0 0 46 0 Z" fill="#DCEDC8" />
              {/* Segments */}
              <Path d="M 25 0 L 25 21 M 25 0 L 10 12 M 25 0 L 40 12" stroke="#8BC34A" strokeWidth="1" />
            </G>

            {/* Cherry (With toothpick) */}
            <G transform={`translate(${CENTER_X - 35}, 35)`}>
              <Path d="M 0 0 L 15 -20" stroke="#D7CCC8" strokeWidth="2" />
              <Circle cx="0" cy="0" r="10" fill="#D50000" />
              <Circle cx="-3" cy="-3" r="3" fill="white" fillOpacity="0.4" />
            </G>
          </AnimatedG>
        )}

      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    height: 300,
  },
});