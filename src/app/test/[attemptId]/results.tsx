import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { outcomeOf, ReviewCard } from '@/components/paper-test/review-card';
import { formatDuration, formatMarks, PT } from '@/components/paper-test/theme';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api-client';
import type { PaperResultsResponse } from '@/types/api';

type Filter = 'ALL' | 'WRONG' | 'SKIPPED' | 'CORRECT';

export default function TestResultsScreen() {
  const { attemptId } = useLocalSearchParams<{ attemptId: string }>();
  const { token } = useAuth();
  const [results, setResults] = useState<PaperResultsResponse | null>(null);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!token || !attemptId) return;
    api.paperResults(token, Number(attemptId)).then(setResults).catch(() => {});
  }, [token, attemptId]);

  const indexed = useMemo(() => (results?.questions ?? []).map((q, i) => ({ q, i, outcome: outcomeOf(q) })), [results]);
  const visible = useMemo(
    () =>
      indexed.filter(({ outcome }) =>
        filter === 'ALL' ? true : filter === 'WRONG' ? outcome === 'wrong' : filter === 'SKIPPED' ? outcome === 'skipped' : outcome === 'correct' || outcome === 'dropped'
      ),
    [indexed, filter]
  );

  const toggle = useCallback((id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

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
  const scorePct = results.maxScore > 0 ? Math.max(0, results.score / results.maxScore) : 0;

  const header = (
    <View>
      <LinearGradient colors={[PT.purple700, PT.purple900]} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={styles.hero}>
        <SafeAreaView edges={['top']}>
          <View style={styles.heroTop}>
            <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={18} color={PT.card} />
            </Pressable>
            <Text style={styles.heroEyebrow}>
              UPSC {results.paper?.year} · {results.section?.name ?? 'Full paper'} · {results.testMode === 'EXAM' ? 'Exam' : 'Practice'}
            </Text>
          </View>
          <Text style={styles.heroLabel}>Your score</Text>
          <Text style={styles.heroScore}>
            {formatMarks(results.score)}
            <Text style={styles.heroMax}> / {results.maxScore}</Text>
          </Text>
          <View style={styles.scoreTrack}>
            <View style={[styles.scoreFill, { width: `${scorePct * 100}%` }]} />
          </View>
          <Text style={styles.heroNote}>
            +{results.marking.correct} per correct · {results.marking.wrong} per wrong · {formatMarks(negative)} marks lost to negative marking
          </Text>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.body}>
        <View style={styles.statGrid}>
          <Stat value={results.correctCount} label="Correct" color={PT.green} />
          <Stat value={results.wrongCount} label="Wrong" color={PT.red} />
          <Stat value={results.skippedCount} label="Skipped" color={PT.ink600} />
          <Stat value={`${accuracy}%`} label="Accuracy" color={PT.purple600} />
        </View>
        <View style={styles.timeRow}>
          <Ionicons name="time-outline" size={14} color={PT.ink400} />
          <Text style={styles.timeText}>
            Time taken {formatDuration(Math.min(results.timeTakenSeconds, results.durationSeconds ?? Infinity))}
            {results.durationSeconds ? ` of ${formatDuration(results.durationSeconds)}` : ''}
          </Text>
        </View>

        {results.sections.length > 1 && (
          <>
            <Text style={styles.sectionLabel}>Subject-wise performance</Text>
            <View style={styles.card}>
              {results.sections.map((s, i) => (
                <View key={s.categoryId} style={[styles.subjectRow, i > 0 && styles.rowBorder]}>
                  <View style={styles.subjectHead}>
                    <Text style={styles.subjectName}>{s.name}</Text>
                    <Text style={styles.subjectScore}>
                      {formatMarks(s.score)}
                      <Text style={styles.subjectMax}>/{s.maxScore}</Text>
                    </Text>
                  </View>
                  <View style={styles.stackBar}>
                    {s.correct > 0 && <View style={{ flex: s.correct, backgroundColor: PT.green }} />}
                    {s.wrong > 0 && <View style={{ flex: s.wrong, backgroundColor: PT.red }} />}
                    {s.skipped > 0 && <View style={{ flex: s.skipped, backgroundColor: PT.line }} />}
                  </View>
                  <Text style={styles.subjectMeta}>
                    {s.correct} correct · {s.wrong} wrong · {s.skipped} skipped · {s.accuracy}% accuracy
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={styles.actions}>
          {results.paper && (
            <Pressable onPress={() => router.replace(`/paper/${results.paper!.id}`)} style={styles.actionBtn}>
              <Ionicons name="refresh" size={16} color={PT.purple600} />
              <Text style={styles.actionText}>Back to paper</Text>
            </Pressable>
          )}
        </View>

        <Text style={styles.sectionLabel}>Review answers</Text>
        <View style={styles.filters}>
          {(
            [
              ['ALL', `All ${indexed.length}`],
              ['WRONG', `Wrong ${results.wrongCount}`],
              ['SKIPPED', `Skipped ${results.skippedCount}`],
              ['CORRECT', `Correct ${results.correctCount}`],
            ] as [Filter, string][]
          ).map(([key, label]) => (
            <Pressable key={key} onPress={() => setFilter(key)} style={[styles.filterChip, filter === key && styles.filterChipActive]}>
              <Text style={[styles.filterText, filter === key && styles.filterTextActive]}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <FlatList
        data={visible}
        keyExtractor={(item) => String(item.q.id)}
        ListHeaderComponent={header}
        renderItem={({ item }) => (
<ReviewCard question={item.q} index={item.i} expanded={expanded.has(item.q.id)} onToggle={toggle} />
        )}
        ListEmptyComponent={<Text style={styles.empty}>No questions in this filter.</Text>}
        contentContainerStyle={{ paddingBottom: 40 }}
        initialNumToRender={8}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

function Stat({ value, label, color }: { value: number | string; label: string; color: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: PT.bg },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: PT.bg },

  hero: { paddingHorizontal: 20, paddingBottom: 24, borderBottomLeftRadius: 2, borderBottomRightRadius: 2 },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6, marginBottom: 18 },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEyebrow: { flex: 1, fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.75)' },
  heroLabel: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.7)' },
  heroScore: { fontSize: 44, fontWeight: '800', color: PT.card, letterSpacing: -1 },
  heroMax: { fontSize: 18, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
  scoreTrack: { height: 8, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)', overflow: 'hidden', marginTop: 10 },
  scoreFill: { height: '100%', borderRadius: 2, backgroundColor: PT.gold },
  heroNote: { fontSize: 11.5, fontWeight: '600', color: 'rgba(255,255,255,0.7)', marginTop: 10, lineHeight: 16 },

  body: { paddingHorizontal: 18, paddingTop: 16 },
  statGrid: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, backgroundColor: PT.card, borderRadius: 2, paddingVertical: 14, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '700', color: PT.ink400, marginTop: 2 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, justifyContent: 'center' },
  timeText: { fontSize: 12.5, fontWeight: '600', color: PT.ink600 },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: PT.ink400,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 22,
    marginBottom: 10,
  },
  card: { backgroundColor: PT.card, borderRadius: 2, overflow: 'hidden' },
  rowBorder: { borderTopWidth: 1, borderTopColor: PT.line },
  subjectRow: { padding: 14 },
  subjectHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  subjectName: { fontSize: 14, fontWeight: '800', color: PT.ink900, flexShrink: 1 },
  subjectScore: { fontSize: 15, fontWeight: '800', color: PT.purple600 },
  subjectMax: { fontSize: 11, fontWeight: '700', color: PT.ink400 },
  stackBar: { flexDirection: 'row', height: 8, borderRadius: 2, overflow: 'hidden', marginTop: 8, backgroundColor: PT.line },
  subjectMeta: { fontSize: 11.5, fontWeight: '500', color: PT.ink400, marginTop: 6 },

  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: PT.purple50,
    paddingVertical: 13,
    borderRadius: 2,
  },
  actionText: { fontSize: 13.5, fontWeight: '800', color: PT.purple600 },

  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  filterChip: { paddingVertical: 8, paddingHorizontal: 13, borderRadius: 2, backgroundColor: PT.card, borderWidth: 1, borderColor: PT.line },
  filterChipActive: { backgroundColor: PT.purple600, borderColor: PT.purple600 },
  filterText: { fontSize: 12.5, fontWeight: '700', color: PT.ink600 },
  filterTextActive: { color: PT.card },
  empty: { textAlign: 'center', color: PT.ink400, fontWeight: '600', marginTop: 20 },
});
