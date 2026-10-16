import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { UI } from '@/constants/ui';

import { StudyNotes } from '@/components/paper-test/study-notes';
import { ProgressRing } from '@/components/progress-ring';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api-client';
import type { AttemptAnswerState, QuestionDifficulty, SafeQuestion } from '@/types/api';
import { dialog } from '@/components/ui/dialog';
import { Pressable } from '@/components/ui/pressable';
import { playSound } from '@/lib/sounds';

// ─── Design tokens aligned with quiz_page.html ─────────────────────────
const QZ = {
  bg: UI.bg,
  card: UI.bg,
  ink900: UI.text,
  ink600: UI.grey,
  ink400: UI.greyLight,
  ink300: UI.border,
  line: UI.border,
  purple600: UI.accent,
  purple500: UI.accent,
  purple400: UI.accent,
  purple100: UI.accentSoft,
  purple50: UI.accentSoft,
  gold: UI.accent,
  goldSoft: UI.accentSoft,
  goldDeep: UI.accent,
  green: UI.green,
  greenSoft: UI.greenSoft,
  greenDeep: UI.green,
  red: UI.red,
  redSoft: UI.redSoft,
  redDeep: UI.red,
} as const;

type Feedback = {
  isCorrect: boolean;
  correctOptionId: number | null;
  explanation: string | null;
  revisionPoints?: string | null;
  // The user skipped, but the answer and notes are still shown.
  skipped?: boolean;
};

const QUESTION_TIME_SECONDS = 45;
const DIFFICULTY_LEVEL: Record<QuestionDifficulty, number> = { EASY: 1, MEDIUM: 2, HARD: 3 };

function Stars({ filled, size = 13, color = QZ.gold, emptyColor = QZ.ink300 }: { filled: number; size?: number; color?: string; emptyColor?: string }) {
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

const OptionButton = React.memo(function OptionButton({ option, isSelected, isCorrectOption, isWrongSelected, disabled, onPress }: OptionProps) {
  let borderColor: string = QZ.line;
  let backgroundColor: string = QZ.card;
  let letterBg: string = QZ.bg;
  let letterColor: string = QZ.ink600;

  if (isCorrectOption) {
    borderColor = QZ.green;
    backgroundColor = QZ.greenSoft;
    letterBg = QZ.green;
    letterColor = QZ.card;
  } else if (isWrongSelected) {
    borderColor = QZ.red;
    backgroundColor = QZ.redSoft;
    letterBg = QZ.red;
    letterColor = QZ.card;
  } else if (isSelected) {
    borderColor = QZ.purple500;
    backgroundColor = QZ.purple50;
    letterBg = QZ.purple500;
    letterColor = QZ.card;
  }

  const handlePress = () => onPress(option.id);

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.option,
        { borderColor, backgroundColor },
        disabled && !isSelected && !isCorrectOption && styles.optionDimmed,
        pressed && { transform: [{ scale: 0.99 }] },
      ]}
    >
      <View style={[styles.optionLetter, { backgroundColor: letterBg }]}>
        <Text style={[styles.optionLetterText, { color: letterColor }]}>{option.label}</Text>
      </View>
      <Text style={styles.optionText}>{option.text}</Text>
      {isCorrectOption && <Ionicons name="checkmark" size={18} color={QZ.green} />}
      {isWrongSelected && <Ionicons name="close" size={18} color={QZ.red} />}
    </Pressable>
  );
});

