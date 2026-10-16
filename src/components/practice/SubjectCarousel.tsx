import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';

import { UI } from '@/constants/ui';
import type { CategorySummary } from '@/types/api';
import { Pressable } from '@/components/ui/pressable';
import { playSound } from '@/lib/sounds';

type Props = {
  subjects: CategorySummary[];
  /** Accuracy per subject id, for subjects with enough answers to be rated. */
  accuracyById: Map<number, number>;
  onPractice: (subject: CategorySummary) => void;
};

const SPACING = 14;
const SPRING = { damping: 20, stiffness: 190, mass: 0.9 };

// The tray behind each card. Closed, it peeks out under the card like a
// second card in a stack; open, it grows out from behind the card (which
// shrinks and lifts into it) to reveal the details and action row.
const PEEK = 12; // how far the closed tray shows below the card
const TRAY_INSET = 14; // closed tray is this much narrower than the card on each side
const TRAY_OVERLAP = 0.55; // the tray's top edge sits this far down the card
const DETAILS_HEIGHT = 206; // stat rows + divider + action row
const BOTTOM_GAP = 8;

// Practice → All subjects: a horizontal, snapping carousel of subject cards
// with parallax. Swipe a card up (or tap its chevron) to pull out the tray
// with its details and actions; swipe down to tuck it back.
export function SubjectCarousel({ subjects, accuracyById, onPractice }: Props) {
  const { width } = useWindowDimensions();
  const [height, setHeight] = useState(0);
  const scrollX = useSharedValue(0);
  const [active, setActive] = useState(0);

  const itemWidth = Math.min(width * 0.74, 320);
  const step = itemWidth + SPACING;
  const sideInset = (width - step) / 2;

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollX.value = e.contentOffset.x;
  });

  const itemHeight = height;
  const cardHeight = Math.min(itemHeight - 24 - PEEK, itemWidth * 1.5);

  return (
    <View style={{ flex: 1 }} onLayout={(e) => setHeight(e.nativeEvent.layout.height)}>
      {height > 0 && (
        <>
          <Animated.FlatList
            data={subjects}
            keyExtractor={(s) => String(s.id)}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={step}
            decelerationRate="fast"
            onScroll={onScroll}
            scrollEventThrottle={16}
            onMomentumScrollEnd={(e) => setActive(Math.round(e.nativeEvent.contentOffset.x / step))}
            contentContainerStyle={{ paddingHorizontal: sideInset }}
            renderItem={({ item, index }) => (
              <SubjectCard
                subject={item}
                index={index}
                step={step}
                width={itemWidth}
                itemHeight={itemHeight}
                cardHeight={cardHeight}
                scrollX={scrollX}
                accuracy={accuracyById.get(item.id)}
                onPractice={() => onPractice(item)}
              />
            )}
          />
          <Text style={styles.srOnly} accessibilityLiveRegion="polite">
            {subjects[active] ? `${active + 1} of ${subjects.length}` : ''}
          </Text>
        </>
      )}
    </View>
  );
}

