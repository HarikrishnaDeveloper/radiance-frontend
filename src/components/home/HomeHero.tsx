import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HT } from './home-theme';

interface Props {
  greeting: string;
  studentName: string;
  targetLabel: string | null;
  streak: number;
  overallProgress: number;
  onPressProfile: () => void;
  onPressStreak: () => void;
}

// Dark gradient header: greeting, exam target, streak and syllabus coverage.
export function HomeHero({ greeting, studentName, targetLabel, streak, overallProgress, onPressProfile, onPressStreak }: Props) {
  const initial = studentName.charAt(0).toUpperCase();

  return (
    <LinearGradient colors={[HT.heroTop, HT.heroBottom]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
      <SafeAreaView edges={['top']}>
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.name} numberOfLines={1}>
              {studentName || 'Aspirant'}
            </Text>
            {targetLabel && (
              <View style={styles.targetRow}>
                <Ionicons name="flag" size={11} color={HT.gold} />
                <Text style={styles.target}>Preparing for {targetLabel}</Text>
              </View>
            )}
          </View>
          <Pressable onPress={onPressProfile} style={styles.avatar} accessibilityRole="button" accessibilityLabel="Profile">
            {initial ? <Text style={styles.avatarText}>{initial}</Text> : <Ionicons name="person" size={18} color={HT.gold} />}
          </Pressable>
        </View>

        <View style={styles.metaRow}>
          <Pressable onPress={onPressStreak} style={styles.streak} accessibilityRole="button" accessibilityLabel={`${streak} day streak`}>
            <Ionicons name="flame" size={15} color={HT.goldBright} />
            <Text style={styles.streakValue}>{streak}</Text>
            <Text style={styles.streakLabel}>day streak</Text>
          </Pressable>

          <View style={styles.coverage}>
            <View style={styles.coverageHead}>
              <Text style={styles.coverageLabel}>Syllabus covered</Text>
              <Text style={styles.coverageValue}>{overallProgress}%</Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${Math.max(overallProgress, 2)}%` }]} />
            </View>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 20, paddingBottom: 56 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 14 },
  greeting: { fontSize: 11, fontWeight: '800', color: HT.gold, letterSpacing: 1.6, textTransform: 'uppercase' },
  name: { fontSize: 28, fontWeight: '800', color: HT.onHero, marginTop: 4, letterSpacing: -0.6 },
  targetRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  target: { fontSize: 13, fontWeight: '600', color: HT.onHeroMuted },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: HT.gold,
    backgroundColor: 'rgba(212,169,60,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '800', color: HT.goldBright },

  metaRow: { flexDirection: 'row', alignItems: 'stretch', gap: 12, marginTop: 22 },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: HT.heroLine,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: HT.radius,
  },
  streakValue: { fontSize: 17, fontWeight: '800', color: HT.onHero },
  streakLabel: { fontSize: 11.5, fontWeight: '600', color: HT.onHeroMuted },
  coverage: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: HT.heroLine,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: HT.radius,
  },
  coverageHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  coverageLabel: { fontSize: 11, fontWeight: '700', color: HT.onHeroMuted, letterSpacing: 0.3 },
  coverageValue: { fontSize: 13, fontWeight: '800', color: HT.goldBright },
  track: { height: 4, backgroundColor: HT.heroLine, borderRadius: HT.radius, marginTop: 8, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: HT.gold, borderRadius: HT.radius },
});
