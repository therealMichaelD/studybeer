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
    Defs,
    G,
    LinearGradient,
    Path,
    RadialGradient,
    Rect,
    Stop,
    Text as SvgText,
} from "react-native-svg";

const COMPONENT_WIDTH = 280;
const COMPONENT_HEIGHT = 200;
const REEL_CENTER_Y = 60;
const LEFT_REEL_X = 70;
const RIGHT_REEL_X = 210;
const MAX_FILM_RADIUS = 35;
const MIN_FILM_RADIUS = 12;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedG = Animated.createAnimatedComponent(G);

export default function ProjectorProgress({ progress }: { progress: number }) {
  const progressVal = useSharedValue(0);
  const flickerOpacity = useSharedValue(0.8);

  useEffect(() => {
    progressVal.value = withTiming(progress, {
      duration: 1500,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [progress]);

  useEffect(() => {
    flickerOpacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 50 }),
        withTiming(0.9, { duration: 80 }),
        withTiming(0.7, { duration: 60 }),
        withTiming(1, { duration: 100 })
      ),
      -1,
      true
    );
  }, []);

  const reelRotation = useDerivedValue(() => {
    return interpolate(progressVal.value, [0, 1], [0, 360 * 4]);
  });

  const leftFilmProps = useAnimatedProps(() => {
    const r = interpolate(progressVal.value, [0, 1], [MAX_FILM_RADIUS, MIN_FILM_RADIUS]);
    return { r };
  });

  const rightFilmProps = useAnimatedProps(() => {
    const r = interpolate(progressVal.value, [0, 1], [MIN_FILM_RADIUS, MAX_FILM_RADIUS]);
    return { r };
  });

  const filmStripProps = useAnimatedProps(() => {
    return {
      strokeDashoffset: -progressVal.value * 200,
    };
  });
  
  const lightBeamProps = useAnimatedProps(() => {
    const baseOpacity = interpolate(progressVal.value, [0.9, 1], [0.1, 0.6]);
    return {
      opacity: progressVal.value >= 1 ? 0.8 : baseOpacity * flickerOpacity.value,
    };
  });

  const rotateLeft = useAnimatedProps(() => ({
    transform: [{ rotate: `${reelRotation.value}deg` }],
  }));

  const rotateRight = useAnimatedProps(() => ({
    transform: [{ rotate: `${reelRotation.value}deg` }],
  }));

  return (
    <View style={styles.container}>
      <Svg width={COMPONENT_WIDTH} height={COMPONENT_HEIGHT} viewBox={`0 0 ${COMPONENT_WIDTH} ${COMPONENT_HEIGHT}`}>
        <Defs>
          <LinearGradient id="metalGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#ccc" />
            <Stop offset="0.5" stopColor="#fff" />
            <Stop offset="1" stopColor="#999" />
          </LinearGradient>
          <RadialGradient id="filmGrad" cx="50%" cy="50%" r="50%">
            <Stop offset="0.7" stopColor="#222" />
            <Stop offset="1" stopColor="#000" />
          </RadialGradient>
          <LinearGradient id="beamGrad" x1="0.5" y1="0" x2="0.5" y2="1">
            <Stop offset="0" stopColor="#fff" stopOpacity="0.8" />
            <Stop offset="1" stopColor="#fff" stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Rect x="20" y="80" width="240" height="100" rx="10" fill="#1a1a1a" stroke="#333" strokeWidth="2" />
        <Rect x="120" y="80" width="40" height="40" fill="#2a2a2a" stroke="#444" />
        <Circle cx="140" cy="100" r="15" fill="#111" stroke="#555" strokeWidth="2" />
        <Circle cx="140" cy="100" r="8" fill="#000" opacity={0.8} />
        <Circle cx="138" cy="98" r="3" fill="#fff" opacity={0.4} />
        <AnimatedPath
          d={`M 140 100 L 80 200 L 200 200 Z`}
          fill="url(#beamGrad)"
          animatedProps={lightBeamProps}
        />
        <Path
          d={`M ${LEFT_REEL_X} ${REEL_CENTER_Y + MIN_FILM_RADIUS} Q 140 ${REEL_CENTER_Y + 60} ${RIGHT_REEL_X} ${REEL_CENTER_Y + MIN_FILM_RADIUS}`}
          fill="none"
          stroke="#111"
          strokeWidth="18"
        />
        <AnimatedPath
          d={`M ${LEFT_REEL_X} ${REEL_CENTER_Y + MIN_FILM_RADIUS} Q 140 ${REEL_CENTER_Y + 60} ${RIGHT_REEL_X} ${REEL_CENTER_Y + MIN_FILM_RADIUS}`}
          fill="none"
          stroke="#555"
          strokeWidth="2"
          strokeDasharray="4 8"
          animatedProps={filmStripProps}
        />
        <G transform={`translate(${LEFT_REEL_X}, ${REEL_CENTER_Y})`}>
          <AnimatedCircle cx="0" cy="0" fill="url(#filmGrad)" animatedProps={leftFilmProps} />
          <AnimatedG animatedProps={rotateLeft}>
            <Circle cx="0" cy="0" r="40" stroke="url(#metalGrad)" strokeWidth="4" fill="none" />
            <Path d="M 0 -40 L 0 40 M -40 0 L 40 0" stroke="#888" strokeWidth="2" />
            <Circle cx="0" cy="0" r="8" fill="#ccc" />
          </AnimatedG>
        </G>
        <G transform={`translate(${RIGHT_REEL_X}, ${REEL_CENTER_Y})`}>
          <AnimatedCircle cx="0" cy="0" fill="url(#filmGrad)" animatedProps={rightFilmProps} />
          <AnimatedG animatedProps={rotateRight}>
            <Circle cx="0" cy="0" r="40" stroke="url(#metalGrad)" strokeWidth="4" fill="none" />
            <Path d="M 0 -40 L 0 40 M -40 0 L 40 0" stroke="#888" strokeWidth="2" />
            <Circle cx="0" cy="0" r="8" fill="#ccc" />
          </AnimatedG>
        </G>
        <SvgText
          x="140"
          y="170"
          fill="#fff"
          textAnchor="middle"
          fontSize="12"
          fontWeight="bold"
          letterSpacing="2"
          opacity={0.5}
        >
          PRODUCTION STATUS
        </SvgText>
        <SvgText
          x="140"
          y="190"
          fill="#fff"
          textAnchor="middle"
          fontSize="20"
          fontWeight="900"
        >
          {progress >= 1 ? "IT'S A WRAP" : `${Math.round(progress * 100)}%`}
        </SvgText>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: 'transparent',
  },
});