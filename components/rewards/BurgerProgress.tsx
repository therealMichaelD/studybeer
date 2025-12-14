import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
    Extrapolate,
    interpolate,
    SharedValue,
    useAnimatedProps,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";
import Svg, {
    Defs,
    Ellipse,
    G,
    LinearGradient,
    Path,
    RadialGradient,
    Rect,
    Stop,
} from "react-native-svg";

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

// Config for a snappy but bouncy fall
const SPRING_CONFIG = { damping: 15, stiffness: 150, mass: 1 };

const Ingredient = ({
  progress,
  range,
  children,
  yOffset = 0,
}: {
  progress: SharedValue<number>;
  range: [number, number];
  children: React.ReactNode;
  yOffset?: number;
}) => {
  const animatedProps = useAnimatedProps(() => {
    const localProgress = interpolate(
      progress.value,
      range,
      [0, 1],
      Extrapolate.CLAMP
    );

    // FIX 1: Increased drop distance from -150 to -400.
    // This ensures ingredients start WAY above the screen.
    const translateY = interpolate(localProgress, [0, 1], [-400, 0]);

    // FIX 2: Delay opacity. 
    // It stays invisible (0) until 20% into its fall, preventing "ghosts" at the top.
    const opacity = interpolate(localProgress, [0, 0.2, 1], [0, 0, 1]);
    
    const scale = interpolate(localProgress, [0, 0.8, 1], [0.5, 1.1, 1]);

    return {
      transform: [
        { translateY: translateY + yOffset },
        { scale: scale },
        { translateX: (1 - scale) * 90 },
        { translateY: (1 - scale) * 80 },
      ],
      opacity,
    };
  });

  return <AnimatedG animatedProps={animatedProps}>{children}</AnimatedG>;
};

