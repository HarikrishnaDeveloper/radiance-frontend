import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProgressRing } from '@/components/progress-ring';
import { COLORS } from '@/constants/colors';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api-client';
import type { AttemptAnswerState, QuestionDifficulty, SafeQuestion } from '@/types/api';

type Feedback = { isCorrect: boolean; correctOptionId: number | null; explanation: string | null };

const QUESTION_TIME_SECONDS = 45;
const DIFFICULTY_LEVEL: Record<QuestionDifficulty, number> = { EASY: 1, MEDIUM: 2, HARD: 3 };

function Stars({ filled, size = 13, color = COLORS.gold, emptyColor = COLORS.grayBorder }: { filled: number; size?: number; color?: string; emptyColor?: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 3 }}>
      {[1, 2, 3].map((i) => (
        <Ionicons key={i} name={i <= filled ? 'star' : 'star-outline'} size={size} color={i <= filled ? color : emptyColor} />
      ))}
    </View>
  );
}

function sessionStarCount(pct: number) {
  if (pct >= 90) return 3;
  if (pct >= 60) return 2;
  if (pct >= 1) return 1;
  return 0;
}

interface OptionProps {
  option: { id: number; label: string; text: string };
  isSelected: boolean;
  isCorrectOption: boolean | null;
  isWrongSelected: boolean | null;
  disabled: boolean;
  onPress: (id: number) => void;
}

const OptionButton = React.memo(({ option, isSelected, isCorrectOption, isWrongSelected, disabled, onPress }: OptionProps) => {
  let borderColor: string = COLORS.grayBorder;
  let backgroundColor: string = COLORS.white;
  let letterBg: string = COLORS.loginBg;
  let letterColor: string = COLORS.gray;

  if (isCorrectOption) {
    borderColor = COLORS.green;
    backgroundColor = COLORS.greenSoft;
    letterBg = COLORS.green;
    letterColor = COLORS.white;
  } else if (isWrongSelected) {
    borderColor = COLORS.error;
    backgroundColor = COLORS.errorBg;
    letterBg = COLORS.error;
    letterColor = COLORS.white;
  } else if (isSelected) {
    borderColor = COLORS.purple;
    backgroundColor = COLORS.purpleSoft;
    letterBg = COLORS.purple;
    letterColor = COLORS.white;
  }

  const handlePress = () => onPress(option.id);

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={[
        styles.option,
        { borderColor, backgroundColor },
        disabled && !isSelected && !isCorrectOption && styles.optionDimmed
      ]}
    >
      <View style={[styles.optionLetter, { backgroundColor: letterBg }]}>
        <Text style={[styles.optionLetterText, { color: letterColor }]}>{option.label}</Text>
      </View>
      <Text style={styles.optionText}>{option.text}</Text>
      {isCorrectOption && <Ionicons name="checkmark" size={18} color={COLORS.green} />}
      {isWrongSelected && <Ionicons name="close" size={18} color={COLORS.error} />}
    </Pressable>
  );
});

