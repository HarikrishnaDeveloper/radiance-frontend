import { router } from 'expo-router';
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
import type { DailyChallengeResponse, DailyChallengeSubmitResponse } from '@/types/api';

export default function DailyChallengeScreen() {
  const { token } = useAuth();
  const theme = useTheme();

  const [challenge, setChallenge] = useState<DailyChallengeResponse | null>(null);
  const [answers, setAnswers] = useState<Map<number, number | null>>(new Map());
  const [index, setIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<DailyChallengeSubmitResponse | null>(null);

  useEffect(() => {
    if (!token) return;
    api.dailyChallenge(token).then(setChallenge);
  }, [token]);

  const currentQuestion = useMemo(
    () => (challenge && index < challenge.questions.length ? challenge.questions[index] : null),
    [challenge, index]
  );

  function pickOption(optionId: number) {
    setSelectedOptionId(optionId);
  }

  async function advance(pickedOptionId: number | null) {
    if (!challenge || !currentQuestion) return;
    const nextAnswers = new Map(answers).set(currentQuestion.id, pickedOptionId);
    setAnswers(nextAnswers);
    setSelectedOptionId(null);

    const isLast = index === challenge.questions.length - 1;
    if (!isLast) {
      setIndex((i) => i + 1);
      return;
    }

    if (!token) return;
    setSubmitting(true);
    try {
      const payload = challenge.questions.map((q) => ({
        questionId: q.id,
        selectedOptionId: nextAnswers.get(q.id) ?? null,
      }));
      const submitResult = await api.submitDailyChallenge(token, payload);
      setResult(submitResult);
    } finally {
      setSubmitting(false);
    }
  }

  if (!challenge) {
    return (
      <ThemedView style={styles.centerFill}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  const alreadyDone = challenge.progress?.completedAt;

  if (result || alreadyDone) {
    const stars = result?.starsEarned ?? challenge.progress?.starsEarned ?? 0;
    const accuracy = result?.accuracy ?? challenge.progress?.accuracy ?? 0;
    const correct = result?.correctAnswers ?? challenge.progress?.correctAnswers ?? 0;
    const total = result?.completedQuestions ?? challenge.progress?.completedQuestions ?? 0;

    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedView style={styles.resultCard}>
            <StarRating count={stars} size={32} />
            <ThemedText type="title" style={styles.scoreText}>
              {accuracy}%
            </ThemedText>
            <ThemedText themeColor="textSecondary">
              {correct}/{total} correct
            </ThemedText>
            {!result && (
              <ThemedText themeColor="textSecondary" type="small" style={{ marginTop: 4 }}>
                Come back tomorrow for a new challenge.
              </ThemedText>
            )}
            <Pressable onPress={() => router.replace('/')} style={[styles.primaryButton, { backgroundColor: theme.text }]}>
              <ThemedText style={{ color: theme.background }} type="smallBold">
                Back to Home
              </ThemedText>
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
          Daily Challenge · Question {index + 1} of {challenge.questionCount}
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
                  {index === challenge.questions.length - 1 ? 'Submit' : 'Next'}
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
