import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
    Easing,
    Extrapolate,
    interpolate,
    interpolateColor,
    useAnimatedProps,
    useSharedValue,
    withRepeat,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import Svg, {
    Circle,
    ClipPath,
    Defs,
    Ellipse,
    G,
    LinearGradient,
    Path,
    Rect,
    Stop,
    Text as SvgText,
} from "react-native-svg";

// 1. Create Animated Components
const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedText = Animated.createAnimatedComponent(SvgText);

type NapProgressProps = {
  progress: number; // 0 to 1
};

export default function NapProgress({ progress }: NapProgressProps) {
  // Main progress value
  const progressVal = useSharedValue(0);
  // Breathing animation loop
  const breath = useSharedValue(0);
  // Zzz float animation loop
  const float = useSharedValue(0);

  useEffect(() => {
    progressVal.value = withSpring(progress, { damping: 20, stiffness: 90 });
  }, [progress]);

  useEffect(() => {
    // Continuous breathing rhythm
    breath.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
    // Continuous floating for Zzzs
    float.value = withRepeat(
      withTiming(1, { duration: 2500, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  // --- ANIMATED PROPS ---

  // 1. Sky / Room Ambience (Day to Night)
  const skyProps = useAnimatedProps(() => {
    const color = interpolateColor(
      progressVal.value,
      [0, 0.5, 1],
      ["#87CEEB", "#6A5ACD", "#191970"] // SkyBlue -> SlateBlue -> MidnightBlue
    );
    return { fill: color };
  });

  // 2. The Blanket "Fill" Effect (Moves up as progress increases)
  const blanketProps = useAnimatedProps(() => {
    // 0 progress = blanket down (y=40), 1 progress = blanket up (y=0 relative to clip)
    const translateY = interpolate(progressVal.value, [0, 1], [40, 0]);

    // Add breathing effect only when progress is high (asleep)
    const breathOffset = interpolate(breath.value, [0, 1], [0, -1.5]);
    const isAsleep = progressVal.value > 0.8 ? 1 : 0;

    return {
      transform: [{ translateY: translateY + breathOffset * isAsleep }],
    };
  });

  // 3. Eyelids (Open to Closed)
  const eyelidProps = useAnimatedProps(() => {
    const scaleY = interpolate(
      progressVal.value,
      [0, 0.8],
      [0, 1],
      Extrapolate.CLAMP // ✅ Fixed: Used directly from import
    );
    return {
      transform: [{ scaleY: scaleY }],
      opacity: interpolate(progressVal.value, [0, 0.2], [0, 1]),
    };
  });

  // 4. Moon/Sun Position & Glow
  const celestialProps = useAnimatedProps(() => {
    const rotate = interpolate(progressVal.value, [0, 1], [0, -40]);
    const opacity = interpolate(progressVal.value, [0.5, 1], [0, 1]);
    return {
      transform: [{ rotate: `${rotate}deg` }],
      opacity: opacity,
    };
  });

  // 5. Zzz Particles (Only visible at 100%)
  const createZzzProps = (offset: number) =>
    useAnimatedProps(() => {
      const show = progressVal.value > 0.95 ? 1 : 0;
      // Staggered float effect
      const localFloat = (float.value + offset) % 1;

      return {
        opacity: interpolate(localFloat, [0, 0.2, 0.8, 1], [0, 1, 1, 0]) * show,
        transform: [
          { translateX: Math.sin(localFloat * Math.PI * 2) * 5 }, // Wiggle
          { translateY: -localFloat * 30 }, // Float Up
          { scale: interpolate(localFloat, [0, 1], [0.5, 1.5]) },
        ],
      };
    });

  const z1 = createZzzProps(0);
  const z2 = createZzzProps(0.33);
  const z3 = createZzzProps(0.66);

  return (
    <View style={styles.container}>
      <Svg width={200} height={180} viewBox="0 0 200 180">
        <Defs>
          <ClipPath id="bedClip">
            <Rect x="30" y="100" width="140" height="60" rx="10" />
          </ClipPath>
          <LinearGradient id="blanketGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#4682b4" stopOpacity="1" />
            <Stop offset="1" stopColor="#2F4F4F" stopOpacity="1" />
          </LinearGradient>
        </Defs>

        {/* --- ROOM BACKGROUND --- */}
        <AnimatedRect
          x="0"
          y="0"
          width="200"
          height="180"
          animatedProps={skyProps}
          rx="20"
        />

        {/* --- WINDOW --- */}
        <G transform="translate(130, 30)">
          <Rect width="50" height="70" fill="#333" rx="4" opacity="0.3" />
          {/* Moon/Stars Group */}
          <AnimatedG animatedProps={celestialProps} originX="25" originY="80">
            <Circle cx="25" cy="20" r="8" fill="#FEFCD7" />
            <Circle cx="10" cy="10" r="1.5" fill="white" opacity="0.8" />
            <Circle cx="40" cy="50" r="1" fill="white" opacity="0.6" />
            <Circle cx="5" cy="60" r="1" fill="white" opacity="0.7" />
          </AnimatedG>
          {/* Window Frame */}
          <Rect
            width="50"
            height="70"
            stroke="white"
            strokeWidth="3"
            rx="4"
            fill="none"
          />
          <Path
            d="M 0 35 L 50 35 M 25 0 L 25 70"
            stroke="white"
            strokeWidth="2"
          />
        </G>

        {/* --- BED HEADBOARD --- */}
        <Rect x="25" y="85" width="150" height="40" fill="#5D4037" rx="5" />

        {/* --- PILLOW --- */}
        <Rect x="40" y="90" width="50" height="30" fill="#FFF" rx="8" />

        {/* --- PERSON (HEAD) --- */}
        <Circle cx="65" cy="100" r="18" fill="#FFDCB1" />

        {/* Eyes (Animated to close) */}
        <G transform="translate(65, 100)">
          {/* Open Eyes (Static Background) */}
          <Circle cx="-6" cy="-2" r="2" fill="#333" opacity="0.3" />
          <Circle cx="6" cy="-2" r="2" fill="#333" opacity="0.3" />

          {/* Eyelids (Skin color covering eyes) */}
          <AnimatedG animatedProps={eyelidProps}>
            <Rect x="-10" y="-6" width="20" height="10" fill="#FFDCB1" />
            <Path
              d="M -8 -1 Q -4 3, 0 -1"
              stroke="#8B4513"
              strokeWidth="1"
              fill="none"
              transform="translate(-4, 2)"
            />
            <Path
              d="M -8 -1 Q -4 3, 0 -1"
              stroke="#8B4513"
              strokeWidth="1"
              fill="none"
              transform="translate(8, 2)"
            />
          </AnimatedG>
        </G>

        {/* --- THE BED BODY (Masked Area) --- */}
        <G clipPath="url(#bedClip)">
          {/* Mattress/Sheet */}
          <Rect x="30" y="100" width="140" height="80" fill="#EEE" />

          {/* Body Shape (Under blanket) */}
          <Ellipse cx="70" cy="130" rx="30" ry="15" fill="#FFDCB1" />

          {/* THE PROGRESS BAR (The Blanket) */}
          <AnimatedRect
            x="30"
            y="90" // Base position
            width="140"
            height="100"
            fill="url(#blanketGrad)"
            animatedProps={blanketProps}
          />
          {/* Blanket Fold details */}
          <AnimatedPath
            d="M 30 90 Q 100 100, 170 90"
            stroke="rgba(0,0,0,0.1)"
            strokeWidth="2"
            fill="none"
            animatedProps={blanketProps}
          />
        </G>

        {/* --- FOOTBOARD --- */}
        <Rect x="25" y="155" width="150" height="10" fill="#5D4037" rx="2" />

        {/* --- Zzz PARTICLES --- */}
        <G transform="translate(80, 80)">
          <AnimatedText
            fontSize="20"
            fontWeight="bold"
            fill="white"
            animatedProps={z1}
          >
            Z
          </AnimatedText>
          <AnimatedText
            fontSize="24"
            fontWeight="bold"
            fill="white"
            animatedProps={z2}
          >
            Z
          </AnimatedText>
          <AnimatedText
            fontSize="16"
            fontWeight="bold"
            fill="white"
            animatedProps={z3}
          >
            Z
          </AnimatedText>
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
});