export default function QuizScreen() {
  const { attemptId } = useLocalSearchParams<{ attemptId: string }>();
  const { token } = useAuth();
  const insets = useSafeAreaInsets();

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
  const [timerIndex, setTimerIndex] = useState(index);
  if (timerIndex !== index) {
    setTimerIndex(index);
    setTimeLeft(QUESTION_TIME_SECONDS);
  }

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
      playSound(result.isCorrect ? 'correct' : 'wrong');
      setFeedback(result);
      setAnswered((prev) =>
        new Map(prev).set(currentQuestion.id, {
          questionId: currentQuestion.id,
          selectedOptionId,
          isCorrect: result.isCorrect,
        })
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function skip() {
    if (!token || !currentQuestion || submitting || feedback) return;
    setSubmitting(true);
    try {
      // Skipping still reveals the correct answer, explanation and review points.
      const result = await api.submitAnswer(token, Number(attemptId), currentQuestion.id, null);
      setAnswered((prev) =>
        new Map(prev).set(currentQuestion.id, {
          questionId: currentQuestion.id,
          selectedOptionId: null,
          isCorrect: result.isCorrect,
        })
      );
      setSelectedOptionId(null);
      setFeedback({ ...result, skipped: true });
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
      // done: the results screen celebrates a fresh finish, not a revisit.
      router.replace({ pathname: '/results/[attemptId]', params: { attemptId, done: '1' } });
    } finally {
      setSubmitting(false);
    }
  }

  function confirmExit() {
    dialog.alert('Exit quiz?', 'Your progress so far is saved — you can resume this attempt later.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Exit', onPress: () => router.back() },
    ]);
  }

  if (!questions) {
    return (
      <View style={styles.centerFill}>
        <ActivityIndicator color={QZ.purple600} />
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
        <Pressable onPress={finish} sound="submit" disabled={submitting} style={[styles.primaryButton, { opacity: submitting ? 0.6 : 1 }]}>
          <Text style={styles.primaryButtonText}>Finish</Text>
        </Pressable>
      </View>
    );
  }

  const difficultyLevel = DIFFICULTY_LEVEL[currentQuestion.difficulty];

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* ── Top bar: close · progress · accuracy · timer ── */}
        <View style={styles.topRow}>
          <Pressable onPress={confirmExit} style={styles.closeBtn} hitSlop={10}>
            <Ionicons name="close" size={15} color={QZ.ink600} />
          </Pressable>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPct}%` }, { backgroundColor: QZ.purple400 }]} />
          </View>
          <View style={styles.accuracyWrap}>
            <Stars filled={sessionStarCount(sessionPct)} />
            <Text style={styles.accuracyPct}>{sessionPct}%</Text>
          </View>
          <ProgressRing
            percent={(timeLeft / QUESTION_TIME_SECONDS) * 100}
            size={34}
            strokeWidth={4}
            color={timeLeft > 15 ? QZ.goldDeep : QZ.red}
            trackColor={QZ.redSoft}>
            <Text style={styles.timerText}>{timeLeft}</Text>
          </ProgressRing>
        </View>

        {/* ── Meta row: subject · year · question count ── */}
        <View style={styles.metaRow}>
          <View style={styles.metaLeft}>
            <Text style={styles.subjectTag} numberOfLines={1}>
              {currentQuestion.category.name}
            </Text>
            {currentQuestion.questionPaper && (
              <Text style={styles.yearTag}>UPSC {currentQuestion.questionPaper.year}</Text>
            )}
          </View>
          <Text style={styles.qCount}>Question {index + 1} of {totalQuestions}</Text>
        </View>
      </SafeAreaView>

      {/* ── Question body ── */}
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

        {feedback && (
          <View style={{ marginTop: 18 }}>
            <StudyNotes explanation={feedback.explanation} revisionPoints={feedback.revisionPoints} />
          </View>
        )}
      </ScrollView>

      {/* ── Bottom: Check Answer / Skip ── */}
      {!feedback && (
        <View style={[styles.bottomArea, { paddingBottom: 18 + insets.bottom }]}>
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

      {/* ── Feedback panel ── */}
      {feedback && (
        <View
          style={[
            styles.feedbackPanel,
            feedback.isCorrect ? styles.feedbackPanelCorrect : styles.feedbackPanelWrong,
            { paddingBottom: 20 + insets.bottom },
          ]}>
          <View style={styles.feedbackTop}>
            <View style={[styles.feedbackIcon, { backgroundColor: feedback.isCorrect ? QZ.green : QZ.red }]}>
              <Ionicons name={feedback.isCorrect ? 'checkmark' : 'close'} size={17} color={QZ.card} />
            </View>
            <Text style={[styles.feedbackTitle, { color: feedback.isCorrect ? QZ.greenDeep : QZ.redDeep }]}>
              {feedback.skipped ? 'Skipped — here is the answer' : feedback.isCorrect ? 'Correct' : 'Not quite'}
            </Text>
          </View>
          <Pressable onPress={isLastQuestion ? finish : goNext} sound={isLastQuestion ? 'submit' : undefined} disabled={submitting} style={styles.continueBtn}>
            <Text style={styles.continueBtnText}>{isLastQuestion ? 'Finish' : 'Continue'}</Text>
          </Pressable>
        </View>
      )}

    </View>
  );
}

// ─── Styles matched to quiz_page.html design ───────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: QZ.bg },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: QZ.bg, gap: 14, paddingHorizontal: 24 },
  doneTitle: { fontSize: 17, fontWeight: '700', color: QZ.ink900 },

  safeArea: { paddingHorizontal: 20, paddingTop: 6 },

  // ── Top row ──
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: QZ.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: QZ.line,
  },
  progressTrack: { flex: 1, height: 9, borderRadius: 8, backgroundColor: QZ.line, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 8 },
  accuracyWrap: { alignItems: 'center', gap: 2 },
  accuracyPct: { fontSize: 9, fontWeight: '700', color: QZ.ink400 },
  timerText: { fontSize: 10, fontWeight: '700', color: QZ.ink900 },

  // ── Meta row ──
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  metaLeft: { flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: 8, marginRight: 8 },
  subjectTag: {
    flexShrink: 1,
    fontSize: 11,
    fontWeight: '700',
    color: QZ.purple600,
    backgroundColor: QZ.purple50,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  yearTag: {
    fontSize: 11,
    fontWeight: '700',
    color: QZ.goldDeep,
    backgroundColor: QZ.goldSoft,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  qCount: { flexShrink: 0, fontSize: 11.5, fontWeight: '700', color: QZ.ink400 },

  // ── Question body ──
  body: { flex: 1 },
  bodyContent: { paddingHorizontal: 22, paddingTop: 22, paddingBottom: 8 },
  questionText: { fontSize: 19, fontWeight: '700', color: QZ.ink900, lineHeight: 27, letterSpacing: -0.2, marginTop: 12 },
  questionImage: { width: '100%', height: 200, borderRadius: 8, marginTop: 12 },

  // ── Options ──
  options: { marginTop: 24, gap: 12 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    borderWidth: 2,
    borderRadius: 8,
    padding: 14,
  },
  optionDimmed: { opacity: 0.55 },
  optionLetter: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  optionLetterText: { fontSize: 13, fontWeight: '700' },
  optionText: { flex: 1, fontSize: 14.5, fontWeight: '600', color: QZ.ink900 },

  // ── Bottom area ──
  bottomArea: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 18, gap: 8 },
  skipLink: { alignItems: 'center', paddingVertical: 4 },
  skipLinkText: { fontSize: 12.5, fontWeight: '600', color: QZ.ink400 },
  checkBtn: {
    backgroundColor: QZ.ink300,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  checkBtnEnabled: {
    backgroundColor: QZ.purple600,
  },
  checkBtnText: { fontSize: 15, fontWeight: '700', color: QZ.card },

  // ── Feedback panel ──
  feedbackPanel: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 20, borderTopWidth: 1, borderTopColor: QZ.line },
  feedbackPanelCorrect: { backgroundColor: QZ.greenSoft },
  feedbackPanelWrong: { backgroundColor: QZ.redSoft },
  feedbackTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  feedbackIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  feedbackTitle: { fontSize: 15, fontWeight: '700' },
  feedbackXp: {
    marginLeft: 'auto',
    fontSize: 12,
    fontWeight: '700',
    color: QZ.goldDeep,
    backgroundColor: QZ.goldSoft,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  feedbackExplain: { fontSize: 12.5, color: QZ.ink600, fontWeight: '500', lineHeight: 19, marginTop: 6 },

  // ── Explanation & Revision cards ──
  explanationBox: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  explanationLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: QZ.purple600,
    marginBottom: 4,
  },
  revisionBox: {
    marginTop: 10,
    padding: 12,
    backgroundColor: QZ.goldSoft,
    borderRadius: 8,
  },
  revisionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  revisionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: QZ.goldDeep,
  },
  revisionText: {
    fontSize: 12.5,
    color: QZ.ink600,
    fontWeight: '500',
    lineHeight: 18,
  },

  continueBtn: {
    marginTop: 14,
    backgroundColor: QZ.purple600,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    // Same purple glow as check button
  },
  continueBtnText: { fontSize: 15, fontWeight: '700', color: QZ.card },

  primaryButton: {
    backgroundColor: QZ.purple600,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  primaryButtonText: { fontSize: 15, fontWeight: '700', color: QZ.card },
});
