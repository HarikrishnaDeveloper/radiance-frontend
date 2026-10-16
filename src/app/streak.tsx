import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { UI } from '@/constants/ui';

import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api-client';
import type { StreakDayStatus, StreakResponse } from '@/types/api';
import { Pressable } from '@/components/ui/pressable';

// ─── Design tokens aligned with streak_page.html ─────────────────────────
const ST = {
  purple900: UI.accent,
  purple800: UI.accent,
  purple700: UI.accent,
  purple600: UI.accent,
  purple500: UI.accent,
  purple400: UI.accent,
  purple100: UI.accentSoft,
  purple50: UI.accentSoft,
  bg: UI.bg,
  card: UI.bg,
  ink900: UI.text,
  ink600: UI.grey,
  ink400: UI.greyLight,
  ink300: UI.border,
  line: UI.border,
  gold: UI.accent,
  goldSoft: UI.accentSoft,
  goldDeep: UI.accent,
  green: UI.green,
  greenSoft: UI.greenSoft,
  blue: UI.accent,
  blueSoft: UI.accentSoft,
  red: UI.red,
} as const;

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const CALENDAR_DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function WeekDot({ status }: { status: StreakDayStatus }) {
  if (status === 'done') {
    return (
      <View style={[styles.weekDot, { backgroundColor: ST.purple600 }]}>
        <Ionicons name="checkmark" size={15} color={ST.card} />
      </View>
    );
  }
  if (status === 'today') {
    return (
      <View style={[styles.weekDot, styles.weekDotToday]}>
        <Ionicons name="flame" size={15} color={ST.gold} />
      </View>
    );
  }
  if (status === 'missed') {
    return (
      <View style={[styles.weekDot, styles.weekDotMissed]}>
        <Ionicons name="close" size={14} color={ST.ink400} />
      </View>
    );
  }
  return <View style={[styles.weekDot, styles.weekDotFuture]} />;
}

