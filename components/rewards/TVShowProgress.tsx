import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
    Easing,
    interpolate,
    useAnimatedProps,
    useDerivedValue,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from "react-native-reanimated";
import Svg, {
    Circle,
    ClipPath,
    Defs,
    G,
    LinearGradient,
    Path,
    Pattern,
    RadialGradient,
    Rect,
    Stop,
} from "react-native-svg";

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedG = Animated.createAnimatedComponent(G);

export default function TVShowProgress({ progress }: { progress: number }) {
  // 0.0 to 1.0 smooth progress
  const progressVal = useDerivedValue(() => {
    return withTiming(progress, { duration: 700, easing: Easing.out(Easing.cubic) });
  });

  // Random noise jitter for the static effect
  const noiseJitter = useSharedValue(0);

  useEffect(() => {
    // Continuous static noise animation loop
    noiseJitter.value = withRepeat(
      withSequence(
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(5, { duration: 50 }),
        withTiming(-5, { duration: 50 })
      ),
      -1,
      true
    );
  }, []);

  // 1. Knob Rotation
  const knobRotation = useDerivedValue(() => {
    return interpolate(progressVal.value, [0, 1], [0, 180]); // Rotate 180 deg
  });

  // ✅ FIX: Use translateX/Y to position, instead of originX/Y inside transform
  const knob1Props = useAnimatedProps(() => {
    return {
      transform: [
        { translateX: 155 }, // Move to position X
        { translateY: 55 },  // Move to position Y
        { rotate: `${knobRotation.value}deg` }, // Rotate in place (since local coords are 0,0)
      ],
    };
  });

  // 2. Screen Logic
  const staticOpacity = useDerivedValue(() => {
    return interpolate(progressVal.value, [0, 0.8], [0.9, 0]); 
  });

  const contentOpacity = useDerivedValue(() => {
    return interpolate(progressVal.value, [0, 0.3], [0, 1]); 
  });

  // The "Vertical Hold" effect - image slides into place
  const vHold = useDerivedValue(() => {
    return interpolate(progressVal.value, [0, 1], [20, 0]); 
  });

  const contentProps = useAnimatedProps(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: vHold.value }]
  }));

  const staticProps = useAnimatedProps(() => ({
    opacity: staticOpacity.value,
    x: noiseJitter.value, 
    y: noiseJitter.value, 
  }));

  // 3. Antenna "Happy" Bounce
  const antennaBounce = useDerivedValue(() => {
    return progressVal.value >= 1 ? -30 : -20;
  });
  
  const antennaProps = useAnimatedProps(() => {
     return {
        d: `M 60 10 L 30 ${antennaBounce.value} M 120 10 L 150 ${antennaBounce.value}`
     }
  });

  return (
    <View style={styles.container}>
      <Svg width={220} height={200} viewBox="0 0 220 200">
        <Defs>
          {/* Wood Gradient */}
          <LinearGradient id="woodGrain" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#8B4513" />
            <Stop offset="50%" stopColor="#A0522D" />
            <Stop offset="100%" stopColor="#5c3317" />
          </LinearGradient>
          
          {/* CRT Glass Reflection Gradient */}
          <LinearGradient id="glassGlare" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="white" stopOpacity="0.4" />
            <Stop offset="50%" stopColor="white" stopOpacity="0" />
          </LinearGradient>

          {/* CRT Inner Glow */}
          <RadialGradient id="crtGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="70%" stopColor="#000" stopOpacity="0" />
            <Stop offset="100%" stopColor="#000" stopOpacity="0.6" />
          </RadialGradient>

          {/* Static Noise Pattern */}
          <Pattern id="staticNoise" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
            <Rect x="0" y="0" width="2" height="2" fill="#111" />
            <Rect x="2" y="2" width="2" height="2" fill="#333" />
            <Rect x="2" y="0" width="2" height="2" fill="#eee" />
            <Rect x="0" y="2" width="2" height="2" fill="#999" />
          </Pattern>

          {/* Scanlines Pattern */}
          <Pattern id="scanlines" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
            <Rect x="0" y="0" width="4" height="1" fill="black" opacity="0.2" />
          </Pattern>
          
          <ClipPath id="screenShape">
            <Rect x="30" y="30" width="130" height="100" rx="15" />
          </ClipPath>
        </Defs>

        {/* --- ANTENNAS --- */}
        <AnimatedPath 
          animatedProps={antennaProps}
          stroke="#444" strokeWidth="4" strokeLinecap="round" 
        />
        <Circle cx="30" cy="-20" r="4" fill="silver" />
        <Circle cx="150" cy="-20" r="4" fill="silver" />

        {/* --- TV CHASSIS --- */}
        <Rect x="5" y="15" width="180" height="140" rx="24" fill="#3e2723" opacity="0.5" /> 
        <Rect x="10" y="10" width="180" height="140" rx="20" fill="url(#woodGrain)" stroke="#3e2723" strokeWidth="4" />
        
        {/* Control Panel Area */}
        <Rect x="145" y="30" width="35" height="100" rx="5" fill="#222" opacity="0.2" />

        {/* --- SCREEN AREA --- */}
        <G clipPath="url(#screenShape)">
            <Rect x="30" y="30" width="130" height="100" fill="#1a1a1a" />

            {/* The Show (Content) */}
            <AnimatedG animatedProps={contentProps}>
                <Rect x="30" y="30" width="130" height="100" fill="#87ceeb" />
                <Circle cx="130" cy="55" r="18" fill="#ffd700" />
                
                {/* Clouds */}
                <Circle cx="50" cy="50" r="12" fill="white" opacity="0.8" />
                <Circle cx="65" cy="55" r="15" fill="white" opacity="0.8" />
                <Circle cx="80" cy="50" r="12" fill="white" opacity="0.8" />

                {/* Mountains */}
                <Path d="M 20 140 L 60 70 L 100 140 Z" fill="#6B8E23" />
                <Path d="M 70 140 L 110 50 L 160 140 Z" fill="#228b22" />
                {/* Snow caps */}
                <Path d="M 60 70 L 52 84 L 60 88 L 68 84 Z" fill="white" />
                <Path d="M 110 50 L 100 70 L 110 75 L 120 70 Z" fill="white" />
            </AnimatedG>

            {/* Static / Noise Layer */}
            <AnimatedRect 
                x="0" y="0" width="200" height="200" 
                fill="url(#staticNoise)" 
                animatedProps={staticProps} 
            />

            {/* Scanlines Overlay */}
            <Rect x="30" y="30" width="130" height="100" fill="url(#scanlines)" />

            {/* Vignette */}
            <Rect x="30" y="30" width="130" height="100" fill="url(#crtGlow)" />
        </G>

        {/* --- OVERLAYS --- */}
        <Path d="M 35 35 L 155 35 L 140 55 L 45 55 Z" fill="url(#glassGlare)" />
        <Path d="M 150 100 L 158 120 L 150 125 Z" fill="white" opacity="0.1" />

        {/* --- CONTROLS --- */}
        <Rect x="75" y="125" width="40" height="8" rx="2" fill="#c0c0c0" />
        <Rect x="76" y="126" width="38" height="6" rx="1" fill="#111" />

        {/* Animated Knob */}
        {/* We center the knob content at 0,0 so rotation works, then transform moves it to 155,55 */}
        <AnimatedG animatedProps={knob1Props}>
            <Circle cx="0" cy="0" r="10" fill="#222" stroke="#111" strokeWidth="2" />
            <Rect x="-2" y="-8" width="4" height="8" fill="#555" rx="1" />
        </AnimatedG>

        {/* Second Knob (Static) */}
        <Circle cx="155" cy="95" r="8" fill="#222" stroke="#111" strokeWidth="2" />
        <Rect x="153" y="89" width="4" height="6" fill="#555" rx="1" />

        {/* Speaker Grille */}
        <Rect x="150" y="115" width="25" height="2" rx="1" fill="#111" opacity="0.5" />
        <Rect x="150" y="120" width="25" height="2" rx="1" fill="#111" opacity="0.5" />
        <Rect x="150" y="125" width="25" height="2" rx="1" fill="#111" opacity="0.5" />

      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
});