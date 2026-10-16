import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import type { ContinueItem } from '@/types/dashboard.types';
import { Pressable } from '@/components/ui/pressable';

import { HT } from './home-theme';

interface Props {
  data: ContinueItem | null;
}

// "Pick up where you left off" — the unfinished practice set or test, or the
// student's current stage. With nothing to resume, invites them to start.
export function ContinueLearning({ data }: Props) {
  if (!data) {
    return (
      <Pressable
        onPress={() => router.push('/practice')}
        style={({ pressed }) => [styles.wrap, pressed && { opacity: 0.92 }]}
        accessibilityRole="button"
        accessibilityLabel="Start practicing">
        <View style={styles.card}>
          <Text style={styles.eyebrow}>Continue learning</Text>
          <Text style={styles.title}>Pick a subject and start solving PYQs</Text>
          <View style={styles.cta}>
            <Text style={styles.ctaText}>Start practicing</Text>
            <Ionicons name="arrow-forward" size={14} color={HT.surface} />
          </View>
        </View>
      </Pressable>
    );
  }

  const cta = data.started ? 'Resume' : 'Start';

  return (
    <Pressable
      onPress={() => router.push(data.route)}
      style={({ pressed }) => [styles.wrap, pressed && { opacity: 0.92 }]}
      accessibilityRole="button"
      accessibilityLabel={`${cta} ${data.title}, ${data.progressLabel}`}>
      <View style={styles.card}>
        <View style={styles.head}>
          <Text style={styles.eyebrow}>Continue · {data.type}</Text>
          <Text style={styles.percent}>{data.progress}%</Text>
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {data.title}
        </Text>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.max(data.progress, 2)}%` }]} />
        </View>
        <Text style={styles.progressLabel}>{data.progressLabel}</Text>
        <View style={styles.cta}>
          <Text style={styles.ctaText}>{cta}</Text>
          <Ionicons name="arrow-forward" size={14} color={HT.surface} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 28 },
  card: { borderRadius: HT.radius, borderWidth: 1, borderColor: HT.hairline, padding: 16, backgroundColor: HT.surface },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: { fontSize: 13, color: HT.muted },
  percent: { fontSize: 13, fontWeight: '600', color: HT.ink },
  title: { fontSize: 17, fontWeight: '700', color: HT.ink, marginTop: 6, lineHeight: 23 },
  track: { height: 6, backgroundColor: HT.hairline, borderRadius: 3, marginTop: 14, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: HT.primary, borderRadius: 3 },
  progressLabel: { fontSize: 13, color: HT.muted, marginTop: 8 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: HT.primary,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: HT.radius,
    marginTop: 14,
  },
  ctaText: { fontSize: 14, fontWeight: '600', color: HT.surface },
});
