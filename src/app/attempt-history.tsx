import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PageHeader } from '@/components/home/PageHeader';
import { Button } from '@/components/ui/button';
import { UI } from '@/constants/ui';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api-client';
import type { AttemptHistoryItem } from '@/types/api';
import { Pressable } from '@/components/ui/pressable';

type Filter = 'all' | 'papers' | 'practice';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'papers', label: 'Papers' },
  { key: 'practice', label: 'Practice' },
];

// Every completed attempt (full papers, sections and subject practice),
// newest first. Opened from the history icon on the Tests tab.
export default function AttemptHistoryScreen() {
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<AttemptHistoryItem[] | null>(null);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setItems(await api.attemptHistory(token, true));
      setError(false);
    } catch {
      setError(true);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const shown = useMemo(
    () =>
      (items ?? []).filter((a) =>
        filter === 'all' ? true : filter === 'papers' ? a.mode === 'FULL_PAPER' : a.mode !== 'FULL_PAPER'
      ),
    [items, filter]
  );

  return (
    <View style={styles.screen}>
      <PageHeader title="Attempt history" subtitle={items ? `${items.length} completed` : undefined} />

      {!items ? (
        <View style={styles.center}>
          {error ? (
            <>
              <Text style={styles.muted}>Could not load your attempts.</Text>
              <Button label="Try again" onPress={load} style={{ marginTop: 14 }} />
            </>
          ) : (
            <ActivityIndicator color={UI.accent} />
          )}
        </View>
      ) : (
        <ScrollView contentContainerStyle={[styles.body, { paddingBottom: 32 + insets.bottom }]} showsVerticalScrollIndicator={false}>
          <View style={styles.filters}>
            {FILTERS.map((f) => {
              const active = f.key === filter;
              return (
                <Pressable
                  key={f.key}
                  onPress={() => setFilter(f.key)}
                  style={[styles.chip, active && styles.chipActive]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{f.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {shown.length === 0 ? (
            <Text style={[styles.muted, { marginTop: 40 }]}>
              {items.length === 0 ? 'No completed attempts yet.' : 'Nothing here for this filter.'}
            </Text>
          ) : (
            <View style={styles.list}>
              {shown.map((a, i) => (
                <AttemptRow key={a.id} attempt={a} first={i === 0} />
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function AttemptRow({ attempt, first }: { attempt: AttemptHistoryItem; first: boolean }) {
  const isPaper = attempt.mode === 'FULL_PAPER';
  const accuracy = attempt.totalQuestions > 0 ? Math.round((attempt.correctCount / attempt.totalQuestions) * 100) : 0;
  const date = new Date(attempt.completedAt ?? attempt.startedAt).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const kind = isPaper ? (attempt.testMode === 'EXAM' ? 'Exam' : 'Paper practice') : 'Subject practice';

  return (
    <Pressable
      onPress={() => router.push(isPaper ? `/test/${attempt.id}/results` : `/results/${attempt.id}`)}
      style={({ pressed }) => [styles.row, !first && styles.rowBorder, pressed && { backgroundColor: UI.accentSoft }]}
      accessibilityRole="button"
      accessibilityLabel={`${attempt.title}, ${attempt.correctCount} of ${attempt.totalQuestions} correct, ${date}`}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title} numberOfLines={2}>
          {attempt.title}
        </Text>
        <Text style={styles.meta}>
          {kind} · {date}
        </Text>
      </View>
      <View style={styles.score}>
        <Text style={styles.scoreValue}>{accuracy}%</Text>
        <Text style={styles.scoreSub}>
          {attempt.correctCount}/{attempt.totalQuestions}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={UI.greyLight} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: UI.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  muted: { fontSize: 15, color: UI.grey, textAlign: 'center' },
  body: { padding: 20 },

  filters: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  chip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: UI.radius, borderWidth: 1, borderColor: UI.border },
  chipActive: { backgroundColor: UI.accent, borderColor: UI.accent },
  chipText: { fontSize: 14, fontWeight: '500', color: UI.grey },
  chipTextActive: { color: UI.bg },

  list: { borderWidth: 1, borderColor: UI.border, borderRadius: UI.radius, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  rowBorder: { borderTopWidth: 1, borderTopColor: UI.border },
  title: { fontSize: 15, fontWeight: '600', color: UI.text },
  meta: { fontSize: 13, color: UI.grey, marginTop: 3 },
  score: { alignItems: 'flex-end' },
  scoreValue: { fontSize: 16, fontWeight: '700', color: UI.text, fontVariant: ['tabular-nums'] },
  scoreSub: { fontSize: 12, color: UI.grey, fontVariant: ['tabular-nums'] },
});
