import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { WeakAreaItem, WeakAreaLevel } from '@/types/dashboard.types';

import { HT } from './home-theme';
import { SectionHeader } from './SectionHeader';

interface Props {
  areas: WeakAreaItem[];
}

const LEVEL: Record<WeakAreaLevel, { color: string; soft: string }> = {
  red: { color: HT.red, soft: HT.redSoft },
  orange: { color: HT.amber, soft: HT.amberSoft },
  green: { color: HT.green, soft: HT.greenSoft },
};

// Lowest-accuracy subjects, each with an accuracy meter. Before there's
// enough data, explains what unlocks this section instead of hiding it.
export function WeakAreas({ areas }: Props) {
  return (
    <View style={styles.section}>
      <SectionHeader eyebrow="Focus areas" title="Needs attention" actionLabel="Practice" onAction={() => router.push('/practice')} />
      <View style={styles.card}>
        {areas.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="pulse" size={18} color={HT.muted} />
            <Text style={styles.emptyText}>Answer at least 5 questions in a subject and your weakest subjects will appear here.</Text>
          </View>
        ) : (
          areas.map((area, i) => {
            const look = LEVEL[area.level];
            return (
              <Pressable
                key={area.categoryId}
                onPress={() => router.push(`/category/${area.categoryId}`)}
                style={({ pressed }) => [styles.row, i > 0 && styles.rowBorder, pressed && { backgroundColor: HT.bg }]}
                accessibilityRole="button"
                accessibilityLabel={`Practice ${area.topicName}, accuracy ${area.accuracy}%`}>
                <View style={{ flex: 1 }}>
                  <View style={styles.rowHead}>
                    <Text style={styles.topic}>{area.topicName}</Text>
                    <Text style={[styles.accuracy, { color: look.color }]}>{area.accuracy}%</Text>
                  </View>
                  <View style={[styles.meter, { backgroundColor: look.soft }]}>
                    <View style={[styles.meterFill, { width: `${Math.max(area.accuracy, 3)}%`, backgroundColor: look.color }]} />
                  </View>
                  <Text style={styles.meta}>{area.answered} answered</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={HT.muted} />
              </Pressable>
            );
          })
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 28 },
  card: { backgroundColor: HT.surface, borderRadius: HT.radius, borderWidth: 1, borderColor: HT.hairline, overflow: 'hidden' },
  empty: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16 },
  emptyText: { flex: 1, fontSize: 13, fontWeight: '500', color: HT.muted, lineHeight: 19 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  rowBorder: { borderTopWidth: 1, borderTopColor: HT.hairline },
  rowHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  topic: { fontSize: 14, fontWeight: '700', color: HT.ink },
  accuracy: { fontSize: 14, fontWeight: '800', fontVariant: ['tabular-nums'] },
  meter: { height: 4, borderRadius: HT.radius, marginTop: 8, overflow: 'hidden' },
  meterFill: { height: '100%', borderRadius: HT.radius },
  meta: { fontSize: 11, fontWeight: '600', color: HT.muted, marginTop: 6 },
});
