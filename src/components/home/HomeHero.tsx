import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Pressable } from '@/components/ui/pressable';

import { GlassStreak } from './GlassStreak';
import { HT } from './home-theme';

interface Props {
  greeting: string;
  studentName: string;
  notificationCount: number;
  streak: number;
  dailyGoal: { completed: number; total: number };
  onPressNotifications: () => void;
  onPressStreak: () => void;
  onPressDailyGoal: () => void;
}

// Accent at a given opacity, so the panel stays inside the app palette.
const accent = (alpha: number) => `${HT.primary}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;

// Page header: greeting and name with notifications on the right,
// then the streak and today's goal (tasks done against the study plan).
// It sits on its own soft violet panel so it reads as one section, apart
// from the white page that scrolls below it.
export function HomeHero({
  greeting,
  studentName,
  notificationCount,
  streak,
  dailyGoal,
  onPressNotifications,
  onPressStreak,
  onPressDailyGoal,
}: Props) {
  const goalMet = dailyGoal.total > 0 && dailyGoal.completed >= dailyGoal.total;

  return (
    <LinearGradient colors={[HT.primarySoft, accent(0.05)]} start={{ x: 0, y: 0 }} end={{ x: 0.4, y: 1 }} style={styles.panel}>
      {/* A faint accent glow in the corner for depth. */}


      <SafeAreaView edges={['top']} style={styles.hero}>
        <View style={styles.topRow}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={styles.greeting}>{greeting}</Text>
            {studentName ? (
              <Text style={styles.name} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
                {studentName}
              </Text>
            ) : null}
          </View>
          <Pressable
            onPress={onPressNotifications}
            style={styles.iconBtn}
            accessibilityRole="button"
            accessibilityLabel={notificationCount > 0 ? `Notifications, ${notificationCount} new` : 'Notifications'}>
            <Ionicons name="notifications-outline" size={22} color={HT.ink} />
            {notificationCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{notificationCount > 9 ? '9+' : notificationCount}</Text>
              </View>
            )}
          </Pressable>
        </View>

        <View style={styles.metaRow}>
          <GlassStreak streak={streak} onPress={onPressStreak} />

          <Pressable
            onPress={onPressDailyGoal}
            style={styles.goal}
            accessibilityRole="button"
            accessibilityLabel={`Daily goal: ${dailyGoal.completed} of ${dailyGoal.total} tasks completed`}>
            <View style={styles.goalHead}>
              <Text style={styles.goalLabel}>{goalMet ? 'Daily goal met' : "Today's goal"}</Text>
              <Text style={styles.goalValue}>
                {dailyGoal.completed}/{dailyGoal.total} <Text style={styles.goalUnit}>tasks</Text>
              </Text>
            </View>
            <View style={styles.segments}>
              {Array.from({ length: Math.max(dailyGoal.total, 1) }, (_, i) => (
                <View key={i} style={[styles.segment, i < dailyGoal.completed && styles.segmentDone]} />
              ))}
            </View>
          </Pressable>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    borderBottomWidth: 1,
    borderColor: accent(0.1),
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: -90,
    right: -70,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: accent(0.07),
  },
  hero: { paddingHorizontal: 20, paddingBottom: 18 },
  topRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  greeting: { fontSize: 14, color: HT.muted },
  name: { fontSize: 26, fontWeight: '700', color: HT.ink, marginTop: 2, letterSpacing: -0.4 },
  // White disc so the bell stands out on the tinted panel.
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: HT.bg,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: `0px 2px 8px ${accent(0.12)}`,
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 5,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: HT.primary,
    borderWidth: 1.5,
    borderColor: HT.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 9.5, fontWeight: '700', color: HT.surface },

  metaRow: { flexDirection: 'row', alignItems: 'stretch', gap: 10, marginTop: 18 },
  goal: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: HT.bg,
    borderWidth: 1,
    borderColor: accent(0.15),
    borderRadius: HT.radius,
  },
  goalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  goalLabel: { fontSize: 12, color: HT.muted },
  goalValue: { fontSize: 13, fontWeight: '700', color: HT.ink, fontVariant: ['tabular-nums'] },
  goalUnit: { fontSize: 12, fontWeight: '400', color: HT.muted },
  segments: { flexDirection: 'row', gap: 4, marginTop: 8 },
  segment: { flex: 1, height: 4, backgroundColor: HT.hairline, borderRadius: 2 },
  segmentDone: { backgroundColor: HT.primary },
});
