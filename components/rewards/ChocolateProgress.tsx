import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
    useAnimatedProps,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";
import Svg, {
    ClipPath,
    Defs,
    G,
    LinearGradient,
    Path,
    Rect,
    Stop,
} from "react-native-svg";

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedPath = Animated.createAnimatedComponent(Path);

// --- Constants for Dimensions ---
const BAR_WIDTH = 100;
const BAR_HEIGHT = 140;
const BAR_X = 40;
const BAR_Y = 10;
const CHUNK_GAP = 5;
const COLS = 2;
const ROWS = 3;
const TOTAL_CHUNKS = COLS * ROWS;

/**
 * A single piece of 3D Chocolate (Helper Component)
 */
const ChocolateChunk = ({ x, y, width, height }: { x: number; y: number; width: number; height: number }) => {
  return (
    <G>
      <Rect x={x} y={y} width={width} height={height} rx={4} fill="url(#chocGradient)" />
      
      {/* Top/Left Highlight (Bevel) */}
      <Path
        d={`M${x + 2},${y + height - 2} L${x + 2},${y + 2} L${x + width - 2},${y + 2}`}
        fill="none"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth={2}
        strokeLinecap="round"
      />

      {/* Bottom/Right Shadow (Bevel) */}
      <Path
        d={`M${x + 2},${y + height - 2} L${x + width - 2},${y + height - 2} L${x + width - 2},${y + 2}`}
        fill="none"
        stroke="rgba(0,0,0,0.4)"
        strokeWidth={2}
        strokeLinecap="round"
      />
      
      {/* Inner Glossy Sheen */}
      <Rect 
        x={x + 10} 
        y={y + 10} 
        width={width - 20} 
        height={height - 20} 
        rx={2} 
        fill="rgba(255,255,255,0.05)" 
      />
    </G>
  );
};

export default function ChocolateProgress({ progress }: { progress: number }) {
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  
  // Logic for Discrete "Breaking Off" steps
  const chunksRevealed = Math.floor(clampedProgress * TOTAL_CHUNKS);
  const discreteProgressStr = chunksRevealed / TOTAL_CHUNKS;
  
  const fillHeight = useSharedValue(0);

  useEffect(() => {
    fillHeight.value = withSpring(discreteProgressStr * BAR_HEIGHT, {
      damping: 14,
      stiffness: 150,
      mass: 1,
    });
  }, [discreteProgressStr]);

  const clipProps = useAnimatedProps(() => {
    return {
      y: BAR_Y + BAR_HEIGHT - fillHeight.value,
      height: fillHeight.value,
    };
  });

  const foilProps = useAnimatedProps(() => {
    const currentY = BAR_Y + BAR_HEIGHT - fillHeight.value;
    const biteWidth = 20;
    const biteDepth = 8; 
    const steps = BAR_WIDTH / biteWidth;
    
    let d = `M${BAR_X},${currentY} `;
    
    for (let i = 0; i < steps; i++) {
      const startX = BAR_X + (i * biteWidth);
      const endX = startX + biteWidth;
      // Draw bite marks
      d += `C ${startX + biteWidth * 0.3},${currentY + biteDepth} ${startX + biteWidth * 0.7},${currentY + biteDepth} ${endX},${currentY} `;
    }
    
    d += `L${BAR_X + BAR_WIDTH},${BAR_Y - 5} L${BAR_X},${BAR_Y - 5} Z`;
    
    return { d };
  });

  const renderChunks = () => {
    const chunkW = (BAR_WIDTH - (CHUNK_GAP * (COLS + 1))) / COLS;
    const chunkH = (BAR_HEIGHT - (CHUNK_GAP * (ROWS + 1))) / ROWS;
    const chunks = [];

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        chunks.push(
          <ChocolateChunk
            key={`${r}-${c}`}
            x={BAR_X + CHUNK_GAP + c * (chunkW + CHUNK_GAP)}
            y={BAR_Y + CHUNK_GAP + r * (chunkH + CHUNK_GAP)}
            width={chunkW}
            height={chunkH}
          />
        );
      }
    }
    return chunks;
  };

  return (
    <View style={styles.container}>
      <Svg width={180} height={190} viewBox="0 0 180 190">
        <Defs>
          <LinearGradient id="chocGradient" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#8D6E63" />
            <Stop offset="0.5" stopColor="#5D4037" />
            <Stop offset="1" stopColor="#3E2723" />
          </LinearGradient>

          <LinearGradient id="redFoilGradient" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#D32F2F" />
            <Stop offset="0.2" stopColor="#FFCDD2" />
            <Stop offset="0.4" stopColor="#E53935" />
            <Stop offset="0.7" stopColor="#FFEBEE" />
            <Stop offset="1" stopColor="#C62828" />
          </LinearGradient>

          <ClipPath id="revealMask">
            <AnimatedRect x={BAR_X} width={BAR_WIDTH} animatedProps={clipProps} />
          </ClipPath>
        </Defs>

        {/* Background Wrapper Slot */}
        <Rect 
            x={BAR_X - 2} y={BAR_Y - 2} 
            width={BAR_WIDTH + 4} height={BAR_HEIGHT + 4} 
            rx={6} 
            fill="#2c2c2c" 
            stroke="#4e342e"
            strokeWidth={1}
        />

        {/* Realistic Chocolate Layer */}
        <G clipPath="url(#revealMask)">
           <Rect x={BAR_X} y={BAR_Y} width={BAR_WIDTH} height={BAR_HEIGHT} rx={5} fill="#3E2723" />
           {renderChunks()}
        </G>

        {/* Red Foil Layer */}
        <AnimatedPath 
            animatedProps={foilProps} 
            fill="url(#redFoilGradient)"
            stroke="#B71C1C" 
            strokeWidth={1.5}
            opacity={progress < 1 ? 1 : 0}
        />
        
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
    shadowRadius: 4.65,
    elevation: 8,
  },
});