import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { memo, useCallback, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type ListRenderItem,
} from "react-native";
import Animated, {
  Extrapolation,
  FadeIn,
  interpolate,
  interpolateColor,
  runOnJS,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";

import { formatMarks } from "@/components/paper-test/theme";
import { Pressable } from "@/components/ui/pressable";
import { UI } from "@/constants/ui";
import { playSound } from "@/lib/sounds";
import type { PaperSummary } from "@/types/api";

const CARD_HEIGHT = 68;
const STEP = CARD_HEIGHT + 30; // card + gap: one snap
const ARC_DEGREES = 12; // angle between neighbouring cards on the wheel
const ARC_RAD = (ARC_DEGREES * Math.PI) / 180;
// Wheel radius chosen so neighbouring cards sit one STEP apart along the rim.
const RADIUS = STEP / ARC_RAD;
const MAX_OFFSET = 7; // beyond this a card has rolled off the wheel (hidden)

// The dial: the open-paper button sits in the hollow of the arc, ringed by a
// track whose ticks (one per paper) turn with the scroll. The tick pointing
// straight right lines up with the centred card.
const DIAL_X = 50; // dial centre from the left edge; the ring tucks just off-screen
const BUTTON_R = 42;
const RING_R = 54;
const TICK_INNER = RING_R + 6;
const TICK_LEN = 12;
const TICK_DEGREES = 14;
const CARD_LEFT = DIAL_X + TICK_INNER + TICK_LEN + 12; // cards start clear of the dial
const CARD_RIGHT = 14;

// Previous-year papers on a vertical arc (wheel picker style): the centred
// card sits upright on the right; cards above and below tilt and curve away
// to the left as if riding the rim of a wheel. The dial in the arc's hollow
// marks the position and opens the active paper.
export function PaperArcCarousel({ papers }: { papers: PaperSummary[] }) {
  const { width } = useWindowDimensions();
  const [height, setHeight] = useState(0);
  const scrollY = useSharedValue(0);
  const [active, setActive] = useState(0);

  const cardWidth = Math.min(width - CARD_LEFT - CARD_RIGHT, 300);

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  // A click the moment a new paper reaches the centre, in step with the
  // card's own change: one per paper passed, silent while staying on one.
  const activeRef = useRef(0);
  const changePaper = useCallback((index: number) => {
    if (index === activeRef.current) return;
    activeRef.current = index;
    setActive(index);
    playSound("click");
  }, []);

  useAnimatedReaction(
    () => Math.round(scrollY.value / STEP),
    (index, prev) => {
      // prev is null on mount: that's the starting paper, not a change.
      if (prev !== null && index !== prev)
        runOnJS(changePaper)(Math.min(Math.max(index, 0), papers.length - 1));
    },
  );

  const renderItem = useCallback<ListRenderItem<PaperSummary>>(
    ({ item, index }) => (
      <ArcRow paper={item} index={index} width={cardWidth} scrollY={scrollY} />
    ),
    [cardWidth, scrollY],
  );

  const paper = papers[active];
  // Padding so the first and last papers can reach the centre (a row is STEP tall).
  const edgePadding = Math.max((height - STEP) / 2, 0);

  return (
    <View
      style={{ flex: 1 }}
      onLayout={(e) => setHeight(e.nativeEvent.layout.height)}
    >
      {height > 0 && (
        <Animated.FlatList
          data={papers}
          keyExtractor={(p) => String(p.id)}
          renderItem={renderItem}
          getItemLayout={(_, index) => ({
            length: STEP,
            offset: edgePadding + STEP * index,
            index,
          })}
          showsVerticalScrollIndicator={false}
          snapToInterval={STEP}
          decelerationRate="normal"
          onScroll={onScroll}
          scrollEventThrottle={16}
          removeClippedSubviews={false}
          initialNumToRender={MAX_OFFSET * 2}
          windowSize={7}
          contentContainerStyle={{ paddingVertical: edgePadding }}
        />
      )}

      {height > 0 && paper && (
        <View
          style={[styles.dial, { top: height / 2 - RING_R - TICK_LEN - 6 }]}
          pointerEvents="box-none"
        >
          <View style={styles.ring} pointerEvents="none" />
          {papers.map((p, i) => (
            <DialTick key={p.id} index={i} scrollY={scrollY} />
          ))}
          <View style={styles.halo} pointerEvents="none" />
          <Pressable
            onPress={() => router.push(`/paper/${paper.id}`)}
            style={({ pressed }) => [
              styles.button,
              pressed && { opacity: 0.85 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`${paper.inProgressAttemptId ? "Resume" : "Open"} ${paper.year} paper`}
          >
            <Animated.View
              key={paper.id}
              entering={FadeIn.duration(180)}
              style={styles.buttonInner}
            >
              <Ionicons
                name={
                  paper.inProgressAttemptId ? "play" : "document-text-outline"
                }
                size={16}
                color={UI.bg}
              />
              <Text maxFontSizeMultiplier={1.3} style={styles.buttonYear}>
                {paper.year}
              </Text>
              <Text maxFontSizeMultiplier={1.3} style={styles.buttonLabel}>
                {paper.inProgressAttemptId ? "Resume" : "Open"}
              </Text>
            </Animated.View>
          </Pressable>
        </View>
      )}
    </View>
  );
}

// One tick on the dial ring. It turns with the scroll on the UI thread, so the
// ring glides with the cards instead of stepping when the active paper changes.
function DialTick({
  index,
  scrollY,
}: {
  index: number;
  scrollY: SharedValue<number>;
}) {
  const style = useAnimatedStyle(() => {
    const offset = index - scrollY.value / STEP; // papers from the centre; 0 = active
    const distance = Math.abs(offset);
    const angle = offset * TICK_DEGREES;
    return {
      opacity: interpolate(
        Math.abs(angle),
        [0, 70, 92],
        [1, 0.9, 0],
        Extrapolation.CLAMP,
      ),
      backgroundColor: interpolateColor(
        distance,
        [0, 0.6],
        [UI.accent, UI.border],
      ),
      transform: [
        { rotateZ: `${angle}deg` },
        { translateX: TICK_INNER + TICK_LEN / 2 },
        {
          scaleX: interpolate(
            distance,
            [0, 0.6],
            [1, 0.55],
            Extrapolation.CLAMP,
          ),
        },
        {
          scaleY: interpolate(
            distance,
            [0, 0.6],
            [1.6, 1],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  });
  return <Animated.View style={[styles.tick, style]} pointerEvents="none" />;
}

const ArcRow = memo(function ArcRow({
  paper,
  index,
  width,
  scrollY,
}: {
  paper: PaperSummary;
  index: number;
  width: number;
  scrollY: SharedValue<number>;
}) {
  const reduceMotion = useReducedMotion();

  const style = useAnimatedStyle(() => {
    // Cards from the centre: positive = below, negative = above. (interpolate
    // needs an increasing input range: scrolling less than index*STEP means
    // the card hasn't reached the centre yet, so it's below it.)
    const offset = interpolate(
      scrollY.value,
      [(index - MAX_OFFSET) * STEP, index * STEP, (index + MAX_OFFSET) * STEP],
      [MAX_OFFSET, 0, -MAX_OFFSET],
      Extrapolation.CLAMP,
    );
    const distance = Math.abs(offset);
    if (reduceMotion)
      return {
        opacity: interpolate(distance, [0, 1], [1, 0.55], Extrapolation.CLAMP),
      };
    // Place the card on a real circle (hub off to the left): rotate it like a
    // spoke, pull it left by the arc's sag and toward the centre by how much the
    // circle curves away from the straight list position. A gentle scale falloff
    // adds depth so cards ease in and out of focus rather than just fading.
    const angle = offset * ARC_RAD;
    return {
      opacity: interpolate(
        distance,
        [0, 1, 2.5, 4, 5],
        [1, 0.92, 0.62, 0.25, 0],
        Extrapolation.CLAMP,
      ),
      transform: [
        { translateX: -RADIUS * (1 - Math.cos(angle)) },
        { translateY: RADIUS * Math.sin(angle) - offset * STEP },
        { rotateZ: `${angle}rad` },
        {
          scale: interpolate(
            distance,
            [0, 1, 3],
            [1, 0.95, 0.86],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  });

  const locked = !!paper.locked;
  // Narrow phones (≈ under 360pt wide): drop the badge so the exam name keeps
  // room; the best score still shows in the meta line.
  const compact = width < 230;
  const bestPct =
    paper.bestScore && paper.bestScore.maxScore > 0
      ? Math.round((paper.bestScore.score / paper.bestScore.maxScore) * 100)
      : null;

  return (
    <Animated.View style={[styles.row, style]}>
      <Pressable
        onPress={() => router.push(`/paper/${paper.id}`)}
        style={({ pressed }) => [
          styles.card,
          { width },
          pressed && { opacity: 0.9 },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${paper.title ?? paper.examType.name} ${paper.year}${locked ? ", locked" : ""}${
          bestPct !== null ? `, best ${bestPct}%` : ""
        }`}
      >
        <Text
          maxFontSizeMultiplier={1.3}
          style={[styles.year, compact && { fontSize: 22 }]}
        >
          {paper.year}
        </Text>
        <View style={styles.info}>
          <Text
            maxFontSizeMultiplier={1.3}
            style={styles.exam}
            numberOfLines={1}
          >
            {paper.examType.name}
          </Text>
          <Text
            maxFontSizeMultiplier={1.3}
            style={styles.meta}
            numberOfLines={1}
          >
            {paper.questionCount} questions
            {paper.bestScore
              ? ` · ${formatMarks(paper.bestScore.score)}/${paper.bestScore.maxScore}`
              : ""}
          </Text>
        </View>
        {!compact && (
          <View style={styles.badge}>
            {locked ? (
              <Ionicons
                name="lock-closed"
                size={16}
                color="rgba(255,255,255,0.9)"
              />
            ) : bestPct !== null ? (
              <Text maxFontSizeMultiplier={1.3} style={styles.badgeText}>
                {bestPct}%
              </Text>
            ) : (
              <Ionicons name="arrow-forward" size={16} color={UI.bg} />
            )}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
});

const DIAL_SIZE = (RING_R + TICK_LEN + 6) * 2;

const styles = StyleSheet.create({
  row: {
    height: STEP,
    justifyContent: "center",
    alignItems: "flex-end",
    paddingRight: CARD_RIGHT,
  },
  card: {
    height: CARD_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingLeft: 14,
    paddingRight: 8,
    borderRadius: 18,
    backgroundColor: UI.accent,
  },
  year: {
    fontSize: 26,
    fontWeight: "800",
    color: UI.bg,
    letterSpacing: -1,
    fontVariant: ["tabular-nums"],
  },
  info: { flex: 1 },
  exam: { fontSize: 14, fontWeight: "700", color: UI.bg },
  meta: { fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 2 },
  badge: {
    width: 48,
    height: 52,
    borderRadius: 13,
    backgroundColor: UI.text,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 14,
    fontWeight: "800",
    color: UI.bg,
    fontVariant: ["tabular-nums"],
  },

  // A square box centred on the dial; children are centred in it.
  dial: {
    position: "absolute",
    left: DIAL_X - DIAL_SIZE / 2,
    width: DIAL_SIZE,
    height: DIAL_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    width: RING_R * 2,
    height: RING_R * 2,
    borderRadius: RING_R,
    borderWidth: 1.5,
    borderColor: UI.border,
  },
  tick: { position: "absolute", width: TICK_LEN, height: 2.5, borderRadius: 2 },
  halo: {
    position: "absolute",
    width: (BUTTON_R + 6) * 2,
    height: (BUTTON_R + 6) * 2,
    borderRadius: BUTTON_R + 6,
    backgroundColor: UI.accentSoft,
  },
  button: {
    width: BUTTON_R * 2,
    height: BUTTON_R * 2,
    borderRadius: BUTTON_R,
    backgroundColor: UI.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonInner: { alignItems: "center" },
  buttonYear: {
    fontSize: 17,
    fontWeight: "800",
    color: UI.bg,
    letterSpacing: -0.5,
    fontVariant: ["tabular-nums"],
    marginTop: 1,
  },
  buttonLabel: {
    fontSize: 10.5,
    fontWeight: "600",
    color: "rgba(255,255,255,0.85)",
    marginTop: -1,
  },
});
