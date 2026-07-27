import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api-client';
import type { AttemptResultsResponse } from '@/types/api';

export default function ResultsScreen() {
  const { attemptId } = useLocalSearchParams<{ attemptId: string }>();
  const { token } = useAuth();
  const theme = useTheme();
  const [results, setResults] = useState<AttemptResultsResponse | null>(null);

  useEffect(() => {
    if (!token || !attemptId) return;
    api.getResults(token, Number(attemptId)).then(setResults);
  }, [token, attemptId]);

  if (!results) {
    return (
      <ThemedView style={styles.centerFill}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedView type="backgroundElement" style={styles.summaryCard}>
            <ThemedText type="title" style={styles.scoreText}>
              {results.scorePercent}%
            </ThemedText>
            <ThemedText themeColor="textSecondary">
              {results.correctCount} correct · {results.wrongCount} wrong · {results.skippedCount} skipped
            </ThemedText>
          </ThemedView>

          {results.questions.map((question, i) => (
            <ThemedView key={question.id} type="backgroundElement" style={styles.questionCard}>
              <ThemedText themeColor="textSecondary" type="small">
                Q{i + 1} · {question.category.name}{question.questionPaper ? ` · ${question.questionPaper.year}` : ''}
              </ThemedText>
              <ThemedText style={styles.questionText}>{question.text}</ThemedText>

              {question.options.map((option) => {
                let color: 'text' | 'textSecondary' = 'textSecondary';
                let prefix = '';
                if (option.isCorrect) {
                  color = 'text';
                  prefix = '✓ ';
                } else if (option.id === question.selectedOptionId) {
                  prefix = '✗ ';
                }
                return (
                  <ThemedText key={option.id} themeColor={color} style={styles.optionLine}>
                    {prefix}
                    {option.label}. {option.text}
                  </ThemedText>
                );
              })}

              {question.explanation && (
                <ThemedText type="small" themeColor="textSecondary" style={styles.explanation}>
                  {question.explanation}
                </ThemedText>
              )}
            </ThemedView>
          ))}

          <Pressable
            onPress={() => router.replace('/')}
            style={[styles.homeButton, { backgroundColor: theme.text }]}>
            <ThemedText style={{ color: theme.background }} type="smallBold">
              Back to Home
            </ThemedText>
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
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  safeArea: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    gap: Spacing.three,
  },
  summaryCard: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.one,
  },
  scoreText: {
    fontSize: 40,
    lineHeight: 46,
  },
  questionCard: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  questionText: {
    marginBottom: Spacing.one,
  },
  optionLine: {
    fontSize: 14,
    lineHeight: 20,
  },
  explanation: {
    marginTop: Spacing.two,
  },
  homeButton: {
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
});
