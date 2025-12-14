import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
    Easing,
    interpolate,
    useAnimatedProps,
    useDerivedValue,
    useSharedValue,
    withDelay,
    withSequence,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import Svg, {
    Circle,
    Defs,
    Ellipse,
    G,
    Line,
    LinearGradient,
    Path,
    Rect,
    Stop,
} from "react-native-svg";

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

// --- CONFIGURATION ---
const BALL_SIZE = 14;
const START_X = 30;
const START_Y = 160;
const HOOP_X = 160;
const HOOP_Y = 60; // The height of the rim
const NET_HEIGHT = 35;

export default function RealisticHoopsProgress({ progress }: { progress: number }) {
  const ballProgress = useSharedValue(0);
  const netSwish = useSharedValue(0);

  useEffect(() => {
    // 1. Animate the ball
    ballProgress.value = withSpring(progress, {
      damping: 16,
      stiffness: 70,
    });

    // 2. Animate the Net Swish when ball enters the "Drop" phase (> 0.7)
    if (progress > 0.75) {
      netSwish.value = withDelay(
        50, // Wait for ball to hit rim
        withSequence(
          withTiming(1, { duration: 150, easing: Easing.out(Easing.quad) }), // Expand
          withTiming(0, { duration: 300, easing: Easing.elastic(1.5) })     // Snap back
        )
      );
    } else {
      netSwish.value = withTiming(0);
    }
  }, [progress]);

  // --- PHYSICS ENGINE ---
  const ballTransform = useDerivedValue(() => {
    const t = ballProgress.value;

    let x, y, scale, rotate;

    // PHASE 1: THE ARC (0.0 -> 0.7)
    // Bezier curve from Start to Rim
    if (t <= 0.7) {
      // Normalize t to 0-1 range for this specific phase
      const phaseT = interpolate(t, [0, 0.7], [0, 1]);
      
      const p0 = { x: START_X, y: START_Y };
      const p1 = { x: 80, y: -40 }; // Control point (Apex high above)
      const p2 = { x: HOOP_X, y: HOOP_Y - 5 }; // Target (slightly above rim center)

      // Quadratic Bezier Formula
      x = (1 - phaseT) * (1 - phaseT) * p0.x + 2 * (1 - phaseT) * phaseT * p1.x + phaseT * phaseT * p2.x;
      y = (1 - phaseT) * (1 - phaseT) * p0.y + 2 * (1 - phaseT) * phaseT * p1.y + phaseT * phaseT * p2.y;
      
      // Scale: Shrink as it goes away
      scale = interpolate(phaseT, [0, 1], [1, 0.7]);
      rotate = interpolate(phaseT, [0, 1], [0, -360]); // Backspin
    } 
    // PHASE 2: THE DROP (0.7 -> 1.0)
    // Linear drop through the net
    else {
      // Lock X at the hoop center (with slight wobble for realism)
      x = HOOP_X;
      
      // Interpolate Y from Rim to below Net
      // 0.7 = Rim Height (60)
      // 1.0 = Floor/Bottom of net (130)
      y = interpolate(t, [0.7, 1], [HOOP_Y - 5, HOOP_Y + NET_HEIGHT + 20]);
      
      scale = 0.7; // Stay small
      rotate = interpolate(t, [0.7, 1], [-360, -450]); // Slower spin while falling
    }

    return { x, y, scale, rotate };
  });

  const ballProps = useAnimatedProps(() => {
    const { x, y, scale, rotate } = ballTransform.value;
    return {
      transform: [
        { translateX: x },
        { translateY: y },
        { scale },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  const shadowProps = useAnimatedProps(() => {
    const t = ballProgress.value;
    const { x } = ballTransform.value;
    
    // Shadow fades when ball is high, gets dark when low
    const opacity = interpolate(t, [0, 0.35, 0.7, 1], [0.4, 0.1, 0.2, 0.4]);
    const sScale = interpolate(t, [0, 0.35, 0.7, 1], [1, 0.5, 0.6, 0.8]);

    return {
      cx: x,
      rx: 12 * sScale,
      ry: 4 * sScale,
      opacity,
    };
  });

  // --- DYNAMIC NET DRAWING ---
  const netProps = useAnimatedProps(() => {
    const s = netSwish.value;
    
    // The net is a trapezoid that bulges at the bottom when swished
    const topW = 26; // Width at rim
    const botW = 12 + (s * 8); // Width at bottom (expands)
    const h = NET_HEIGHT + (s * 5); // Height (stretches)
    
    // Center X is 0 (relative to Group)
    const tl = -topW / 2; // Top Left
    const tr = topW / 2;  // Top Right
    const bl = -botW / 2; // Bottom Left
    const br = botW / 2;  // Bottom Right

    // Draw the outline and the cross-hatching
    // We construct a path string dynamically
    const d = `
      M ${tl} 0 L ${bl} ${h} L ${br} ${h} L ${tr} 0 
      M ${tl * 0.6} 0 L ${bl * 0.6} ${h}
      M ${tl * 0.2} 0 L ${bl * 0.2} ${h}
      M ${tr * 0.2} 0 L ${br * 0.2} ${h}
      M ${tr * 0.6} 0 L ${br * 0.6} ${h}
      M ${tl} ${h*0.3} L ${tr} ${h*0.3}
      M ${bl} ${h*0.7} L ${br} ${h*0.7}
    `;

    return { d };
  });

  return (
    <View style={styles.container}>
      <Svg width={220} height={200} viewBox="0 0 220 200">
        <Defs>
          <LinearGradient id="ballGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#ff8c00" stopOpacity="1" />
            <Stop offset="1" stopColor="#d95400" stopOpacity="1" />
          </LinearGradient>
        </Defs>

        {/* 1. FLOOR & SHADOW */}
        <Rect x="0" y="180" width="220" height="2" fill="#ddd" />
        <AnimatedEllipse cy="180" fill="#000" animatedProps={shadowProps} />

        {/* 2. POLE STRUCTURE (Geometric & Clean) */}
        <Rect x="190" y="50" width="8" height="130" fill="#555" rx="2" />
        <Path d="M 194 90 L 175 75" stroke="#555" strokeWidth="5" />
        
        {/* Backboard */}
        <Rect x="175" y="25" width="4" height="60" fill="#eee" stroke="#999" />
        <Rect x="176" y="45" width="2" height="20" fill="red" />

        {/* --- LAYER 3: BEHIND THE BALL --- */}
        {/* Back Rim (The part of the ring furthest from camera) */}
        <G transform={`translate(${HOOP_X}, ${HOOP_Y})`}>
          {/* Top half of ellipse */}
          <Path d="M -15 0 A 15 4 0 0 0 15 0" stroke="#b00" strokeWidth="2" fill="none" />
        </G>

        {/* Back Net (Darker, thinner) */}
        <G transform={`translate(${HOOP_X}, ${HOOP_Y})`}>
          <AnimatedPath animatedProps={netProps} stroke="#ccc" strokeWidth="1" fill="none" opacity={0.5} />
        </G>

        {/* --- LAYER 4: THE BALL --- */}
        <AnimatedG animatedProps={ballProps}>
          <Circle cx="0" cy="0" r={BALL_SIZE} fill="url(#ballGrad)" />
          {/* Ball Lines */}
          <Path d={`M -${BALL_SIZE} 0 L ${BALL_SIZE} 0`} stroke="#333" strokeWidth="1.5" />
          <Line x1="0" y1={-BALL_SIZE} x2="0" y2={BALL_SIZE} stroke="#333" strokeWidth="1.5" />
          <Circle cx="0" cy="0" r={BALL_SIZE * 0.6} stroke="#333" strokeWidth="1.5" fill="none" />
        </AnimatedG>

        {/* --- LAYER 5: IN FRONT OF THE BALL --- */}
        {/* Front Net (Lighter, covers the ball slightly as it falls through) */}
        <G transform={`translate(${HOOP_X}, ${HOOP_Y})`}>
          <AnimatedPath animatedProps={netProps} stroke="#fff" strokeWidth="1.5" fill="none" />
        </G>

        {/* Front Rim (The part of the ring closest to camera) */}
        <G transform={`translate(${HOOP_X}, ${HOOP_Y})`}>
          {/* Bottom half of ellipse */}
          <Path d="M -15 0 A 15 4 0 0 1 15 0" stroke="red" strokeWidth="2.5" fill="none" />
        </G>

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