import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProgressRing } from '@/components/progress-ring';
import { StarRating } from '@/components/star-rating';
import { COLORS } from '@/constants/colors';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api-client';
import type { DashboardResponse } from '@/types/api';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function HomeScreen() {
  const { token, user } = useAuth();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const dashboard = await api.dashboard(token);
      setData(dashboard);
      setError(null);
    } catch {
      setError('Could not load your dashboard');
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function startFullPaper(questionPaperId: number) {
    if (!token) return;
    const attempt = await api.createAttempt(token, { mode: 'FULL_PAPER', questionPaperId });
    router.push(`/quiz/${attempt.id}`);
  }

  if (!data) {
    return (
      <View style={styles.centerFill}>
        <ActivityIndicator color={COLORS.purple} />
      </View>
    );
  }

  const continueLearning = data.continueLearning;
  const suggestedCategory = continueLearning.allCompleted
    ? data.categoryProgress.find((c) => c.progress < 100) ?? data.categoryProgress[0]
    : null;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={[COLORS.purple700, COLORS.purple900]} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerTop}>
            <View style={styles.greetTextWrap}>
              <Text style={styles.greetLabel}>{greeting()}</Text>
              <Text style={styles.greetName} numberOfLines={1}>{user?.name ?? user?.username}</Text>
            </View>
            <View style={styles.iconPill}>
              <Ionicons name="notifications-outline" size={19} color={COLORS.white} />
            </View>
          </View>
          <Text style={styles.headerSub}>Let&apos;s achieve your UPSC goal today.</Text>

          <Pressable onPress={() => router.push('/streak')} style={styles.streakCard}>
            <View style={styles.streakFlameWrap}>
              <Ionicons name="flame" size={21} color={data.streak > 0 ? COLORS.gold : 'rgba(255,255,255,0.45)'} />
            </View>
            <View>
              {data.streak > 0 ? (
                <View style={styles.streakDaysRow}>
                  <Text style={styles.streakNum}>{data.streak}</Text>
                  <Text style={styles.streakUnit}>Day Streak</Text>
                </View>
              ) : (
                <Text style={styles.streakStartText}>Start your streak today!</Text>
              )}
              {data.longestStreak > data.streak && (
                <Text style={styles.streakCaption}>Best streak: {data.longestStreak} days</Text>
              )}
            </View>
            <View style={styles.streakPips}>
              {data.recentActivity.map((active, i) => (
                <View key={i} style={[styles.pip, active && styles.pipOn]} />
              ))}
            </View>
          </Pressable>
        </SafeAreaView>
      </LinearGradient>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {!continueLearning.allCompleted ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Continue Learning</Text>
          <Pressable onPress={() => router.push(`/stage/${continueLearning.stageId}`)}>
            <LinearGradient colors={[COLORS.purple, COLORS.purpleDark]} style={styles.heroCard}>
              <Text style={styles.heroEyebrow}>Current Stage</Text>
              <View style={styles.heroTop}>
                <View style={styles.heroEmblem}>
                  <Ionicons name="book" size={24} color={COLORS.white} />
                </View>
                <View>
                  <Text style={styles.heroTitle}>{continueLearning.foodWorldName ?? continueLearning.categoryName}</Text>
                  <Text style={styles.heroMeta}>
                    Stage {continueLearning.stageNumber} · {continueLearning.questionProgress.completed} of{' '}
                    {continueLearning.questionProgress.total}
                  </Text>
                </View>
              </View>
              <View style={styles.track}>
                <View
                  style={[
                    styles.trackFill,
                    {
                      width: `${
                        continueLearning.questionProgress.total > 0
                          ? Math.round(
                              (continueLearning.questionProgress.completed / continueLearning.questionProgress.total) * 100
                            )
                          : 0
                      }%`,
                    },
                  ]}
                />
              </View>
              <View style={styles.heroCta}>
                <Text style={styles.heroCtaText}>Continue</Text>
                <Ionicons name="arrow-forward" size={15} color={COLORS.purpleDark} />
              </View>
            </LinearGradient>
          </Pressable>
        </View>
      ) : suggestedCategory ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Start Something New</Text>
          <Pressable onPress={() => router.push(`/category/${suggestedCategory.id}`)}>
            <LinearGradient colors={[COLORS.purple, COLORS.purpleDark]} style={styles.heroCard}>
              <Text style={styles.heroEyebrow}>Suggested for you</Text>
              <View style={styles.heroTop}>
                <View style={styles.heroEmblem}>
                  <Ionicons name="sparkles" size={24} color={COLORS.white} />
                </View>
                <View>
                  <Text style={styles.heroTitle}>{suggestedCategory.foodWorldName ?? suggestedCategory.name}</Text>
                  <Text style={styles.heroMeta}>
                    {suggestedCategory.questionCount} Questions · {suggestedCategory.totalStages} Stages
                  </Text>
                </View>
              </View>
              <View style={styles.heroCta}>
                <Text style={styles.heroCtaText}>Start Learning</Text>
                <Ionicons name="arrow-forward" size={15} color={COLORS.purpleDark} />
              </View>
            </LinearGradient>
          </Pressable>
        </View>
      ) : (
        <View style={styles.section}>
          <View style={styles.emptyHero}>
            <Ionicons name="checkmark-done-circle" size={28} color={COLORS.purple} />
            <Text style={styles.emptyHeroText}>You&apos;re all caught up! No stages left to complete.</Text>
          </View>
        </View>
      )}

      {data.continueAttempt && (
        <View style={styles.section}>
          <Pressable onPress={() => router.push(`/quiz/${data.continueAttempt!.id}`)}>
            <View style={styles.attemptCard}>
              <Text style={styles.attemptTitle}>Continue Quiz</Text>
              <Text style={styles.attemptSub}>{data.continueAttempt.title}</Text>
              <Text style={styles.attemptMeta}>
                {data.continueAttempt.answeredCount} / {data.continueAttempt.totalQuestions} answered
              </Text>
            </View>
          </Pressable>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today&apos;s Focus</Text>
        <View style={styles.focusCard}>
          <View style={styles.focusRow}>
            <View style={[styles.focusIcon, { backgroundColor: COLORS.greenSoft }]}>
              <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.green} />
            </View>
            <View style={styles.focusBody}>
              <Text style={styles.focusTitle}>Answer 1 Question</Text>
              <Text style={styles.focusSub}>
                {data.todaysFocus.answeredToday ? 'Your daily minimum — done for today' : 'Your daily minimum'}
              </Text>
            </View>
            {data.todaysFocus.answeredToday && (
              <View style={styles.focusCheck}>
                <Ionicons name="checkmark" size={14} color={COLORS.green} />
              </View>
            )}
          </View>

          {!continueLearning.allCompleted && (
            <Pressable onPress={() => router.push(`/stage/${continueLearning.stageId}`)}>
              <View style={styles.focusRow}>
                <View style={[styles.focusIcon, { backgroundColor: COLORS.purpleSoft }]}>
                  <Ionicons name="layers-outline" size={20} color={COLORS.purple} />
                </View>
                <View style={styles.focusBody}>
                  <Text style={styles.focusTitle}>Complete a Stage</Text>
                  <Text style={styles.focusSub}>
                    Finish Stage {continueLearning.stageNumber} in {continueLearning.categoryName}
                  </Text>
                </View>
                <Text style={styles.focusFrac}>
                  {continueLearning.questionProgress.completed}/{continueLearning.questionProgress.total}
                </Text>
              </View>
            </Pressable>
          )}

          <View style={[styles.focusRow, styles.focusRowLast]}>
            <View style={[styles.focusIcon, { backgroundColor: COLORS.goldSoft }]}>
              <Ionicons name="flash" size={20} color={COLORS.gold} />
            </View>
            <View style={styles.focusBody}>
              <Text style={styles.focusTitle}>Daily Challenge</Text>
              <Text style={styles.focusSub}>10 mixed questions · resets at midnight</Text>
            </View>
            {data.todaysFocus.dailyChallenge.completed ? (
              <StarRating count={data.todaysFocus.dailyChallenge.starsEarned ?? 0} size={14} />
            ) : (
              <Pressable onPress={() => router.push('/daily-challenge')} style={styles.focusStartBtn}>
                <Text style={styles.focusStartText}>Start</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Quick Practice</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hscroll}>
          {data.categoryProgress.map((category) => (
            <Pressable key={category.id} onPress={() => router.push(`/category/${category.id}`)} style={styles.ringCard}>
              <ProgressRing percent={category.progress} color={COLORS.purple} trackColor={COLORS.purpleSoft} style={styles.ring}>
                <Text style={styles.ringPct}>{category.progress}%</Text>
              </ProgressRing>
              <Text style={styles.ringName} numberOfLines={1}>
                {category.foodWorldName ?? category.name}
              </Text>
              <Text style={styles.ringCount}>{category.questionCount} Questions</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Previous Year Journey</Text>
        <View style={styles.yearList}>
          {data.papers.map((paper, i) => (
            <Pressable key={paper.id} onPress={() => startFullPaper(paper.id)}>
              <View style={[styles.yearItem, i === data.papers.length - 1 && styles.yearItemLast]}>
                <View style={styles.yearBody}>
                  <Text style={styles.yearTitle}>{paper.title ?? `${paper.year} Paper`}</Text>
                  <Text style={styles.yearMeta}>{paper.questionCount} Questions</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.grayLight} />
              </View>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Performance</Text>
        <View style={styles.perfGrid}>
          <View style={styles.perfCard}>
            <View style={[styles.perfIcon, { backgroundColor: COLORS.greenSoft }]}>
              <Ionicons name="checkmark-circle-outline" size={17} color={COLORS.green} />
            </View>
            <Text style={styles.perfVal}>{data.stats.accuracy}%</Text>
            <Text style={styles.perfLabel}>Accuracy</Text>
          </View>
          <View style={styles.perfCard}>
            <View style={[styles.perfIcon, { backgroundColor: COLORS.purpleSoft }]}>
              <Ionicons name="document-text-outline" size={17} color={COLORS.purple} />
            </View>
            <Text style={styles.perfVal}>{data.stats.questionsSolved}</Text>
            <Text style={styles.perfLabel}>Questions Solved</Text>
          </View>
        </View>
      </View>

      {data.recentAchievements.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Achievements</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hscroll}>
            {data.recentAchievements.map((a) => (
              <View key={a.stageId} style={styles.achievementCard}>
                <Text style={styles.ringName} numberOfLines={1}>
                  {a.foodWorldName ?? a.categoryName}
                </Text>
                <Text style={styles.ringCount}>Stage {a.stageNumber}</Text>
                <StarRating count={a.starsEarned} size={14} />
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.loginBg },
  scrollContent: { flexGrow: 1 },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.loginBg },
  errorText: { color: COLORS.error, textAlign: 'center', marginTop: 12 },

  header: { paddingHorizontal: 22, paddingBottom: 26, paddingTop: 6 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greetTextWrap: { flex: 1, marginRight: 12 },
  greetLabel: { fontSize: 13, color: 'rgba(255,255,255,0.65)', fontWeight: '500' },
  greetName: { fontSize: 22, fontWeight: '800', color: COLORS.white, marginTop: 2 },
  iconPill: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSub: { marginTop: 14, fontSize: 13.5, color: 'rgba(255,255,255,0.78)', fontWeight: '500' },

  streakCard: {
    marginTop: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  streakFlameWrap: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: 'rgba(245,166,35,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(245,166,35,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakDaysRow: { flexDirection: 'row', alignItems: 'baseline', gap: 5 },
  streakNum: { fontSize: 19, fontWeight: '800', color: COLORS.white },
  streakUnit: { fontSize: 12.5, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  streakStartText: { fontSize: 15, fontWeight: '800', color: COLORS.white },
  streakCaption: { fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: '500', marginTop: 2 },
  streakPips: { flexDirection: 'row', gap: 4, marginLeft: 'auto' },
  pip: { width: 6, height: 20, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.18)' },
  pipOn: { backgroundColor: COLORS.gold },

  focusCard: { backgroundColor: COLORS.white, borderRadius: 20, overflow: 'hidden' },
  focusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayBorder,
  },
  focusRowLast: { borderBottomWidth: 0 },
  focusIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  focusBody: { flex: 1 },
  focusTitle: { fontSize: 14, fontWeight: '700', color: COLORS.navy },
  focusSub: { fontSize: 12, color: COLORS.gray, marginTop: 2, fontWeight: '500' },
  focusCheck: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusFrac: { fontSize: 13, fontWeight: '800', color: COLORS.purple },
  focusStartBtn: { backgroundColor: COLORS.purple, paddingVertical: 7, paddingHorizontal: 14, borderRadius: 9 },
  focusStartText: { fontSize: 11.5, fontWeight: '800', color: COLORS.white },

  section: { paddingHorizontal: 22, paddingTop: 24 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  sectionTitle: { fontSize: 16.5, fontWeight: '800', color: COLORS.navy, marginBottom: 14 },

  heroCard: { borderRadius: 26, padding: 20 },
  heroEyebrow: { fontSize: 11.5, fontWeight: '700', letterSpacing: 0.4, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase' },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  heroEmblem: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { fontSize: 18, fontWeight: '800', color: COLORS.white },
  heroMeta: { fontSize: 12.5, color: 'rgba(255,255,255,0.68)', marginTop: 2, fontWeight: '500' },
  track: { height: 7, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.18)', marginTop: 16, overflow: 'hidden' },
  trackFill: { height: '100%', borderRadius: 100, backgroundColor: COLORS.gold },
  heroCta: {
    marginTop: 18,
    backgroundColor: COLORS.white,
    paddingVertical: 13,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  heroCtaText: { color: COLORS.purpleDark, fontWeight: '800', fontSize: 14 },

  emptyHero: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  emptyHeroText: { color: COLORS.gray, fontWeight: '600', textAlign: 'center' },

  attemptCard: { backgroundColor: COLORS.white, borderRadius: 20, padding: 16, gap: 4 },
  attemptTitle: { fontSize: 15, fontWeight: '800', color: COLORS.navy },
  attemptSub: { fontSize: 13, color: COLORS.gray, fontWeight: '500' },
  attemptMeta: { fontSize: 12, color: COLORS.grayLight, fontWeight: '500' },

  hscroll: { flexDirection: 'row', gap: 13 },
  ringCard: {
    minWidth: 136,
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 18,
    alignItems: 'center',
  },
  ring: { marginBottom: 12 },
  ringPct: { fontSize: 13, fontWeight: '800', color: COLORS.navy },
  ringName: { fontSize: 13.5, fontWeight: '800', color: COLORS.navy },
  ringCount: { fontSize: 11, color: COLORS.grayLight, fontWeight: '600', marginTop: 3 },

  yearList: { backgroundColor: COLORS.white, borderRadius: 22, overflow: 'hidden' },
  yearItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayBorder,
  },
  yearItemLast: { borderBottomWidth: 0 },
  yearBody: {},
  yearTitle: { fontSize: 14.5, fontWeight: '800', color: COLORS.navy },
  yearMeta: { fontSize: 12, color: COLORS.gray, marginTop: 2, fontWeight: '500' },

  perfGrid: { flexDirection: 'row', gap: 12 },
  perfCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: 18, padding: 16 },
  perfIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  perfVal: { fontSize: 20, fontWeight: '800', color: COLORS.navy, letterSpacing: -0.3 },
  perfLabel: { fontSize: 12, color: COLORS.gray, marginTop: 2, fontWeight: '500' },

  achievementCard: { minWidth: 120, backgroundColor: COLORS.white, borderRadius: 18, padding: 14, gap: 4 },
});
