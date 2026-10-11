import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StudyNotes } from '@/components/paper-test/study-notes';
import { formatDuration, PT, questionLabel } from '@/components/paper-test/theme';
import { useAuth } from '@/context/auth-context';
import { ApiError, api } from '@/lib/api-client';
import type { PaperAnswerState, PaperAttemptDetailResponse, SafeOption } from '@/types/api';

type OptionState = 'idle' | 'selected' | 'correct' | 'wrong' | 'dimmed';
type PaletteState = 'current' | 'answered' | 'marked' | 'markedAnswered' | 'correct' | 'wrong' | 'skipped' | 'unseen';

export default function TestPlayerScreen() {
  const { attemptId } = useLocalSearchParams<{ attemptId: string }>();
  const id = Number(attemptId);
  const { token } = useAuth();

  const [detail, setDetail] = useState<PaperAttemptDetailResponse | null>(null);
  const [answers, setAnswers] = useState<Map<number, PaperAnswerState>>(new Map());
  const [marked, setMarked] = useState<Set<number>>(new Set());
  const [visited, setVisited] = useState<Set<number>>(new Set());
  const [index, setIndex] = useState(0);
  const [busyQuestionId, setBusyQuestionId] = useState<number | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  // Server clock minus device clock, so the countdown matches the server's deadline.
  const [clockOffset, setClockOffset] = useState(0);

  const submitted = useRef(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!token || !id) return;
    api.getPaperAttempt(token, id).then((d) => {
      if (d.completedAt) {
        router.replace(`/test/${id}/results`);
        return;
      }
      setClockOffset(new Date(d.serverNow).getTime() - Date.now());
      const map = new Map(d.answers.map((a) => [a.questionId, a]));
      const resume = d.questions.findIndex((q) => map.get(q.id)?.selectedOptionId == null);
      const start = resume === -1 ? 0 : resume;
      setDetail(d);
      setAnswers(map);
      setVisited(new Set([...map.keys(), d.questions[start]?.id].filter((x): x is number => x !== undefined)));
      setIndex(start);
    });
  }, [token, id]);

  const isExam = detail?.testMode === 'EXAM';
  const deadlineMs = detail?.deadline ? new Date(detail.deadline).getTime() : null;
  const remainingSeconds = deadlineMs ? Math.max(0, (deadlineMs - (now + clockOffset)) / 1000) : null;
  const elapsedSeconds = detail ? Math.max(0, (now + clockOffset - new Date(detail.startedAt).getTime()) / 1000) : 0;

  const submit = useCallback(async () => {
    if (!token || submitted.current) return;
    submitted.current = true;
    setSubmitting(true);
    setConfirmOpen(false);
    setPaletteOpen(false);
    try {
      await api.submitPaperTest(token, id);
      router.replace(`/test/${id}/results`);
    } catch {
      submitted.current = false;
      setSubmitting(false);
      Alert.alert('Could not submit', 'Your answers are saved. Please check your connection and try again.');
    }
  }, [token, id]);

  // One-second tick for the clock. When an exam's time runs out the server
  // stops accepting answers, so whatever is saved gets submitted.
  useEffect(() => {
    if (!detail) return;
    const t = setInterval(() => {
      const tick = Date.now();
      setNow(tick);
      if (deadlineMs !== null && tick + clockOffset >= deadlineMs) submit();
    }, 1000);
    return () => clearInterval(t);
  }, [detail, deadlineMs, clockOffset, submit]);

  const questions = useMemo(() => detail?.questions ?? [], [detail]);
  const current = questions[index];
  const currentAnswer = current ? answers.get(current.id) : undefined;
  const answeredCount = useMemo(() => [...answers.values()].filter((a) => a.selectedOptionId != null).length, [answers]);

  const goTo = useCallback(
    (i: number) => {
      const q = questions[i];
      if (!q) return;
      setIndex(i);
      setVisited((prev) => new Set(prev).add(q.id));
      setPaletteOpen(false);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    },
    [questions]
  );

  async function choose(option: SafeOption) {
    if (!token || !current || submitting) return;
    const questionId = current.id;

    if (isExam) {
      // Saved immediately and optimistically; revert if the save fails.
      const previous = answers.get(questionId);
      setAnswers((prev) => new Map(prev).set(questionId, { questionId, selectedOptionId: option.id }));
      try {
        await api.savePaperAnswer(token, id, questionId, option.id);
      } catch (e) {
        setAnswers((prev) => {
          const next = new Map(prev);
          if (previous) next.set(questionId, previous);
          else next.delete(questionId);
          return next;
        });
        handleSaveError(e);
      }
      return;
    }

    // Practice: the first choice is final and reveals the answer.
    if (currentAnswer?.selectedOptionId != null || busyQuestionId !== null) return;
    setBusyQuestionId(questionId);
    try {
      const res = await api.savePaperAnswer(token, id, questionId, option.id);
      if (res.saved) return;
      setAnswers((prev) =>
        new Map(prev).set(questionId, {
          questionId,
          selectedOptionId: res.selectedOptionId,
          isCorrect: res.isCorrect,
          correctOptionId: res.correctOptionId,
          explanation: res.explanation,
          revisionPoints: res.revisionPoints,
        })
      );
    } catch (e) {
      handleSaveError(e);
    } finally {
      setBusyQuestionId(null);
    }
  }

  async function clearResponse() {
    if (!token || !current || currentAnswer?.selectedOptionId == null) return;
    const questionId = current.id;
    const previous = currentAnswer;
    setAnswers((prev) => {
      const next = new Map(prev);
      next.delete(questionId);
      return next;
    });
    try {
      await api.savePaperAnswer(token, id, questionId, null);
    } catch (e) {
      setAnswers((prev) => new Map(prev).set(questionId, previous));
      handleSaveError(e);
    }
  }

  function handleSaveError(e: unknown) {
    if (e instanceof ApiError && e.body?.error === 'TIME_UP') {
      submit();
      return;
    }
    Alert.alert('Answer not saved', 'Please check your connection and tap the option again.');
  }

  function toggleMark() {
    if (!current) return;
    setMarked((prev) => {
      const next = new Set(prev);
      if (next.has(current.id)) next.delete(current.id);
      else next.add(current.id);
      return next;
    });
  }

  function confirmExit() {
    Alert.alert(
      'Leave the test?',
      isExam
        ? 'Your answers are saved, but the exam timer keeps running while you are away.'
        : 'Your progress is saved — you can resume this test from the paper screen.',
      [
        { text: 'Stay', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: () => router.back() },
      ]
    );
  }

  function paletteState(questionId: number, i: number): PaletteState {
    if (i === index) return 'current';
    const a = answers.get(questionId);
    const answered = a?.selectedOptionId != null;
    if (!isExam) {
      if (answered) return a?.isCorrect ? 'correct' : 'wrong';
      return visited.has(questionId) ? 'skipped' : 'unseen';
    }
    if (marked.has(questionId)) return answered ? 'markedAnswered' : 'marked';
    if (answered) return 'answered';
    return visited.has(questionId) ? 'skipped' : 'unseen';
  }

  if (!detail || !current) {
    return (
      <View style={styles.centerFill}>
        <ActivityIndicator color={PT.purple600} />
      </View>
    );
  }

  const revealed = !isExam && currentAnswer?.selectedOptionId != null;
  const isLast = index === questions.length - 1;
  const lowTime = remainingSeconds !== null && remainingSeconds < 5 * 60;
  const title = `${detail.paper?.year ?? ''} · ${detail.section?.name ?? 'Full paper'}`;

  function optionState(option: SafeOption): OptionState {
    const selected = currentAnswer?.selectedOptionId === option.id;
    if (!revealed) return selected ? 'selected' : 'idle';
    if (option.id === currentAnswer?.correctOptionId) return 'correct';
    if (selected) return 'wrong';
    return 'dimmed';
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.topRow}>
          <Pressable onPress={confirmExit} style={styles.iconBtn} hitSlop={10}>
            <Ionicons name="close" size={16} color={PT.ink600} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.modeTag}>{isExam ? 'Exam mode' : 'Practice mode'}</Text>
          </View>
          <View style={[styles.timerPill, lowTime && styles.timerPillLow]}>
            <Ionicons name={isExam ? 'timer-outline' : 'stopwatch-outline'} size={13} color={lowTime ? PT.red : PT.ink900} />
            <Text style={[styles.timerText, lowTime && { color: PT.red }]}>
              {formatDuration(remainingSeconds ?? elapsedSeconds)}
            </Text>
          </View>
          <Pressable onPress={() => setConfirmOpen(true)} style={styles.submitBtn} disabled={submitting}>
            <Text style={styles.submitBtnText}>Submit</Text>
          </Pressable>
        </View>

        <View style={styles.progressTrack}>
          <LinearGradient
            colors={[PT.purple400, PT.purple600]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: `${(answeredCount / Math.max(1, questions.length)) * 100}%` }]}
          />
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.qBadge}>{questionLabel(current, index)}</Text>
          <Text style={styles.subjectTag} numberOfLines={1}>
            {current.category.name}
          </Text>
          <Pressable onPress={() => setPaletteOpen(true)} style={styles.paletteBtn} hitSlop={6}>
            <Ionicons name="grid-outline" size={14} color={PT.purple600} />
            <Text style={styles.paletteBtnText}>
              {index + 1}/{questions.length}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        {isExam && marked.has(current.id) && (
          <View style={styles.markedNote}>
            <Ionicons name="flag" size={12} color={PT.goldDeep} />
            <Text style={styles.markedNoteText}>Marked for review</Text>
          </View>
        )}

        <Text style={styles.questionText}>{current.text}</Text>
        {current.questionImage && (
          <Image
            source={{ uri: `${process.env.EXPO_PUBLIC_API_URL}${current.questionImage}` }}
            style={styles.questionImage}
            contentFit="contain"
            transition={200}
          />
        )}

        <View style={styles.options}>
          {current.options.map((option) => (
            <OptionRow
              key={option.id}
              option={option}
              state={optionState(option)}
              disabled={submitting || revealed || busyQuestionId !== null}
              onPress={choose}
            />
          ))}
        </View>

        {busyQuestionId === current.id && <ActivityIndicator color={PT.purple600} style={{ marginTop: 16 }} />}

        {revealed && currentAnswer && (
          <View style={{ marginTop: 18, gap: 10 }}>
            <ResultBanner answer={currentAnswer} />
            <StudyNotes explanation={currentAnswer.explanation} revisionPoints={currentAnswer.revisionPoints} />
          </View>
        )}
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        {isExam && (
          <View style={styles.examTools}>
            <Pressable onPress={toggleMark} style={styles.toolBtn}>
              <Ionicons name={marked.has(current.id) ? 'flag' : 'flag-outline'} size={15} color={PT.goldDeep} />
              <Text style={[styles.toolText, { color: PT.goldDeep }]}>{marked.has(current.id) ? 'Unmark' : 'Mark for review'}</Text>
            </Pressable>
            <Pressable onPress={clearResponse} disabled={currentAnswer?.selectedOptionId == null} style={styles.toolBtn}>
              <Ionicons name="refresh" size={15} color={currentAnswer?.selectedOptionId == null ? PT.ink300 : PT.ink600} />
              <Text style={[styles.toolText, currentAnswer?.selectedOptionId == null && { color: PT.ink300 }]}>Clear response</Text>
            </Pressable>
          </View>
        )}
        <View style={styles.navRow}>
          <Pressable onPress={() => goTo(index - 1)} disabled={index === 0} style={[styles.navBtn, index === 0 && { opacity: 0.4 }]}>
            <Ionicons name="chevron-back" size={18} color={PT.ink900} />
            <Text style={styles.navBtnText}>Previous</Text>
          </Pressable>
          <Pressable
            onPress={() => (isLast ? setConfirmOpen(true) : goTo(index + 1))}
            style={[styles.navBtn, styles.navBtnPrimary]}>
            <Text style={[styles.navBtnText, { color: PT.card }]}>{isLast ? 'Finish' : 'Next'}</Text>
            <Ionicons name={isLast ? 'checkmark-done' : 'chevron-forward'} size={18} color={PT.card} />
          </Pressable>
        </View>
      </SafeAreaView>

      <PaletteSheet
        visible={paletteOpen}
        isExam={!!isExam}
        questions={questions}
        stateOf={paletteState}
        onPick={goTo}
        onClose={() => setPaletteOpen(false)}
        onSubmit={() => {
          setPaletteOpen(false);
          setConfirmOpen(true);
        }}
      />

      <SubmitSheet
        visible={confirmOpen}
        total={questions.length}
        answered={answeredCount}
        marked={isExam ? questions.filter((q) => marked.has(q.id)).length : 0}
        remainingSeconds={remainingSeconds}
        submitting={submitting}
        onCancel={() => setConfirmOpen(false)}
        onSubmit={submit}
      />

      {submitting && (
        <View style={styles.overlay}>
          <ActivityIndicator color={PT.card} size="large" />
          <Text style={styles.overlayText}>Submitting your test…</Text>
        </View>
      )}
    </View>
  );
}

