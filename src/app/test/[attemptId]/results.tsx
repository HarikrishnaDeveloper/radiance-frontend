import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, SectionList, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { outcomeOf, ReviewCard, type Outcome } from '@/components/paper-test/review-card';
import { formatDuration, formatMarks, PT, questionLabel } from '@/components/paper-test/theme';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api-client';
import type { PaperResultQuestion, PaperResultsResponse, SectionResult } from '@/types/api';
import { Pressable } from '@/components/ui/pressable';
import { playSound } from '@/lib/sounds';

type Filter = 'ALL' | 'WRONG' | 'SKIPPED' | 'CORRECT';
type Row = { q: PaperResultQuestion; i: number; outcome: Outcome };
type Section = { key: string; title: string; summary: SectionResult | undefined; data: Row[] };

const AnimatedSectionList = Animated.createAnimatedComponent(SectionList<Row, Section>);

// Stat cards fold away over the first COLLAPSE px of scrolling.
const CARD_HEIGHT = 104;
const CARDS_SPACE = CARD_HEIGHT + 16;
const COLLAPSE = CARDS_SPACE;

// Full-paper results, "bank app" style: the score stays pinned and shrinks,
// the stat cards tilt back in 3D and fold away as you scroll, and the answer
// review is grouped by subject under sticky headers.
export default function TestResultsScreen() {
  const { attemptId, done } = useLocalSearchParams<{ attemptId: string; done?: string }>();
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const [results, setResults] = useState<PaperResultsResponse | null>(null);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  useEffect(() => {
    if (!token || !attemptId) return;
    api
      .paperResults(token, Number(attemptId))
      .then((r) => {
        if (done === '1') playSound('success');
        setResults(r);
      })
      .catch(() => {});
  }, [token, attemptId, done]);

  const rows = useMemo<Row[]>(() => (results?.questions ?? []).map((q, i) => ({ q, i, outcome: outcomeOf(q) })), [results]);

  // Filtered rows, grouped by subject in paper order.
  const sections = useMemo<Section[]>(() => {
    const keep = rows.filter(({ outcome }) =>
      filter === 'ALL'
        ? true
        : filter === 'WRONG'
          ? outcome === 'wrong'
          : filter === 'SKIPPED'
            ? outcome === 'skipped'
            : outcome === 'correct' || outcome === 'dropped'
    );
    const groups = new Map<number, Section>();
    for (const row of keep) {
      const id = row.q.category.id;
      if (!groups.has(id)) {
        groups.set(id, {
          key: String(id),
          title: row.q.category.name,
          summary: results?.sections.find((s) => s.categoryId === id),
          data: [],
        });
      }
      groups.get(id)!.data.push(row);
    }
    return [...groups.values()];
  }, [rows, filter, results]);

  const toggle = useCallback((id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Score shrinks toward its left edge as the cards fold away.
  const scoreStyle = useAnimatedStyle(() => {
    if (reduceMotion) return {};
    return {
      transform: [{ scale: interpolate(scrollY.value, [0, COLLAPSE], [1, 0.72], Extrapolation.CLAMP) }],
    };
  });

  // The card strip's height closes so the list moves up into the space.
  const cardsStripStyle = useAnimatedStyle(() => ({
    height: interpolate(scrollY.value, [0, COLLAPSE], [CARDS_SPACE, 0], Extrapolation.CLAMP),
  }));

  if (!results) {
    return (
      <View style={styles.centerFill}>
        <ActivityIndicator color={PT.purple600} />
      </View>
    );
  }

  const attempted = results.correctCount + results.wrongCount;
  const accuracy = attempted > 0 ? Math.round((results.correctCount / attempted) * 100) : 0;
  const negative = results.wrongCount * Math.abs(results.marking.wrong);
  const timeTaken = Math.min(results.timeTakenSeconds, results.durationSeconds ?? Infinity);

  const cards: { icon: keyof typeof Ionicons.glyphMap; tint: string; value: string; label: string }[] = [
    { icon: 'checkmark-circle', tint: PT.green, value: String(results.correctCount), label: 'Correct' },
    { icon: 'close-circle', tint: PT.red, value: String(results.wrongCount), label: 'Wrong' },
    { icon: 'remove-circle', tint: PT.ink400, value: String(results.skippedCount), label: 'Skipped' },
    { icon: 'analytics', tint: PT.purple600, value: `${accuracy}%`, label: 'Accuracy' },
    { icon: 'time', tint: PT.purple600, value: formatDuration(timeTaken), label: 'Time taken' },
    { icon: 'trending-down', tint: PT.red, value: `−${formatMarks(negative)}`, label: 'Negative marks' },
  ];

  const filters: [Filter, string][] = [
    ['ALL', `All ${rows.length}`],
    ['WRONG', `Wrong ${results.wrongCount}`],
    ['SKIPPED', `Skipped ${results.skippedCount}`],
    ['CORRECT', `Correct ${results.correctCount}`],
  ];

  return (
    <View style={styles.screen}>
      {/* ── Pinned header: score + folding stat cards ── */}
      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={10} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={24} color={PT.ink900} />
          </Pressable>
          <Text style={styles.eyebrow} numberOfLines={1}>
            UPSC {results.paper?.year} · {results.section?.name ?? 'Full paper'} · {results.testMode === 'EXAM' ? 'Exam' : 'Practice'}
          </Text>
          {results.paper && (
            <Pressable
              onPress={() => router.replace(`/paper/${results.paper!.id}`)}
              hitSlop={10}
              style={styles.iconBtn}
              accessibilityRole="button"
              accessibilityLabel="Back to paper">
              <Ionicons name="refresh" size={20} color={PT.purple600} />
            </Pressable>
          )}
        </View>

        <Animated.View style={[styles.scoreWrap, scoreStyle]}>
          <Text style={styles.score}>
            {formatMarks(results.score)}
            <Text style={styles.scoreMax}> / {results.maxScore}</Text>
          </Text>
          <Text style={styles.scoreLabel}>Your score · {results.scorePercent}%</Text>
        </Animated.View>

        <Animated.View style={[styles.cardsStrip, cardsStripStyle]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsRow}>
            {cards.map((c, i) => (
              <StatCard key={c.label} index={i} scrollY={scrollY} reduceMotion={reduceMotion} {...c} />
            ))}
          </ScrollView>
        </Animated.View>
      </SafeAreaView>

      {/* ── Review, grouped by subject with sticky headers ── */}
      <AnimatedSectionList
        sections={sections}
        keyExtractor={(row) => String(row.q.id)}
        onScroll={onScroll}
        scrollEventThrottle={16}
        stickySectionHeadersEnabled
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}
        ListHeaderComponent={
          <View style={styles.filters}>
            {filters.map(([key, label]) => (
              <Pressable
                key={key}
                onPress={() => setFilter(key)}
                style={[styles.filterChip, filter === key && styles.filterChipActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: filter === key }}>
                <Text style={[styles.filterText, filter === key && styles.filterTextActive]}>{label}</Text>
              </Pressable>
            ))}
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle} numberOfLines={1}>
              {section.title}
            </Text>
            {section.summary && (
              <Text style={styles.sectionMeta}>
                {formatMarks(section.summary.score)}/{section.summary.maxScore} · {section.summary.accuracy}%
              </Text>
            )}
          </View>
        )}
        renderItem={({ item }) =>
          expanded.has(item.q.id) ? (
            <View style={{ marginTop: 6 }}>
              <ReviewCard question={item.q} index={item.i} expanded onToggle={toggle} />
            </View>
          ) : (
            <AnswerRow row={item} marking={results.marking} onPress={() => toggle(item.q.id)} />
          )
        }
        ListEmptyComponent={<Text style={styles.empty}>No questions in this filter.</Text>}
        initialNumToRender={12}
      />
    </View>
  );
}

