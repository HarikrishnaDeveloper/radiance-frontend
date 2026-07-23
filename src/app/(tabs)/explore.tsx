import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api-client';
import type { AttemptHistoryItem, CategorySummary, PaperSummary } from '@/types/api';

export default function ExploreScreen() {
  const { token, logout } = useAuth();
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [papers, setPapers] = useState<PaperSummary[]>([]);
  const [history, setHistory] = useState<AttemptHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const [categoriesRes, papersRes, historyRes] = await Promise.all([
      api.categories(token),
      api.papers(token),
      api.attemptHistory(token, true),
    ]);
    setCategories(categoriesRes);
    setPapers(papersRes);
    setHistory(historyRes);
    setLoading(false);
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function startCategoryPractice(categoryId: number) {
    if (!token) return;
    const attempt = await api.createAttempt(token, { mode: 'CATEGORY_PRACTICE', categoryIds: [categoryId] });
    router.push(`/quiz/${attempt.id}`);
  }

  async function startFullPaper(questionPaperId: number) {
    if (!token) return;
    const attempt = await api.createAttempt(token, { mode: 'FULL_PAPER', questionPaperId });
    router.push(`/quiz/${attempt.id}`);
  }

  if (loading && categories.length === 0) {
    return (
      <ThemedView style={styles.centerFill}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
      <ThemedView style={styles.container}>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <ThemedText type="subtitle">Practice by category</ThemedText>
          <ThemedView style={styles.list}>
            {categories.map((category) => (
              <Pressable key={category.id} onPress={() => startCategoryPractice(category.id)}>
                <ThemedView type="backgroundElement" style={styles.row}>
                  <ThemedText>{category.name}</ThemedText>
                  <ThemedText themeColor="textSecondary" type="small">
                    {category.questionCount} questions
                  </ThemedText>
                </ThemedView>
              </Pressable>
            ))}
          </ThemedView>

          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Past year papers
          </ThemedText>
          <ThemedView style={styles.list}>
            {papers.map((paper) => (
              <Pressable key={paper.id} onPress={() => startFullPaper(paper.id)}>
                <ThemedView type="backgroundElement" style={styles.row}>
                  <ThemedText>{paper.title ?? `${paper.year} Paper`}</ThemedText>
                  <ThemedText themeColor="textSecondary" type="small">
                    {paper.questionCount} questions
                  </ThemedText>
                </ThemedView>
              </Pressable>
            ))}
          </ThemedView>

          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Past attempts
          </ThemedText>
          <ThemedView style={styles.list}>
            {history.length === 0 && (
              <ThemedText themeColor="textSecondary">No completed attempts yet.</ThemedText>
            )}
            {history.map((attempt) => (
              <Pressable key={attempt.id} onPress={() => router.push(`/results/${attempt.id}`)}>
                <ThemedView type="backgroundElement" style={styles.row}>
                  <ThemedText>{attempt.title}</ThemedText>
                  <ThemedText themeColor="textSecondary" type="small">
                    {attempt.correctCount} / {attempt.totalQuestions} correct
                  </ThemedText>
                </ThemedView>
              </Pressable>
            ))}
          </ThemedView>

          <Pressable onPress={() => logout()} style={styles.logoutButton}>
            <ThemedText themeColor="textSecondary">Log out</ThemedText>
          </Pressable>
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
    gap: Spacing.two,
  },
  sectionTitle: {
    marginTop: Spacing.four,
  },
  list: {
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  row: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoutButton: {
    alignItems: 'center',
    marginTop: Spacing.five,
    paddingVertical: Spacing.three,
  },
});
