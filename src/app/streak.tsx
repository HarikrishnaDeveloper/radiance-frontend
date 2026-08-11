import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api-client';
import type { StreakDayStatus, StreakResponse } from '@/types/api';

// ─── Design tokens aligned with streak_page.html ─────────────────────────
const ST = {
  purple900: '#2A1065',
  purple800: '#3A1794',
  purple700: '#4C1FB8',
  purple600: '#5E2CE0',
  purple500: '#6D3AF0',
  purple400: '#8B5CF6',
  purple100: '#EEE9FE',
  purple50: '#F6F3FF',
  bg: '#F7F6FB',
  card: '#FFFFFF',
  ink900: '#1B1830',
  ink600: '#635F7A',
  ink400: '#9C98B4',
  ink300: '#C6C3DA',
  line: '#ECE9F7',
  gold: '#F5A623',
  goldSoft: '#FFF3DC',
  goldDeep: '#B77A0E',
  green: '#1FAE64',
  greenSoft: '#E6F8EF',
  blue: '#3B7DDB',
  blueSoft: '#EAF2FC',
  red: '#E14848',
} as const;

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const CALENDAR_DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function WeekDot({ status }: { status: StreakDayStatus }) {
  if (status === 'done') {
    return (
      <LinearGradient
        colors={['#FFD37A', ST.gold]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.weekDot}
      >
        <Ionicons name="checkmark" size={15} color="#8A5A00" />
      </LinearGradient>
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
        <Ionicons name="close" size={14} color={ST.red} />
      </View>
    );
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
        <ActivityIndicator color={ST.purple600} />
      </View>
    );
  }

  const milestoneProgress = Math.min(100, Math.round((data.streak / data.nextMilestone) * 100));
  const daysToMilestone = data.nextMilestone - data.streak;

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── Header + Flame Hero + Week Strip ── */}
        <LinearGradient
          colors={[ST.purple800, '#1A0F3E']}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={styles.header}
        >
          <SafeAreaView edges={['top']}>
            {/* Header Top Nav */}
            <View style={styles.headerTop}>
              <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
                <Ionicons name="chevron-back" size={20} color="#fff" />
              </Pressable>
              <Text style={styles.pageTitle}>Streak</Text>
              <View style={{ width: 38 }} />
            </View>

            {/* Flame Hero */}
            <View style={styles.flameHero}>
              <View style={styles.flameIconWrap}>
                <Ionicons name="flame" size={52} color={ST.gold} />
              </View>
              <Text style={styles.streakCount}>{data.streak}</Text>
              <Text style={styles.streakCaption}>Day Streak</Text>
              <Text style={styles.streakMotivation}>
                {data.streak > 0
                  ? "You're on fire. Answer one question today to keep it alive."
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
        </LinearGradient>

        {/* ── Body Content ── */}
        <View style={styles.bodyContent}>
          {/* Next Milestone */}
          <View style={styles.section}>
            <View style={styles.milestoneCard}>
              <View style={styles.milestoneTop}>
                <View style={styles.milestoneIcon}>
                  <Ionicons name="star" size={22} color={ST.goldDeep} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.milestoneTitle}>Next Milestone: {data.nextMilestone} Days</Text>
                  <Text style={styles.milestoneSub}>
                    {daysToMilestone} more day{daysToMilestone === 1 ? '' : 's'} to unlock a new badge
                  </Text>
                </View>
              </View>
              <View style={styles.milestoneTrack}>
                <LinearGradient
                  colors={[ST.gold, ST.goldDeep]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.milestoneFill, { width: `${milestoneProgress}%` }]}
                />
              </View>
              <View style={styles.milestoneDaysRow}>
                <Text style={styles.milestoneDaysText}>{data.streak}</Text>
                <Text style={styles.milestoneDaysText}>{data.nextMilestone}</Text>
              </View>
            </View>
          </View>

          {/* Streak Freeze Card */}
          <View style={styles.section}>
            <LinearGradient
              colors={[ST.blueSoft, '#F7F6FB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.freezeCard}
            >
              <View style={styles.freezeIcon}>
                <Ionicons name="snow" size={22} color={ST.blue} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.freezeTitle}>
                  {data.freezesAvailable} Streak Freeze{data.freezesAvailable === 1 ? '' : 's'}
                </Text>
                <Text style={styles.freezeSub}>Protects your streak if you miss a day</Text>
              </View>
              <Pressable onPress={() => Alert.alert('Streak Freezes', 'You can acquire more streak freezes by completing daily milestones.')}>
                <Text style={styles.freezeCta}>Get More</Text>
              </Pressable>
            </LinearGradient>
          </View>

          {/* Streak Stats */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Streak Stats</Text>
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
                <View style={[styles.statIcon, { backgroundColor: ST.greenSoft }]}>
                  <Ionicons name="book" size={17} color={ST.green} />
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
            <Text style={styles.sectionTitle}>Streak Calendar</Text>
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
                    <View
                      key={i}
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
                  );
                })}
              </View>
            </View>
          </View>

          {/* CTA fixed action */}
          <View style={[styles.section, { marginTop: 10 }]}>
            <Pressable onPress={() => router.push('/(tabs)/practice')} style={styles.ctaBtnWrap}>
              <LinearGradient
                colors={[ST.purple600, ST.purple800]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.ctaFixed}
              >
                <Text style={styles.ctaText}>Practice Now to Extend Streak</Text>
              </LinearGradient>
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
    paddingHorizontal: 22,
    paddingBottom: 34,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
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
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.1,
  },
  flameHero: {
    alignItems: 'center',
    marginTop: 12,
  },
  flameIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(245,166,35,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakCount: {
    fontSize: 52,
    fontWeight: '800',
    color: '#FFD37A', // Styled text representation
    marginTop: 6,
    letterSpacing: -1.5,
  },
  streakCaption: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    marginTop: -4,
  },
  streakMotivation: {
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '500',
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
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 2,
    borderColor: ST.gold,
  },
  weekDotMissed: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1.5,
    borderColor: ST.red,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDotFuture: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    borderStyle: 'dashed',
  },
  weekLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.55)',
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
    fontWeight: '800',
    color: ST.ink900,
    marginBottom: 14,
    letterSpacing: -0.2,
  },
  milestoneCard: {
    backgroundColor: ST.card,
    borderRadius: 22,
    padding: 19,
    ...Platform.select({
      ios: {
        shadowColor: ST.purple900,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  milestoneTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  milestoneIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: ST.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneTitle: {
    fontSize: 14.5,
    fontWeight: '800',
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
    borderRadius: 100,
    backgroundColor: ST.line,
    marginTop: 16,
    overflow: 'hidden',
  },
  milestoneFill: {
    height: '100%',
    borderRadius: 100,
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
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DCEAFB',
    ...Platform.select({
      ios: {
        shadowColor: ST.blue,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  freezeIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: ST.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: ST.blue,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  freezeTitle: {
    fontSize: 14,
    fontWeight: '800',
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
    fontWeight: '800',
    color: ST.blue,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: ST.card,
    borderRadius: 18,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: ST.purple900,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statVal: {
    fontSize: 19,
    fontWeight: '800',
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
    borderRadius: 22,
    padding: 18,
    ...Platform.select({
      ios: {
        shadowColor: ST.purple900,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  calHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  calMonth: {
    fontSize: 14,
    fontWeight: '800',
    color: ST.ink900,
  },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  calDow: {
    width: '12.5%',
    fontSize: 10,
    fontWeight: '700',
    color: ST.ink300,
    textAlign: 'center',
  },
  calDay: {
    width: '12.5%',
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
    fontWeight: '800',
  },
  ctaBtnWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: ST.purple700,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  ctaFixed: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#fff',
  },
});
