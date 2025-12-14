import React, { useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  Extrapolate,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

// --- Constants ---
const MUG_WIDTH = 140;
const MUG_HEIGHT = 200;
const GLASS_THICKNESS = 8;
const LIQUID_COLOR = "rgba(235, 168, 50, 0.95)"; // Deep Amber
const LIQUID_HIGHLIGHT = "rgba(255, 215, 100, 0.6)"; // Inner Gold Glow
const GLASS_COLOR = "rgba(255, 255, 255, 0.25)";
const CONDENSATION_COLOR = "rgba(255, 255, 255, 0.4)";

type Props = {
  progress: number; // 0 -> 1
};

// --- Helper Component: Individual Rising Bubble ---
const RandomBubble = ({ index }: { index: number }) => {
  const yVal = useSharedValue(0);
  const xVal = useSharedValue(0);
  const size = 4 + Math.random() * 6; // Random size 4-10px
  const duration = 2000 + Math.random() * 2000; // Random speed
  const startDelay = Math.random() * 2000;
  const initialX = Math.random() * (MUG_WIDTH - 40);

  useEffect(() => {
    yVal.value = withDelay(
      startDelay,
      withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1, false)
    );
    // Side-to-side wiggle
    xVal.value = withRepeat(
      withSequence(
        withTiming(1, { duration: duration / 4 }),
        withTiming(-1, { duration: duration / 4 })
      ),
      -1,
      true
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    bottom: 0,
    left: initialX,
    width: size,
    height: size,
    opacity: interpolate(yVal.value, [0, 0.2, 0.9, 1], [0, 1, 1, 0]),
    transform: [
      { translateY: interpolate(yVal.value, [0, 1], [0, -180]) },
      { translateX: xVal.value * (Math.random() * 10) }, // Wiggle amount
    ],
  }));

  return <Animated.View style={[styles.bubble, style]} />;
};

// --- Helper Component: Condensation Droplet ---
const Droplet = ({ x, y, size }: { x: number; y: number; size: number }) => (
  <View
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: CONDENSATION_COLOR,
    }}
  />
);

