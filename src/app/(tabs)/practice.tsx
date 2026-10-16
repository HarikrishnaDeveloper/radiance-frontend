import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FilterTabs } from '@/components/practice/FilterTabs';
import { PracticeAnalytics } from '@/components/practice/PracticeAnalytics';
import { SubjectCarousel } from '@/components/practice/SubjectCarousel';
import { dialog } from '@/components/ui/dialog';
import { ScrollEdgeFade } from '@/components/ui/scroll-item';
import { ViewSwitcher } from '@/components/ui/view-switcher';
import { COLORS } from '@/constants/colors';
import { useAuth } from '@/context/auth-context';
import { toPerformance } from '@/hooks/useHomeDashboard';
import { api } from '@/lib/api-client';
import type { CategorySummary, UserStats } from '@/types/api';
import type { HomeData } from '@/types/dashboard.types';
import { Pressable } from '@/components/ui/pressable';
import { playSound } from '@/lib/sounds';

type FilterKey = 'all' | 'in_progress' | 'completed' | 'not_started';
type View_ = 'subjects' | 'analytics';

const VIEWS: { key: View_; label: string }[] = [
  { key: 'subjects', label: 'All subjects' },
  { key: 'analytics', label: 'Analytics' },
];

function statusOf(category: CategorySummary): Exclude<FilterKey, 'all'> {
  if (category.totalStages === 0 || category.completedStages === 0) return 'not_started';
  if (category.completedStages >= category.totalStages) return 'completed';
  return 'in_progress';
}

