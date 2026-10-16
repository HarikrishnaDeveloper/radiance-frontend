import { router } from 'expo-router';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryPerformance } from '@/components/home/CategoryPerformance';
import { ContinueLearning } from '@/components/home/ContinueLearning';
import { HomeHero } from '@/components/home/HomeHero';
import { HT } from '@/components/home/home-theme';
import { LeaderboardPreview } from '@/components/home/LeaderboardPreview';
import { QuickActions } from '@/components/home/QuickActions';
import { ScrollEdgeFade, ScrollItem } from '@/components/ui/scroll-item';
import { SectionHeader } from '@/components/home/SectionHeader';
import { StatsStrip } from '@/components/home/StatsStrip';
import { TodaysPlan } from '@/components/home/TodaysPlan';
import { useHomeDashboard } from '@/hooks/useHomeDashboard';
import { Pressable } from '@/components/ui/pressable';

export default function HomeScreen() {
  const { data, isLoading, error, refreshing, refetch } = useHomeDashboard();
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  if (isLoading) return <HomeSkeleton />;

  if (error || !data) {
    return (
      <View style={styles.centerFill}>
        <Text style={styles.errorTitle}>Could not load your dashboard</Text>
        <Text style={styles.errorText}>{error?.message ?? 'Please try again.'}</Text>
        <Pressable onPress={refetch} style={styles.retryBtn} accessibilityRole="button">
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* 1. Header  ·  2. Streak & daily goal — stay put while the rest scrolls */}
      <HomeHero
        greeting={data.greeting}
        studentName={data.studentName}
        notificationCount={data.notificationCount}
        streak={data.streak}
        dailyGoal={data.dailyGoal}
        onPressNotifications={() => router.push('/notifications')}
        onPressStreak={() => router.push('/streak')}
        onPressDailyGoal={() => router.push('/daily-tasks')}
      />

      {/* Each section shrinks and fades as it scrolls up under the header. */}
      <View style={styles.scrollArea}>
        <Animated.ScrollView
          onScroll={onScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refetch} tintColor={HT.primary} colors={[HT.primary]} />}>
          {/* 3. Continue learning */}
          <ScrollItem scrollY={scrollY} style={styles.first}>
            <ContinueLearning data={data.continueLearning} />
          </ScrollItem>

          {/* 4. Leaderboard preview */}
          <ScrollItem scrollY={scrollY} style={styles.padded}>
            <LeaderboardPreview leaderboard={data.leaderboard} />
          </ScrollItem>

          {/* 5. Performance summary */}
          <ScrollItem scrollY={scrollY}>
            <View style={styles.padded}>
              <SectionHeader title="Your progress" />
            </View>
            <StatsStrip
              questionsSolved={data.stats.questionsSolved}
              accuracy={data.stats.accuracy}
              syllabusCoverage={data.stats.syllabusCoverage}
              paperTests={data.stats.paperTests}
            />
          </ScrollItem>

          {/* 6. Today's study plan */}
          <ScrollItem scrollY={scrollY} style={styles.planWrap}>
            <TodaysPlan plan={data.todaysPlan} />
          </ScrollItem>

          {/* 7. Quick actions */}
          <ScrollItem scrollY={scrollY} style={styles.padded}>
            <QuickActions />
          </ScrollItem>

          {/* 8. Strong & weak categories */}
          <ScrollItem scrollY={scrollY} style={styles.padded}>
            <CategoryPerformance performance={data.performance} />
          </ScrollItem>
        </Animated.ScrollView>
        {/* Soft edge under the header, so sections fade out instead of being cut off. */}
        <ScrollEdgeFade color={HT.bg} />
      </View>
    </View>
  );
}

// Placeholder shapes in the real layout while the dashboard loads.
function HomeSkeleton() {
  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.skeletonHero}>
        <View style={[styles.bone, { width: 90, height: 12 }]} />
        <View style={[styles.bone, { width: 180, height: 26, marginTop: 8 }]} />
        <View style={[styles.bone, { height: 48, marginTop: 18 }]} />
      </SafeAreaView>
      <View style={styles.body}>
        <View style={[styles.bone, { height: 140 }]} />
        <View style={[styles.bone, { height: 180, marginTop: 28 }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: HT.bg },
  scrollArea: { flex: 1 },
  body: { paddingHorizontal: 20, paddingTop: 28 },
  // Same spacing the sections had as one long page.
  padded: { paddingHorizontal: 20 },
  first: { paddingHorizontal: 20, marginTop: 20 },
  planWrap: { paddingHorizontal: 20, paddingTop: 28 },

  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: HT.bg, paddingHorizontal: 32 },
  errorTitle: { fontSize: 16, fontWeight: '700', color: HT.ink, textAlign: 'center' },
  errorText: { color: HT.muted, textAlign: 'center', marginTop: 6, fontWeight: '500' },
  retryBtn: { marginTop: 18, backgroundColor: HT.primary, paddingVertical: 12, paddingHorizontal: 28, borderRadius: HT.radius },
  retryText: { color: HT.surface, fontWeight: '700' },

  // Same violet panel as the real header, so nothing jumps when it loads.
  skeletonHero: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 18,
    backgroundColor: HT.primarySoft,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  bone: { backgroundColor: '#F2F2F2', borderRadius: HT.radius },
});
