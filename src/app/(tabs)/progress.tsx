import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProgressRing } from '@/components/progress-ring';
import { COLORS } from '@/constants/colors';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api-client';
import type { DashboardResponse } from '@/types/api';

export default function ProgressScreen() {
  const { token } = useAuth();
  const [data, setData] = useState<DashboardResponse | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    const dashboard = await api.dashboard(token);
    setData(dashboard);
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

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <SafeAreaView edges={['top']}>
          <Text style={styles.pageTitle}>Progress</Text>
          <Text style={styles.pageSub}>Track how far you&apos;ve come</Text>
        </SafeAreaView>
      </View>

      <View style={styles.section}>
        <View style={styles.accuracyCard}>
          <ProgressRing percent={data.stats.accuracy} size={104} strokeWidth={10} color={COLORS.purple} trackColor={COLORS.purpleSoft}>
            <Text style={styles.accuracyNum}>{data.stats.accuracy}%</Text>
            <Text style={styles.accuracyLabel}>Accuracy</Text>
          </ProgressRing>
          <View style={styles.accuracySide}>
            <View style={styles.statRow}>
              <View style={[styles.dot, { backgroundColor: COLORS.purple }]} />
              <View>
                <Text style={styles.statVal}>{data.stats.questionsSolved}</Text>
                <Text style={styles.statLabel}>Questions Solved</Text>
              </View>
            </View>
            <View style={styles.statRow}>
              <View style={[styles.dot, { backgroundColor: COLORS.gold }]} />
              <View>
                <Text style={styles.statVal}>{data.streak}</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
            </View>
            {data.longestStreak > 0 && (
              <View style={styles.statRow}>
                <View style={[styles.dot, { backgroundColor: COLORS.green }]} />
                <View>
                  <Text style={styles.statVal}>{data.longestStreak}</Text>
                  <Text style={styles.statLabel}>Best Streak</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Stage Completion by Subject</Text>
        <View style={styles.card}>
          {data.categoryProgress.map((category, i) => (
            <View key={category.id} style={[styles.subjRow, i === data.categoryProgress.length - 1 && { marginBottom: 0 }]}>
              <View style={styles.subjTop}>
                <Text style={styles.subjName}>{category.foodWorldName ?? category.name}</Text>
                <Text style={styles.subjPct}>{category.progress}%</Text>
              </View>
              <View style={styles.track}>
                <View style={[styles.trackFill, { width: `${category.progress}%` }]} />
              </View>
            </View>
          ))}
          {data.categoryProgress.length === 0 && (
            <Text style={styles.emptyText}>No categories yet.</Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.rankCard}>
          <View style={styles.rankBadge}>
            <Ionicons name="ribbon-outline" size={24} color={COLORS.white} />
          </View>
          <View>
            <Text style={styles.rankTitle}>{data.stats.questionsSolved} questions answered</Text>
            <Text style={styles.rankSub}>Across {data.categoryProgress.length} subjects</Text>
          </View>
        </View>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.loginBg },
  scrollContent: { flexGrow: 1 },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.loginBg },

  header: { backgroundColor: COLORS.purple700, paddingHorizontal: 22, paddingBottom: 22, paddingTop: 6 },
  pageTitle: { fontSize: 22, fontWeight: '800', color: COLORS.white },
  pageSub: { fontSize: 13, color: 'rgba(255,255,255,0.68)', marginTop: 3, fontWeight: '500' },

  section: { paddingHorizontal: 22, paddingTop: 22 },
  sectionTitle: { fontSize: 16.5, fontWeight: '800', color: COLORS.navy, marginBottom: 14 },

  accuracyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  accuracyNum: { fontSize: 22, fontWeight: '800', color: COLORS.navy },
  accuracyLabel: { fontSize: 10.5, color: COLORS.grayLight, fontWeight: '600' },
  accuracySide: { flex: 1, gap: 12 },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statVal: { fontSize: 14, fontWeight: '800', color: COLORS.navy },
  statLabel: { fontSize: 11, color: COLORS.gray, fontWeight: '500' },

  card: { backgroundColor: COLORS.white, borderRadius: 22, padding: 20 },
  subjRow: { marginBottom: 16 },
  subjTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 },
  subjName: { fontSize: 13.5, fontWeight: '700', color: COLORS.navy },
  subjPct: { fontSize: 13, fontWeight: '800', color: COLORS.navy },
  track: { height: 8, borderRadius: 100, backgroundColor: COLORS.grayBorder, overflow: 'hidden' },
  trackFill: { height: '100%', borderRadius: 100, backgroundColor: COLORS.purple },
  emptyText: { textAlign: 'center', color: COLORS.grayLight },

  rankCard: {
    backgroundColor: COLORS.purple700,
    borderRadius: 22,
    padding: 19,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  rankBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankTitle: { fontSize: 15, fontWeight: '800', color: COLORS.white },
  rankSub: { fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: '500', marginTop: 2 },
});
