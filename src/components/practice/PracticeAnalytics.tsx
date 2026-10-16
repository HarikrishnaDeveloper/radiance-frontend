import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

import { CategoryPerformance } from '@/components/home/CategoryPerformance';
import { UI } from '@/constants/ui';
import type { CategorySummary, UserStats } from '@/types/api';
import type { HomeData } from '@/types/dashboard.types';
import { Pressable } from '@/components/ui/pressable';
import { ScrollItem } from '@/components/ui/scroll-item';

type Props = {
  stats: UserStats | null;
  performance: HomeData['performance'] | null;
  categories: CategorySummary[];
  /** The parent scroll view's offset, for the shrink-and-fade on scroll. */
  scrollY: SharedValue<number>;
};

// Practice → Analytics: overall numbers, strong & weak subjects, and how far
// along each subject's stages the student is. Each block is a direct child of
// the parent scroll view (hence the fragment) so it can animate on scroll.
export function PracticeAnalytics({ stats, performance, categories, scrollY }: Props) {
  const stagesDone = categories.reduce((sum, c) => sum + c.completedStages, 0);
  const stagesTotal = categories.reduce((sum, c) => sum + c.totalStages, 0);
  // Furthest along first, so the list reads as a ranking.
  const bySubject = [...categories].sort((a, b) => b.progress - a.progress);

  return (
    <>
      {stats && (
        <ScrollItem scrollY={scrollY} style={styles.tiles}>
          <Tile label="Questions solved" value={stats.questionsSolved.toLocaleString()} />
          <Tile label="Accuracy" value={`${stats.accuracy}%`} />
          <Tile label="Syllabus covered" value={`${stats.syllabusCoverage}%`} />
          <Tile label="Stages done" value={`${stagesDone}/${stagesTotal}`} />
        </ScrollItem>
      )}

      {performance && (
        <ScrollItem scrollY={scrollY} style={{ marginTop: 24 }}>
          <CategoryPerformance performance={performance} />
        </ScrollItem>
      )}

      <ScrollItem scrollY={scrollY}>
        <Text style={styles.sectionTitle}>Stage completion by subject</Text>
        <View style={styles.card}>
          {bySubject.map((c, i) => (
            <Pressable
              key={c.id}
              onPress={() => router.push(`/category/${c.id}`)}
              style={({ pressed }) => [styles.row, i > 0 && styles.rowBorder, pressed && { backgroundColor: UI.accentSoft }]}
              accessibilityRole="button"
              accessibilityLabel={`${c.foodWorldName ?? c.name}, ${c.completedStages} of ${c.totalStages} stages, ${c.progress}%`}>
              <View style={styles.rowHead}>
                <Text style={styles.subject} numberOfLines={1}>
                  {c.foodWorldName ?? c.name}
                </Text>
                <Text style={styles.pct}>{c.progress}%</Text>
              </View>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${Math.min(Math.max(c.progress, 0), 100)}%` }]} />
              </View>
              <Text style={styles.meta}>
                {c.completedStages} of {c.totalStages} stages
              </Text>
            </Pressable>
          ))}
          {bySubject.length === 0 && <Text style={styles.empty}>No subjects yet.</Text>}
        </View>
      </ScrollItem>
    </>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.tile}>
      <Text style={styles.tileLabel} numberOfLines={1}>
        {label}
      </Text>
      <Text style={styles.tileValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // 2×2 on every phone width.
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { flexBasis: '40%', flexGrow: 1, borderWidth: 1, borderColor: UI.border, borderRadius: UI.radius, padding: 14 },
  tileLabel: { fontSize: 13, color: UI.grey },
  tileValue: { fontSize: 24, fontWeight: '700', color: UI.text, marginTop: 4, letterSpacing: -0.5, fontVariant: ['tabular-nums'] },

  sectionTitle: { fontSize: 18, fontWeight: '700', color: UI.text, letterSpacing: -0.2, marginBottom: 10 },
  card: { borderWidth: 1, borderColor: UI.border, borderRadius: UI.radius, overflow: 'hidden' },
  row: { paddingHorizontal: 16, paddingVertical: 12 },
  rowBorder: { borderTopWidth: 1, borderTopColor: UI.border },
  rowHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 },
  subject: { flex: 1, fontSize: 15, color: UI.text },
  pct: { fontSize: 14, fontWeight: '700', color: UI.text, fontVariant: ['tabular-nums'] },
  track: { height: 6, borderRadius: 3, backgroundColor: UI.border, marginTop: 8, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3, backgroundColor: UI.accent },
  meta: { fontSize: 12.5, color: UI.grey, marginTop: 6 },
  empty: { padding: 16, color: UI.grey, textAlign: 'center' },
});
