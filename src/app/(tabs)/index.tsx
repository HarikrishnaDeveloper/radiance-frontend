import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StarRating } from '@/components/star-rating';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api-client';
import type { DashboardResponse } from '@/types/api';

export default function HomeScreen() {
  const { token, user } = useAuth();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const dashboard = await api.dashboard(token);
      setData(dashboard);
      setError(null);
    } catch {
      setError('Could not load your dashboard');
    } finally {
      setLoading(false);
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

  if (loading && !data) {
    return (
      <ThemedView style={styles.centerFill}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  const continueLearning = data?.continueLearning ?? null;

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
      <ThemedView style={styles.container}>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <ThemedText type="title" style={styles.greeting}>
            Good morning, {user?.name ?? user?.username}
          </ThemedText>

          {data && data.streak > 0 && (
            <ThemedText themeColor="textSecondary">🔥 {data.streak} day streak</ThemedText>
          )}

          {error && <ThemedText themeColor="textSecondary">{error}</ThemedText>}

          {data?.continueAttempt && (
            <Pressable onPress={() => router.push(`/quiz/${data.continueAttempt!.id}`)}>
              <ThemedView type="backgroundElement" style={styles.card}>
                <ThemedText type="subtitle">Continue</ThemedText>
                <ThemedText>{data.continueAttempt.title}</ThemedText>
                <ThemedText themeColor="textSecondary">
                  {data.continueAttempt.answeredCount} / {data.continueAttempt.totalQuestions} answered
                </ThemedText>
              </ThemedView>
            </Pressable>
          )}

          {continueLearning && !continueLearning.allCompleted && (
            <Pressable onPress={() => router.push(`/stage/${continueLearning.stageId}`)}>
              <ThemedView type="backgroundElement" style={styles.card}>
                <ThemedText type="subtitle">Continue Learning</ThemedText>
                <ThemedText>{continueLearning.foodWorldName ?? continueLearning.categoryName}</ThemedText>
                <ThemedText themeColor="textSecondary">
                  Stage {continueLearning.stageNumber} · {continueLearning.questionProgress.completed} /{' '}
                  {continueLearning.questionProgress.total} answered
                </ThemedText>
              </ThemedView>
            </Pressable>
          )}

          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Quick Practice
          </ThemedText>
          <ThemedView style={styles.tileRow}>
            {data?.categoryProgress.map((category) => (
              <Pressable
                key={category.id}
                onPress={() => router.push(`/category/${category.id}`)}
                style={styles.tileWrapper}>
                <ThemedView type="backgroundElement" style={styles.tile}>
                  <ThemedText type="smallBold">{category.foodWorldName ?? category.name}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {category.completedStages}/{category.totalStages} stages
                  </ThemedText>
                </ThemedView>
              </Pressable>
            ))}
          </ThemedView>

          <ThemedText type="subtitle" style={styles.sectionTitle}>
            30 Year Journey
          </ThemedText>
          <ThemedView style={styles.tileRow}>
            {data?.papers.map((paper) => (
              <Pressable key={paper.id} onPress={() => startFullPaper(paper.id)} style={styles.tileWrapper}>
                <ThemedView type="backgroundElement" style={styles.tile}>
                  <ThemedText type="smallBold">{paper.title ?? `${paper.year} Paper`}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {paper.questionCount} questions
                  </ThemedText>
                </ThemedView>
              </Pressable>
            ))}
          </ThemedView>

          {data && data.recentAchievements.length > 0 && (
            <>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Recent Achievements
              </ThemedText>
              <ThemedView style={styles.tileRow}>
                {data.recentAchievements.map((achievement) => (
                  <ThemedView key={achievement.stageId} type="backgroundElement" style={styles.tile}>
                    <ThemedText type="smallBold">{achievement.foodWorldName ?? achievement.categoryName}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      Stage {achievement.stageNumber}
                    </ThemedText>
                    <StarRating count={achievement.starsEarned} size={14} />
                  </ThemedView>
                ))}
              </ThemedView>
            </>
          )}
        </SafeAreaView>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  centerFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    maxWidth: MaxContentWidth,
    width: '100%',
  },
  safeArea: {
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.three,
  },
  greeting: {
    fontSize: 28,
    lineHeight: 34,
  },
  card: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.one,
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 26,
    marginTop: Spacing.two,
  },
  tileRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  tileWrapper: {
    minWidth: 140,
    flexGrow: 1,
  },
  tile: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.half,
  },
});