const OptionRow = React.memo(function OptionRow({
  option,
  state,
  disabled,
  onPress,
}: {
  option: SafeOption;
  state: OptionState;
  disabled: boolean;
  onPress: (option: SafeOption) => void;
}) {
  const look = OPTION_LOOK[state];
  return (
    <Pressable
      onPress={() => onPress(option)}
      disabled={disabled}
      style={({ pressed }) => [
        styles.option,
        { borderColor: look.border, backgroundColor: look.bg },
        state === 'dimmed' && { opacity: 0.55 },
        pressed && { transform: [{ scale: 0.99 }] },
      ]}>
      <View style={[styles.optionLetter, { backgroundColor: look.letterBg }]}>
        <Text style={[styles.optionLetterText, { color: look.letterColor }]}>{option.label}</Text>
      </View>
      <Text style={styles.optionText}>{option.text}</Text>
      {state === 'correct' && <Ionicons name="checkmark-circle" size={20} color={PT.green} />}
      {state === 'wrong' && <Ionicons name="close-circle" size={20} color={PT.red} />}
    </Pressable>
  );
});

const OPTION_LOOK: Record<OptionState, { border: string; bg: string; letterBg: string; letterColor: string }> = {
  idle: { border: PT.line, bg: PT.card, letterBg: PT.bg, letterColor: PT.ink600 },
  dimmed: { border: PT.line, bg: PT.card, letterBg: PT.bg, letterColor: PT.ink600 },
  selected: { border: PT.purple500, bg: PT.purple50, letterBg: PT.purple500, letterColor: PT.card },
  correct: { border: PT.green, bg: PT.greenSoft, letterBg: PT.green, letterColor: PT.card },
  wrong: { border: PT.red, bg: PT.redSoft, letterBg: PT.red, letterColor: PT.card },
};

