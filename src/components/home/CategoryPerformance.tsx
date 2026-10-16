import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import type { CategoryItem, HomeData } from '@/types/dashboard.types';
import { Pressable } from '@/components/ui/pressable';

import { HT } from './home-theme';
import { SectionHeader } from './SectionHeader';

interface Props {
  performance: HomeData['performance'];
}

// Subject-wise accuracy split into strong and weak categories (classified by
// the backend once a subject has enough answers). Weak ones link straight to
// revision practice.
export function CategoryPerformance({ performance }: Props) {
  const { strong, weak, hasRatedCategories, minAnswers } = performance;

  return (
    <View style={styles.section}>
      <SectionHeader title="Strong & weak areas" />
      <View style={styles.card}>
        {!hasRatedCategories ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Not enough data yet</Text>
            <Text style={styles.emptyText}>
              Answer at least {minAnswers} questions in a subject to see where you&apos;re strong and what to revise.
            </Text>
          </View>
        ) : (
          <>
            <Group title="Needs revision" weak items={weak} emptyText="Nothing to revise right now." />
            <Group title="Strong" items={strong} emptyText="Reach 70% accuracy in a subject to see it here." />
          </>
        )}
      </View>
    </View>
  );
}

function Group({ title, weak, items, emptyText }: { title: string; weak?: boolean; items: CategoryItem[]; emptyText: string }) {
  // Green/red only marks which group a subject is in: a small dot by the
  // heading and the accuracy figure. Everything else stays neutral.
  const tone = weak ? HT.red : HT.green;

  return (
    <View style={!weak && styles.groupBorder}>
      <View style={styles.groupHead}>
        <View style={styles.groupLabel}>
          <View style={[styles.dot, { backgroundColor: tone }]} />
          <Text style={styles.groupTitle}>{title}</Text>
        </View>
        <Text style={styles.groupCount}>{items.length}</Text>
      </View>
      {items.length === 0 ? (
        <Text style={styles.groupEmpty}>{emptyText}</Text>
      ) : (
        items.map((item) => (
          <Pressable
            key={item.categoryId}
            onPress={() => router.push(`/category/${item.categoryId}`)}
            style={({ pressed }) => [styles.row, pressed && { backgroundColor: HT.primarySoft }]}
            accessibilityRole="button"
            accessibilityLabel={`${weak ? 'Revise' : 'Practice'} ${item.name}, accuracy ${item.accuracy}%`}>
            <View style={{ flex: 1 }}>
              <Text style={styles.topic} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.meta}>
                {weak && <Text style={{ color: tone }}>{item.accuracy}% accuracy</Text>}
                {weak ? ' · ' : ''}
                {item.answered} answered
              </Text>
            </View>
            {weak ? (
              <View style={styles.reviseBtn}>
                <Text style={styles.reviseText}>Revise</Text>
              </View>
            ) : (
              <Text style={[styles.accuracy, { color: tone }]}>{item.accuracy}%</Text>
            )}
          </Pressable>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 28 },
  card: { backgroundColor: HT.surface, borderRadius: HT.radius, borderWidth: 1, borderColor: HT.hairline, overflow: 'hidden' },
  empty: { padding: 16 },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: HT.ink },
  emptyText: { fontSize: 13.5, color: HT.muted, lineHeight: 19, marginTop: 4 },

  groupBorder: { borderTopWidth: 1, borderTopColor: HT.hairline },
  groupHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
  groupLabel: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  groupTitle: { fontSize: 13, fontWeight: '600', color: HT.muted },
  groupCount: { fontSize: 13, color: HT.muted, fontVariant: ['tabular-nums'] },
  groupEmpty: { fontSize: 13.5, color: HT.muted, paddingHorizontal: 16, paddingTop: 4, paddingBottom: 14 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 11 },
  topic: { fontSize: 15, color: HT.ink },
  meta: { fontSize: 12.5, color: HT.muted, marginTop: 2 },
  accuracy: { fontSize: 16, fontWeight: '700', color: HT.ink, fontVariant: ['tabular-nums'] },
  reviseBtn: { backgroundColor: HT.primary, paddingHorizontal: 14, paddingVertical: 7, borderRadius: HT.radius },
  reviseText: { fontSize: 13, fontWeight: '600', color: HT.surface },
});