export default function QuizScreen() {
  const { attemptId } = useLocalSearchParams<{ attemptId: string }>();
  const { token } = useAuth();

  const [questions, setQuestions] = useState<SafeQuestion[] | null>(null);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [answered, setAnswered] = useState<Map<number, AttemptAnswerState>>(new Map());
  const [index, setIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_SECONDS);

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

  // Cosmetic per-question countdown — pauses once an answer is checked, resets on the next question.
  useEffect(() => {
    setTimeLeft(QUESTION_TIME_SECONDS);
  }, [index]);

  useEffect(() => {
    if (!currentQuestion || feedback) return;
    const id = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [currentQuestion, feedback]);

  const sessionTotal = answered.size;
  const sessionCorrect = useMemo(() => {
    let count = 0;
    answered.forEach((a) => {
      if (a.isCorrect) count++;
    });
    return count;
  }, [answered]);
  const sessionPct = sessionTotal === 0 ? 100 : Math.round((sessionCorrect / sessionTotal) * 100);

  const selectOption = useCallback((optionId: number) => {
    if (feedback || submitting) return;
    setSelectedOptionId(optionId);
  }, [feedback, submitting]);

  async function checkAnswer() {
    if (!token || !currentQuestion || selectedOptionId === null || submitting || feedback) return;
    setSubmitting(true);
    try {
      const result = await api.submitAnswer(token, Number(attemptId), currentQuestion.id, selectedOptionId);
      setFeedback(result);
      setAnswered((prev) =>
        new Map(prev).set(currentQuestion.id, {
          questionId: currentQuestion.id,
          selectedOptionId,
          isCorrect: result.isCorrect,
        })
      );
    } // eslint-disable-next-line no-useless-catch
    catch (e) {
      throw e;
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
    } // eslint-disable-next-line no-useless-catch
    catch (e) {
      throw e;
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
    } // eslint-disable-next-line no-useless-catch
    catch (e) {
      throw e;
    } finally {
      setSubmitting(false);
    }
  }

  function confirmExit() {
    Alert.alert('Exit Quiz?', 'Your progress so far is saved — you can resume this attempt later.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Exit', style: 'destructive', onPress: () => router.back() },
    ]);
  }

  if (!questions) {
    return (
      <View style={styles.centerFill}>
        <ActivityIndicator color={COLORS.purple} />
      </View>
    );
  }

  const isLastQuestion = index === questions.length - 1;
  const readyToFinish = index >= questions.length;
  const progressPct = (Math.min(index + 1, totalQuestions) / Math.max(1, totalQuestions)) * 100;

  if (readyToFinish || !currentQuestion) {
    return (
      <View style={styles.centerFill}>
        <Text style={styles.doneTitle}>All questions answered</Text>
        <Pressable onPress={finish} disabled={submitting} style={[styles.primaryButton, { opacity: submitting ? 0.6 : 1 }]}>
          <Text style={styles.primaryButtonText}>Finish</Text>
        </Pressable>
      </View>
    );
  }

  const difficultyLevel = DIFFICULTY_LEVEL[currentQuestion.difficulty];

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.topRow}>
          <Pressable onPress={confirmExit} style={styles.closeBtn} hitSlop={10}>
            <Ionicons name="close" size={17} color={COLORS.gray} />
          </Pressable>
          <View style={styles.progressTrack}>
            <LinearGradient
              colors={[COLORS.purple400, COLORS.purple]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${progressPct}%` }]}
            />
          </View>
          <View style={styles.accuracyWrap}>
            <Stars filled={sessionStarCount(sessionPct)} />
            <Text style={styles.accuracyPct}>{sessionPct}%</Text>
          </View>
          <ProgressRing
            percent={(timeLeft / QUESTION_TIME_SECONDS) * 100}
            size={34}
            strokeWidth={4}
            color={timeLeft > 15 ? COLORS.goldDeep : COLORS.error}
            trackColor={COLORS.errorBg}>
            <Text style={styles.timerText}>{timeLeft}</Text>
          </ProgressRing>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaLeft}>
            <Text style={styles.subjectTag}>{currentQuestion.category.name}</Text>
            {currentQuestion.questionPaper && (
              <Text style={styles.yearTag}>UPSC {currentQuestion.questionPaper.year}</Text>
            )}
          </View>
          <Text style={styles.qCount}>Question {index + 1} of {totalQuestions}</Text>
        </View>
      </SafeAreaView>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        <Stars filled={difficultyLevel} size={12} />
        <Text style={styles.questionText}>{currentQuestion.text}</Text>
        {currentQuestion.questionImage && (
          <Image
            source={{ uri: `${process.env.EXPO_PUBLIC_API_URL}${currentQuestion.questionImage}` }}
            style={styles.questionImage}
            contentFit="contain"
            transition={200}
            priority="high"
          />
        )}

        <View style={styles.options}>
          {currentQuestion.options.map((option) => {
            const isSelected = option.id === selectedOptionId;
            const isCorrectOption = feedback && option.id === feedback.correctOptionId;
            const isWrongSelected = feedback && isSelected && !feedback.isCorrect;

            return (
              <OptionButton
                key={option.id}
                option={option}
                isSelected={isSelected}
                isCorrectOption={!!isCorrectOption}
                isWrongSelected={!!isWrongSelected}
                disabled={!!feedback || submitting}
                onPress={selectOption}
              />
            );
          })}
        </View>
      </ScrollView>

      {!feedback && (
        <View style={styles.bottomArea}>
          {!submitting && (
            <Pressable onPress={skip} style={styles.skipLink}>
              <Text style={styles.skipLinkText}>Skip this question</Text>
            </Pressable>
          )}
          <Pressable
            onPress={checkAnswer}
            disabled={selectedOptionId === null || submitting}
            style={[styles.checkBtn, selectedOptionId !== null && !submitting && styles.checkBtnEnabled]}>
            <Text style={styles.checkBtnText}>Check Answer</Text>
          </Pressable>
        </View>
      )}

      {feedback && (
        <View style={[styles.feedbackPanel, feedback.isCorrect ? styles.feedbackPanelCorrect : styles.feedbackPanelWrong]}>
          <View style={styles.feedbackTop}>
            <View style={[styles.feedbackIcon, { backgroundColor: feedback.isCorrect ? COLORS.green : COLORS.error }]}>
              <Ionicons name={feedback.isCorrect ? 'checkmark' : 'close'} size={16} color={COLORS.white} />
            </View>
            <Text style={[styles.feedbackTitle, { color: feedback.isCorrect ? '#158A50' : '#B93030' }]}>
              {feedback.isCorrect ? 'Correct!' : 'Not Quite'}
            </Text>
            <Text style={styles.feedbackXp}>{feedback.isCorrect ? '+10 XP' : '+0 XP'}</Text>
          </View>
          {feedback.explanation && <Text style={styles.feedbackExplain}>{feedback.explanation}</Text>}
          <Pressable onPress={isLastQuestion ? finish : goNext} disabled={submitting} style={styles.continueBtn}>
            <Text style={styles.continueBtnText}>{isLastQuestion ? 'Finish' : 'Continue'}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.loginBg },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.loginBg, gap: 14, paddingHorizontal: 24 },
  doneTitle: { fontSize: 17, fontWeight: '800', color: COLORS.navy },

  safeArea: { paddingHorizontal: 20, paddingTop: 6 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: { flex: 1, height: 9, borderRadius: 100, backgroundColor: COLORS.grayBorder, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 100 },
  accuracyWrap: { alignItems: 'center', gap: 2 },
  accuracyPct: { fontSize: 9, fontWeight: '800', color: COLORS.grayLight, letterSpacing: 0.2 },
  timerText: { fontSize: 10, fontWeight: '800', color: COLORS.navy },

  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  metaLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  subjectTag: { fontSize: 11, fontWeight: '800', color: COLORS.purple, backgroundColor: COLORS.purpleSoft, paddingVertical: 5, paddingHorizontal: 10, borderRadius: 8 },
  yearTag: { fontSize: 11, fontWeight: '700', color: COLORS.goldDeep, backgroundColor: COLORS.goldSoft, paddingVertical: 5, paddingHorizontal: 10, borderRadius: 8 },
  qCount: { fontSize: 11.5, fontWeight: '700', color: COLORS.grayLight },

  body: { flex: 1 },
  bodyContent: { paddingHorizontal: 22, paddingTop: 22, paddingBottom: 8 },
  questionText: { fontSize: 19, fontWeight: '800', color: COLORS.navy, lineHeight: 27, letterSpacing: -0.2, marginTop: 12 },
  questionImage: { width: '100%', height: 200, borderRadius: 8, marginTop: 12 },

  options: { marginTop: 22, gap: 12 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 13, borderWidth: 2, borderRadius: 16, padding: 14 },
  optionDimmed: { opacity: 0.55 },
  optionLetter: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  optionLetterText: { fontSize: 13, fontWeight: '800' },
  optionText: { flex: 1, fontSize: 14.5, fontWeight: '600', color: COLORS.navy },

  bottomArea: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 18, gap: 8 },
  skipLink: { alignItems: 'center', paddingVertical: 4 },
  skipLinkText: { fontSize: 12.5, fontWeight: '600', color: COLORS.grayLight },
  checkBtn: { backgroundColor: COLORS.grayLight, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  checkBtnEnabled: { backgroundColor: COLORS.purple },
  checkBtnText: { fontSize: 15, fontWeight: '800', color: COLORS.white },

  feedbackPanel: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 20, borderTopWidth: 1, borderTopColor: COLORS.grayBorder },
  feedbackPanelCorrect: { backgroundColor: COLORS.greenSoft },
  feedbackPanelWrong: { backgroundColor: COLORS.errorBg },
  feedbackTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  feedbackIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  feedbackTitle: { fontSize: 15, fontWeight: '800' },
  feedbackXp: { marginLeft: 'auto', fontSize: 12, fontWeight: '800', color: COLORS.goldDeep, backgroundColor: COLORS.goldSoft, paddingVertical: 5, paddingHorizontal: 10, borderRadius: 8 },
  feedbackExplain: { fontSize: 12.5, color: COLORS.gray, fontWeight: '500', lineHeight: 18, marginTop: 10 },
  continueBtn: { marginTop: 14, backgroundColor: COLORS.purple, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  continueBtnText: { fontSize: 15, fontWeight: '800', color: COLORS.white },

  primaryButton: { backgroundColor: COLORS.purple, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 28 },
  primaryButtonText: { fontSize: 15, fontWeight: '800', color: COLORS.white },
});