export default function StreakScreen() {
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
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
        <ActivityIndicator color={ST.purple600} />
      </View>
    );
  }

  const milestoneProgress = Math.min(100, Math.round((data.streak / data.nextMilestone) * 100));
  const daysToMilestone = data.nextMilestone - data.streak;

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 24 + insets.bottom }]}
        showsVerticalScrollIndicator={false}>
        {/* ── Header + streak count + week strip ── */}
        <View style={styles.header}>
          <SafeAreaView edges={['top']}>
            {/* Header Top Nav */}
            <View style={styles.headerTop}>
              <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
                <Ionicons name="chevron-back" size={22} color={ST.ink900} />
              </Pressable>
              <Text style={styles.pageTitle}>Streak</Text>
              <View style={{ width: 38 }} />
            </View>

            {/* Streak count */}
            <View style={styles.flameHero}>
              <View style={styles.flameIconWrap}>
                <Ionicons name="flame" size={36} color={ST.purple600} />
              </View>
              <Text style={styles.streakCount}>{data.streak}</Text>
              <Text style={styles.streakCaption}>day streak</Text>
              <Text style={styles.streakMotivation}>
                {data.streak > 0
                  ? "Answer at least one question today to keep it going."
                  : 'Start your streak today by completing a question.'}
              </Text>
            </View>

            {/* Week Strip */}
            <View style={styles.weekStrip}>
              {data.weekStrip.map((d, i) => (
                <View key={i} style={styles.weekDay}>
                  <WeekDot status={d.status} />
                  <Text style={[styles.weekLabel, d.status === 'today' && styles.weekLabelToday]}>
                    {d.label}
                  </Text>
                </View>
              ))}
            </View>
          </SafeAreaView>
        </View>

        {/* ── Body Content ── */}
        <View style={styles.bodyContent}>
          {/* Next Milestone */}
          <View style={styles.section}>
            <View style={styles.milestoneCard}>
              <View style={styles.milestoneTop}>
                <View style={styles.milestoneIcon}>
                  <Ionicons name="star-outline" size={20} color={ST.purple600} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.milestoneTitle}>Next milestone: {data.nextMilestone} days</Text>
                  <Text style={styles.milestoneSub}>
                    {daysToMilestone} more day{daysToMilestone === 1 ? '' : 's'} to go
                  </Text>
                </View>
              </View>
              <View style={styles.milestoneTrack}>
                <View style={[styles.milestoneFill, { width: `${milestoneProgress}%` }, { backgroundColor: ST.gold }]} />
              </View>
              <View style={styles.milestoneDaysRow}>
                <Text style={styles.milestoneDaysText}>{data.streak}</Text>
                <Text style={styles.milestoneDaysText}>{data.nextMilestone}</Text>
              </View>
            </View>
          </View>

          {/* Streak Freeze Card */}
          <View style={styles.section}>
            <View style={styles.freezeCard}>
              <View style={styles.freezeIcon}>
                <Ionicons name="snow-outline" size={20} color={ST.purple600} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.freezeTitle}>
                  {data.freezesAvailable} Streak Freeze{data.freezesAvailable === 1 ? '' : 's'}
                </Text>
                <Text style={styles.freezeSub}>Protects your streak if you miss a day</Text>
              </View>
            </View>
          </View>

          {/* Streak Stats */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Stats</Text>
            <View style={styles.statGrid}>
              {/* Card 1 */}
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: ST.goldSoft }]}>
                  <Ionicons name="flame" size={17} color={ST.goldDeep} />
                </View>
                <Text style={styles.statVal}>{data.longestStreak} Days</Text>
                <Text style={styles.statLabel}>Longest Streak</Text>
              </View>
              
              {/* Card 2 */}
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: ST.purple50 }]}>
                  <Ionicons name="book" size={17} color={ST.purple600} />
                </View>
                <Text style={styles.statVal}>{data.totalActiveDays} Days</Text>
                <Text style={styles.statLabel}>Total Active Days</Text>
              </View>

              {/* Card 3 */}
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: ST.blueSoft }]}>
                  <Ionicons name="snow" size={17} color={ST.blue} />
                </View>
                <Text style={styles.statVal}>{data.freezesUsed} Used</Text>
                <Text style={styles.statLabel}>Freezes Used</Text>
              </View>

              {/* Card 4 */}
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: ST.purple50 }]}>
                  <Ionicons name="time" size={17} color={ST.purple600} />
                </View>
                <Text style={styles.statVal}>{data.daysKeptPercent}%</Text>
                <Text style={styles.statLabel}>Days Kept</Text>
              </View>
            </View>
          </View>

          {/* Streak Calendar */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Calendar</Text>
            <View style={styles.calCard}>
              <View style={styles.calHead}>
                <Text style={styles.calMonth}>
                  {MONTH_NAMES[data.calendar.month]} {data.calendar.year}
                </Text>
              </View>
              <View style={styles.calGrid}>
                {CALENDAR_DOW.map((d, i) => (
                  <Text key={i} style={styles.calDow}>{d}</Text>
                ))}
                {data.calendar.days.map((d, i) => {
                  const isVisible = d !== null;
                  return (
                    <View key={i} style={styles.calCell}>
                      <View
                        style={[
                          styles.calDay,
                          d?.hasActivity && styles.calDayFlame,
                          d?.isToday && styles.calDayToday,
                          !isVisible && { opacity: 0 },
                        ]}
                      >
                        {d && (
                          <Text style={[styles.calDayText, d.hasActivity && styles.calDayTextFlame]}>
                            {d.day}
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>

          {/* CTA fixed action */}
          <View style={[styles.section, { marginTop: 10 }]}>
            <Pressable onPress={() => router.push('/(tabs)/practice')} style={styles.ctaBtnWrap}>
              <View style={[styles.ctaFixed, { backgroundColor: ST.purple600 }]}>
                <Text style={styles.ctaText}>Practice now</Text>
              </View>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: ST.bg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  centerFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ST.bg,
  },
  header: {
    backgroundColor: ST.card,
    paddingHorizontal: 22,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: ST.line,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    position: 'relative',
    overflow: 'hidden',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 8,
    marginLeft: -8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: ST.ink900,
    letterSpacing: -0.1,
  },
  flameHero: {
    alignItems: 'center',
    marginTop: 12,
  },
  flameIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: ST.purple50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakCount: {
    fontSize: 52,
    fontWeight: '700',
    color: ST.ink900,
    marginTop: 6,
    letterSpacing: -1.5,
  },
  streakCaption: {
    fontSize: 14,
    fontWeight: '700',
    color: ST.ink600,
    marginTop: -4,
  },
  streakMotivation: {
    fontSize: 12.5,
    color: ST.ink600,
    fontWeight: '400',
    marginTop: 8,
    paddingHorizontal: 20,
    textAlign: 'center',
    lineHeight: 18,
  },
  weekStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 26,
  },
  weekDay: {
    alignItems: 'center',
    gap: 7,
  },
  weekDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDotToday: {
    backgroundColor: ST.card,
    borderWidth: 2,
    borderColor: ST.purple600,
  },
  weekDotMissed: {
    backgroundColor: ST.card,
    borderWidth: 1.5,
    borderColor: ST.ink300,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDotFuture: {
    backgroundColor: ST.card,
    borderWidth: 1.5,
    borderColor: ST.ink300,
    borderStyle: 'dashed',
  },
  weekLabel: {
    fontSize: 10.5,
    fontWeight: '500',
    color: ST.ink600,
  },
  weekLabelToday: {
    color: ST.gold,
  },
  bodyContent: {
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 22,
    paddingTop: 18,
  },
  sectionTitle: {
    fontSize: 16.5,
    fontWeight: '700',
    color: ST.ink900,
    marginBottom: 14,
    letterSpacing: -0.2,
  },
  milestoneCard: {
    backgroundColor: ST.card,
    borderWidth: 1,
    borderColor: ST.line,
    borderRadius: 8,
    padding: 19,
  },
  milestoneTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  milestoneIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: ST.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: ST.ink900,
  },
  milestoneSub: {
    fontSize: 12,
    color: ST.ink600,
    marginTop: 2,
    fontWeight: '500',
  },
  milestoneTrack: {
    height: 8,
    borderRadius: 8,
    backgroundColor: ST.line,
    marginTop: 16,
    overflow: 'hidden',
  },
  milestoneFill: {
    height: '100%',
    borderRadius: 8,
  },
  milestoneDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  milestoneDaysText: {
    fontSize: 11,
    fontWeight: '700',
    color: ST.ink400,
  },
  freezeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 8,
    padding: 16,
    backgroundColor: ST.card,
    borderWidth: 1,
    borderColor: ST.line,
  },
  freezeIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: ST.purple50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  freezeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: ST.ink900,
  },
  freezeSub: {
    fontSize: 11.5,
    color: ST.ink600,
    marginTop: 2,
    fontWeight: '500',
    lineHeight: 16,
  },
  freezeCta: {
    fontSize: 12,
    fontWeight: '700',
    color: ST.blue,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  // Basis under 50% leaves room for the 12px gap so it stays 2 per row.
  statCard: {
    flexBasis: '40%',
    flexGrow: 1,
    backgroundColor: ST.card,
    borderWidth: 1,
    borderColor: ST.line,
    borderRadius: 8,
    padding: 16,
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statVal: {
    fontSize: 19,
    fontWeight: '700',
    color: ST.ink900,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 11.5,
    color: ST.ink600,
    marginTop: 2,
    fontWeight: '500',
  },
  calCard: {
    backgroundColor: ST.card,
    borderWidth: 1,
    borderColor: ST.line,
    borderRadius: 8,
    padding: 18,
  },
  calHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  calMonth: {
    fontSize: 14,
    fontWeight: '700',
    color: ST.ink900,
  },
  // Exactly 7 columns on any width: each cell is 1/7 of the row and spacing
  // comes from cell margins, not `gap` (12.5% + gaps overflowed to 6 per row).
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calDow: {
    width: '14.2857%', // 1/7
    fontSize: 10,
    fontWeight: '700',
    color: ST.ink300,
    textAlign: 'center',
    marginBottom: 6,
  },
  calCell: {
    width: '14.2857%', // 1/7
    padding: 3,
  },
  calDay: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ST.bg,
  },
  calDayFlame: {
    backgroundColor: ST.goldSoft,
  },
  calDayToday: {
    borderWidth: 2,
    borderColor: ST.gold,
  },
  calDayText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: ST.ink400,
  },
  calDayTextFlame: {
    color: ST.goldDeep,
    fontWeight: '700',
  },
  ctaBtnWrap: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  ctaFixed: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#fff',
  },
});
