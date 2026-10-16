import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

import { Button } from '@/components/ui/button';
import { dialog } from '@/components/ui/dialog';
import { Pressable } from '@/components/ui/pressable';
import { ScrollItem } from '@/components/ui/scroll-item';
import { UI } from '@/constants/ui';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api-client';
import { playSound } from '@/lib/sounds';
import { buildInsights, formatSeconds, type SubjectInsight, type TestInsights, type TrendPoint } from '@/lib/test-insights';
import type { LeaderboardEntry, PaperResultsResponse, PaperSummary } from '@/types/api';

type Props = {
  papers: PaperSummary[];
  /** Results of the most recent finished papers; null while loading. */
  results: PaperResultsResponse[] | null;
  /** The student's leaderboard entry (null when not ranked yet). */
  rank: LeaderboardEntry | null;
  totalRanked: number;
  /** The parent scroll view's offset, for the shrink-and-fade on scroll. */
  scrollY: SharedValue<number>;
  /** Switches the Tests screen to its Papers view. */
  onBrowsePapers: () => void;
};

const accent = (alpha: number) => `${UI.accent}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;

// Tests → Analytics, as a study coach: which subjects cost the most marks,
// whether scores are moving, and how negative marking and pacing affect them.
// Each block is a direct child of the parent scroll view (hence the fragment)
// so it can animate on scroll.
export function TestDashboard({ papers, results, rank, totalRanked, scrollY, onBrowsePapers }: Props) {
  if (!results) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={UI.accent} />
      </View>
    );
  }

  const insights = buildInsights(results);
  if (!insights) {
    return (
      <ScrollItem scrollY={scrollY} style={styles.block}>
        <View style={styles.emptyCard}>
          <Ionicons name="analytics-outline" size={28} color={UI.accent} />
          <Text style={styles.emptyTitle}>Your study coach starts here</Text>
          <Text style={styles.emptyText}>
            Finish a previous-year paper and this page will show which subjects cost you marks, how your scores move, and what to work on next.
          </Text>
          <Button label="Browse papers" onPress={onBrowsePapers} style={{ marginTop: 16, alignSelf: 'stretch' }} />
        </View>
      </ScrollItem>
    );
  }

  const best = Math.max(
    ...papers.map((p) => (p.bestScore && p.bestScore.maxScore > 0 ? Math.round((p.bestScore.score / p.bestScore.maxScore) * 100) : 0)),
  );

  return (
    <>
      <ScrollItem scrollY={scrollY} style={styles.block}>
        <View style={styles.tiles}>
          <Tile icon="trending-up-outline" label="Recent average" value={`${insights.average}%`} />
          <Tile icon="trophy-outline" label="Best paper score" value={`${best}%`} />
          <Tile icon="podium-outline" label="Leaderboard" value={rank ? `#${rank.rank}` : '—'} note={rank ? `of ${totalRanked}` : 'Not ranked'} />
          <Tile icon="document-text-outline" label="Papers tried" value={`${papers.filter((p) => p.bestScore).length}/${papers.length}`} />
        </View>
      </ScrollItem>

      {insights.subjects.length > 0 && (
        <ScrollItem scrollY={scrollY} style={styles.block}>
          <FocusSubjects subjects={insights.subjects} />
        </ScrollItem>
      )}

      {insights.trend.length > 1 && (
        <ScrollItem scrollY={scrollY} style={styles.block}>
          <ScoreTrend trend={insights.trend} average={insights.average} change={insights.change} />
        </ScrollItem>
      )}

      <ScrollItem scrollY={scrollY} style={styles.block}>
        <AnswerHabits insights={insights} />
      </ScrollItem>

      {insights.pace && (
        <ScrollItem scrollY={scrollY} style={styles.block}>
          <Pacing pace={insights.pace} />
        </ScrollItem>
      )}

      {insights.latestMistakes && (
        <ScrollItem scrollY={scrollY} style={styles.block}>
          <Pressable
            onPress={() => router.push(`/test/${insights.latestMistakes!.attemptId}/results`)}
            style={({ pressed }) => [styles.reviewCard, pressed && { backgroundColor: UI.accentSoft }]}
            accessibilityRole="button"
            accessibilityLabel={`Review ${insights.latestMistakes.wrong} mistakes from ${insights.latestMistakes.label}`}>
            <View style={styles.reviewIcon}>
              <Ionicons name="refresh-outline" size={20} color={UI.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.reviewTitle}>Review your {insights.latestMistakes.wrong} mistakes</Text>
              <Text style={styles.reviewSub}>From {insights.latestMistakes.label} — with explanations</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={UI.greyLight} />
          </Pressable>
        </ScrollItem>
      )}

      <Text style={styles.footnote}>Based on your last {insights.tests} finished paper{insights.tests === 1 ? '' : 's'}.</Text>
    </>
  );
}