function ResultBanner({ answer }: { answer: PaperAnswerState }) {
  // Dropped questions come back correct with no key: full marks for everyone.
  if (answer.isCorrect && answer.correctOptionId == null) {
    return (
      <View style={[styles.banner, { backgroundColor: PT.tealSoft }]}>
        <Ionicons name="information-circle" size={18} color={PT.teal} />
        <Text style={[styles.bannerText, { color: PT.teal }]}>Dropped by UPSC — full marks awarded to everyone</Text>
      </View>
    );
  }
  const good = !!answer.isCorrect;
  return (
    <View style={[styles.banner, { backgroundColor: good ? PT.greenSoft : PT.redSoft }]}>
      <Ionicons name={good ? 'checkmark-circle' : 'close-circle'} size={18} color={good ? PT.greenDeep : PT.redDeep} />
      <Text style={[styles.bannerText, { color: good ? PT.greenDeep : PT.redDeep }]}>
        {good ? 'Correct  ·  +2 marks' : 'Incorrect  ·  −0.67 marks'}
      </Text>
    </View>
  );
}

const PALETTE_LOOK: Record<PaletteState, { bg: string; border: string; color: string }> = {
  current: { bg: PT.card, border: PT.purple600, color: PT.purple600 },
  answered: { bg: PT.purple600, border: PT.purple600, color: PT.card },
  marked: { bg: PT.goldSoft, border: PT.gold, color: PT.goldDeep },
  markedAnswered: { bg: PT.gold, border: PT.gold, color: PT.card },
  correct: { bg: PT.green, border: PT.green, color: PT.card },
  wrong: { bg: PT.red, border: PT.red, color: PT.card },
  skipped: { bg: PT.card, border: PT.ink300, color: PT.ink600 },
  unseen: { bg: PT.bg, border: PT.line, color: PT.ink400 },
};

