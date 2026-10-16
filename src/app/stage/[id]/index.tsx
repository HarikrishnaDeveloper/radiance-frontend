import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { StudyNotes } from '@/components/paper-test/study-notes';
import { ProgressRing } from '@/components/progress-ring';
import { StarRating } from '@/components/star-rating';
import { COLORS } from '@/constants/colors';
import { useAuth } from '@/context/auth-context';
import { ApiError, api } from '@/lib/api-client';
import type { QuestionDifficulty, StageDetailResponse, StageSubmitResponse, StreakResponse, SubmitAnswerResponse } from '@/types/api';
import { dialog } from '@/components/ui/dialog';
import { Pressable } from '@/components/ui/pressable';
import { playSound } from '@/lib/sounds';

const STREAK_BONUS_THRESHOLD = 2;
const QUESTION_TIME_SECONDS = 45;
const DIFFICULTY_LEVEL: Record<QuestionDifficulty, number> = { EASY: 1, MEDIUM: 2, HARD: 3 };

// `skipped`: the user skipped, but the answer and notes are still shown.
type Feedback = SubmitAnswerResponse & { skipped?: boolean };

function formatElapsed(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

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

type AnswerRecord = { selectedOptionId: number | null; isCorrect: boolean };

interface OptionProps {
  option: { id: number; label: string; text: string };
  isSelected: boolean;
  isCorrectOption: boolean | null;
  isWrongSelected: boolean | null;
  disabled: boolean;
  onPress: (id: number) => void;
}

const OptionButton = React.memo(function OptionButton({ option, isSelected, isCorrectOption, isWrongSelected, disabled, onPress }: OptionProps) {
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

export default function StageScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const insets = useSafeAreaInsets();

  const [stage, setStage] = useState<StageDetailResponse | null>(null);
  const [answers, setAnswers] = useState<Map<number, AnswerRecord>>(new Map());
  const [index, setIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<StageSubmitResponse | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [streak, setStreak] = useState<StreakResponse | null>(null);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_SECONDS);
  const [startTime] = useState(() => Date.now());

  useEffect(() => {
    if (!token || !id) return;
    api.stageDetail(token, Number(id)).then(setStage).catch((e) => {
      if (e instanceof ApiError && e.isSubscriptionRequired) {
        router.replace('/paywall');
      } else {
        dialog.error('Could not load stage', 'Please try again.', [{ text: 'OK', onPress: () => router.back() }]);
      }
    });
  }, [token, id]);

  useEffect(() => {
    if (!token || !result) return;
    // Only feeds the optional streak card, so a failure just hides it.
    api.streak(token).then(setStreak).catch(() => undefined);
  }, [token, result]);

  const currentQuestion = useMemo(
    () => (stage && index < stage.questions.length ? stage.questions[index] : null),
    [stage, index]
  );

  // Cosmetic per-question countdown — pauses once an answer is checked, resets on the next question.
  const [timerIndex, setTimerIndex] = useState(index);
  if (timerIndex !== index) {
    setTimerIndex(index);
    setTimeLeft(QUESTION_TIME_SECONDS);
  }

  useEffect(() => {
    if (!currentQuestion || feedback) return;
    const timer = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(timer);
  }, [currentQuestion, feedback]);

  const sessionTotal = answers.size;
  const sessionCorrect = useMemo(() => {
    let count = 0;
    answers.forEach((a) => {
      if (a.isCorrect) count++;
    });
    return count;
  }, [answers]);
  const sessionPct = sessionTotal === 0 ? 100 : Math.round((sessionCorrect / sessionTotal) * 100);

  const pickOption = useCallback((optionId: number) => {
    if (feedback || submitting) return;
    setSelectedOptionId(optionId);
  }, [feedback, submitting]);

  async function checkAnswer() {
    if (!token || !stage || !currentQuestion || selectedOptionId === null || submitting || feedback) return;
    setSubmitting(true);
    try {
      const checked = await api.checkStageAnswer(token, stage.id, currentQuestion.id, selectedOptionId);
      playSound(checked.isCorrect ? 'correct' : 'wrong');
      setFeedback(checked);
      setAnswers((prev) => new Map(prev).set(currentQuestion.id, { selectedOptionId, isCorrect: checked.isCorrect }));
    } finally {
      setSubmitting(false);
    }
  }

  async function finishStage(finalAnswers: Map<number, AnswerRecord>) {
    if (!token || !stage) return;
    setSubmitting(true);
    playSound('submit');
    try {
      const payload = stage.questions.map((q) => ({
        questionId: q.id,
        selectedOptionId: finalAnswers.get(q.id)?.selectedOptionId ?? null,
      }));
      const submitResult = await api.submitStage(token, stage.id, payload);
      setElapsedSeconds(Math.round((Date.now() - startTime) / 1000));
      playSound('success');
      setResult(submitResult);
    } finally {
      setSubmitting(false);
    }
  }

  async function skip() {
    if (!token || !stage || !currentQuestion || submitting || feedback) return;
    setSubmitting(true);
    try {
      // Skipping still reveals the correct answer, explanation and review points.
      const result = await api.checkStageAnswer(token, stage.id, currentQuestion.id, null);
      setAnswers((prev) => new Map(prev).set(currentQuestion.id, { selectedOptionId: null, isCorrect: result.isCorrect }));
      setSelectedOptionId(null);
      setFeedback({ ...result, skipped: true });
    } finally {
      setSubmitting(false);
    }
  }

  function goNext() {
    if (!stage || submitting) return;
    const isLast = index === stage.questions.length - 1;
    setSelectedOptionId(null);
    setFeedback(null);
    if (isLast) {
      finishStage(answers);
    } else {
      setIndex((i) => i + 1);
    }
  }

  function confirmExit() {
    dialog.alert('Exit stage?', 'Your progress so far is saved — you can resume this stage later.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Exit', onPress: () => router.back() },
    ]);
  }

  if (!stage) {
    return (
      <View style={styles.centerFill}>
        <ActivityIndicator color={COLORS.purple} />
      </View>
    );
  }

  if (result) {
    const showStreakBonus = !!streak && streak.streak >= STREAK_BONUS_THRESHOLD;
    const wrongAnswers = result.completedQuestions - result.correctAnswers;

    return (
      <View style={completeStyles.screen}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={completeStyles.celebrate}>
            <SafeAreaView edges={['top']}>
              <View style={completeStyles.trophyWrap}>
                <View style={completeStyles.trophyGlow}>
                  <Ionicons name="checkmark" size={30} color={COLORS.purple} />
                </View>
                <Text style={completeStyles.eyebrow}>
                  Stage {stage.stageNumber} · {stage.category.name}
                </Text>
                <Text style={completeStyles.celebrateTitle}>Stage complete</Text>
              </View>
            </SafeAreaView>
          </View>

          <View style={completeStyles.body}>
            <View style={completeStyles.scoreCard}>
              <View style={completeStyles.scoreStarsBlock}>
                <StarRating count={result.starsEarned} size={30} />
                <Text style={completeStyles.scoreFrac}>{result.correctAnswers}/{result.completedQuestions} Correct</Text>
                <Text style={completeStyles.scorePctLabel}>{result.accuracy}% Accuracy</Text>
              </View>
              <View style={completeStyles.scoreDivider} />
              <View style={completeStyles.scoreSide}>
                <View style={completeStyles.scoreRow}>
                  <View style={[completeStyles.scoreDot, { backgroundColor: COLORS.green }]} />
                  <Text style={completeStyles.scoreVal}>{result.correctAnswers} Correct</Text>
                </View>
                <View style={completeStyles.scoreRow}>
                  <View style={[completeStyles.scoreDot, { backgroundColor: COLORS.error }]} />
                  <Text style={completeStyles.scoreVal}>{wrongAnswers} Wrong</Text>
                </View>
              </View>
            </View>

            <View style={completeStyles.statGrid}>
              <View style={completeStyles.statCard}>
                <View style={[completeStyles.statIcon, { backgroundColor: COLORS.blueSoft }]}>
                  <Ionicons name="time-outline" size={16} color={COLORS.purple} />
                </View>
                <Text style={completeStyles.statVal}>{formatElapsed(elapsedSeconds)}</Text>
                <Text style={completeStyles.statLabel}>Time Taken</Text>
              </View>
              <View style={completeStyles.statCard}>
                <View style={[completeStyles.statIcon, { backgroundColor: COLORS.goldSoft }]}>
                  <Ionicons name="star-outline" size={16} color={COLORS.purple} />
                </View>
                <Text style={completeStyles.statVal}>{result.starsEarned}/3</Text>
                <Text style={completeStyles.statLabel}>Stars</Text>
              </View>
            </View>

            {showStreakBonus && (
              <View style={completeStyles.bonusCard}>
                <View style={completeStyles.bonusIcon}>
                  <Ionicons name="flame" size={19} color={COLORS.purple} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={completeStyles.bonusTitle}>{streak!.streak} Day Streak</Text>
                  <Text style={completeStyles.bonusSub}>Practise again tomorrow to keep it going</Text>
                </View>
              </View>
            )}

            {result.nextStageUnlocked && result.nextStageNumber !== null && (
              <View style={completeStyles.unlockCard}>
                <View style={completeStyles.unlockBadge}>
                  <Ionicons name="star" size={20} color={COLORS.white} />
                </View>
                <View>
                  <Text style={completeStyles.unlockTitle}>Stage {result.nextStageNumber} unlocked</Text>
                  <Text style={completeStyles.unlockSub}>Keep going in {stage.category.name}</Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        <View style={[completeStyles.actions, { paddingBottom: 20 + insets.bottom }]}>
          {result.nextStageUnlocked && result.nextStageId ? (
            <Pressable onPress={() => router.replace(`/stage/${result.nextStageId}`)} sound="open" style={completeStyles.btnPrimary}>
              <Text style={completeStyles.btnPrimaryText}>Continue to Stage {result.nextStageNumber}</Text>
              <Ionicons name="arrow-forward" size={15} color={COLORS.white} />
            </Pressable>
          ) : (
            <Pressable onPress={() => router.replace(`/category/${stage.category.id}`)} style={completeStyles.btnPrimary}>
              <Text style={completeStyles.btnPrimaryText}>Back to Category</Text>
            </Pressable>
          )}
          <Pressable
            onPress={() => router.push({ pathname: '/stage/[id]/results', params: { id: stage.id } })}
            style={completeStyles.btnSecondary}>
            <Text style={completeStyles.btnSecondaryText}>Review Answers</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (!currentQuestion) {
    return (
      <View style={styles.centerFill}>
        <ActivityIndicator color={COLORS.purple} />
      </View>
    );
  }

  const isLastQuestion = index === stage.questions.length - 1;
  const progressPct = ((index + 1) / Math.max(1, stage.questions.length)) * 100;
  const difficultyLevel = DIFFICULTY_LEVEL[currentQuestion.difficulty];

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.topRow}>
          <Pressable onPress={confirmExit} style={styles.closeBtn} hitSlop={10}>
            <Ionicons name="close" size={17} color={COLORS.gray} />
          </Pressable>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPct}%` }, { backgroundColor: COLORS.purple400 }]} />
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
            <Text style={styles.subjectTag} numberOfLines={1}>
              {currentQuestion.category.name}
            </Text>
            {currentQuestion.questionPaper && (
              <Text style={styles.yearTag}>UPSC {currentQuestion.questionPaper.year}</Text>
            )}
            <Text style={styles.stageTag}>Stage {stage.stageNumber}</Text>
          </View>
          <Text style={styles.qCount}>Question {index + 1} of {stage.questions.length}</Text>
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
                onPress={pickOption}
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

      {feedback && (
        <View
          style={[
            styles.feedbackPanel,
            feedback.isCorrect ? styles.feedbackPanelCorrect : styles.feedbackPanelWrong,
            { paddingBottom: 20 + insets.bottom },
          ]}>
          <View style={styles.feedbackTop}>
            <View style={[styles.feedbackIcon, { backgroundColor: feedback.isCorrect ? COLORS.green : COLORS.error }]}>
              <Ionicons name={feedback.isCorrect ? 'checkmark' : 'close'} size={16} color={COLORS.white} />
            </View>
            <Text style={[styles.feedbackTitle, { color: feedback.isCorrect ? COLORS.green : COLORS.error }]}>
              {feedback.skipped ? 'Skipped — here is the answer' : feedback.isCorrect ? 'Correct' : 'Not quite'}
            </Text>
          </View>
          <Pressable onPress={goNext} disabled={submitting} style={styles.continueBtn}>
            <Text style={styles.continueBtnText}>{isLastQuestion ? 'Finish' : 'Continue'}</Text>
          </Pressable>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.loginBg },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.loginBg },

  safeArea: { paddingHorizontal: 20, paddingTop: 6 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: { flex: 1, height: 9, borderRadius: 8, backgroundColor: COLORS.grayBorder, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 8 },
  accuracyWrap: { alignItems: 'center', gap: 2 },
  accuracyPct: { fontSize: 9, fontWeight: '700', color: COLORS.grayLight },
  timerText: { fontSize: 10, fontWeight: '700', color: COLORS.navy },

  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  metaLeft: { flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: 8, marginRight: 8 },
  subjectTag: { flexShrink: 1, fontSize: 11, fontWeight: '700', color: COLORS.purple, backgroundColor: COLORS.purpleSoft, paddingVertical: 5, paddingHorizontal: 10, borderRadius: 8 },
  yearTag: { fontSize: 11, fontWeight: '700', color: COLORS.goldDeep, backgroundColor: COLORS.goldSoft, paddingVertical: 5, paddingHorizontal: 10, borderRadius: 8 },
  stageTag: { fontSize: 11.5, fontWeight: '600', color: COLORS.grayLight },
  qCount: { flexShrink: 0, fontSize: 11.5, fontWeight: '700', color: COLORS.grayLight },

  body: { flex: 1 },
  bodyContent: { paddingHorizontal: 22, paddingTop: 22, paddingBottom: 8 },
  questionText: { fontSize: 19, fontWeight: '700', color: COLORS.navy, lineHeight: 27, letterSpacing: -0.2, marginTop: 12 },
  questionImage: { width: '100%', height: 200, borderRadius: 8, marginTop: 12 },

  options: { marginTop: 22, gap: 12 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 13, borderWidth: 2, borderRadius: 8, padding: 14 },
  optionDimmed: { opacity: 0.55 },
  optionLetter: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  optionLetterText: { fontSize: 13, fontWeight: '700' },
  optionText: { flex: 1, fontSize: 14.5, fontWeight: '600', color: COLORS.navy },

  bottomArea: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 18, gap: 8 },
  skipLink: { alignItems: 'center', paddingVertical: 4 },
  skipLinkText: { fontSize: 12.5, fontWeight: '600', color: COLORS.grayLight },
  checkBtn: { backgroundColor: COLORS.grayLight, borderRadius: 8, paddingVertical: 16, alignItems: 'center' },
  checkBtnEnabled: { backgroundColor: COLORS.purple },
  checkBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.white },

  feedbackPanel: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 20, borderTopWidth: 1, borderTopColor: COLORS.grayBorder },
  feedbackPanelCorrect: { backgroundColor: COLORS.greenSoft },
  feedbackPanelWrong: { backgroundColor: COLORS.errorBg },
  feedbackTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  feedbackIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  feedbackTitle: { fontSize: 15, fontWeight: '700' },
  feedbackXp: { marginLeft: 'auto', fontSize: 12, fontWeight: '700', color: COLORS.goldDeep, backgroundColor: COLORS.goldSoft, paddingVertical: 5, paddingHorizontal: 10, borderRadius: 8 },
  feedbackExplain: { fontSize: 12.5, color: COLORS.gray, fontWeight: '500', lineHeight: 18, marginTop: 6 },

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
    color: COLORS.purple,
    marginBottom: 4,
  },
  revisionBox: {
    marginTop: 10,
    padding: 12,
    backgroundColor: COLORS.goldSoft,
    borderRadius: 8,
  },
  revisionTitleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 5,
    marginBottom: 4,
  },
  revisionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.goldDeep,
  },
  revisionText: {
    fontSize: 12.5,
    color: COLORS.gray,
    fontWeight: '500',
    lineHeight: 18,
  },

  continueBtn: { marginTop: 14, backgroundColor: COLORS.purple, borderRadius: 8, paddingVertical: 16, alignItems: 'center' },
  continueBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.white },
});

const completeStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.loginBg },

  celebrate: { paddingHorizontal: 22, paddingBottom: 20, paddingTop: 6 },
  trophyWrap: { alignItems: 'center', marginTop: 14 },
  trophyGlow: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.purpleSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '400',
    color: COLORS.gray,
    marginTop: 10,
  },
  celebrateTitle: { fontSize: 24, fontWeight: '700', color: COLORS.navy, marginTop: 4, letterSpacing: -0.3 },

  body: { paddingHorizontal: 22 },

  scoreCard: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
  },
  scoreStarsBlock: { alignItems: 'center' },
  scoreFrac: { fontSize: 14.5, fontWeight: '700', color: COLORS.navy, marginTop: 10 },
  scorePctLabel: { fontSize: 11, color: COLORS.grayLight, fontWeight: '700', marginTop: 2 },
  scoreDivider: { width: 1, alignSelf: 'stretch', backgroundColor: COLORS.grayBorder },
  scoreSide: { flex: 1, gap: 12 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  scoreDot: { width: 8, height: 8, borderRadius: 4 },
  scoreVal: { fontSize: 14, fontWeight: '700', color: COLORS.navy },

  statGrid: { flexDirection: 'row', gap: 12, marginTop: 14 },
  statCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: 8, padding: 15, borderWidth: 1, borderColor: COLORS.grayBorder },
  statIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statVal: { fontSize: 17, fontWeight: '700', color: COLORS.navy, letterSpacing: -0.2 },
  statLabel: { fontSize: 11, color: COLORS.gray, marginTop: 2, fontWeight: '500' },

  bonusCard: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
    borderRadius: 8,
    padding: 15,
  },
  bonusIcon: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: COLORS.purpleSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bonusTitle: { fontSize: 13.5, fontWeight: '700', color: COLORS.navy },
  bonusSub: { fontSize: 11.5, color: COLORS.gray, marginTop: 1, fontWeight: '500' },
  bonusXp: { fontSize: 13, fontWeight: '700', color: COLORS.goldDeep },

  unlockCard: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
  },
  unlockBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlockTitle: { fontSize: 13.5, fontWeight: '700', color: COLORS.navy },
  unlockSub: { fontSize: 11.5, color: COLORS.gray, marginTop: 1, fontWeight: '500' },

  actions: { paddingHorizontal: 22, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.grayBorder },
  btnPrimary: {
    backgroundColor: COLORS.purple700,
    borderRadius: 8,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnPrimaryText: { fontSize: 15, fontWeight: '700', color: COLORS.white },
  btnSecondary: {
    marginTop: 10,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
  },
  btnSecondaryText: { fontSize: 14, fontWeight: '700', color: COLORS.navy },
});