function Tile({ icon, label, value, note }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; note?: string }) {
  return (
    <View style={styles.tile}>
      <Ionicons name={icon} size={16} color={UI.accent} />
      <Text style={styles.tileValue}>
        {value}
        {note ? <Text style={styles.tileNote}> {note}</Text> : null}
      </Text>
      <Text style={styles.tileLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

// ─── Subjects to focus on ───────────────────────────────────────────────
// Weakest three by share of marks lost, each with a one-tap practice set;
// the strongest is named so the student knows what's working.

function FocusSubjects({ subjects }: { subjects: SubjectInsight[] }) {
  const { token } = useAuth();
  const [starting, setStarting] = useState<number | null>(null);
  const weak = subjects.slice(0, 3);
  const strongest = subjects.length > 3 ? subjects[subjects.length - 1] : null;

  async function practice(subject: SubjectInsight) {
    if (!token || starting !== null) return;
    setStarting(subject.categoryId);
    try {
      const attempt = await api.createAttempt(token, { mode: 'CATEGORY_PRACTICE', categoryIds: [subject.categoryId] });
      playSound('open');
      router.push(`/quiz/${attempt.id}`);
    } catch {
      dialog.error('Could not start practice', 'Please check your connection and try again.');
    } finally {
      setStarting(null);
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <Text style={styles.cardTitle}>Subjects costing you marks</Text>
      </View>
      <Text style={styles.cardSub}>Marks scored out of marks available in your recent papers</Text>

      {weak.map((s, i) => {
        const pct = Math.max(0, Math.round((s.score / s.maxScore) * 100));
        return (
          <View key={s.categoryId} style={[styles.subjectRow, i > 0 && styles.rowBorder]}>
            <View style={{ flex: 1 }}>
              <View style={styles.subjectHead}>
                <Text style={styles.subjectName} numberOfLines={1}>
                  {s.name}
                </Text>
                <Text style={styles.subjectPct}>{pct}%</Text>
              </View>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${pct}%` }]} />
              </View>
              <Text style={styles.subjectMeta}>
                {s.accuracy}% accurate · {s.wrong} wrong · {s.skipped} skipped
              </Text>
            </View>
            <Pressable
              onPress={() => practice(s)}
              disabled={starting !== null}
              style={({ pressed }) => [styles.practiceBtn, pressed && { backgroundColor: UI.accentPressed }]}
              accessibilityRole="button"
              accessibilityLabel={`Practice ${s.name}`}>
              {starting === s.categoryId ? <ActivityIndicator size="small" color={UI.bg} /> : <Text style={styles.practiceText}>Practice</Text>}
            </Pressable>
          </View>
        );
      })}

      {strongest && (
        <View style={styles.strongRow}>
          <Ionicons name="checkmark-circle" size={16} color={UI.green} />
          <Text style={styles.strongText}>
            Strongest: <Text style={styles.strongName}>{strongest.name}</Text> ({Math.max(0, Math.round((strongest.score / strongest.maxScore) * 100))}%)
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Score trend ────────────────────────────────────────────────────────
// Recent tests in the order taken. One series, one hue; tap a bar to read it.

const CHART_HEIGHT = 120;

function ScoreTrend({ trend, average, change }: { trend: TrendPoint[]; average: number; change: number | null }) {
  const [selectedId, setSelectedId] = useState(trend[trend.length - 1].attemptId);
  const selected = trend.find((p) => p.attemptId === selectedId) ?? trend[trend.length - 1];

  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <Text style={styles.cardTitle}>Score trend</Text>
        {change !== null && (
          <Text style={[styles.cardMeta, { color: change >= 0 ? UI.green : UI.red }]}>
            {change >= 0 ? '▲' : '▼'} {Math.abs(change)}% latest
          </Text>
        )}
      </View>
      <Text style={styles.caption} accessibilityLiveRegion="polite">
        <Text style={styles.captionValue}>{selected.pct}%</Text> · {selected.label}
        {selected.testMode === 'PRACTICE' ? ' (practice mode)' : ''}
      </Text>

      <View style={styles.plot}>
        <View style={[styles.avgLine, { bottom: (Math.max(average, 0) / 100) * CHART_HEIGHT }]} pointerEvents="none">
          <Text style={styles.avgLabel}>avg {average}%</Text>
        </View>
        <View style={styles.bars}>
          {trend.map((p, i) => {
            const active = p.attemptId === selected.attemptId;
            return (
              <Pressable
                key={p.attemptId}
                onPress={() => setSelectedId(p.attemptId)}
                style={styles.barSlot}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`Test ${i + 1}, ${p.label}: ${p.pct}%`}>
                <View style={[styles.bar, { height: Math.max((Math.max(p.pct, 0) / 100) * CHART_HEIGHT, 3) }, !active && styles.barIdle]} />
              </Pressable>
            );
          })}
        </View>
      </View>
      <View style={styles.axisRow}>
        <Text style={styles.axisText}>Older</Text>
        <Text style={styles.axisText}>Latest</Text>
      </View>
    </View>
  );
}

// ─── Answer habits ──────────────────────────────────────────────────────
// Right / wrong / skipped, and what negative marking cost.

function AnswerHabits({ insights }: { insights: TestInsights }) {
  const { correct, wrong, skipped, penalty, penaltyPct } = insights;
  const total = correct + wrong + skipped;
  const answered = correct + wrong;
  const accuracy = answered ? Math.round((correct / answered) * 100) : 0;
  const attemptRate = total ? Math.round((answered / total) * 100) : 0;
  const parts = [
    { key: 'correct', label: 'Correct', count: correct, color: UI.green },
    { key: 'wrong', label: 'Wrong', count: wrong, color: UI.red },
    { key: 'skipped', label: 'Skipped', count: skipped, color: UI.border },
  ].filter((p) => p.count > 0);

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>How you answer</Text>
      {total > 0 && (
        <View style={styles.stack} accessible accessibilityLabel={`${correct} correct, ${wrong} wrong, ${skipped} skipped`}>
          {parts.map((p) => (
            <View key={p.key} style={[styles.segment, { flex: p.count, backgroundColor: p.color }]} />
          ))}
        </View>
      )}
      <View style={styles.legend}>
        {parts.map((p) => (
          <View key={p.key} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: p.color }]} />
            <Text style={styles.legendLabel}>{p.label}</Text>
            <Text style={styles.legendValue}>{p.count.toLocaleString()}</Text>
          </View>
        ))}
      </View>

      <View style={styles.ratios}>
        <Ratio label="Accuracy when you answer" value={`${accuracy}%`} />
        <View style={styles.ratioDivider} />
        <Ratio label="Questions attempted" value={`${attemptRate}%`} />
        <View style={styles.ratioDivider} />
        <Ratio label="Lost to negative marks" value={`${Math.round(penalty * 100) / 100}`} tone={penaltyPct >= 5 ? 'bad' : undefined} />
      </View>
    </View>
  );
}

function Ratio({ label, value, tone }: { label: string; value: string; tone?: 'bad' }) {
  return (
    <View style={styles.ratio}>
      <Text style={[styles.ratioValue, tone === 'bad' && { color: UI.red }]}>{value}</Text>
      <Text style={styles.ratioLabel}>{label}</Text>
    </View>
  );
}

// ─── Pacing ─────────────────────────────────────────────────────────────

function Pacing({ pace }: { pace: NonNullable<TestInsights['pace']> }) {
  const used = Math.min(pace.usedPct, 100);
  const verdict = pace.usedPct >= 97 ? 'Running out of time' : pace.usedPct < 70 ? 'Finishing early' : 'Well paced';
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <Text style={styles.cardTitle}>Exam pacing</Text>
        <Text style={styles.cardMeta}>{verdict}</Text>
      </View>
      <View style={styles.paceRow}>
        <View style={styles.ratio}>
          <Text style={styles.ratioValue}>{formatSeconds(pace.usedPerQ)}</Text>
          <Text style={styles.ratioLabel}>Your time per question</Text>
        </View>
        <View style={styles.ratioDivider} />
        <View style={styles.ratio}>
          <Text style={styles.ratioValue}>{formatSeconds(pace.allowedPerQ)}</Text>
          <Text style={styles.ratioLabel}>Allowed per question</Text>
        </View>
      </View>
      <View style={[styles.track, { marginTop: 14 }]}>
        <View style={[styles.fill, { width: `${used}%` }]} />
      </View>
      <Text style={styles.subjectMeta}>{pace.usedPct}% of the exam time used</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { paddingVertical: 60, alignItems: 'center' },
  block: { marginBottom: 16 },
  footnote: { fontSize: 12, color: UI.greyLight, textAlign: 'center', marginTop: 4 },

  emptyCard: { borderWidth: 1, borderColor: UI.border, borderRadius: 16, padding: 22, alignItems: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: UI.text, marginTop: 10, textAlign: 'center' },
  emptyText: { fontSize: 14, color: UI.grey, lineHeight: 20, marginTop: 6, textAlign: 'center' },

  // Tiles: 2×2 on every phone width.
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { flexBasis: '40%', flexGrow: 1, borderWidth: 1, borderColor: accent(0.12), backgroundColor: accent(0.03), borderRadius: 14, padding: 14 },
  tileValue: { fontSize: 22, fontWeight: '700', color: UI.text, marginTop: 8, fontVariant: ['tabular-nums'] },
  tileNote: { fontSize: 12.5, fontWeight: '400', color: UI.grey },
  tileLabel: { fontSize: 12.5, color: UI.grey, marginTop: 2 },

  card: { borderWidth: 1, borderColor: UI.border, borderRadius: 16, padding: 16 },
  cardHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 },
  cardTitle: { fontSize: 15.5, fontWeight: '700', color: UI.text },
  cardSub: { fontSize: 12.5, color: UI.grey, marginTop: 3 },
  cardMeta: { fontSize: 12, fontWeight: '600', color: UI.grey },

  // Focus subjects
  subjectRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 },
  rowBorder: { borderTopWidth: 1, borderTopColor: UI.border },
  subjectHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 },
  subjectName: { flex: 1, fontSize: 14.5, fontWeight: '600', color: UI.text },
  subjectPct: { fontSize: 14, fontWeight: '700', color: UI.text, fontVariant: ['tabular-nums'] },
  subjectMeta: { fontSize: 12, color: UI.grey, marginTop: 6 },
  track: { height: 6, borderRadius: 3, backgroundColor: UI.border, marginTop: 8, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3, backgroundColor: UI.accent },
  practiceBtn: { minWidth: 84, height: 36, borderRadius: 18, backgroundColor: UI.accent, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  practiceText: { fontSize: 13, fontWeight: '700', color: UI.bg },
  strongRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 12, borderTopWidth: 1, borderTopColor: UI.border },
  strongText: { fontSize: 13, color: UI.grey },
  strongName: { fontWeight: '700', color: UI.text },

  // Trend
  caption: { fontSize: 13, color: UI.grey, marginTop: 6 },
  captionValue: { fontSize: 20, fontWeight: '700', color: UI.text, fontVariant: ['tabular-nums'] },
  plot: { height: CHART_HEIGHT, marginTop: 14, borderBottomWidth: 1, borderBottomColor: UI.border },
  avgLine: { position: 'absolute', left: 0, right: 0, borderTopWidth: 1, borderStyle: 'dashed', borderColor: UI.greyLight, zIndex: 1 },
  avgLabel: { position: 'absolute', right: 0, bottom: 2, fontSize: 11, color: UI.grey, backgroundColor: UI.bg, paddingLeft: 4 },
  bars: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  barSlot: { flex: 1, height: '100%', justifyContent: 'flex-end', alignItems: 'center' },
  bar: { width: '100%', maxWidth: 32, backgroundColor: UI.accent, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  barIdle: { opacity: 0.35 },
  axisRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  axisText: { fontSize: 11, color: UI.greyLight },

  // Answer habits
  stack: { flexDirection: 'row', height: 12, gap: 2, marginTop: 14, borderRadius: 4, overflow: 'hidden' },
  segment: { height: '100%' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 12.5, color: UI.grey },
  legendValue: { fontSize: 12.5, fontWeight: '700', color: UI.text, fontVariant: ['tabular-nums'] },
  ratios: { flexDirection: 'row', marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: UI.border },
  ratio: { flex: 1 },
  ratioDivider: { width: 1, backgroundColor: UI.border, marginHorizontal: 10 },
  ratioValue: { fontSize: 19, fontWeight: '700', color: UI.text, fontVariant: ['tabular-nums'] },
  ratioLabel: { fontSize: 11.5, color: UI.grey, marginTop: 2, lineHeight: 15 },

  // Pacing
  paceRow: { flexDirection: 'row', marginTop: 14 },

  // Review mistakes
  reviewCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: accent(0.2), borderRadius: 16, padding: 14 },
  reviewIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: UI.accentSoft, alignItems: 'center', justifyContent: 'center' },
  reviewTitle: { fontSize: 14.5, fontWeight: '700', color: UI.text },
  reviewSub: { fontSize: 12.5, color: UI.grey, marginTop: 2 },
});
