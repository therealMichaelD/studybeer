import React, { useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSpring,
} from "react-native-reanimated";
import Svg, {
    Circle,
    Defs,
    Ellipse,
    G,
    Path,
    RadialGradient,
    Stop
} from "react-native-svg";

interface Props {
  progress: number;
}

const TOTAL_SLICES = 6;
const RADIUS = 70; // Radius of the pizza
// Viewbox needs to be big enough to hold the pizza + borders
const VIEW_SIZE = RADIUS * 2.5; 

// --- Colors ---
const COLORS = {
  crustBase: "#e09f57",
  crustBurn: "#bf7e45",
  cheeseLight: "#fffaeb",
  cheeseBase: "#ffca28",
  cheeseDark: "#f57f17",
  pepperoni: "#d32f2f",
  pepperoniDark: "#b71c1c",
  basil: "#43a047",
  basilDark: "#2e7d32",
  mushroom: "#d7ccc8",
  mushroomDark: "#8d6e63",
  olive: "#3e2723",
};

// --- Helper Math for Perfect Arcs ---
const degToRad = (deg: number) => (deg * Math.PI) / 180;

// Calculate the exact X,Y coordinates for the slice wedge
// We want a 60 degree slice centered on the X-axis (-30 to +30 degrees)
const ANGLE_OFFSET = 30; 
const startX = RADIUS * Math.cos(degToRad(-ANGLE_OFFSET));
const startY = RADIUS * Math.sin(degToRad(-ANGLE_OFFSET));
const endX = RADIUS * Math.cos(degToRad(ANGLE_OFFSET));
const endY = RADIUS * Math.sin(degToRad(ANGLE_OFFSET));

// 1. The main cheese wedge (Geometric Perfection)
const SLICE_PATH = `
  M 0 0
  L ${startX} ${startY}
  A ${RADIUS} ${RADIUS} 0 0 1 ${endX} ${endY}
  Z
`;

// 2. The crust (Just the outer arc rim)
const CRUST_PATH = `
  M ${startX} ${startY}
  A ${RADIUS} ${RADIUS} 0 0 1 ${endX} ${endY}
`;

// --- Topping Components (Same as before) ---
const BasilLeaf = ({ x, y, r }: { x: number; y: number; r: number }) => (
  <G x={x} y={y} rotation={Math.random() * 360}>
    <Path d={`M0,0 Q${r},${-r} ${r * 2},0 Q${r},${r} 0,0`} fill={COLORS.basil} stroke={COLORS.basilDark} strokeWidth={0.5} />
    <Path d={`M0,0 L${r * 2},0`} stroke={COLORS.basilDark} strokeWidth={0.5} />
  </G>
);

const Olive = ({ x, y, r }: { x: number; y: number; r: number }) => (
  <G x={x} y={y}>
    <Circle cx={0} cy={0} r={r} fill={COLORS.olive} />
    <Circle cx={0} cy={0} r={r * 0.4} fill={COLORS.cheeseBase} />
    <Circle cx={-r * 0.3} cy={-r * 0.3} r={r * 0.2} fill="white" opacity={0.3} />
  </G>
);

const Mushroom = ({ x, y, r }: { x: number; y: number; r: number }) => (
  <G x={x} y={y} rotation={Math.random() * 180}>
    <Path d={`M${-r * 0.3},${r * 0.2} L${-r * 0.3},${r} L${r * 0.3},${r} L${r * 0.3},${r * 0.2}`} fill={COLORS.mushroom} />
    <Path d={`M${-r},${r * 0.2} Q0,${-r} ${r},${r * 0.2} Z`} fill={COLORS.mushroom} stroke={COLORS.mushroomDark} strokeWidth={0.5} />
  </G>
);

const Pepperoni = ({ x, y, r }: { x: number; y: number; r: number }) => (
  <G x={x} y={y}>
    <Circle cx={1} cy={1} r={r} fill="rgba(0,0,0,0.15)" />
    <Circle cx={0} cy={0} r={r} fill={COLORS.pepperoni} />
    <Circle cx={-r * 0.4} cy={r * 0.2} r={r * 0.15} fill={COLORS.pepperoniDark} opacity={0.6} />
    <Ellipse cx={-r * 0.2} cy={-r * 0.2} rx={r * 0.4} ry={r * 0.2} fill="white" opacity={0.2} rotation={-45} />
  </G>
);