// One stat card. While the strip folds away each card tilts back on its X
// axis (3D), shrinks and fades — the later cards a beat after the first.
function StatCard({
  index,
  scrollY,
  reduceMotion,
  icon,
  tint,
  value,
  label,
}: {
  index: number;
  scrollY: SharedValue<number>;
  reduceMotion: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  value: string;
  label: string;
}) {
  const style = useAnimatedStyle(() => {
    if (reduceMotion) return {};
    const start = Math.min(index * 6, 30);
    const progress = interpolate(scrollY.value, [start, COLLAPSE], [0, 1], Extrapolation.CLAMP);
    return {
      opacity: 1 - progress,
      transform: [
        { perspective: 600 },
        { translateY: -progress * 18 },
        { rotateX: `${progress * 70}deg` },
        { scale: 1 - progress * 0.15 },
      ],
    };
  });

  return (
    <Animated.View style={[styles.card, style]}>
      <Ionicons name={icon} size={20} color={tint} />
      <View>
        <Text style={styles.cardValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
          {value}
        </Text>
        <Text style={styles.cardLabel}>{label}</Text>
      </View>
    </Animated.View>
  );
}

const OUTCOME_LABEL: Record<Outcome, string> = { correct: 'Correct', wrong: 'Wrong', skipped: 'Skipped', dropped: 'Dropped by UPSC' };

function AnswerRow({ row, marking, onPress }: { row: Row; marking: PaperResultsResponse['marking']; onPress: () => void }) {
  const { q, i, outcome } = row;
  const marks =
    outcome === 'correct' || outcome === 'dropped'
      ? `+${formatMarks(marking.correct)}`
      : outcome === 'wrong'
        ? `−${formatMarks(Math.abs(marking.wrong))}`
        : '0';
  const tone = outcome === 'correct' ? PT.green : outcome === 'wrong' ? PT.red : PT.ink400;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: PT.purple50 }]}
      accessibilityRole="button"
      accessibilityLabel={`${questionLabel(q, i)}, ${OUTCOME_LABEL[outcome]}, ${marks} marks. Show answer.`}>
      <View style={[styles.qBadge, { borderColor: tone }]}>
        <Text style={styles.qBadgeText}>{q.questionNo ?? i + 1}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowText} numberOfLines={2}>
          {q.text}
        </Text>
        <Text style={styles.rowMeta}>{OUTCOME_LABEL[outcome]}</Text>
      </View>
      <Text style={[styles.rowMarks, { color: tone }]}>{marks}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: PT.bg },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: PT.bg },

  header: { backgroundColor: PT.bg, borderBottomWidth: 1, borderBottomColor: PT.line, zIndex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, marginTop: 4 },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { flex: 1, fontSize: 13, color: PT.ink600 },

  scoreWrap: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 12, transformOrigin: 'left' },
  score: { fontSize: 44, fontWeight: '700', color: PT.ink900, letterSpacing: -1, fontVariant: ['tabular-nums'] },
  scoreMax: { fontSize: 20, fontWeight: '500', color: PT.ink400 },
  scoreLabel: { fontSize: 13, color: PT.ink600, marginTop: 2 },

  cardsStrip: { overflow: 'hidden' },
  cardsRow: { gap: 10, paddingHorizontal: 20, paddingBottom: 16 },
  card: {
    width: 124,
    height: CARD_HEIGHT,
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    backgroundColor: PT.tealSoft,
    transformOrigin: 'bottom',
  },
  cardValue: { fontSize: 22, fontWeight: '700', color: PT.ink900, fontVariant: ['tabular-nums'] },
  cardLabel: { fontSize: 12.5, color: PT.ink600, marginTop: 1 },

  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  filterChip: { paddingVertical: 8, paddingHorizontal: 13, borderRadius: 8, borderWidth: 1, borderColor: PT.line },
  filterChipActive: { backgroundColor: PT.purple600, borderColor: PT.purple600 },
  filterText: { fontSize: 13, fontWeight: '600', color: PT.ink600 },
  filterTextActive: { color: PT.card },

  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 8,
    backgroundColor: PT.bg,
  },
  sectionTitle: { flex: 1, fontSize: 20, fontWeight: '700', color: PT.ink900, letterSpacing: -0.3 },
  sectionMeta: { fontSize: 13, color: PT.ink600, fontVariant: ['tabular-nums'] },

  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 12 },
  qBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    backgroundColor: PT.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qBadgeText: { fontSize: 13, fontWeight: '700', color: PT.ink900, fontVariant: ['tabular-nums'] },
  rowText: { fontSize: 14.5, fontWeight: '600', color: PT.ink900, lineHeight: 20 },
  rowMeta: { fontSize: 12.5, color: PT.ink400, marginTop: 2 },
  rowMarks: { fontSize: 15, fontWeight: '700', fontVariant: ['tabular-nums'] },

  empty: { textAlign: 'center', color: PT.ink400, marginTop: 30 },
});
