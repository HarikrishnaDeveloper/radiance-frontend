import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StarRating } from '@/components/star-rating';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api-client';
import type { StageDetailResponse, StageSubmitResponse } from '@/types/api';

export default function StageScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const theme = useTheme();

  const [stage, setStage] = useState<StageDetailResponse | null>(null);
  const [answers, setAnswers] = useState<Map<number, number | null>>(new Map());
  const [index, setIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<StageSubmitResponse | null>(null);

  useEffect(() => {
    if (!token || !id) return;
    api.stageDetail(token, Number(id)).then(setStage);
  }, [token, id]);

  const currentQuestion = useMemo(
    () => (stage && index < stage.questions.length ? stage.questions[index] : null),
    [stage, index]
  );

  function pickOption(optionId: number) {
    setSelectedOptionId(optionId);
  }

  async function advance(pickedOptionId: number | null) {
    if (!stage || !currentQuestion) return;
    const nextAnswers = new Map(answers).set(currentQuestion.id, pickedOptionId);
    setAnswers(nextAnswers);
    setSelectedOptionId(null);

    const isLast = index === stage.questions.length - 1;
    if (!isLast) {
      setIndex((i) => i + 1);
      return;
    }

    if (!token) return;
    setSubmitting(true);
    try {
      const payload = stage.questions.map((q) => ({
        questionId: q.id,
        selectedOptionId: nextAnswers.get(q.id) ?? null,
      }));
      const submitResult = await api.submitStage(token, stage.id, payload);
      setResult(submitResult);
    } finally {
      setSubmitting(false);
    }
  }

  if (!stage) {
    return (
      <ThemedView style={styles.centerFill}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  if (result) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedView style={styles.resultCard}>
            <StarRating count={result.starsEarned} size={32} />
            <ThemedText type="title" style={styles.scoreText}>
              {result.accuracy}%
            </ThemedText>
            <ThemedText themeColor="textSecondary">
              {result.correctAnswers}/{result.completedQuestions} correct
            </ThemedText>

            {result.nextStageUnlocked && result.nextStageId && (
              <Pressable
                onPress={() => router.replace(`/stage/${result.nextStageId}`)}
                style={[styles.primaryButton, { backgroundColor: theme.text }]}>
                <ThemedText style={{ color: theme.background }} type="smallBold">
                  Next Stage
                </ThemedText>
              </Pressable>
            )}
            <Pressable
              onPress={() => router.replace(`/category/${stage.category.id}`)}
              style={styles.secondaryButton}>
              <ThemedText themeColor="textSecondary">Back to Category</ThemedText>
            </Pressable>
          </ThemedView>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText themeColor="textSecondary" type="small">
          Question {index + 1} of {stage.questionCount}
        </ThemedText>

        {currentQuestion && (
          <>
            <ThemedText themeColor="textSecondary" type="small">
              {currentQuestion.category.name}
              {currentQuestion.questionPaper ? ` • ${currentQuestion.questionPaper.year}` : ''}
            </ThemedText>
            <ScrollView style={styles.questionScroll} showsVerticalScrollIndicator={false}>
              <ThemedText style={styles.questionText}>{currentQuestion.text}</ThemedText>
              {currentQuestion.questionImage && (
                <Image
                  source={{ uri: `${process.env.EXPO_PUBLIC_API_URL}${currentQuestion.questionImage}` }}
                  style={styles.questionImage}
                  resizeMode="contain"
                />
              )}
            </ScrollView>

            <ThemedView style={styles.options}>
              {currentQuestion.options.map((option) => {
                const isSelected = option.id === selectedOptionId;
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => pickOption(option.id)}
                    disabled={submitting}
                    style={[
                      styles.option,
                      { backgroundColor: isSelected ? theme.backgroundSelected : theme.backgroundElement },
                    ]}>
                    <ThemedText type="smallBold">{option.label}</ThemedText>
                    <ThemedText style={styles.optionText}>{option.text}</ThemedText>
                  </Pressable>
                );
              })}
            </ThemedView>

            <ThemedView style={styles.footer}>
              <Pressable onPress={() => advance(null)} disabled={submitting} style={styles.skipButton}>
                <ThemedText themeColor="textSecondary">Skip</ThemedText>
              </Pressable>
              <Pressable
                onPress={() => advance(selectedOptionId)}
                disabled={submitting || selectedOptionId === null}
                style={[
                  styles.primaryButton,
                  { backgroundColor: theme.text, opacity: submitting || selectedOptionId === null ? 0.5 : 1 },
                ]}>
                <ThemedText style={{ color: theme.background }} type="smallBold">
                  {index === stage.questions.length - 1 ? 'Submit Stage' : 'Next'}
                </ThemedText>
              </Pressable>
            </ThemedView>
          </>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  centerFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    gap: Spacing.three,
  },
  questionScroll: {
    maxHeight: 280,
  },
  questionText: {
    fontSize: 20,
    lineHeight: 28,
    marginBottom: 8,
  },
  questionImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  options: {
    gap: Spacing.two,
  },
  option: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    flexDirection: 'row',
    gap: Spacing.two,
  },
  optionText: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: Spacing.four,
  },
  skipButton: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  primaryButton: {
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.five,
    alignItems: 'center',
  },
  secondaryButton: {
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  resultCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  scoreText: {
    fontSize: 40,
    lineHeight: 46,
    marginTop: Spacing.two,
  },
});