export default function RealisticBeer({ progress }: Props) {
  const fill = useSharedValue(progress);
  const tilt = useSharedValue(0); // The rotation of the mug
  const foamBreath = useSharedValue(1);

  // Generate bubbles and droplets once
  const bubbles = useMemo(() => Array.from({ length: 12 }), []);
  const droplets = useMemo(() => {
    return Array.from({ length: 15 }).map(() => ({
      x: Math.random() * (MUG_WIDTH - 20),
      y: Math.random() * (MUG_HEIGHT - 60) + 40,
      size: Math.random() * 4 + 2,
    }));
  }, []);

  useEffect(() => {
    // 1. Fill Animation
    fill.value = withTiming(progress, {
      duration: 1200,
      easing: Easing.out(Easing.cubic),
    });

    // 2. Realistic "Clink" Tilt Animation
    // When progress updates (beer arrives), the mug "clinks" or settles
    tilt.value = withSequence(
      withTiming(5, { duration: 150 }), // Tilt right
      withTiming(-3, { duration: 150 }), // Correction left
      withTiming(1, { duration: 200 }), // Slight settle
      withTiming(0, { duration: 400 }) // Back to center
    );
  }, [progress]);

  // Foam ambient breathing
  useEffect(() => {
    foamBreath.value = withRepeat(
      withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  // --- Animated Styles ---

  const mugStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${tilt.value}deg` },
      { scale: interpolate(fill.value, [0, 1], [0.95, 1]) }, // Subtle scale up on fill
    ],
  }));

  // The liquid needs to counter-rotate to stay level (Physics)
  // We use `overflow: visible` on the liquid container usually, but here we mask it.
  const liquidHeightStyle = useAnimatedStyle(() => ({
    height: interpolate(fill.value, [0, 1], [0, MUG_HEIGHT - 25], Extrapolate.CLAMP),
    // When mug tilts right (positive), liquid surface tilts left (negative) relative to mug
    transform: [{ rotate: `${-tilt.value}deg` }, { scale: 1.05 }], // Scale covers edges during rotation
  }));

  const foamStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: foamBreath.value }, { scaleX: foamBreath.value }],
    opacity: fill.value > 0.1 ? 1 : 0, // Hide foam when empty
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.mugWrapper, mugStyle]}>
        
        {/* --- HANDLE --- */}
        {/* Placed behind the glass for depth */}
        <View style={styles.handleContainer}>
          <View style={styles.handleGlass} />
          <View style={styles.handleHighlight} />
        </View>

        {/* --- GLASS BODY --- */}
        <View style={styles.glassBody}>
          
          {/* 1. Background (Thickness of glass) */}
          <View style={styles.glassThickness} />

          {/* 2. Liquid Container (Masked) */}
          <View style={styles.liquidMask}>
            <Animated.View style={[styles.liquidContent, liquidHeightStyle]}>
              
              {/* Deep Amber Base */}
              <View style={styles.liquidBase}>
                {/* Inner lighter glow for volume */}
                <View style={styles.liquidGlow} />
              </View>

              {/* Rising Bubbles */}
              <View style={styles.bubbleContainer}>
                {bubbles.map((_, i) => (
                  <RandomBubble key={i} index={i} />
                ))}
              </View>

              {/* FOAM HEAD (Irregular shapes) */}
              <Animated.View style={[styles.foamContainer, foamStyle]}>
                <View style={[styles.foamCircle, { left: -10, width: 60, height: 40 }]} />
                <View style={[styles.foamCircle, { left: 30, width: 70, height: 45, top: -5 }]} />
                <View style={[styles.foamCircle, { left: 80, width: 50, height: 35 }]} />
                {/* Foam drip/lacing */}
                <View style={[styles.foamLace, { left: 10, height: 15 }]} />
                <View style={[styles.foamLace, { right: 20, height: 10 }]} />
              </Animated.View>

            </Animated.View>
          </View>

          {/* 3. Glass Highlights & Texture (Overlay) */}
          <View style={styles.glassHighlights}>
             <View style={styles.specularHighlightLeft} />
             <View style={styles.specularHighlightRight} />
             
             {/* Condensation Droplets */}
             {droplets.map((d, i) => (
               <Droplet key={i} {...d} />
             ))}
          </View>

        </View>

        {/* --- BASE --- */}
        <View style={styles.glassBase} />
        
      </Animated.View>

      {/* Shadow under the mug */}
      <View style={styles.shadow} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },
  mugWrapper: {
    width: MUG_WIDTH,
    height: MUG_HEIGHT,
    justifyContent: "flex-end",
    alignItems: "center",
  },

  // --- HANDLE ---
  handleContainer: {
    position: "absolute",
    right: -45,
    top: 40,
    width: 60,
    height: 90,
    zIndex: -1, // Behind the mug
  },
  handleGlass: {
    flex: 1,
    borderWidth: 12,
    borderColor: "rgba(255,255,255,0.4)",
    borderRadius: 30,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  handleHighlight: {
    position: "absolute",
    top: 10,
    right: 12,
    width: 4,
    height: 70,
    backgroundColor: "rgba(255,255,255,0.5)",
    borderRadius: 2,
  },

  // --- GLASS STRUCTURE ---
  glassBody: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)", // Very subtle fill
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
    borderBottomWidth: 0, // The base handles the bottom
    overflow: "hidden",
    position: "relative",
  },
  glassThickness: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: GLASS_THICKNESS,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 10,
  },
  glassBase: {
    position: "absolute",
    bottom: -15,
    width: MUG_WIDTH + 4,
    height: 30,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 10,
    borderTopWidth: 0,
  },

  // --- LIQUID ---
  liquidMask: {
    position: "absolute",
    bottom: 15, // Offset for the heavy glass bottom
    left: GLASS_THICKNESS,
    right: GLASS_THICKNESS,
    top: 10,
    borderRadius: 4,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  liquidContent: {
    width: "100%",
    justifyContent: "flex-start", // Start drawing from top (foam)
  },
  liquidBase: {
    flex: 1, // Fills the animated height
    backgroundColor: LIQUID_COLOR,
    width: "200%", // Wide to allow rotation without showing edges
    marginLeft: "-50%",
    position: "relative",
  },
  liquidGlow: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: "25%",
    right: "25%",
    backgroundColor: LIQUID_HIGHLIGHT,
    opacity: 0.5,
    filter: 'blur(10px)', // Note: Blur works on some versions, otherwise opacity handles it
  },

  // --- BUBBLES ---
  bubbleContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    overflow: 'hidden',
  },
  bubble: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 10,
  },

  // --- FOAM ---
  foamContainer: {
    height: 40,
    width: "140%", // Wider to cover rotation
    left: "-20%",
    position: "absolute",
    top: -30, // Sit on top of liquid
    zIndex: 20,
    flexDirection: 'row',
  },
  foamCircle: {
    position: 'absolute',
    backgroundColor: "#FFFCF5",
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  foamLace: {
    position: "absolute",
    top: 30,
    width: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.8)",
  },

  // --- HIGHLIGHTS ---
  glassHighlights: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 30,
  },
  specularHighlightLeft: {
    position: "absolute",
    left: 14,
    top: 20,
    bottom: 40,
    width: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 5,
  },
  specularHighlightRight: {
    position: "absolute",
    right: 14,
    top: 20,
    bottom: 40,
    width: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 5,
  },

  // --- SHADOW ---
  shadow: {
    marginTop: 20,
    width: MUG_WIDTH - 20,
    height: 12,
    borderRadius: 50,
    backgroundColor: "rgba(0,0,0,0.2)",
    transform: [{ scaleY: 0.5 }],
  },
});