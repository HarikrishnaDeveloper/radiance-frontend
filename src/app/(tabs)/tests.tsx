import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PaperArcCarousel } from '@/components/tests/PaperArcCarousel';
import { TestDashboard } from '@/components/tests/TestDashboard';
import { Button } from '@/components/ui/button';
import { ScrollEdgeFade } from '@/components/ui/scroll-item';
import { ViewSwitcher } from '@/components/ui/view-switcher';
import { COLORS } from '@/constants/colors';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api-client';
import type { LeaderboardResponse, PaperResultsResponse, PaperSummary } from '@/types/api';
import { Pressable } from '@/components/ui/pressable';

// Tests tab: previous-year question papers (arc carousel) and an Analytics
// view with the student's results. Subject stages live in Practice.
type View_ = 'papers' | 'analytics';
// How many recent finished papers Analytics studies.
const RECENT_RESULTS = 6;
const VIEWS: { key: View_; label: string }[] = [
  { key: 'papers', label: 'Papers' },
  { key: 'analytics', label: 'Analytics' },
];

export default function TestsScreen() {
  const { token } = useAuth();
  const [papers, setPapers] = useState<PaperSummary[] | null>(null);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(null);
  const [view, setView] = useState<View_>('papers');
  const [results, setResults] = useState<PaperResultsResponse[] | null>(null);
  const analyticsY = useSharedValue(0);
  const onAnalyticsScroll = useAnimatedScrollHandler((e) => {
    analyticsY.value = e.contentOffset.y;
  });

  const load = useCallback(async (force = false) => {
    if (!token) return;
    // Rank comes from the (cached) dashboard; the dashboard card works without it.
    api
      .dashboard(token, (d) => setLeaderboard(d.leaderboard), force)
      .then((d) => setLeaderboard(d.leaderboard))
      .catch(() => undefined);
    try {
      setPapers(await api.papers(token, setPapers, force));
      setError(false);
    } catch {
      // Keep showing what we have; only an empty screen needs the error state.
      setError(true);
    }
  }, [token]);

  // Analytics reads the full results of the most recent finished papers. Only
  // fetched while Analytics is open, since each result is a separate request.
  const loadResults = useCallback(async () => {
    if (!token) return;
    try {
      const recent = (await api.attemptHistory(token, true))
        .filter((a) => a.mode === 'FULL_PAPER' && a.completedAt)
        .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
        .slice(0, RECENT_RESULTS);
      const settled = await Promise.allSettled(recent.map((a) => api.paperResults(token, a.id)));
      setResults(settled.flatMap((s) => (s.status === 'fulfilled' ? [s.value] : [])));
    } catch {
      setResults((prev) => prev ?? []);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
      if (view === 'analytics') loadResults();
    }, [load, loadResults, view])
  );

  async function refresh() {
    setRefreshing(true);
    await Promise.all([load(true), view === 'analytics' ? loadResults() : undefined]);
    setRefreshing(false);
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.pageTitle}>Tests</Text>
            <Text style={styles.pageSub}>Previous year question papers</Text>
          </View>
          <Pressable
            onPress={() => router.push('/attempt-history')}
            hitSlop={8}
            style={({ pressed }) => [styles.historyBtn, pressed && { backgroundColor: COLORS.purpleSoft }]}
            accessibilityRole="button"
            accessibilityLabel="Attempt history">
            <Ionicons name="time-outline" size={22} color={COLORS.navy} />
          </Pressable>
        </View>
        <ViewSwitcher
          views={VIEWS}
          value={view}
          onChange={(next) => {
            // The analytics list remounts at the top, so its offset starts over too.
            analyticsY.set(0);
            setView(next);
          }}
        />
      </SafeAreaView>

      {!papers ? (
        <View style={styles.center}>
          {error ? (
            <>
              <Text style={styles.emptyText}>Could not load papers.</Text>
              <Button label="Try again" onPress={() => load()} style={{ marginTop: 14 }} />
            </>
          ) : (
            <ActivityIndicator color={COLORS.purple} />
          )}
        </View>
      ) : view === 'analytics' ? (
        // Each block shrinks and fades as it scrolls up under the header.
        <View style={{ flex: 1 }}>
          <Animated.ScrollView
            onScroll={onAnalyticsScroll}
            scrollEventThrottle={16}
            contentContainerStyle={styles.analytics}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={COLORS.purple} colors={[COLORS.purple]} />}>
            <TestDashboard
              papers={papers}
              results={results}
              rank={leaderboard?.me ?? null}
              totalRanked={leaderboard?.totalRanked ?? 0}
              scrollY={analyticsY}
              onBrowsePapers={() => setView('papers')}
            />
          </Animated.ScrollView>
          <ScrollEdgeFade color={COLORS.white} />
        </View>
      ) : (
        papers.length === 0 ? (
          <Text style={[styles.emptyText, { marginTop: 40 }]}>No papers yet.</Text>
        ) : (
          <PaperArcCarousel papers={papers} />
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.white },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },

  header: { backgroundColor: COLORS.white, paddingHorizontal: 22, paddingTop: 12, paddingBottom: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  historyBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: { fontSize: 28, fontWeight: '700', color: COLORS.navy, letterSpacing: -0.5 },
  pageSub: { fontSize: 14, color: COLORS.gray, marginTop: 3 },

  analytics: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 32 },
  emptyText: { fontSize: 15, color: COLORS.gray, textAlign: 'center' },

});
