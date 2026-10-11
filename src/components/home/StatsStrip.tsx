import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { HT, homeShadow } from './home-theme';

interface Props {
  questionsSolved: number;
  accuracy: number;
  paperTests: number;
}

// Three headline numbers in one card that overlaps the hero's lower edge.
export function StatsStrip({ questionsSolved, accuracy, paperTests }: Props) {
  const stats: { icon: keyof typeof Ionicons.glyphMap; value: string; label: string }[] = [
    { icon: 'checkmark-done', value: questionsSolved.toLocaleString(), label: 'Solved' },
    { icon: 'analytics', value: `${accuracy}%`, label: 'Accuracy' },
    { icon: 'document-text', value: String(paperTests), label: 'Paper tests' },
  ];

  return (
    <View style={styles.card}>
      {stats.map((s, i) => (
        <View key={s.label} style={[styles.cell, i > 0 && styles.divider]}>
          <Ionicons name={s.icon} size={14} color={HT.goldDeep} />
          <Text style={styles.value}>{s.value}</Text>
          <Text style={styles.label}>{s.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: HT.surface,
    borderRadius: HT.radius,
    borderWidth: 1,
    borderColor: HT.hairline,
    marginTop: -36,
    marginHorizontal: 20,
    paddingVertical: 16,
    ...homeShadow,
  },
  cell: { flex: 1, alignItems: 'center', gap: 4 },
  divider: { borderLeftWidth: 1, borderLeftColor: HT.hairline },
  value: { fontSize: 22, fontWeight: '800', color: HT.ink, letterSpacing: -0.5, fontVariant: ['tabular-nums'] },
  label: { fontSize: 10.5, fontWeight: '700', color: HT.muted, letterSpacing: 0.8, textTransform: 'uppercase' },
});
