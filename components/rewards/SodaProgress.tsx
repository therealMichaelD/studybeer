import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
    Easing,
    interpolate,
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
    Rect,
    Stop,
} from "react-native-svg";

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedRect = Animated.createAnimatedComponent(Rect);

// --- Helpers ---
const randomRange = (min: number, max: number) =>
  Math.random() * (max - min) + min;

// --- Sub-Component: Rising Bubble ---
const Bubble = ({ index }: { index: number }) => {
  const y = useSharedValue(200);
  const xOffset = randomRange(-30, 30);
  const size = randomRange(2, 5);
  const speed = randomRange(2500, 4500);
  const delay = index * 600;

  useEffect(() => {
    y.value = withDelay(
      delay,
      withRepeat(
        withTiming(-20, { duration: speed, easing: Easing.linear }),
        -1,
        false
      )
    );
  }, []);

  const animatedProps = useAnimatedProps(() => ({
    cy: y.value,
    opacity: interpolate(y.value, [200, 150, 50, 0], [0, 0.6, 0.6, 0]),
  }));

  return (
    <AnimatedCircle
      cx={90 + xOffset}
      r={size}
      fill="white"
      animatedProps={animatedProps}
    />
  );
};

// --- Sub-Component: Bobbing Ice Cube ---
const IceCube = ({ x, y, rotate }: { x: number; y: number; rotate: number }) => {
  const offset = useSharedValue(0);

  useEffect(() => {
    offset.value = withRepeat(
      withSequence(
        withTiming(4, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
        withTiming(-4, { duration: 1500, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );
  }, []);

  const animatedProps = useAnimatedProps(() => ({
    y: y + offset.value,
  }));

  return (
    <AnimatedRect
      x={x}
      width="25"
      height="25"
      rx="4"
      fill="white"
      fillOpacity="0.3"
      stroke="white"
      strokeWidth="1"
      strokeOpacity="0.5"
      transform={`rotate(${rotate}, ${x + 12.5}, ${y + 12.5})`}
      animatedProps={animatedProps}
    />
  );
};

// --- MAIN COMPONENT ---
// We explicitly type the props here to fix your "IntrinsicAttributes" error
export default function AnimatedReward({ progress }: { progress: number }) {
  const CUP_TOP_Y = 20;    
  const CUP_BOTTOM_Y = 200; 
  
  const fluidLevel = useSharedValue(CUP_BOTTOM_Y);
  const waveOffset = useSharedValue(0);

  useEffect(() => {
    const clamped = Math.max(0, Math.min(progress, 1));
    const targetY = interpolate(clamped, [0, 1], [CUP_BOTTOM_Y, CUP_TOP_Y]);

    fluidLevel.value = withSpring(targetY, {
      damping: 15,
      stiffness: 80,
    });
  }, [progress]);

  useEffect(() => {
    waveOffset.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const liquidProps = useAnimatedProps(() => {
    const currentY = fluidLevel.value;
    const wavePhase = waveOffset.value * Math.PI * 2;
    const amplitude = 5; 

    return {
      d: `
        M 0 ${currentY} 
        Q 45 ${currentY - amplitude + Math.sin(wavePhase) * 5} 90 ${currentY}
        T 180 ${currentY}
        V 220 
        H 0 
        Z
      `,
      fill: "url(#colaGradient)",
    };
  });

  const cupPath = "M 40 20 L 50 200 L 130 200 L 140 20 Z";

  return (
    <View style={styles.cupContainer}>
      <Svg width={180} height={220} viewBox="0 0 180 220">
        <Defs>
          <ClipPath id="cupClip">
            <Path d={cupPath} />
          </ClipPath>
          <LinearGradient id="colaGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#d94f4f" />
            <Stop offset="1" stopColor="#8b0000" />
          </LinearGradient>
        </Defs>

        <Path d="M 110 200 L 135 5" stroke="#d63031" strokeWidth="8" />

        <G clipPath="url(#cupClip)">
          <AnimatedPath animatedProps={liquidProps} />
          <IceCube x={60} y={80} rotate={15} />
          <IceCube x={90} y={120} rotate={-10} />
          <IceCube x={65} y={150} rotate={45} />
          {[...Array(6)].map((_, i) => (
            <Bubble key={i} index={i} />
          ))}
          <Path d="M 45 20 L 52 200 L 70 200 L 60 20 Z" fill="white" fillOpacity="0.15" />
        </G>

        <Path d={cupPath} stroke="rgba(255,255,255,0.8)" strokeWidth="4" fill="none" />
        <Rect x="35" y="15" width="110" height="15" rx="4" fill="#eee" />
        <Path d="M 129 18 L 135 5" stroke="#ff7675" strokeWidth="8" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  cupContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#d94f4f",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
});