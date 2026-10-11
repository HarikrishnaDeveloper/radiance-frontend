import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { PlanItem } from '@/types/dashboard.types';

import { HT } from './home-theme';
import { SectionHeader } from './SectionHeader';

interface Props {
  plan: PlanItem[];
}

export function TodaysPlan({ plan }: Props) {
  const done = plan.filter((item) => item.isCompleted).length;

  return (
    <View style={styles.section}>
      <SectionHeader eyebrow="Today" title="Your plan" />
      <View style={styles.card}>
        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            <Text style={styles.summaryStrong}>{done}</Text> of {plan.length} done
          </Text>
          <View style={styles.segments}>
            {plan.map((item) => (
              <View key={item.id} style={[styles.segment, item.isCompleted && styles.segmentDone]} />
            ))}
          </View>
        </View>

        {plan.map((item, i) => (
          <Pressable
            key={item.id}
            onPress={() => router.push(item.route)}
            style={({ pressed }) => [styles.row, i === plan.length - 1 && styles.rowLast, pressed && { backgroundColor: HT.bg }]}
            accessibilityRole="button"
            accessibilityLabel={item.title}>
            <View style={[styles.marker, item.isCompleted && styles.markerDone]}>
              {item.isCompleted ? (
                <Ionicons name="checkmark" size={13} color={HT.surface} />
              ) : (
                <Text style={styles.markerText}>{i + 1}</Text>
              )}
            </View>
            <Text style={[styles.itemTitle, item.isCompleted && styles.itemTitleDone]}>{item.title}</Text>
            {!item.isCompleted && <Ionicons name="chevron-forward" size={16} color={HT.muted} />}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 28 },
  card: { backgroundColor: HT.surface, borderRadius: HT.radius, borderWidth: 1, borderColor: HT.hairline, overflow: 'hidden' },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: HT.hairline,
    backgroundColor: '#FBFAFD',
  },
  summaryText: { fontSize: 12.5, fontWeight: '600', color: HT.muted },
  summaryStrong: { fontWeight: '800', color: HT.ink },
  segments: { flexDirection: 'row', gap: 4 },
  segment: { width: 22, height: 4, borderRadius: HT.radius, backgroundColor: HT.hairline },
  segmentDone: { backgroundColor: HT.green },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: HT.hairline,
  },
  rowLast: { borderBottomWidth: 0 },
  marker: {
    width: 24,
    height: 24,
    borderRadius: HT.radius,
    borderWidth: 1.5,
    borderColor: HT.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerDone: { backgroundColor: HT.green, borderColor: HT.green },
  markerText: { fontSize: 11.5, fontWeight: '800', color: HT.inkSoft },
  itemTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: HT.ink },
  itemTitleDone: { color: HT.muted, textDecorationLine: 'line-through' },
});
