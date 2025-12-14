import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
    Easing,
    useAnimatedProps,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import Svg, {
    Circle,
    ClipPath,
    Defs,
    G,
    LinearGradient,
    Path,
    Stop,
} from "react-native-svg";

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// --- Constants ---
const CUP_WIDTH = 180;
const CUP_HEIGHT = 200;
const BOTTOM_Y = 160;
const TOP_Y = 40;
const LIQUID_HEIGHT_MAX = BOTTOM_Y - TOP_Y;

// A static wave path that is extra wide (300px) so we can slide it
// Q/T commands create smooth Bezier curves (the wave tops)
// V 400 extends the liquid deep down to ensure it covers the bottom
const STATIC_WAVE_PATH = `
  M 0 0 
  Q 25 10 50 0 
  T 100 0 
  T 150 0 
  T 200 0 
  T 250 0 
  T 300 0 
  V 400 
  H 0 
  Z
`;

// --- Sub-Component: Floating Pearl ---
const BobaPearl = ({ x, y, delay }: { x: number; y: number; delay: number }) => {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-4, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      )
    );
  }, []);

  // Use transform for stability instead of changing cy prop directly
  const animatedStyle = useAnimatedProps(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return <AnimatedCircle cx={x} cy={y} r="7" fill="#36261b" animatedProps={animatedStyle} />;
};

// --- Sub-Component: Rising Bubble ---
// Rewritten to use pure Reanimated loops (no setTimeouts) to prevent memory leaks/crashes
const Bubble = ({ xOffset, speed }: { xOffset: number; speed: number }) => {
  const y = useSharedValue(BOTTOM_Y);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Reset and start loop
    y.value = BOTTOM_Y;
    opacity.value = 0;

    opacity.value = withRepeat(
        withSequence(
            withTiming(0.6, { duration: 500 }),
            withDelay(speed - 700, withTiming(0, { duration: 200 }))
        ), 
        -1, 
        false 
    );

    y.value = withRepeat(
        withTiming(TOP_Y, { duration: speed, easing: Easing.linear }), 
        -1, 
        false
    );
  }, []);

  const props = useAnimatedProps(() => ({
    cy: y.value,
    opacity: opacity.value,
  }));

  return <AnimatedCircle cx={60 + xOffset} r={3} fill="rgba(255,255,255,0.5)" animatedProps={props} />;
};

export default function BobaProgress({ progress }: { progress: number }) {
  const fillY = useSharedValue(BOTTOM_Y); // Controls Up/Down
  const waveX = useSharedValue(0);        // Controls Left/Right Ripple

  useEffect(() => {
    // 1. Vertical Fill Animation
    const safeProgress = Math.max(0, Math.min(progress, 1));
    // Calculate target Y position. 
    // Note: The static path top is at Y=0. We need to translate it down to the cup bottom (160)
    // or up to the cup top (40).
    const targetY = BOTTOM_Y - (safeProgress * LIQUID_HEIGHT_MAX);
    
    fillY.value = withSpring(targetY, { damping: 14, stiffness: 80 });
  }, [progress]);

  useEffect(() => {
    // 2. Horizontal Ripple Animation
    // We slide the wave horizontally by -100 units (one wave period) and loop it
    waveX.value = withRepeat(
      withTiming(-100, { duration: 1500, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  // Combine transforms into one animated prop
  // This is the "Crash Proof" method: native transforms only.
  const liquidStyle = useAnimatedProps(() => {
    return {
      transform: [
        { translateX: waveX.value }, 
        { translateY: fillY.value }
      ],
    };
  });

  const cupPath = "M 50 40 L 60 160 C 60 170 120 170 120 160 L 130 40 Z";

  return (
    <View style={styles.container}>
      <Svg width={CUP_WIDTH} height={CUP_HEIGHT} viewBox={`0 0 ${CUP_WIDTH} ${CUP_HEIGHT}`}>
        <Defs>
          <ClipPath id="bobaClip">
            <Path d={cupPath} />
          </ClipPath>
          <LinearGradient id="teaGradient" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#e8dcca" />
            <Stop offset="0.5" stopColor="#dcbfa6" />
            <Stop offset="1" stopColor="#ceaa86" />
          </LinearGradient>
        </Defs>

        {/* Straw */}
        <Path d="M 90 160 L 115 10" stroke="#333" strokeWidth="12" strokeLinecap="round" opacity={0.2} />
        <Path d="M 90 160 L 115 10" stroke="#d65a5a" strokeWidth="8" strokeLinecap="round" />

        {/* Masked Liquid Area */}
        <G clipPath="url(#bobaClip)">
          {/* The Liquid Shape
             We start it at x=-50 to ensure we have room to slide left/right without gaps 
          */}
          <AnimatedPath 
            x="-50"
            d={STATIC_WAVE_PATH} 
            fill="url(#teaGradient)" 
            animatedProps={liquidStyle} 
          />

          {/* Bubbles */}
          <Bubble xOffset={10} speed={2500} />
          <Bubble xOffset={30} speed={3200} />
          <Bubble xOffset={50} speed={2100} />

          {/* Pearls */}
          <BobaPearl x={70} y={150} delay={0} />
          <BobaPearl x={90} y={155} delay={500} />
          <BobaPearl x={110} y={150} delay={200} />
          <BobaPearl x={80} y={140} delay={800} />
          <BobaPearl x={100} y={142} delay={300} />
        </G>

        {/* Gloss Reflection */}
        <Path 
          d="M 55 45 L 63 150" 
          stroke="rgba(255,255,255,0.3)" 
          strokeWidth="4" 
          strokeLinecap="round" 
        />
        
        {/* Cup Outline */}
        <Path d={cupPath} stroke="#444" strokeWidth="4" fill="none" strokeLinejoin="round" />
        <Path d="M 50 40 L 130 40" stroke="#444" strokeWidth="4" strokeLinecap="round" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
});