export default function BurgerProgress({ progress }: { progress: number }) {
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withSpring(
      Math.max(0, Math.min(progress, 1)),
      SPRING_CONFIG
    );
  }, [progress]);

  const shadowProps = useAnimatedProps(() => {
    const scale = interpolate(animatedProgress.value, [0, 1], [0.8, 1.2]);
    const opacity = interpolate(animatedProgress.value, [0, 1], [0.4, 0.7]);
    return {
      rx: 75 * scale,
      ry: 15 * scale,
      opacity: opacity,
    };
  });

  return (
    // FIX 3: Added overflow: 'hidden' to the container
    <View style={styles.container}>
      <Svg width={200} height={230} viewBox="0 0 180 210">
        <Defs>
          {/* --- FOOD GRADIENTS --- */}
          <LinearGradient id="bunGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#F4A460" stopOpacity="1" />
            <Stop offset="1" stopColor="#CD853F" stopOpacity="1" />
          </LinearGradient>
          <LinearGradient id="meatGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#8B4513" stopOpacity="1" />
            <Stop offset="0.8" stopColor="#5D2906" stopOpacity="1" />
          </LinearGradient>
          <LinearGradient id="cheeseGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0.3" stopColor="#FFD700" stopOpacity="1" />
            <Stop offset="1" stopColor="#FFA500" stopOpacity="1" />
          </LinearGradient>
          <LinearGradient id="lettuceGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#32CD32" stopOpacity="1" />
            <Stop offset="1" stopColor="#228B22" stopOpacity="1" />
          </LinearGradient>
          <RadialGradient id="tomatoGrad" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0.6" stopColor="#FF6347" stopOpacity="1" />
            <Stop offset="1" stopColor="#B22222" stopOpacity="1" />
          </RadialGradient>

          {/* --- PLATE GRADIENTS --- */}
          <LinearGradient id="plateRimGrad" x1="0" y1="0" x2="0" y2="1">
             <Stop offset="0" stopColor="#FFFFFF" stopOpacity="1" />
             <Stop offset="1" stopColor="#E0E0E0" stopOpacity="1" />
          </LinearGradient>
           <RadialGradient id="plateCenterGrad" cx="50%" cy="50%" rx="50%" ry="50%">
             <Stop offset="0.7" stopColor="#F8F8F8" stopOpacity="1" />
             <Stop offset="1" stopColor="#D0D0D0" stopOpacity="1" />
          </RadialGradient>
        </Defs>

        {/* Dynamic Shadow */}
        <AnimatedEllipse cx="90" cy="195" fill="black" animatedProps={shadowProps} />

         {/* Plate */}
         <G>
           <Ellipse cx="90" cy="178" rx="85" ry="25" fill="url(#plateRimGrad)" stroke="#D0D0D0" strokeWidth="0.5" />
           <Ellipse cx="90" cy="178" rx="65" ry="18" fill="url(#plateCenterGrad)" stroke="#C0C0C0" strokeWidth="0.5" />
         </G>

        {/* --- INGREDIENTS --- */}
        <Ingredient progress={animatedProgress} range={[0, 0.15]} yOffset={160}>
          <Path d="M 40 0 L 40 10 Q 90 25, 140 10 L 140 0 Z" fill="#CD853F" />
          <Path d="M 40 0 L 40 10 Q 90 25, 140 10 L 140 0 Z" fill="url(#bunGrad)" />
        </Ingredient>

        <Ingredient progress={animatedProgress} range={[0.15, 0.35]} yOffset={155}>
          <Path d="M 30 5 Q 40 15, 50 5 Q 60 -5, 70 5 Q 80 15, 90 5 Q 100 -5, 110 5 Q 120 15, 130 5 Q 140 -5, 150 5 L 140 10 L 40 10 Z" fill="url(#lettuceGrad)" stroke="#228B22" strokeWidth="1" />
        </Ingredient>

        <Ingredient progress={animatedProgress} range={[0.35, 0.55]} yOffset={135}>
          <Rect x="40" y="0" width="100" height="20" rx="8" fill="url(#meatGrad)" />
          <Path d="M 50 2 L 60 18 M 70 2 L 80 18 M 90 2 L 100 18 M 110 2 L 120 18 M 130 2 L 140 18" stroke="rgba(0,0,0,0.3)" strokeWidth="2" />
          <Path d="M 45 4 Q 90 8, 135 4" stroke="rgba(255,255,255,0.15)" strokeWidth="3" fill="none" />
        </Ingredient>

        <Ingredient progress={animatedProgress} range={[0.55, 0.7]} yOffset={133}>
          <Path d="M 40 0 L 140 0 L 140 8 L 130 15 L 120 5 L 60 5 L 50 18 L 40 5 Z" fill="url(#cheeseGrad)" stroke="#DAA520" strokeWidth="0.5" />
        </Ingredient>

        <Ingredient progress={animatedProgress} range={[0.7, 0.85]} yOffset={125}>
          <Rect x="45" y="0" width="90" height="10" rx="3" fill="url(#tomatoGrad)" />
          <Path d="M 48 2 H 132" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" />
        </Ingredient>

        <Ingredient progress={animatedProgress} range={[0.85, 1.0]} yOffset={85}>
          <Path d="M 40 40 Q 90 0, 140 40 Z" fill="url(#bunGrad)" />
          <Path d="M 40 40 Q 90 50, 140 40" fill="none" stroke="#CD853F" strokeWidth="2" />
          <G fill="#FFE4B5">
            <Ellipse cx="70" cy="25" rx="2" ry="1" transform="rotate(-20 70 25)" />
            <Ellipse cx="90" cy="20" rx="2" ry="1" />
            <Ellipse cx="110" cy="25" rx="2" ry="1" transform="rotate(20 110 25)" />
            <Ellipse cx="60" cy="35" rx="2" ry="1" transform="rotate(-10 60 35)" />
            <Ellipse cx="120" cy="35" rx="2" ry="1" transform="rotate(10 120 35)" />
            <Ellipse cx="90" cy="10" rx="2" ry="1" transform="rotate(5 90 10)" />
          </G>
        </Ingredient>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    // This cuts off the invisible ingredients hovering above the plate
    overflow: 'hidden', 
    // Add a bit of padding so the shadow doesn't get clipped at the bottom
    paddingVertical: 10,
  },
});