import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api-client';
import type { AttemptAnswerState, SafeQuestion } from '@/types/api';

type Feedback = { isCorrect: boolean; correctOptionId: number | null; explanation: string | null };

export default function QuizScreen() {
  const { attemptId } = useLocalSearchParams<{ attemptId: string }>();
  const { token } = useAuth();
  const theme = useTheme();

  const [questions, setQuestions] = useState<SafeQuestion[] | null>(null);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [answered, setAnswered] = useState<Map<number, AttemptAnswerState>>(new Map());
  const [index, setIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token || !attemptId) return;
    (async () => {
      const detail = await api.getAttempt(token, Number(attemptId));
      if (detail.completedAt) {
        router.replace(`/results/${attemptId}`);
        return;
      }
      const answeredMap = new Map(detail.answers.map((a) => [a.questionId, a]));
      const resumeIndex = detail.questions.findIndex((q) => !answeredMap.has(q.id));
      setQuestions(detail.questions);
      setTotalQuestions(detail.totalQuestions);
      setAnswered(answeredMap);
      setIndex(resumeIndex === -1 ? detail.questions.length : resumeIndex);
    })();
  }, [token, attemptId]);

  const currentQuestion = useMemo(
    () => (questions && index < questions.length ? questions[index] : null),
    [questions, index]
  );

  async function selectOption(optionId: number) {
    if (!token || !currentQuestion || submitting || feedback) return;
    setSelectedOptionId(optionId);
    setSubmitting(true);
    try {
      const result = await api.submitAnswer(token, Number(attemptId), currentQuestion.id, optionId);
      setFeedback(result);
      setAnswered((prev) =>
        new Map(prev).set(currentQuestion.id, {
          questionId: currentQuestion.id,
          selectedOptionId: optionId,
          isCorrect: result.isCorrect,
        })
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function skip() {
    if (!token || !currentQuestion || submitting) return;
    setSubmitting(true);
    try {
      await api.submitAnswer(token, Number(attemptId), currentQuestion.id, null);
      setAnswered((prev) =>
        new Map(prev).set(currentQuestion.id, {
          questionId: currentQuestion.id,
          selectedOptionId: null,
          isCorrect: false,
        })
      );
      goNext();
    } finally {
      setSubmitting(false);
    }
  }

  function goNext() {
    setSelectedOptionId(null);
    setFeedback(null);
    setIndex((i) => i + 1);
  }

  async function finish() {
    if (!token) return;
    setSubmitting(true);
    try {
      await api.completeAttempt(token, Number(attemptId));
      router.replace(`/results/${attemptId}`);
    } finally {
      setSubmitting(false);
    }
  }

  if (!questions) {
    return (
      <ThemedView style={styles.centerFill}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  const isLastQuestion = index === questions.length - 1;
  const readyToFinish = index >= questions.length;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText themeColor="textSecondary" type="small">
          Question {Math.min(index + 1, totalQuestions)} of {totalQuestions}
        </ThemedText>

        {readyToFinish || !currentQuestion ? (
          <ThemedView style={styles.card}>
            <ThemedText type="subtitle">All questions answered</ThemedText>
            <Pressable
              onPress={finish}
              disabled={submitting}
              style={[styles.primaryButton, { backgroundColor: theme.text, opacity: submitting ? 0.6 : 1 }]}>
              <ThemedText style={{ color: theme.background }} type="smallBold">
                Finish
              </ThemedText>
            </Pressable>
          </ThemedView>
        ) : (
          <>
            <ThemedText themeColor="textSecondary" type="small">
              {currentQuestion.category.name}{currentQuestion.questionPaper ? ` • ${currentQuestion.questionPaper.year}` : ''}
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
                const isCorrectOption = feedback && option.id === feedback.correctOptionId;
                const isWrongSelected = feedback && isSelected && !feedback.isCorrect;

                let backgroundColor: string = theme.backgroundElement;
                if (isCorrectOption) backgroundColor = '#3ea34d55';
                else if (isWrongSelected) backgroundColor = '#d9433955';
                else if (isSelected) backgroundColor = theme.backgroundSelected;

                return (
                  <Pressable
                    key={option.id}
                    onPress={() => selectOption(option.id)}
                    disabled={!!feedback || submitting}
                    style={[styles.option, { backgroundColor }]}>
                    <ThemedText type="smallBold">{option.label}</ThemedText>
                    <ThemedText style={styles.optionText}>{option.text}</ThemedText>
                  </Pressable>
                );
              })}
            </ThemedView>

            {feedback?.explanation && (
              <ThemedView type="backgroundElement" style={styles.explanation}>
                <ThemedText type="small" themeColor="textSecondary">
                  {feedback.explanation}
                </ThemedText>
              </ThemedView>
            )}

            <ThemedView style={styles.footer}>
              {!feedback && (
                <Pressable onPress={skip} disabled={submitting} style={styles.skipButton}>
                  <ThemedText themeColor="textSecondary">Skip</ThemedText>
                </Pressable>
              )}
              {feedback && (
                <Pressable
                  onPress={isLastQuestion ? finish : goNext}
                  disabled={submitting}
                  style={[styles.primaryButton, { backgroundColor: theme.text, opacity: submitting ? 0.6 : 1 }]}>
                  <ThemedText style={{ color: theme.background }} type="smallBold">
                    {isLastQuestion ? 'Finish' : 'Next'}
                  </ThemedText>
                </Pressable>
              )}
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
  explanation: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
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
  card: {
    gap: Spacing.three,
    alignItems: 'flex-start',
  },
});
