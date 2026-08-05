import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '@/constants/colors';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api-client';
import type { StreakDayStatus, StreakResponse } from '@/types/api';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const CALENDAR_DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function WeekDot({ status }: { status: StreakDayStatus }) {
  if (status === 'done') {
    return (
      <View style={[styles.weekDot, styles.weekDotDone]}>
        <Ionicons name="checkmark" size={14} color={COLORS.goldDeep} />
      </View>
    );
  }
  if (status === 'today') {
    return (
      <View style={[styles.weekDot, styles.weekDotToday]}>
        <Ionicons name="flame" size={14} color={COLORS.gold} />
      </View>
    );
  }
  if (status === 'missed') {
    return <View style={[styles.weekDot, styles.weekDotMissed]} />;
  }
  return <View style={[styles.weekDot, styles.weekDotFuture]} />;
}

export default function StreakScreen() {
  const { token } = useAuth();
  const [data, setData] = useState<StreakResponse | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    const streak = await api.streak(token);
    setData(streak);
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (!data) {
    return (
      <View style={styles.centerFill}>
        <ActivityIndicator color={COLORS.purple} />
      </View>
    );
  }

  const milestoneProgress = Math.min(100, Math.round((data.streak / data.nextMilestone) * 100));
  const daysToMilestone = data.nextMilestone - data.streak;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={[COLORS.purple700, COLORS.purple900]} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerTop}>
            <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
              <Ionicons name="chevron-back" size={20} color={COLORS.white} />
            </Pressable>
            <Text style={styles.pageTitle}>Streak</Text>
            <View style={{ width: 38 }} />
          </View>

          <View style={styles.flameHero}>
            <View style={styles.flameIconWrap}>
              <Ionicons name="flame" size={48} color={COLORS.gold} />
            </View>
            <Text style={styles.streakCount}>{data.streak}</Text>
            <Text style={styles.streakCaption}>Day Streak</Text>
            <Text style={styles.streakMotivation}>
              {data.streak > 0
                ? "You're on fire. Answer one question today to keep it alive."
                : 'Start your streak today by completing a question.'}
            </Text>
          </View>

          <View style={styles.weekStrip}>
            {data.weekStrip.map((d, i) => (
              <View key={i} style={styles.weekDay}>
                <WeekDot status={d.status} />
                <Text style={[styles.weekLabel, d.status === 'today' && styles.weekLabelToday]}>{d.label}</Text>
              </View>
            ))}
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.section}>
        <View style={styles.milestoneCard}>
          <View style={styles.milestoneTop}>
            <View style={styles.milestoneIcon}>
              <Ionicons name="trophy" size={20} color={COLORS.goldDeep} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.milestoneTitle}>Next Milestone: {data.nextMilestone} Days</Text>
              <Text style={styles.milestoneSub}>
                {daysToMilestone} more day{daysToMilestone === 1 ? '' : 's'} to unlock a new badge
              </Text>
            </View>
          </View>
          <View style={styles.milestoneTrack}>
            <View style={[styles.milestoneFill, { width: `${milestoneProgress}%` }]} />
          </View>
          <View style={styles.milestoneDaysRow}>
            <Text style={styles.milestoneDaysText}>{data.streak}</Text>
            <Text style={styles.milestoneDaysText}>{data.nextMilestone}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.freezeCard}>
          <View style={styles.freezeIcon}>
            <Ionicons name="snow-outline" size={22} color={COLORS.blue} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.freezeTitle}>
              {data.freezesAvailable} Streak Freeze{data.freezesAvailable === 1 ? '' : 's'}
            </Text>
            <Text style={styles.freezeSub}>Protects your streak if you miss a day</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Streak Stats</Text>
        <View style={styles.statGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: COLORS.goldSoft }]}>
              <Ionicons name="flame" size={16} color={COLORS.goldDeep} />
            </View>
            <Text style={styles.statVal}>{data.longestStreak} Days</Text>
            <Text style={styles.statLabel}>Longest Streak</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: COLORS.greenSoft }]}>
              <Ionicons name="calendar-outline" size={16} color={COLORS.green} />
            </View>
            <Text style={styles.statVal}>{data.totalActiveDays} Days</Text>
            <Text style={styles.statLabel}>Total Active Days</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: COLORS.blueSoft }]}>
              <Ionicons name="snow-outline" size={16} color={COLORS.blue} />
            </View>
            <Text style={styles.statVal}>{data.freezesUsed} Used</Text>
            <Text style={styles.statLabel}>Freezes Used</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: COLORS.purpleSoft }]}>
              <Ionicons name="time-outline" size={16} color={COLORS.purple} />
            </View>
            <Text style={styles.statVal}>{data.daysKeptPercent}%</Text>
            <Text style={styles.statLabel}>Days Kept</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Streak Calendar</Text>
        <View style={styles.calCard}>
          <Text style={styles.calMonth}>
            {MONTH_NAMES[data.calendar.month]} {data.calendar.year}
          </Text>
          <View style={styles.calGrid}>
            {CALENDAR_DOW.map((d, i) => (
              <Text key={i} style={styles.calDow}>{d}</Text>
            ))}
            {data.calendar.days.map((d, i) => (
              <View
                key={i}
                style={[
                  styles.calDay,
                  d?.hasActivity && styles.calDayFlame,
                  d?.isToday && styles.calDayToday,
                  d === null && { opacity: 0 },
                ]}>
                {d && <Text style={[styles.calDayText, d.hasActivity && styles.calDayTextFlame]}>{d.day}</Text>}
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Pressable style={styles.cta} onPress={() => router.push('/practice')}>
          <Text style={styles.ctaText}>Practice Now to Extend Streak</Text>
        </Pressable>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.loginBg },
  scrollContent: { flexGrow: 1 },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.loginBg },

  header: { paddingHorizontal: 22, paddingBottom: 26, paddingTop: 6 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: { fontSize: 15, fontWeight: '800', color: COLORS.white },

  flameHero: { alignItems: 'center', marginTop: 6 },
  flameIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(245,166,35,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakCount: { fontSize: 48, fontWeight: '800', color: COLORS.white, marginTop: 6, letterSpacing: -1 },
  streakCaption: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.85)', marginTop: -4 },
  streakMotivation: {
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '500',
    marginTop: 8,
    paddingHorizontal: 20,
    textAlign: 'center',
    lineHeight: 17,
  },

  weekStrip: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 22 },
  weekDay: { alignItems: 'center', gap: 7 },
  weekDot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  weekDotDone: { backgroundColor: COLORS.gold },
  weekDotToday: { backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 2, borderColor: COLORS.gold },
  weekDotMissed: { backgroundColor: 'rgba(255,255,255,0.08)' },
  weekDotFuture: { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)', borderStyle: 'dashed' },
  weekLabel: { fontSize: 10.5, fontWeight: '700', color: 'rgba(255,255,255,0.55)' },
  weekLabelToday: { color: COLORS.gold },

  section: { paddingHorizontal: 22, paddingTop: 22 },
  sectionTitle: { fontSize: 16.5, fontWeight: '800', color: COLORS.navy, marginBottom: 14 },

  milestoneCard: { backgroundColor: COLORS.white, borderRadius: 22, padding: 19 },
  milestoneTop: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  milestoneIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: COLORS.goldSoft, alignItems: 'center', justifyContent: 'center' },
  milestoneTitle: { fontSize: 14.5, fontWeight: '800', color: COLORS.navy },
  milestoneSub: { fontSize: 12, color: COLORS.gray, marginTop: 2, fontWeight: '500' },
  milestoneTrack: { height: 8, borderRadius: 100, backgroundColor: COLORS.grayBorder, marginTop: 16, overflow: 'hidden' },
  milestoneFill: { height: '100%', borderRadius: 100, backgroundColor: COLORS.gold },
  milestoneDaysRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  milestoneDaysText: { fontSize: 11, fontWeight: '700', color: COLORS.grayLight },

  freezeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: COLORS.blueSoft,
    borderRadius: 20,
    padding: 16,
  },
  freezeIcon: { width: 46, height: 46, borderRadius: 14, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center' },
  freezeTitle: { fontSize: 14, fontWeight: '800', color: COLORS.navy },
  freezeSub: { fontSize: 11.5, color: COLORS.gray, marginTop: 2, fontWeight: '500' },

  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: { width: '47%', backgroundColor: COLORS.white, borderRadius: 18, padding: 16 },
  statIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  statVal: { fontSize: 19, fontWeight: '800', color: COLORS.navy, letterSpacing: -0.3 },
  statLabel: { fontSize: 11.5, color: COLORS.gray, marginTop: 2, fontWeight: '500' },

  calCard: { backgroundColor: COLORS.white, borderRadius: 22, padding: 18 },
  calMonth: { fontSize: 14, fontWeight: '800', color: COLORS.navy, marginBottom: 14 },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  calDow: { width: '12%', fontSize: 10, fontWeight: '700', color: COLORS.grayLight, textAlign: 'center' },
  calDay: {
    width: '12%',
    aspectRatio: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.loginBg,
  },
  calDayFlame: { backgroundColor: COLORS.goldSoft },
  calDayToday: { borderWidth: 2, borderColor: COLORS.gold },
  calDayText: { fontSize: 10.5, fontWeight: '600', color: COLORS.grayLight },
  calDayTextFlame: { color: COLORS.goldDeep, fontWeight: '800' },

  cta: {
    backgroundColor: COLORS.purple700,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaText: { fontSize: 14.5, fontWeight: '800', color: COLORS.white },
});
