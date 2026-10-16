import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { UI } from '@/constants/ui';
import type { StageSummary } from '@/types/api';
import { Pressable } from '@/components/ui/pressable';

type Props = {
  stages: StageSummary[];
  onStagePress: (stage: StageSummary, index: number) => void;
  /** Horizontal padding already applied by the parent screen, subtracted from window width. */
  horizontalInset?: number;
  /** Y (inside the path) of the stage to play next — lets the screen scroll to it. */
  onCurrentY?: (y: number) => void;
};

type NodeState = 'done' | 'current' | 'open' | 'locked' | 'pro';

const NODE = 64;
const CURRENT_NODE = 76;
const LIP = 6; // the darker "underside" that makes nodes look like pressable buttons
const ROW = 118;
const TOP = 70; // room for the "Start" bubble above the first node
const BOTTOM = 70;
const LABEL_WIDTH = 104;
const MAX_CANVAS_WIDTH = 420;

const LOOK: Record<NodeState | 'trophyOff', { face: string; lip: string; icon: string }> = {
  done: { face: UI.accent, lip: UI.accentPressed, icon: UI.bg },
  current: { face: UI.accent, lip: UI.accentPressed, icon: UI.bg },
  open: { face: UI.accentSoft, lip: '#DCC6FF', icon: UI.accent },
  pro: { face: UI.accentSoft, lip: '#DCC6FF', icon: UI.accent },
  locked: { face: '#EDEDED', lip: '#D4D4D4', icon: '#A6A6A6' },
  trophyOff: { face: '#EDEDED', lip: '#D4D4D4', icon: '#A6A6A6' },
};

// A winding "road" of stages, game-style: raised round buttons that press
// down, a road that fills in violet up to the student's current stage, stars
// under every finished stage and a trophy at the end.
export function StagePath({ stages, onStagePress, horizontalInset = 44, onCurrentY }: Props) {
  const { width: windowWidth } = useWindowDimensions();
  const width = Math.min(Math.max(windowWidth - horizontalInset, 240), MAX_CANVAS_WIDTH);
  // Narrow phones squeeze the sideways swing so nodes and labels stay on screen.
  const amplitude = Math.min(width * 0.24, (width - LABEL_WIDTH) / 2);

  const currentIndex = stages.findIndex((s) => s.status === 'UNLOCKED' || s.status === 'IN_PROGRESS');
  const allDone = stages.length > 0 && stages.every((s) => s.status === 'COMPLETED');
  // How far along the road the violet "progress" line reaches (the trophy is index stages.length).
  const reached = allDone ? stages.length : Math.max(currentIndex, 0);

  // One extra point for the trophy at the end of the road.
  const points = useMemo(
    () =>
      Array.from({ length: stages.length + 1 }, (_, i) => ({
        x: width / 2 + amplitude * Math.sin((i * Math.PI) / 4),
        y: TOP + i * ROW,
      })),
    [stages.length, width, amplitude]
  );

  const road = (upTo: number) => {
    if (upTo < 1) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i <= upTo; i++) {
      const a = points[i - 1];
      const b = points[i];
      const midY = (a.y + b.y) / 2;
      d += ` C ${a.x} ${midY}, ${b.x} ${midY}, ${b.x} ${b.y}`;
    }
    return d;
  };

  useEffect(() => {
    if (currentIndex >= 0) onCurrentY?.(points[currentIndex].y);
  }, [currentIndex, points, onCurrentY]);

  const height = TOP + stages.length * ROW + BOTTOM;
  const trophy = points[stages.length];

  return (
    <View style={{ width, height, alignSelf: 'center' }}>
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Path d={road(stages.length)} stroke="#EDEDED" strokeWidth={10} strokeLinecap="round" fill="none" />
        <Path d={road(reached)} stroke={UI.accent} strokeWidth={10} strokeLinecap="round" fill="none" />
      </Svg>

      {stages.map((stage, i) => {
        const state: NodeState =
          stage.status === 'COMPLETED'
            ? 'done'
            : stage.requiresSubscription
              ? 'pro'
              : i === currentIndex
                ? 'current'
                : stage.status === 'LOCKED'
                  ? 'locked'
                  : 'open';
        const size = state === 'current' ? CURRENT_NODE : NODE;
        return (
          <View
            key={stage.id}
            style={[styles.slot, { left: points[i].x - LABEL_WIDTH / 2, top: points[i].y - size / 2 }]}
            pointerEvents="box-none">
            {state === 'current' && <StartBubble label={stage.status === 'IN_PROGRESS' ? 'Continue' : 'Start'} />}
            <Node
              size={size}
              state={state}
              label={stage.stageNumber}
              pulse={state === 'current'}
              onPress={() => onStagePress(stage, i)}
              accessibilityLabel={`Stage ${stage.stageNumber}, ${stage.title}, ${
                state === 'done' ? `${stage.starsEarned} of ${stage.rewardStars} stars` : state
              }`}
            />
            {state === 'done' && <Stars earned={stage.starsEarned} max={stage.rewardStars} />}
            <Text style={[styles.label, state === 'current' && styles.labelCurrent]} numberOfLines={1}>
              {stage.title}
            </Text>
          </View>
        );
      })}

      <View style={[styles.slot, { left: trophy.x - LABEL_WIDTH / 2, top: trophy.y - NODE / 2 }]} pointerEvents="none">
        <Node size={NODE} state={allDone ? 'done' : 'trophyOff'} icon="trophy" />
        <Text style={[styles.label, allDone && styles.labelCurrent]}>{allDone ? 'Subject complete' : 'Finish'}</Text>
      </View>
    </View>
  );
}

