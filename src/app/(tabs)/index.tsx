import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { useCallback } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ContinueLearning } from '@/components/home/ContinueLearning';
import { DailyMotivation } from '@/components/home/DailyMotivation';
import { HomeHero } from '@/components/home/HomeHero';
import { HT } from '@/components/home/home-theme';
import { QuickActions } from '@/components/home/QuickActions';
import { StatsStrip } from '@/components/home/StatsStrip';
import { TodaysPlan } from '@/components/home/TodaysPlan';
import { WeakAreas } from '@/components/home/WeakAreas';
import { useHomeDashboard } from '@/hooks/useHomeDashboard';

export default function HomeScreen() {
  const { data, isLoading, error, refreshing, refetch } = useHomeDashboard();

  // Light status bar over the dark hero; back to dark when leaving Home.
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('light');
      return () => setStatusBarStyle('dark');
    }, [])
  );

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
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refetch} tintColor={HT.gold} />}>
        <HomeHero
          greeting={data.greeting}
          studentName={data.studentName}
          targetLabel={data.targetLabel}
          streak={data.streak}
          overallProgress={data.overallProgress}
          onPressProfile={() => router.push('/profile')}
          onPressStreak={() => router.push('/streak')}
        />

        <StatsStrip questionsSolved={data.questionsSolved} accuracy={data.accuracy} paperTests={data.paperTestsCompleted} />

        <View style={styles.body}>
          <ContinueLearning data={data.continueLearning} />
          <TodaysPlan plan={data.todaysPlan} />
          <QuickActions />
          <WeakAreas areas={data.weakAreas} />
          <DailyMotivation text={data.dailyMotivation} />
        </View>
      </ScrollView>
    </View>
  );
}

// Placeholder shapes in the real layout while the dashboard loads.
function HomeSkeleton() {
  return (
    <View style={styles.screen}>
      <LinearGradient colors={[HT.heroTop, HT.heroBottom]} style={styles.skeletonHero}>
        <View style={[styles.bone, styles.boneDark, { width: 90, height: 10 }]} />
        <View style={[styles.bone, styles.boneDark, { width: 180, height: 26, marginTop: 10 }]} />
        <View style={[styles.bone, styles.boneDark, { width: 140, height: 12, marginTop: 10 }]} />
        <View style={[styles.bone, styles.boneDark, { height: 48, marginTop: 24 }]} />
      </LinearGradient>
      <View style={[styles.bone, styles.skeletonStats]} />
      <View style={styles.body}>
        <View style={[styles.bone, { height: 140 }]} />
        <View style={[styles.bone, { height: 180, marginTop: 28 }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: HT.bg },
  body: { paddingHorizontal: 20, paddingTop: 28 },

  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: HT.bg, paddingHorizontal: 32 },
  errorTitle: { fontSize: 16, fontWeight: '800', color: HT.ink, textAlign: 'center' },
  errorText: { color: HT.muted, textAlign: 'center', marginTop: 6, fontWeight: '500' },
  retryBtn: { marginTop: 18, backgroundColor: HT.primary, paddingVertical: 12, paddingHorizontal: 28, borderRadius: HT.radius },
  retryText: { color: HT.surface, fontWeight: '800' },

  skeletonHero: { paddingHorizontal: 20, paddingTop: 72, paddingBottom: 56 },
  skeletonStats: { height: 86, marginTop: -36, marginHorizontal: 20, backgroundColor: HT.surface, borderWidth: 1, borderColor: HT.hairline },
  bone: { backgroundColor: '#E9E7F0', borderRadius: HT.radius },
  boneDark: { backgroundColor: 'rgba(255,255,255,0.1)' },
});
