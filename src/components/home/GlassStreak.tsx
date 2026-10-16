import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Pressable } from '@/components/ui/pressable';

import { HT } from './home-theme';

const BORDER = 1;
const LAP_MS = 4800;

// Accent at a given opacity, so the effect stays inside the app palette.
const accent = (alpha: number) =>
  `${HT.primary}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
const white = (alpha: number) => `rgba(255,255,255,${alpha})`;

interface Props {
  streak: number;
  onPress: () => void;
}

// Streak pill with a frosted accent tint and a soft light that travels
// around its border. The light is a gradient square spun behind a 1px
// window, so the only per-frame work is a transform on the UI thread.
export function GlassStreak({ streak, onPress }: Props) {
  const reduceMotion = useReducedMotion();
  const [diagonal, setDiagonal] = useState(0);
  const turn = useSharedValue(0.125);

  useEffect(() => {
    if (reduceMotion) return;
    turn.value = 0;
    turn.value = withRepeat(withTiming(1, { duration: LAP_MS, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(turn);
  }, [reduceMotion, turn]);

  const spin = useAnimatedStyle(() => ({ transform: [{ rotate: `${turn.value * 360}deg` }] }));

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setDiagonal(Math.ceil(Math.hypot(width, height)));
  };

  return (
    <Pressable
      onPress={onPress}
      onLayout={onLayout}
      style={({ pressed }) => [styles.streak, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${streak} day streak`}>
      {/* Border ring: faint accent base with the travelling light on top. */}
      <View style={styles.ring}>
        {diagonal > 0 && (
          <Animated.View
            style={[
              styles.spinner,
              { width: diagonal, height: diagonal, marginLeft: -diagonal / 2, marginTop: -diagonal / 2 },
              spin,
            ]}>
            <LinearGradient
              colors={[accent(0), accent(0), accent(0.55), accent(1)]}
              locations={[0, 0.45, 0.8, 1]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        )}
      </View>

      {/* Glass body: translucent accent tint plus a reflection on the top half. */}
      <View style={styles.glass}>
        <LinearGradient
          colors={[white(0.92), accent(0.07)]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient colors={[white(0.85), white(0)]} style={styles.reflection} />
      </View>

      <Ionicons name="flame" size={16} color={HT.primary} />
      <Text style={styles.streakValue}>{streak}</Text>
      <Text style={styles.streakLabel}>day streak</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Padding absorbs the 1px the old border took, so the pill keeps its size.
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12 + BORDER,
    borderRadius: HT.radius,
    boxShadow: `0px 2px 10px ${accent(0.16)}`,
  },
  pressed: { opacity: 0.85 },
  ring: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: HT.radius,
    overflow: 'hidden',
    backgroundColor: accent(0.18),
    pointerEvents: 'none',
  },
  spinner: { position: 'absolute', left: '50%', top: '50%' },
  glass: {
    position: 'absolute',
    top: BORDER,
    left: BORDER,
    right: BORDER,
    bottom: BORDER,
    borderRadius: HT.radius - BORDER,
    overflow: 'hidden',
    backgroundColor: HT.bg,
    pointerEvents: 'none',
  },
  reflection: { position: 'absolute', top: 0, left: 0, right: 0, height: '50%' },
  streakValue: { fontSize: 16, fontWeight: '700', color: HT.ink },
  streakLabel: { fontSize: 12, color: HT.muted },
});