function SubjectCard({
  subject,
  index,
  step,
  width,
  itemHeight,
  cardHeight,
  scrollX,
  accuracy,
  onPractice,
}: {
  subject: CategorySummary;
  index: number;
  step: number;
  width: number;
  itemHeight: number;
  cardHeight: number;
  scrollX: SharedValue<number>;
  accuracy: number | undefined;
  onPractice: () => void;
}) {
  const reduceMotion = useReducedMotion();
  // 0 = tray tucked behind the card, 1 = tray pulled out. Dragging may push it
  // slightly past either end (rubber band) before it springs back.
  const open = useSharedValue(0);
  const startOpen = useSharedValue(0);
  const [isOpen, setIsOpen] = useState(false);

  // ── Geometry ──────────────────────────────────────────────────────────
  // Closed: card centred (nudged up to leave room for the peeking tray).
  const cardTop = Math.max(8, (itemHeight - cardHeight - PEEK) / 2 - 10);
  const closedTrayTop = cardTop + cardHeight * TRAY_OVERLAP;
  const closedTrayBottom = cardTop + cardHeight + PEEK;
  // Open: the tray runs to the bottom of the item; the card shrinks (from its
  // top edge) and lifts so its lower part rests inside the tray, just above
  // the details.
  const openTrayBottom = itemHeight - BOTTOM_GAP;
  const openCardTop = Math.max(4, cardTop - 18);
  const openCardBottom = openTrayBottom - DETAILS_HEIGHT;
  // Floor keeps the card readable on very short screens (it then rests a
  // little over the first detail row instead of collapsing to a sliver).
  const liftedScale = Math.min(0.9, Math.max(0.45, (openCardBottom - openCardTop) / cardHeight));
  const lift = openCardTop - cardTop;
  const openTrayTop = openCardTop + cardHeight * liftedScale * TRAY_OVERLAP;
  const dragRange = closedTrayBottom - openCardBottom + DETAILS_HEIGHT * 0.4;

  const settle = (target: 0 | 1, velocity = 0) => {
    'worklet';
    open.value = withSpring(target, { ...SPRING, velocity });
    runOnJS(setIsOpen)(target === 1);
  };
  const setOpen = (value: 0 | 1) => {
    open.value = withSpring(value, SPRING);
    setIsOpen(value === 1);
  };

  const pan = Gesture.Pan()
    .activeOffsetY([-12, 12])
    .failOffsetX([-14, 14]) // horizontal drags belong to the carousel
    .onStart(() => {
      startOpen.value = open.value;
    })
    .onUpdate((e) => {
      const raw = startOpen.value - e.translationY / dragRange;
      // Rubber band past the ends: a quarter of the extra drag, capped.
      open.value = raw > 1 ? Math.min(1 + (raw - 1) * 0.25, 1.06) : raw < 0 ? Math.max(raw * 0.25, -0.06) : raw;
    })
    .onEnd((e) => {
      const target = e.velocityY < -300 ? 1 : e.velocityY > 300 ? 0 : open.value > 0.5 ? 1 : 0;
      // The air sound rides the opening spring; closing stays quiet.
      if (target === 1 && startOpen.value < 0.5) runOnJS(playSound)('air');
      settle(target, -e.velocityY / dragRange);
    });

  // Tuck the tray back in once the card is swiped away from the centre.
  useAnimatedReaction(
    () => Math.abs(scrollX.value - index * step) > step * 0.5,
    (away, wasAway) => {
      if (away && !wasAway && open.value > 0) settle(0);
    }
  );

  // ── Animated styles ───────────────────────────────────────────────────
  // Neighbours shrink and fade; the title slides at a different speed than the card (parallax).
  const range = [(index - 1) * step, index * step, (index + 1) * step];
  const itemStyle = useAnimatedStyle(() => {
    if (reduceMotion) return {};
    return {
      opacity: interpolate(scrollX.value, range, [0.55, 1, 0.55], Extrapolation.CLAMP),
      transform: [{ scale: interpolate(scrollX.value, range, [0.88, 1, 0.88], Extrapolation.CLAMP) }],
    };
  });
  const titleStyle = useAnimatedStyle(() => {
    if (reduceMotion) return {};
    return { transform: [{ translateX: interpolate(scrollX.value, range, [width * 0.35, 0, -width * 0.35], Extrapolation.CLAMP) }] };
  });
  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(open.value, [0, 1], [0, lift]) },
      { scale: interpolate(open.value, [0, 1], [1, liftedScale]) },
    ],
  }));
  // The tray grows on both edges at once: its top rides up with the shrinking
  // card while its bottom drops to make room, and it widens from a tucked-in
  // stack card to full width.
  const trayStyle = useAnimatedStyle(() => {
    const top = interpolate(open.value, [0, 1], [closedTrayTop, openTrayTop]);
    const bottom = interpolate(open.value, [0, 1], [closedTrayBottom, openTrayBottom]);
    const inset = interpolate(open.value, [0, 1], [TRAY_INSET, 0], Extrapolation.CLAMP);
    return {
      top,
      height: bottom - top,
      left: inset,
      right: inset,
      opacity: interpolate(open.value, [0, 0.25], [0.75, 1], Extrapolation.CLAMP),
    };
  });
  const hintStyle = useAnimatedStyle(() => ({ opacity: interpolate(open.value, [0, 0.3], [1, 0], Extrapolation.CLAMP) }));

  const name = subject.foodWorldName ?? subject.name;

  return (
    <Animated.View style={[{ width: step, height: itemHeight, alignItems: 'center' }, itemStyle]}>
      <View style={{ width, height: itemHeight }}>
        {/* Tray — sits behind the card and grows out from under it. */}
        <Animated.View style={[styles.tray, trayStyle]} pointerEvents={isOpen ? 'box-none' : 'none'}>
          <View style={[styles.details, { height: DETAILS_HEIGHT }]} pointerEvents="box-none">
            <Reveal open={open} order={0}>
              <DetailRow icon="help-circle-outline" label="Questions" value={subject.questionCount.toLocaleString()} />
            </Reveal>
            <Reveal open={open} order={1}>
              <DetailRow icon="flag-outline" label="Stages done" value={`${subject.completedStages}/${subject.totalStages}`} />
            </Reveal>
            <Reveal open={open} order={2}>
              <DetailRow icon="analytics-outline" label="Your accuracy" value={accuracy !== undefined ? `${accuracy}%` : 'Not rated yet'} />
            </Reveal>
            <Reveal open={open} order={3}>
              <View style={styles.divider} />
              <View style={styles.actions}>
                <ActionColumn icon="map-outline" label="Stages" status="Open" onPress={() => router.push(`/category/${subject.id}`)} />
                <View style={styles.actionDivider} />
                <ActionColumn icon="flash-outline" label="Practice" status="10 Qs" onPress={onPractice} />
              </View>
            </Reveal>
          </View>
        </Animated.View>

        <GestureDetector gesture={pan}>
          <Animated.View style={[styles.cardShadow, { width, height: cardHeight, top: cardTop }, cardStyle]}>
            <View style={styles.card}>
              <Pressable
                style={StyleSheet.absoluteFill}
                onPress={() => (isOpen ? setOpen(0) : router.push(`/category/${subject.id}`))}
                accessibilityRole="button"
                accessibilityLabel={`${name}, ${subject.progress}% complete. Open stages`}
              />

              {/* Big faint number in the corner */}
              <Text maxFontSizeMultiplier={1.3} style={styles.watermark} pointerEvents="none">
                {String(index + 1).padStart(2, '0')}
              </Text>

              <View style={styles.cardTop} pointerEvents="none">
                <View style={styles.iconCircle}>
                  <Ionicons name="book-outline" size={18} color={UI.bg} />
                </View>
              </View>

              {/* Title runs bottom-to-top up the card */}
              <Animated.View
                style={[styles.titleRail, { width: cardHeight - 120, top: cardHeight / 2 - 30, left: -(cardHeight - 120) / 2 + 46 }, titleStyle]}
                pointerEvents="none">
                {/* Rotation lives on the inner view so the parallax transform doesn't replace it. */}
                <View style={styles.titleRotate}>
                  <Text maxFontSizeMultiplier={1.3} style={styles.title} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>
                    {name.toUpperCase()}
                  </Text>
                </View>
              </Animated.View>

              <View style={styles.cardBottom} pointerEvents="none">
                <Text maxFontSizeMultiplier={1.3} style={styles.progressValue}>{subject.progress}%</Text>
                <Text maxFontSizeMultiplier={1.3} style={styles.progressLabel}>
                  {subject.completedStages} of {subject.totalStages} stages
                </Text>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${Math.min(Math.max(subject.progress, 0), 100)}%` }]} />
                </View>
              </View>

              <Animated.View style={[styles.hint, hintStyle]}>
                <Pressable
                  onPress={() => {
                    if (isOpen) return;
                    playSound('air');
                    setOpen(1);
                  }}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel="Show details">
                  <Ionicons name="chevron-up" size={22} color="rgba(255,255,255,0.85)" />
                </Pressable>
              </Animated.View>
            </View>
          </Animated.View>
        </GestureDetector>
      </View>
    </Animated.View>
  );
}

// Fades and slides a block of the tray in after the one before it, so the
// details cascade in as the tray opens instead of appearing all at once.
function Reveal({ open, order, children }: { open: SharedValue<number>; order: number; children: React.ReactNode }) {
  const style = useAnimatedStyle(() => {
    const start = 0.3 + order * 0.12;
    const p = interpolate(open.value, [start, start + 0.4], [0, 1], Extrapolation.CLAMP);
    return { opacity: p, transform: [{ translateY: (1 - p) * 14 }] };
  });
  return <Animated.View style={style}>{children}</Animated.View>;
}

function DetailRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={17} color={UI.grey} />
      <Text maxFontSizeMultiplier={1.3} style={styles.detailLabel}>{label}</Text>
      <Text maxFontSizeMultiplier={1.3} style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function ActionColumn({
  icon,
  label,
  status,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  status: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.action, pressed && { backgroundColor: UI.accentSoft }]}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${status}`}>
      <Ionicons name={icon} size={22} color={UI.accent} />
      <Text maxFontSizeMultiplier={1.3} style={styles.actionLabel}>{label}</Text>
      <Text maxFontSizeMultiplier={1.3} style={styles.actionStatus}>{status}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cardShadow: {
    position: 'absolute',
    left: 0,
    borderRadius: 24,
    backgroundColor: UI.accent,
    transformOrigin: 'top',
    shadowColor: UI.accent,
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  card: { flex: 1, borderRadius: 24, overflow: 'hidden' },
  watermark: {
    position: 'absolute',
    right: -6,
    bottom: 64,
    fontSize: 140,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.08)',
    letterSpacing: -6,
  },
  cardTop: { position: 'absolute', top: 16, right: 16 },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRail: { position: 'absolute', height: 60 },
  titleRotate: { flex: 1, justifyContent: 'center', transform: [{ rotate: '-90deg' }] },
  title: { fontSize: 46, fontWeight: '800', color: UI.bg, letterSpacing: 3 },
  cardBottom: { position: 'absolute', left: 92, right: 18, bottom: 46 },
  progressValue: { fontSize: 30, fontWeight: '700', color: UI.bg, textAlign: 'right', fontVariant: ['tabular-nums'] },
  progressLabel: { fontSize: 12.5, color: 'rgba(255,255,255,0.8)', textAlign: 'right' },
  progressTrack: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.25)', marginTop: 10, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2, backgroundColor: UI.bg },
  hint: { position: 'absolute', bottom: 10, left: 0, right: 0, alignItems: 'center' },

  tray: {
    position: 'absolute',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: UI.border,
    backgroundColor: UI.subtle,
    overflow: 'hidden',
  },
  // Pinned to the tray's bottom edge, so it's uncovered as the tray grows.
  details: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10, gap: 10 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 22 },
  detailLabel: { flex: 1, fontSize: 14, color: UI.grey },
  detailValue: { fontSize: 14, fontWeight: '700', color: UI.text, fontVariant: ['tabular-nums'] },
  divider: { height: 1, backgroundColor: UI.border, marginHorizontal: -16, marginTop: 2 },
  actions: { flexDirection: 'row', alignItems: 'stretch', marginTop: 8 },
  actionDivider: { width: 1, backgroundColor: UI.border, marginVertical: 8 },
  action: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 6, borderRadius: 14, gap: 2 },
  actionLabel: { fontSize: 11.5, color: UI.grey, marginTop: 2 },
  actionStatus: { fontSize: 13, fontWeight: '700', color: UI.accent, letterSpacing: 0.6, textTransform: 'uppercase' },

  srOnly: { position: 'absolute', width: 1, height: 1, opacity: 0 },
});
