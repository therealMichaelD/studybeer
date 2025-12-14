import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
    interpolate,
    useAnimatedProps,
    useSharedValue,
    withSequence,
    withSpring,
    withTiming
} from "react-native-reanimated";
import Svg, {
    Circle,
    ClipPath,
    Defs,
    G,
    LinearGradient,
    Path,
    Rect,
    Stop
} from "react-native-svg";

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedG = Animated.createAnimatedComponent(G);

interface IceCreamProgressProps {
  progress: number; // 0.0 to 1.0
}

export default function IceCreamProgress({ progress }: IceCreamProgressProps) {
  // 1. The Fill Level (Height of the mask)
  const fillHeight = useSharedValue(0);
  
  // 2. Scale for the whole ice cream (for a breathing/pulse effect)
  const scale = useSharedValue(1);

  // 3. Cherry Scale (Only appears at 100%)
  const cherryScale = useSharedValue(0);

  useEffect(() => {
    // Clamp progress between 0 and 1
    const clamped = Math.max(0, Math.min(progress, 1));

    // Calculate height (180 is total height, we want to reveal from bottom up)
    // We map 0-1 to SVG coordinates.
    // SVG Bottom is 180, Top is 0.
    const targetHeight = clamped * 180;
    
    fillHeight.value = withSpring(targetHeight, {
      damping: 18,
      stiffness: 90,
    });

    // Pulse effect: slightly scale up when progress changes, then settle
    scale.value = withSequence(
        withTiming(1.05, { duration: 100 }),
        withSpring(1, { damping: 10 })
    );

    // "Cherry on top" logic: Only show if fully complete
    if (clamped >= 0.98) {
      cherryScale.value = withSpring(1, { damping: 12, stiffness: 200 });
    } else {
      cherryScale.value = withTiming(0, { duration: 200 });
    }

  }, [progress]);

  // Animate the Mask Rectangle
  const maskProps = useAnimatedProps(() => {
    // The rect needs to grow from y=180 upwards.
    // If fillHeight is 50, y should be 180 - 50 = 130, height = 50.
    return {
      y: 180 - fillHeight.value,
      height: fillHeight.value,
    };
  });

  // Animate the entire group scaling (breathing effect)
  const groupTransform = useAnimatedProps(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  // Animate Cherry popping in
  const cherryProps = useAnimatedProps(() => {
    return {
        r: interpolate(cherryScale.value, [0, 1], [0, 8]), // Radius 0 to 8
    };
  });

  return (
    <View style={styles.container}>
      <Svg width={200} height={200} viewBox="0 0 100 180">
        <Defs>
          {/* Gradient for the Cone to give it 3D rounding */}
          <LinearGradient id="coneGradient" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor="#d2691e" stopOpacity="0.8" />
            <Stop offset="50%" stopColor="#f4a460" stopOpacity="1" />
            <Stop offset="100%" stopColor="#d2691e" stopOpacity="0.8" />
          </LinearGradient>

          {/* Gradient for Ice Cream (Strawberry/Vanilla mix) */}
          <LinearGradient id="creamGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#ffb6c1" />
            <Stop offset="100%" stopColor="#ffe4e1" />
          </LinearGradient>

          {/* The Revealing Mask */}
          <ClipPath id="fillClip">
            <AnimatedRect x="0" width="100" animatedProps={maskProps} />
          </ClipPath>
        </Defs>

        {/* --- BACKGROUND LAYER (Greyed out / Empty State) --- */}
        <G opacity={0.2}>
             {/* Cone Shape */}
            <Path 
                d="M 30 100 L 50 175 L 70 100 Z" 
                fill="#ccc" 
            />
            {/* Scoops Shape */}
            <Path 
                d="M 30 100 Q 20 80 35 70 Q 25 50 50 45 Q 75 50 65 70 Q 80 80 70 100 Z" 
                fill="#e0e0e0" 
            />
        </G>

        {/* --- FOREGROUND LAYER (Animated Reveal) --- */}
        <AnimatedG clipPath="url(#fillClip)" animatedProps={groupTransform} originX="50" originY="110">
          
          {/* 1. Realistic Waffle Cone */}
          <Path 
            d="M 30 100 L 50 175 L 70 100 Z" 
            fill="url(#coneGradient)" 
            stroke="#8b4513" 
            strokeWidth="1"
            strokeLinejoin="round"
          />
          {/* Cone Waffle Pattern Details */}
          <Path 
            d="M 35 120 L 65 120 M 40 140 L 60 140 M 45 160 L 55 160" 
            stroke="rgba(139, 69, 19, 0.3)" 
            strokeWidth="1" 
          />
          <Path 
            d="M 40 100 L 50 175 M 60 100 L 50 175" 
            stroke="rgba(139, 69, 19, 0.3)" 
            strokeWidth="1" 
          />

          {/* 2. Soft/Melting Ice Cream Scoops */}
          {/* Note: Drawn as a single complex path to look like they are melting into each other */}
          <Path 
            d="M 28 100 
               C 20 100, 15 80, 35 75 
               C 25 60, 35 40, 50 35 
               C 65 40, 75 60, 65 75 
               C 85 80, 80 100, 72 100 
               Q 50 105, 28 100 Z"
            fill="url(#creamGradient)"
          />
          
          {/* Texture/Highlights on Ice Cream */}
          <Path d="M 40 50 Q 50 45 60 50" stroke="#fff" strokeWidth="2" strokeOpacity="0.5" strokeLinecap="round" />
          <Path d="M 35 85 Q 45 80 50 85" stroke="#fff" strokeWidth="2" strokeOpacity="0.5" strokeLinecap="round" />

          {/* 3. Sprinkles (Random bits) */}
          <G fill="#FFD700"> 
             <Rect x="45" y="60" width="2" height="4" transform="rotate(20 45 60)" rx="1" />
             <Rect x="55" y="70" width="2" height="4" transform="rotate(-15 55 70)" rx="1" fill="#87CEEB"/>
             <Rect x="50" y="50" width="2" height="4" transform="rotate(45 50 50)" rx="1" fill="#FF69B4"/>
             <Rect x="40" y="75" width="2" height="4" transform="rotate(10 40 75)" rx="1" fill="#32CD32"/>
             <Rect x="60" y="55" width="2" height="4" transform="rotate(90 60 55)" rx="1" />
          </G>

          {/* 4. The "Cherry on Top" (Animated Scale) */}
          <AnimatedCircle 
            cx="50" 
            cy="30" 
            fill="#D90000" 
            animatedProps={cherryProps}
          />
          {/* Cherry Stem (Part of the same reveal logic, simplified visually) */}
          <Path d="M 50 30 Q 55 20 60 15" stroke="#2e8b57" strokeWidth="2" opacity={progress >= 0.98 ? 1 : 0} />
          {/* Cherry Shine */}
          <Circle cx="48" cy="28" r="2" fill="white" opacity={progress >= 0.98 ? 0.6 : 0} />

        </AnimatedG>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    // Optional: Add a shadow to the whole component for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
});