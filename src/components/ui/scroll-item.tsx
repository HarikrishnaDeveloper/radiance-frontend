import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

type Props = {
  /** The parent scroll view's vertical offset. */
  scrollY: SharedValue<number>;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

// The stretch of scrolling, ending as a section's bottom edge leaves the top,
// over which it shrinks and fades away. A short section fades over its whole
// height; a tall one scrolls normally until only this much of it is left.
const FADE_DISTANCE = 120;
const MIN_SCALE = 0.92;

// A section of a scroll view that gently shrinks and fades as it slides up
// past the top edge. It must be a direct child of the scroll view's content,
// since it measures its own position there; sections of any height work.
export function ScrollItem({ scrollY, style, children }: Props) {
  const reduceMotion = useReducedMotion();
  const top = useSharedValue(0);
  const height = useSharedValue(0);

  const animated = useAnimatedStyle(() => {
    if (reduceMotion || height.value === 0) return {};
    const bottom = top.value + height.value;
    const range = [bottom - Math.min(height.value, FADE_DISTANCE), bottom];
    const p = interpolate(scrollY.value, range, [1, 0], Extrapolation.CLAMP);
    return { opacity: p, transform: [{ scale: MIN_SCALE + (1 - MIN_SCALE) * p }] };
  });

  return (
    <Animated.View
      onLayout={(e) => {
        top.set(e.nativeEvent.layout.y);
        height.set(e.nativeEvent.layout.height);
      }}
      // Shrink toward the bottom edge: the part still on screen stays put.
      style={[style, { transformOrigin: 'bottom' }, animated]}>
      {children}
    </Animated.View>
  );
}

/**
 * A soft fade at the top of a scroll area, so content slides out of view
 * instead of meeting a hard edge. Place it after the scroll view, in a
 * container that wraps both.
 */
export function ScrollEdgeFade({ color }: { color: string }) {
  return <LinearGradient colors={[color, `${color}00`]} style={styles.edgeFade} pointerEvents="none" />;
}

const styles = StyleSheet.create({
  edgeFade: { position: 'absolute', top: 0, left: 0, right: 0, height: 24 },
});