export default function PracticeScreen() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<CategorySummary[] | null>(null);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [performance, setPerformance] = useState<HomeData['performance'] | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [view, setView] = useState<View_>('subjects');
  const analyticsY = useSharedValue(0);
  const onAnalyticsScroll = useAnimatedScrollHandler((e) => {
    analyticsY.value = e.contentOffset.y;
  });

  const load = useCallback(async () => {
    if (!token) return;
    // Analytics (stats, strong & weak subjects) come from the cached dashboard;
    // the subject list works without them.
    const applyDashboard = (d: Awaited<ReturnType<typeof api.dashboard>>) => {
      setPerformance(toPerformance(d));
      setStats(d.stats);
    };
    api.dashboard(token, applyDashboard).then(applyDashboard).catch(() => undefined);
    try {
      const result = await api.categories(token, (freshData) => {
        setCategories(freshData);
      });
      setCategories(result);
    } catch {
      // Swallowed as we want to remain silent if cached data exists
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const filtered = useMemo(
    () => (categories ?? []).filter((c) => filter === 'all' || statusOf(c) === filter),
    [categories, filter]
  );

  // Accuracy per subject (only rated subjects have one), for the carousel details.
  const accuracyById = useMemo(() => {
    const map = new Map<number, number>();
    for (const c of [...(performance?.strong ?? []), ...(performance?.weak ?? [])]) map.set(c.categoryId, c.accuracy);
    return map;
  }, [performance]);

  async function practiceSubject(subject: CategorySummary) {
    if (!token) return;
    try {
      const attempt = await api.createAttempt(token, { mode: 'CATEGORY_PRACTICE', categoryIds: [subject.id] });
      playSound('open');
      router.push(`/quiz/${attempt.id}`);
    } catch {
      dialog.error('Could not start practice', 'Please check your connection and try again.');
    }
  }

  async function startQuickPractice() {
    if (!token || !categories || categories.length === 0) return;
    const attempt = await api.createAttempt(token, {
      mode: 'CATEGORY_PRACTICE',
      categoryIds: categories.map((c) => c.id),
    });
    playSound('open');
    router.push(`/quiz/${attempt.id}`);
  }

  if (!categories) {
    return (
      <View style={styles.centerFill}>
        <ActivityIndicator color={COLORS.purple} />
      </View>
    );
  }

  const countOf = (key: FilterKey) => (key === 'all' ? categories.length : categories.filter((c) => statusOf(c) === key).length);
  const chips = (
    [
      ['all', 'All'],
      ['in_progress', 'In progress'],
      ['completed', 'Done'],
      ['not_started', 'To start'],
    ] as [FilterKey, string][]
  ).map(([key, label]) => ({ key, label, count: countOf(key) }));

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.pageTitle}>Practice</Text>
            <Text style={styles.pageSub}>
              {categories.length} subjects · {categories.reduce((sum, c) => sum + c.questionCount, 0)}+ questions
            </Text>
          </View>
          <Pressable
            onPress={startQuickPractice}
            style={({ pressed }) => [styles.quickBtn, pressed && { backgroundColor: COLORS.purpleDark }]}
            accessibilityRole="button"
            accessibilityLabel="Quick practice: 10 random questions across all subjects">
            <Ionicons name="flash" size={16} color={COLORS.white} />
            <Text style={styles.quickText}>Quick 10</Text>
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

      {view === 'analytics' ? (
        // Each block shrinks and fades as it scrolls up under the header.
        <View style={styles.subjectsView}>
          <Animated.ScrollView
            onScroll={onAnalyticsScroll}
            scrollEventThrottle={16}
            contentContainerStyle={styles.analytics}
            showsVerticalScrollIndicator={false}>
            <PracticeAnalytics stats={stats} performance={performance} categories={categories} scrollY={analyticsY} />
          </Animated.ScrollView>
          <ScrollEdgeFade color={COLORS.loginBg} />
        </View>
      ) : (
        // Fixed-height layout: the carousel takes the remaining space, so swiping
        // a card up for details never fights with page scrolling.
        <View style={styles.subjectsView}>
          <View style={styles.filterSection}>
            <FilterTabs tabs={chips} value={filter} onChange={setFilter} />
          </View>

          {filtered.length === 0 ? (
            <Text style={styles.emptyText}>No subjects match this filter.</Text>
          ) : (
            <SubjectCarousel
              // Remount on filter so the carousel starts at the first match.
              key={filter}
              subjects={filtered}
              accuracyById={accuracyById}
              onPractice={practiceSubject}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.loginBg },
  scrollContent: { flexGrow: 1 },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.loginBg },

  header: { backgroundColor: COLORS.white, paddingHorizontal: 22, paddingBottom: 4, paddingTop: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  quickBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.purple, paddingVertical: 9, paddingHorizontal: 14, borderRadius: 20 },
  quickText: { fontSize: 13.5, fontWeight: '600', color: COLORS.white },
  analytics: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 32 },
  chipScroll: { flexGrow: 0, marginTop: 12 },
  pageTitle: { fontSize: 28, fontWeight: '700', color: COLORS.navy, letterSpacing: -0.5 },
  pageSub: { fontSize: 14, color: COLORS.gray, marginTop: 3 },

  subjectsView: { flex: 1 },
  filterSection: { paddingTop: 14, paddingBottom: 0 },

  section: { paddingHorizontal: 22, paddingTop: 22 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.navy, marginBottom: 12 },

  modeCard: {
    backgroundColor: COLORS.purple,
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  modeIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeBody: { flex: 1 },
  modeName: { fontSize: 15, fontWeight: '600', color: COLORS.white },
  modeSub: { fontSize: 12.5, color: 'rgba(255,255,255,0.85)', marginTop: 2 },

  chipRow: { flexDirection: 'row', gap: 9, paddingHorizontal: 22, paddingBottom: 6 },
  chip: {
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
    backgroundColor: COLORS.white,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  chipActive: { backgroundColor: COLORS.purple, borderColor: COLORS.purple },
  chipText: { fontSize: 13.5, fontWeight: '500', color: COLORS.gray },
  chipTextActive: { color: COLORS.white },

  subjectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
  },
  subjectBody: { flex: 1 },
  subjectName: { fontSize: 15.5, fontWeight: '600', color: COLORS.navy },
  subjectMeta: { fontSize: 13, color: COLORS.gray, marginTop: 3 },
  subjectBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: COLORS.purpleSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: { textAlign: 'center', color: COLORS.grayLight, marginTop: 20 },
});
