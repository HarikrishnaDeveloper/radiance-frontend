import { StyleSheet, Text, View } from 'react-native';

import { HT } from './home-theme';

interface Props {
  questionsSolved: number;
  accuracy: number;
  syllabusCoverage: number;
  paperTests: number;
}

type Stat = { label: string; value: string; percent?: number };

// Performance summary: four headline numbers in a 2×2 grid. Percentages get a
// thin bar underneath so they read at a glance.
export function StatsStrip({ questionsSolved, accuracy, syllabusCoverage, paperTests }: Props) {
  const stats: Stat[] = [
    { label: 'Questions solved', value: questionsSolved.toLocaleString() },
    { label: 'Accuracy', value: `${accuracy}%`, percent: accuracy },
    { label: 'Syllabus covered', value: `${syllabusCoverage}%`, percent: syllabusCoverage },
    { label: 'Full tests taken', value: String(paperTests) },
  ];

  return (
    <View style={styles.card}>
      {stats.map((s, i) => (
        <View
          key={s.label}
          style={[styles.cell, i % 2 === 1 && styles.cellRight, i >= 2 && styles.cellBottom]}
          accessibilityLabel={`${s.label}: ${s.value}`}>
          <Text style={styles.label} numberOfLines={1}>
            {s.label}
          </Text>
          <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
            {s.value}
          </Text>
          {s.percent !== undefined && (
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${Math.min(Math.max(s.percent, 0), 100)}%` }]} />
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: HT.surface,
    borderRadius: HT.radius,
    borderWidth: 1,
    borderColor: HT.hairline,
    marginHorizontal: 20,
  },
  cell: { width: '50%', paddingVertical: 14, paddingHorizontal: 16 },
  cellRight: { borderLeftWidth: 1, borderLeftColor: HT.hairline },
  cellBottom: { borderTopWidth: 1, borderTopColor: HT.hairline },
  label: { fontSize: 13, color: HT.muted },
  value: { fontSize: 24, fontWeight: '700', color: HT.ink, marginTop: 4, letterSpacing: -0.5, fontVariant: ['tabular-nums'] },
  track: { height: 4, borderRadius: 2, backgroundColor: HT.hairline, marginTop: 8, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 2, backgroundColor: HT.primary },
});
