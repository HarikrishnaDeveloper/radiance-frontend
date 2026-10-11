import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ContinueItem } from '@/types/dashboard.types';

import { HT, homeShadow } from './home-theme';

interface Props {
  data: ContinueItem | null;
}

// "Pick up where you left off" — the unfinished test or the next stage.
export function ContinueLearning({ data }: Props) {
  if (!data) return null;

  return (
    <Pressable
      onPress={() => router.push(data.route)}
      style={({ pressed }) => [styles.wrap, pressed && { opacity: 0.92 }]}
      accessibilityRole="button"
      accessibilityLabel={`Resume ${data.title}`}>
      <LinearGradient colors={[HT.primary, HT.primaryDeep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
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
        <View style={styles.cta}>
          <Text style={styles.ctaText}>Resume</Text>
          <Ionicons name="arrow-forward" size={14} color={HT.ink} />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 28, borderRadius: HT.radius, ...homeShadow },
  card: { borderRadius: HT.radius, padding: 18 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: { fontSize: 10.5, fontWeight: '800', color: HT.goldBright, letterSpacing: 1.4, textTransform: 'uppercase' },
  percent: { fontSize: 12, fontWeight: '800', color: 'rgba(255,255,255,0.8)' },
  title: { fontSize: 17, fontWeight: '800', color: HT.onHero, marginTop: 8, letterSpacing: -0.2, lineHeight: 23 },
  track: { height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: HT.radius, marginTop: 14, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: HT.goldBright, borderRadius: HT.radius },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: HT.goldBright,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: HT.radius,
    marginTop: 16,
  },
  ctaText: { fontSize: 13, fontWeight: '800', color: HT.ink, letterSpacing: 0.2 },
});
