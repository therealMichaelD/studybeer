import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
    Easing,
    interpolate,
    useAnimatedProps,
    useDerivedValue,
    useSharedValue,
    withRepeat,
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

// --- Configuration ---
const GLASS_WIDTH = 100;
const GLASS_HEIGHT = 120;
const GLASS_X = 40;
const GLASS_Y = 30;
const ICE_SIZE = 35;

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  progress: number; // 0.0 to 1.0
}

export default function RealisticWhiskey({ progress }: Props) {
  // --- Shared Values ---
  const fillLevel = useSharedValue(0);
  const wavePhase = useSharedValue(0);
  const wobble = useSharedValue(0);

  // --- Animation Loop ---
  useEffect(() => {
    // Continuous wave motion
    wavePhase.value = withRepeat(
      withTiming(Math.PI * 2, { duration: 2000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  useEffect(() => {
    // Handle Fill Logic
    // We map 0-1 progress to the Y coordinate of the liquid surface
    const clampedProgress = Math.min(Math.max(progress, 0), 1);
    
    // Calculate target height (0% = Bottom of glass, 100% = Top)
    // Glass Bottom Y = 150, Top Y = 30. range = 120
    const targetHeight = clampedProgress * GLASS_HEIGHT; 
    
    fillLevel.value = withSpring(targetHeight, {
      damping: 12,
      stiffness: 90,
    });

    // Add a little "impact" wobble to the ice when progress changes
    wobble.value = withSpring(Math.random() * 0.2 - 0.1, {}, () => {
      wobble.value = withSpring(0);
    });
  }, [progress]);

  // --- Wave Generator Worklet ---
  const createWavePath = (phaseOffset: number, amplitude: number) => {
    "worklet";
    const width = GLASS_WIDTH;
    const height = GLASS_HEIGHT;
    const waterHeight = fillLevel.value;
    
    // If empty, hide liquid
    if (waterHeight <= 0) return `M 0 ${GLASS_Y + height} L 0 ${GLASS_Y + height}`;

    // Base Y level of the liquid (Top surface)
    const liquidTopY = (GLASS_Y + height) - waterHeight;

    let d = `M ${GLASS_X} ${liquidTopY}`;

    // Generate Sine Wave points
    for (let x = 0; x <= width; x += 5) {
      const y =
        amplitude * Math.sin((x / width) * Math.PI * 2 + wavePhase.value + phaseOffset);
      d += ` L ${GLASS_X + x} ${liquidTopY + y}`;
    }

    // Close the path down to the bottom of the glass
    d += ` L ${GLASS_X + width} ${GLASS_Y + height}`; // Bottom Right
    d += ` L ${GLASS_X} ${GLASS_Y + height}`;         // Bottom Left
    d += " Z";
    return d;
  };

  // --- Props ---
  const backWaveProps = useAnimatedProps(() => ({
    d: createWavePath(1.5, 3), // Phase offset, Amplitude
  }));

  const frontWaveProps = useAnimatedProps(() => ({
    d: createWavePath(0, 5),
  }));

  // --- Ice Cube Physics ---
  const iceStyle = useAnimatedProps(() => {
    // 1. Calculate Liquid Top Y
    const currentLiquidHeight = fillLevel.value;
    const glassBottom = GLASS_Y + GLASS_HEIGHT;
    const liquidTop = glassBottom - currentLiquidHeight;

    // 2. Ice Target Y
    // Ice floats. It wants to be roughly 60% submerged.
    // However, it cannot go below the glass bottom.
    let iceTargetY = liquidTop - (ICE_SIZE * 0.3); // Float offset
    
    // Clamp to bottom of glass
    const maxIceY = glassBottom - ICE_SIZE - 5; // 5px padding
    if (iceTargetY > maxIceY) iceTargetY = maxIceY;

    // 3. Rotation
    // Rotate slightly based on the wave phase to make it look like it's bobbing
    const rotation = Math.sin(wavePhase.value) * 5 + (wobble.value * 100);

    return {
      transform: [
        { translateX: GLASS_X + GLASS_WIDTH / 2 - ICE_SIZE / 2 }, // Center X
        { translateY: iceTargetY },
        { rotate: `${rotation}deg` }
      ],
    };
  });
  
  // --- Bubble Animation ---
  // Simple bubbles rising
  const bubbleY = useDerivedValue(() => {
    return interpolate(Math.sin(wavePhase.value * 2), [-1, 1], [0, -40]);
  });

  const bubbleProps = useAnimatedProps(() => {
     // Only show bubbles if there is liquid
     const opacity = fillLevel.value > 20 ? 0.4 : 0;
     const glassBottom = GLASS_Y + GLASS_HEIGHT;
     const liquidTop = glassBottom - fillLevel.value;
     
     return {
         cy: (glassBottom - 20) + bubbleY.value,
         opacity: opacity
     }
  });

  return (
    <View style={styles.container}>
      <Svg width={180} height={180} viewBox="0 0 180 180">
        <Defs>
          <ClipPath id="glassClip">
            <Rect x={GLASS_X} y={GLASS_Y} width={GLASS_WIDTH} height={GLASS_HEIGHT} rx="6" />
          </ClipPath>
          
          {/* Deep Amber Gradient */}
          <LinearGradient id="whiskeyGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#dba345" stopOpacity="0.9" />
            <Stop offset="0.5" stopColor="#a36b1d" stopOpacity="0.95" />
            <Stop offset="1" stopColor="#4f2e05" stopOpacity="1" />
          </LinearGradient>

           {/* Back Wave Gradient (Darker) */}
           <LinearGradient id="whiskeyDark" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#a36b1d" stopOpacity="0.8" />
            <Stop offset="1" stopColor="#3d2203" stopOpacity="0.9" />
          </LinearGradient>
          
           {/* Glass Shine */}
           <LinearGradient id="glassShine" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="white" stopOpacity="0.1" />
            <Stop offset="0.2" stopColor="white" stopOpacity="0.0" />
            <Stop offset="0.8" stopColor="white" stopOpacity="0.0" />
            <Stop offset="1" stopColor="white" stopOpacity="0.2" />
          </LinearGradient>
        </Defs>

        {/* --- 1. Glass Background (Thickness) --- */}
        <Rect
          x={GLASS_X - 2}
          y={GLASS_Y - 2}
          width={GLASS_WIDTH + 4}
          height={GLASS_HEIGHT + 4}
          rx="8"
          fill="#fff"
          fillOpacity="0.1"
        />
        
         {/* Glass Bottom (Thick Base) */}
         <Rect
          x={GLASS_X}
          y={GLASS_Y + GLASS_HEIGHT - 15}
          width={GLASS_WIDTH}
          height={15}
          rx="6"
          fill="#fff"
          fillOpacity="0.2"
          clipPath="url(#glassClip)"
        />

        {/* --- 2. Liquid Layer --- */}
        <G clipPath="url(#glassClip)">
          
          {/* Back Wave (Darker, provides depth) */}
          <AnimatedPath animatedProps={backWaveProps} fill="url(#whiskeyDark)" />

          {/* Ice Cube (Floating) */}
          <AnimatedG animatedProps={iceStyle}>
             <Rect 
                width={ICE_SIZE} 
                height={ICE_SIZE} 
                rx="4" 
                fill="#fff" 
                fillOpacity="0.3" 
                stroke="#fff" 
                strokeWidth="1" 
                strokeOpacity="0.6" 
            />
            {/* Ice Highlight */}
             <Rect x="5" y="5" width={ICE_SIZE-10} height={ICE_SIZE-10} rx="2" fill="#fff" fillOpacity="0.2" />
          </AnimatedG>
          
          {/* Front Wave (Main Color) */}
          <AnimatedPath animatedProps={frontWaveProps} fill="url(#whiskeyGradient)" />
          
          {/* Bubbles */}
          <AnimatedCircle cx={GLASS_X + 30} r="2" fill="#fff" fillOpacity="0.3" animatedProps={bubbleProps} />
          <AnimatedCircle cx={GLASS_X + 70} r="3" fill="#fff" fillOpacity="0.2" animatedProps={bubbleProps} />

        </G>

        {/* --- 3. Glass Highlights & Rim --- */}
        {/* Main Glass Outline */}
        <Rect
          x={GLASS_X}
          y={GLASS_Y}
          width={GLASS_WIDTH}
          height={GLASS_HEIGHT}
          rx="6"
          stroke="white"
          strokeWidth="2"
          strokeOpacity="0.3"
          fill="url(#glassShine)"
        />
        
        {/* Specular Highlight (The "shiny" line on the left) */}
        <Rect
            x={GLASS_X + 5}
            y={GLASS_Y + 10}
            width={6}
            height={GLASS_HEIGHT - 30}
            rx="3"
            fill="white"
            fillOpacity="0.15"
        />

      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    height: 180,
  },
});