function Node({
  size,
  state,
  label,
  icon,
  pulse,
  onPress,
  accessibilityLabel,
}: {
  size: number;
  state: NodeState | 'trophyOff';
  label?: number;
  icon?: keyof typeof Ionicons.glyphMap;
  pulse?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  const look = LOOK[state];
  const glyph: keyof typeof Ionicons.glyphMap | null =
    icon ?? (state === 'done' ? 'checkmark' : state === 'current' ? 'play' : state === 'locked' || state === 'pro' ? 'lock-closed' : null);

  return (
    <View style={{ width: size, height: size + LIP }}>
      {pulse && <PulseRing size={size} />}
      {/* Underside — stays put while the face presses down onto it. */}
      <View style={[styles.round, { width: size, height: size, borderRadius: size / 2, top: LIP, backgroundColor: look.lip }]} />
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={({ pressed }) => [
          styles.round,
          styles.face,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: look.face },
          pressed && { transform: [{ translateY: LIP - 1 }] },
        ]}>
        {glyph ? (
          <Ionicons name={glyph} size={Math.round(size * (glyph === 'checkmark' ? 0.46 : 0.36))} color={look.icon} />
        ) : (
          <Text style={[styles.number, { color: look.icon }]}>{label}</Text>
        )}
      </Pressable>
      {state === 'pro' && (
        <View style={styles.proBadge}>
          <Text style={styles.proText}>PRO</Text>
        </View>
      )}
    </View>
  );
}

function PulseRing({ size }: { size: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.out(Easing.quad) }), -1, false);
  }, [t]);
  const style = useAnimatedStyle(() => ({
    opacity: 0.5 * (1 - t.value),
    transform: [{ scale: 1 + 0.45 * t.value }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.round, { width: size, height: size, borderRadius: size / 2, top: LIP / 2, backgroundColor: UI.accent }, style]}
    />
  );
}

function StartBubble({ label }: { label: string }) {
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withRepeat(
      withSequence(withTiming(-4, { duration: 700, easing: Easing.inOut(Easing.quad) }), withTiming(0, { duration: 700, easing: Easing.inOut(Easing.quad) })),
      -1,
      false
    );
  }, [y]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return (
    <Animated.View pointerEvents="none" style={[styles.bubble, style]}>
      <Text style={styles.bubbleText}>{label}</Text>
      <View style={styles.bubbleTail} />
    </Animated.View>
  );
}

function Stars({ earned, max }: { earned: number; max: number }) {
  return (
    <View style={styles.stars}>
      {Array.from({ length: Math.max(max, 1) }, (_, i) => (
        <Ionicons key={i} name={i < earned ? 'star' : 'star-outline'} size={13} color={i < earned ? UI.accent : '#C9C9C9'} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  slot: { position: 'absolute', width: LABEL_WIDTH, alignItems: 'center' },
  round: { position: 'absolute', left: 0 },
  face: { top: 0, alignItems: 'center', justifyContent: 'center' },
  number: { fontSize: 22, fontWeight: '700' },
  label: { marginTop: 6, fontSize: 12.5, fontWeight: '500', color: UI.grey, textAlign: 'center', maxWidth: LABEL_WIDTH },
  labelCurrent: { color: UI.text, fontWeight: '700' },
  stars: { flexDirection: 'row', gap: 2, marginTop: 6 },

  proBadge: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: UI.accent,
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderWidth: 2,
    borderColor: UI.bg,
  },
  proText: { fontSize: 9, fontWeight: '800', color: UI.bg },

  bubble: {
    position: 'absolute',
    bottom: '100%',
    marginBottom: 10,
    backgroundColor: UI.bg,
    borderWidth: 2,
    borderColor: UI.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
    alignItems: 'center',
  },
  bubbleText: { fontSize: 13, fontWeight: '800', color: UI.accent },
  bubbleTail: {
    position: 'absolute',
    bottom: -7,
    width: 12,
    height: 12,
    backgroundColor: UI.bg,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: UI.border,
    transform: [{ rotate: '45deg' }],
  },
});
