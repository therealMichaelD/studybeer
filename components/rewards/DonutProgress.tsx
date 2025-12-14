import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
    interpolate,
    useAnimatedProps,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import Svg, {
    Circle,
    Defs,
    G,
    Mask,
    Path,
} from "react-native-svg";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Geometry constants for the mask
const RADIUS = 35; 
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function DonutProgress({ progress }: { progress: number }) {
  const animatedProgress = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    const clampedProgress = Math.max(0, Math.min(progress, 1));

    animatedProgress.value = withSpring(clampedProgress, {
      damping: 15,
      stiffness: 90,
    });

    scale.value = withSequence(
      withTiming(1.05, { duration: 100 }),
      withSpring(1, { damping: 10 })
    );
  }, [progress]);

  const maskProps = useAnimatedProps(() => {
    const strokeDashoffset = interpolate(
      animatedProgress.value,
      [0, 1],
      [CIRCUMFERENCE, 0]
    );
    return {
      strokeDashoffset,
    };
  });

  const containerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const donutPath =
    "M 90 30 A 50 50 0 1 1 90 130 A 50 50 0 1 1 90 30 M 90 60 A 20 20 0 1 0 90 100 A 20 20 0 1 0 90 60";

  return (
    <View style={styles.container}>
      <Animated.View style={containerStyle}>
        <Svg width={180} height={160} viewBox="0 0 180 160">
          <Defs>
            <Mask id="frostingMask">
              <AnimatedCircle
                cx="90"
                cy="80"
                r={RADIUS}
                stroke="white"
                strokeWidth="65"
                strokeDasharray={CIRCUMFERENCE}
                strokeLinecap="round"
                animatedProps={maskProps}
                transform="rotate(-90 90 80)" 
              />
            </Mask>
          </Defs>

          <Path d={donutPath} fill="#C29469" />

          <G mask="url(#frostingMask)">
            <Path d={donutPath} fill="#FF94C2" />
            <Path 
                d="M 90 35 A 45 45 0 0 1 130 60" 
                stroke="white" 
                strokeWidth="3" 
                strokeOpacity="0.4" 
                strokeLinecap="round" 
                fill="none"
            />
            <Circle cx="70" cy="50" r="3" fill="#00E5FF" />
            <Circle cx="115" cy="55" r="3" fill="#FFEB3B" />
            <Circle cx="90" cy="115" r="3" fill="#76FF03" />
            <Circle cx="125" cy="90" r="3" fill="#FFFFFF" />
            <Circle cx="55" cy="90" r="3" fill="#FFFFFF" />
            <Circle cx="90" cy="45" r="3" fill="#D500F9" />
          </G>
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5, 
  },
});