// --- The Slice Component ---
const PizzaSlice = ({ index, isVisible }: { index: number; isVisible: boolean }) => {
  // Memoize random values so they don't change on re-render
  const { toppings, cheeseBubbles } = useMemo(() => {
    // Texture Bubbles
    const bubbles = Array.from({ length: 5 }).map(() => ({
      // Keep bubbles strictly within the wedge shape
      // (Polar coordinates are safer here to avoid edges)
      dist: 10 + Math.random() * (RADIUS - 20),
      angle: -20 + Math.random() * 40, // strictly between -20 and +20 deg
      r: 2 + Math.random() * 3,
      opacity: 0.2 + Math.random() * 0.3,
    }));

    // Toppings
    const generatedToppings = Array.from({ length: 3 }).map(() => {
      const typeRand = Math.random();
      let type = "pepperoni";
      if (typeRand > 0.75) type = "basil";
      else if (typeRand > 0.6) type = "mushroom";
      else if (typeRand > 0.45) type = "olive";

      // Calculate polar position to keep inside the slice 
      const dist = 20 + Math.random() * (RADIUS - 35);
      const angle = -15 + Math.random() * 30; // Keep away from edges
      
      return {
        type,
        x: dist * Math.cos(degToRad(angle)),
        y: dist * Math.sin(degToRad(angle)),
        r: type === "pepperoni" ? 6 : type === "basil" ? 5 : 4.5,
      };
    });

    return { toppings: generatedToppings, cheeseBubbles: bubbles };
  }, []);

  // Animations
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isVisible) {
      scale.value = withDelay(index * 50, withSpring(1, { damping: 14 }));
      opacity.value = withDelay(index * 50, withSpring(1));
    } else {
      scale.value = withSpring(0);
      opacity.value = withSpring(0);
    }
  }, [isVisible, index]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { rotate: `${index * (360 / TOTAL_SLICES)}deg` },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View style={[styles.sliceContainer, animatedStyle]}>
      {/* viewBox is centered at 0,0. 
        So (0,0) corresponds to the center of the pizza.
      */}
      <Svg
        width={VIEW_SIZE}
        height={VIEW_SIZE}
        viewBox={`-${VIEW_SIZE/2} -${VIEW_SIZE/2} ${VIEW_SIZE} ${VIEW_SIZE}`}
      >
        <Defs>
          <RadialGradient id={`cheeseGrad-${index}`} cx="0" cy="0" rx={RADIUS} ry={RADIUS} gradientUnits="userSpaceOnUse">
            <Stop offset="0.2" stopColor={COLORS.cheeseLight} />
            <Stop offset="0.7" stopColor={COLORS.cheeseBase} />
            <Stop offset="1.0" stopColor={COLORS.cheeseDark} />
          </RadialGradient>
        </Defs>

        <G>
          {/* 1. Base Cheese Wedge (Perfect Geometric Fit) */}
          <Path d={SLICE_PATH} fill={`url(#cheeseGrad-${index})`} stroke="none" />

          {/* 2. Cheese Texture (Bubbles) */}
          {cheeseBubbles.map((b, i) => {
            // Convert polar to cartesian for rendering
            const bx = b.dist * Math.cos(degToRad(b.angle));
            const by = b.dist * Math.sin(degToRad(b.angle));
            return (
               <Circle key={`bubble-${i}`} cx={bx} cy={by} r={b.r} fill="#e65100" opacity={b.opacity} />
            )
          })}

          {/* 3. The Crust (Stroke on the outer rim only) */}
          <Path 
            d={CRUST_PATH} 
            fill="none" 
            stroke={COLORS.crustBase} 
            strokeWidth={8} // Thick crust
            strokeLinecap="butt" // Butt ends ensure they meet neighbor slices cleanly
          />
           {/* Inner Crust Shadow/Highlight for realism */}
           <Path 
            d={CRUST_PATH} 
            fill="none" 
            stroke={COLORS.crustBurn} 
            strokeWidth={2}
            strokeDasharray="4, 4"
            opacity={0.5}
          />

          {/* 4. Toppings */}
          {toppings.map((t, i) => (
            <React.Fragment key={`top-${i}`}>
              {t.type === "pepperoni" && <Pepperoni x={t.x} y={t.y} r={t.r} />}
              {t.type === "basil" && <BasilLeaf x={t.x} y={t.y} r={t.r} />}
              {t.type === "olive" && <Olive x={t.x} y={t.y} r={t.r} />}
              {t.type === "mushroom" && <Mushroom x={t.x} y={t.y} r={t.r} />}
            </React.Fragment>
          ))}
        </G>
      </Svg>
    </Animated.View>
  );
};

export default function PizzaProgress({ progress }: Props) {
  const slicesVisible = Math.ceil(progress * TOTAL_SLICES);

  return (
    <View style={styles.container}>
      {/* Plate */}
      <View style={styles.plate}>
        <View style={styles.innerPlate} />
      </View>

      {/* Pizza Assembly */}
      <View style={styles.pizzaContainer}>
        {Array.from({ length: TOTAL_SLICES }).map((_, index) => (
          <PizzaSlice key={index} index={index} isVisible={index < slicesVisible} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  plate: {
    position: "absolute",
    width: VIEW_SIZE, // Match view size
    height: VIEW_SIZE,
    backgroundColor: "#2a2a2a",
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    // Elevation for Android / Shadow for iOS
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  innerPlate: {
    width: VIEW_SIZE - 20,
    height: VIEW_SIZE - 20,
    borderRadius: 999,
    backgroundColor: "#1f1f1f",
    borderWidth: 1,
    borderColor: "#333",
  },
  pizzaContainer: {
    width: VIEW_SIZE,
    height: VIEW_SIZE,
    justifyContent: "center",
    alignItems: "center",
  },
  sliceContainer: {
    position: "absolute",
    width: VIEW_SIZE,
    height: VIEW_SIZE,
    justifyContent: "center",
    alignItems: "center",
  },
});