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
    Ellipse,
    G,
    LinearGradient,
    Path,
    RadialGradient,
    Stop,
} from "react-native-svg";

// --- Constants ---
const GLASS_WIDTH = 200;
const GLASS_HEIGHT = 240;

// --- Animated Components ---
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  progress: number; // Expects a value between 0 and 1
}

// --- Worklet: Generate Sine Wave Path ---
const createWavePath = (
  fillHeight: number,
  phase: number,
  amplitude: number,
  glassWidth: number
) => {
  "worklet";
  // 140 is the Y-coordinate of the bottom tip of the glass
  const startY = 140 - fillHeight;
  const step = 20; 
  let d = `M 0 ${startY}`;
  
  // Create the wave across the top surface
  for (let x = 0; x <= glassWidth; x += step) {
    const y = startY + Math.sin((x / 30) + phase) * amplitude;
    d += ` L ${x} ${y}`;
  }
  
  // Close the shape (Sides down to bottom tip)
  d += ` L ${glassWidth} 140 L 0 140 Z`;
  return d;
};

export default function RealisticMartini({ progress }: Props) {
  // --- Shared Values ---
  const fillLevel = useSharedValue(0); // Height of liquid in pixels
  const wavePhase = useSharedValue(0); // For the wave animation
  const waveAmp = useSharedValue(0);   // Amplitude (roughness) of the wave
  const bubbles = [useSharedValue(0), useSharedValue(0), useSharedValue(0)];

  // --- Effect 1: Handle Progress & Filling Physics ---
  useEffect(() => {
    // 1. Clamp progress between 0 and 1 to prevent overflow errors
    const safeProgress = Math.min(Math.max(progress, 0), 1);
    
    // 2. Calculate target height (Max liquid height is approx 90px)
    const targetHeight = safeProgress * 90;

    // 3. Trigger a "Slosh" effect when progress changes
    if (safeProgress > 0) {
      waveAmp.value = withSequence(
        withTiming(5, { duration: 100 }), // Splash up
        withSpring(2, { damping: 5, stiffness: 80 }), // Settle
        withTiming(0.5, { duration: 2000 }) // Return to calm
      );
    }

    // 4. Animate the liquid level
    fillLevel.value = withSpring(targetHeight, {
      damping: 15,
      stiffness: 90,
    });
  }, [progress]);

  // --- Effect 2: Continuous Ambient Animations ---
  useEffect(() => {
    // Constant gentle wave movement
    wavePhase.value = withRepeat(
      withTiming(Math.PI * 4, { duration: 4000, easing: Easing.linear }),
      -1,
      false
    );

    // Bubbles rising in a loop
    bubbles.forEach((b, i) => {
      b.value = withDelay(
        i * 600,
        withRepeat(
            withTiming(1, { duration: 2000 + i * 500, easing: Easing.in(Easing.quad) }),
            -1,
            false
        )
      );
    });
  }, []);

  // --- Animated Props ---
  
  // Updates the SVG Path data for the liquid
  const liquidPathProps = useAnimatedProps(() => {
    return {
      d: createWavePath(fillLevel.value, wavePhase.value, waveAmp.value, 180),
    };
  });

  // Moves the Olive to float on top of the wave
  const oliveGroupProps = useAnimatedProps(() => {
    const currentY = 140 - fillLevel.value;
    // Calculate wave offset at center (x=90)
    const waveYOffset = Math.sin((90 / 30) + wavePhase.value) * waveAmp.value;
    // Calculate tilt based on wave slope
    const slope = Math.cos((90 / 30) + wavePhase.value) * waveAmp.value;

    return {
      transform: [
        { translateX: 90 },
        { translateY: currentY + waveYOffset }, 
        { rotate: `${slope * 5}deg` }
      ],
    };
  });

  return (
    <View style={styles.container}>
      <Svg width={GLASS_WIDTH} height={GLASS_HEIGHT} viewBox="0 0 180 220">
        <Defs>
          {/* Clips the liquid to the triangle shape of the glass */}
          <ClipPath id="coneClip">
            <Path d="M 20 50 L 160 50 L 90 140 Z" />
          </ClipPath>

          <LinearGradient id="glassBody" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#aaccff" stopOpacity="0.1" />
            <Stop offset="0.2" stopColor="#aaccff" stopOpacity="0.05" />
            <Stop offset="0.8" stopColor="#aaccff" stopOpacity="0.05" />
            <Stop offset="1" stopColor="#aaccff" stopOpacity="0.3" />
          </LinearGradient>

          <LinearGradient id="liquidGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#d4f1f9" stopOpacity="0.9" />
            <Stop offset="1" stopColor="#5dade2" stopOpacity="0.85" />
          </LinearGradient>

          <RadialGradient id="oliveGrad" cx="30%" cy="30%" rx="50%" ry="50%">
            <Stop offset="0" stopColor="#dbe86f" />
            <Stop offset="1" stopColor="#556b2f" />
          </RadialGradient>
        </Defs>

        {/* --- LAYER 1: Back of Glass --- */}
        <Path 
          d="M 20 50 L 160 50 L 90 140 Z" 
          fill="url(#glassBody)" 
          stroke="rgba(255,255,255,0.2)" 
          strokeWidth="1"
        />

        {/* --- LAYER 2: Liquid & Bubbles --- */}
        <G clipPath="url(#coneClip)">
          <AnimatedPath
            fill="url(#liquidGrad)"
            animatedProps={liquidPathProps}
          />
          
          {bubbles.map((b, i) => {
            const bubbleProps = useAnimatedProps(() => {
              const bubbleY = 140 - (b.value * 80); // Rise from bottom
              const liquidY = 140 - fillLevel.value;
              
              // Fade out if bubble goes above liquid line
              const opacity = bubbleY > liquidY ? interpolate(b.value, [0, 1], [0.8, 0]) : 0;
              
              return {
                cy: bubbleY,
                opacity: opacity,
              };
            });
            return (
              <AnimatedCircle 
                key={i} 
                cx={90 + (i - 1) * 20}
                r={2 + i} 
                fill="rgba(255,255,255,0.4)" 
                animatedProps={bubbleProps} 
              />
            );
          })}
        </G>

        {/* --- LAYER 3: The Olive --- */}
        <AnimatedG animatedProps={oliveGroupProps}>
          {/* Toothpick */}
          <Path d="M -25 -25 L 5 5" stroke="#e0c095" strokeWidth="2" strokeLinecap="round" />
          {/* Main Olive Body */}
          <Circle cx="0" cy="0" r="11" fill="url(#oliveGrad)" />
          {/* Pimento */}
          <Circle cx="4" cy="2" r="3.5" fill="#d94e36" opacity={0.9} />
          {/* Reflection */}
          <Ellipse cx="-3" cy="-3" rx="4" ry="2" fill="white" opacity={0.3} transform="rotate(-45)" />
        </AnimatedG>

        {/* --- LAYER 4: Glass Foreground (Stem, Base, Highlights) --- */}
        <Path d="M 90 140 L 90 200" stroke="rgba(255,255,255,0.6)" strokeWidth="6" />
        <Path d="M 50 200 Q 90 190 130 200" stroke="rgba(255,255,255,0.6)" strokeWidth="4" strokeLinecap="round" />
        <Ellipse cx="90" cy="200" rx="40" ry="5" fill="rgba(255,255,255,0.1)" />
        
        {/* Rim */}
        <Path d="M 20 50 L 160 50" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round" />
        
        {/* Highlights/Reflections */}
        <Path 
            d="M 125 55 L 100 110" 
            stroke="white" 
            strokeWidth="3" 
            strokeOpacity="0.15" 
            strokeLinecap="round" 
        />
         <Path 
            d="M 35 55 L 45 80" 
            stroke="white" 
            strokeWidth="1.5" 
            strokeOpacity="0.3" 
            strokeLinecap="round" 
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    height: 250,
  },
});