function PaletteSheet({
  visible,
  isExam,
  questions,
  stateOf,
  onPick,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  isExam: boolean;
  questions: PaperAttemptDetailResponse['questions'];
  stateOf: (questionId: number, index: number) => PaletteState;
  onPick: (index: number) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const legend: [PaletteState, string][] = isExam
    ? [
        ['answered', 'Answered'],
        ['marked', 'Marked'],
        ['markedAnswered', 'Answered & marked'],
        ['skipped', 'Not answered'],
        ['unseen', 'Not visited'],
      ]
    : [
        ['correct', 'Correct'],
        ['wrong', 'Wrong'],
        ['skipped', 'Skipped'],
        ['unseen', 'Not visited'],
      ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <View style={styles.sheetHead}>
          <Text style={styles.sheetTitle}>Question palette</Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={20} color={PT.ink600} />
          </Pressable>
        </View>
        <View style={styles.legend}>
          {legend.map(([state, label]) => (
            <View key={state} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: PALETTE_LOOK[state].bg, borderColor: PALETTE_LOOK[state].border }]} />
              <Text style={styles.legendText}>{label}</Text>
            </View>
          ))}
        </View>
        <ScrollView style={{ maxHeight: 360 }} contentContainerStyle={styles.grid}>
          {questions.map((q, i) => {
            const look = PALETTE_LOOK[stateOf(q.id, i)];
            return (
              <Pressable
                key={q.id}
                onPress={() => onPick(i)}
                style={[styles.cell, { backgroundColor: look.bg, borderColor: look.border }]}>
                <Text style={[styles.cellText, { color: look.color }]}>{q.questionNo ?? i + 1}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <SafeAreaView edges={['bottom']}>
          <Pressable onPress={onSubmit} style={styles.sheetPrimary}>
            <Text style={styles.sheetPrimaryText}>Submit test</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function SubmitSheet({
  visible,
  total,
  answered,
  marked,
  remainingSeconds,
  submitting,
  onCancel,
  onSubmit,
}: {
  visible: boolean;
  total: number;
  answered: number;
  marked: number;
  remainingSeconds: number | null;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.dialogBackdrop}>
        <View style={styles.dialog}>
          <View style={styles.dialogIcon}>
            <Ionicons name="paper-plane" size={22} color={PT.purple600} />
          </View>
          <Text style={styles.dialogTitle}>Submit this test?</Text>
          <Text style={styles.dialogSub}>
            {remainingSeconds !== null ? `${formatDuration(remainingSeconds)} left. ` : ''}You can&apos;t change answers after submitting.
          </Text>
          <View style={styles.dialogStats}>
            <DialogStat value={answered} label="Answered" color={PT.purple600} />
            <DialogStat value={total - answered} label="Unanswered" color={PT.ink600} />
            {marked > 0 && <DialogStat value={marked} label="Marked" color={PT.goldDeep} />}
          </View>
          <Pressable onPress={onSubmit} disabled={submitting} style={styles.sheetPrimary}>
            <Text style={styles.sheetPrimaryText}>Submit test</Text>
          </Pressable>
          <Pressable onPress={onCancel} style={styles.dialogSecondary}>
            <Text style={styles.dialogSecondaryText}>Keep going</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function DialogStat({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <View style={styles.dialogStat}>
      <Text style={[styles.dialogStatValue, { color }]}>{value}</Text>
      <Text style={styles.dialogStatLabel}>{label}</Text>
    </View>
  );
}

const shadow = Platform.select({
  ios: { shadowColor: '#1B1830', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
  android: { elevation: 3 },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: PT.bg },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: PT.bg },

  header: { paddingHorizontal: 18, paddingTop: 6, paddingBottom: 10, backgroundColor: PT.bg },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: { width: 34, height: 34, borderRadius: 2, backgroundColor: PT.card, alignItems: 'center', justifyContent: 'center', ...shadow },
  title: { fontSize: 14, fontWeight: '800', color: PT.ink900 },
  modeTag: { fontSize: 11, fontWeight: '700', color: PT.ink400, marginTop: 1 },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: PT.card,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 2,
    ...shadow,
  },
  timerPillLow: { backgroundColor: PT.redSoft },
  timerText: { fontSize: 13, fontWeight: '800', color: PT.ink900, fontVariant: ['tabular-nums'] },
  submitBtn: { backgroundColor: PT.purple600, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 2 },
  submitBtnText: { fontSize: 12.5, fontWeight: '800', color: PT.card },

  progressTrack: { height: 6, borderRadius: 2, backgroundColor: PT.line, overflow: 'hidden', marginTop: 12 },
  progressFill: { height: '100%', borderRadius: 2 },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  qBadge: {
    fontSize: 12,
    fontWeight: '800',
    color: PT.card,
    backgroundColor: PT.ink900,
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 2,
    overflow: 'hidden',
  },
  subjectTag: {
    flexShrink: 1,
    fontSize: 11.5,
    fontWeight: '800',
    color: PT.purple600,
    backgroundColor: PT.purple50,
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 2,
    overflow: 'hidden',
  },
  paletteBtn: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: PT.purple50,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 2,
  },
  paletteBtnText: { fontSize: 12, fontWeight: '800', color: PT.purple600 },

  bodyContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 24 },
  markedNote: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 },
  markedNoteText: { fontSize: 11.5, fontWeight: '800', color: PT.goldDeep },
  questionText: { fontSize: 16.5, fontWeight: '700', color: PT.ink900, lineHeight: 25 },
  questionImage: { width: '100%', height: 200, borderRadius: 2, marginTop: 12 },

  options: { marginTop: 20, gap: 10 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 2, borderRadius: 2, padding: 13 },
  optionLetter: { width: 30, height: 30, borderRadius: 2, alignItems: 'center', justifyContent: 'center' },
  optionLetterText: { fontSize: 13, fontWeight: '800' },
  optionText: { flex: 1, fontSize: 14, fontWeight: '600', color: PT.ink900, lineHeight: 20 },

  banner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 2 },
  bannerText: { flex: 1, fontSize: 13.5, fontWeight: '800' },

  footer: { backgroundColor: PT.card, borderTopWidth: 1, borderTopColor: PT.line, paddingHorizontal: 16, paddingTop: 10 },
  examTools: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  toolBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 4 },
  toolText: { fontSize: 12.5, fontWeight: '700', color: PT.ink600 },
  navRow: { flexDirection: 'row', gap: 10, paddingBottom: 10 },
  navBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 14,
    borderRadius: 2,
    backgroundColor: PT.bg,
  },
  navBtnPrimary: { backgroundColor: PT.purple600 },
  navBtnText: { fontSize: 14.5, fontWeight: '800', color: PT.ink900 },

  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(27,24,48,0.4)' },
  sheet: { backgroundColor: PT.card, borderTopLeftRadius: 2, borderTopRightRadius: 2, paddingHorizontal: 18, paddingTop: 8 },
  sheetHandle: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, backgroundColor: PT.line, marginBottom: 10 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetTitle: { fontSize: 16, fontWeight: '800', color: PT.ink900 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12, marginBottom: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 12, height: 12, borderRadius: 2, borderWidth: 1.5 },
  legendText: { fontSize: 11.5, fontWeight: '600', color: PT.ink600 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 12 },
  cell: { width: 46, height: 40, borderRadius: 2, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  cellText: { fontSize: 13, fontWeight: '800' },
  sheetPrimary: { backgroundColor: PT.purple600, borderRadius: 2, paddingVertical: 15, alignItems: 'center', marginTop: 6, marginBottom: 10 },
  sheetPrimaryText: { fontSize: 15, fontWeight: '800', color: PT.card },

  dialogBackdrop: { flex: 1, backgroundColor: 'rgba(27,24,48,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  dialog: { width: '100%', maxWidth: 380, backgroundColor: PT.card, borderRadius: 2, padding: 22, alignItems: 'stretch' },
  dialogIcon: {
    alignSelf: 'center',
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: PT.purple50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogTitle: { fontSize: 18, fontWeight: '800', color: PT.ink900, textAlign: 'center', marginTop: 12 },
  dialogSub: { fontSize: 13, fontWeight: '500', color: PT.ink600, textAlign: 'center', marginTop: 6, lineHeight: 19 },
  dialogStats: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginVertical: 18 },
  dialogStat: { flex: 1, backgroundColor: PT.bg, borderRadius: 2, paddingVertical: 12, alignItems: 'center' },
  dialogStatValue: { fontSize: 20, fontWeight: '800' },
  dialogStatLabel: { fontSize: 11, fontWeight: '700', color: PT.ink400, marginTop: 2 },
  dialogSecondary: { alignItems: 'center', paddingVertical: 8 },
  dialogSecondaryText: { fontSize: 13.5, fontWeight: '700', color: PT.ink600 },

  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(27,24,48,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  overlayText: { fontSize: 14, fontWeight: '700', color: PT.card },
});
