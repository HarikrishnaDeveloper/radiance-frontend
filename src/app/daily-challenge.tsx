import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ReviewCard } from '@/components/paper-test/review-card';
import { StudyNotes } from '@/components/paper-test/study-notes';
import { PT } from '@/components/paper-test/theme';
import { StarRating } from '@/components/star-rating';
import { useAuth } from '@/context/auth-context';
import { ApiError, api } from '@/lib/api-client';
import type { DailyAnswerFeedback, DailyChallengeResponse, SafeOption } from '@/types/api';
import { dialog } from '@/components/ui/dialog';
import { Pressable } from '@/components/ui/pressable';
import { playSound } from '@/lib/sounds';

type OptionState = 'idle' | 'selected' | 'correct' | 'wrong' | 'dimmed';

// Today's 10-question challenge. Every answer — right, wrong or skipped —
// immediately shows the correct option, the explanation and UPSC review
// points; once finished, the whole challenge can be reviewed until tomorrow.
export default function DailyChallengeScreen() {
  const { token } = useAuth();

  const [challenge, setChallenge] = useState<DailyChallengeResponse | null>(null);
  const [feedback, setFeedback] = useState<Map<number, DailyAnswerFeedback & { skipped?: boolean }>>(new Map());
  const [index, setIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    if (!token) return;
    api.dailyChallenge(token, setChallenge).then(setChallenge).catch(() => {
      dialog.error('Could not load the challenge', 'Please check your connection and try again.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    });
  }, [token]);

  useEffect(load, [load]);

  if (!challenge) {
    return (
      <View style={styles.centerFill}>
        <ActivityIndicator color={PT.purple600} />
      </View>
    );
  }

  if (challenge.progress?.completedAt) {
    return <ChallengeReview challenge={challenge} />;
  }

  const question = challenge.questions[index];
  if (!question) return null;
  const current = feedback.get(question.id);
  const isLast = index === challenge.questions.length - 1;

  async function check(optionId: number | null) {
    if (!token || checking || current) return;
    setChecking(true);
    try {
      const res = await api.checkDailyAnswer(token, question.id, optionId);
      if (optionId !== null) playSound(res.isCorrect ? 'correct' : 'wrong');
      setFeedback((prev) => new Map(prev).set(question.id, { ...res, skipped: optionId === null }));
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) load();
      else dialog.error('Answer not checked', e instanceof ApiError ? e.message : 'Please try again.');
    } finally {
      setChecking(false);
    }
  }

  async function next() {
    if (!isLast) {
      setIndex((i) => i + 1);
      setSelectedOptionId(null);
      return;
    }
    if (!token || submitting || !challenge) return;
    setSubmitting(true);
    try {
      await api.submitDailyChallenge(
        token,
        challenge.questions.map((q) => ({ questionId: q.id, selectedOptionId: feedback.get(q.id)?.selectedOptionId ?? null }))
      );
      // Reload: the completed challenge comes back with its full review.
      const fresh = await api.dailyChallenge(token);
      playSound('success');
      setChallenge(fresh);
    } catch (e) {
      dialog.error('Could not submit', e instanceof ApiError ? e.message : 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function optionState(option: SafeOption): OptionState {
    if (!current) return option.id === selectedOptionId ? 'selected' : 'idle';
    if (option.id === current.correctOptionId) return 'correct';
    if (option.id === current.selectedOptionId) return 'wrong';
    return 'dimmed';
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.topRow}>
          <Pressable onPress={() => router.back()} style={styles.iconBtn} hitSlop={10}>
            <Ionicons name="close" size={16} color={PT.ink600} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Daily Challenge</Text>
            <Text style={styles.subtitle}>
              Question {index + 1} of {challenge.questions.length}
            </Text>
          </View>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${((index + (current ? 1 : 0)) / challenge.questions.length) * 100}%` }]} />
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.subjectTag}>{question.category.name}</Text>
          {question.questionPaper && <Text style={styles.yearTag}>UPSC {question.questionPaper.year}</Text>}
        </View>
      </SafeAreaView>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.questionText}>{question.text}</Text>
        {question.questionImage && (
          <Image
            source={{ uri: `${process.env.EXPO_PUBLIC_API_URL}${question.questionImage}` }}
            style={styles.questionImage}
            contentFit="contain"
            transition={200}
          />
        )}

        <View style={styles.options}>
          {question.options.map((option) => {
            const state = optionState(option);
            const look = OPTION_LOOK[state];
            return (
              <Pressable
                key={option.id}
                onPress={() => setSelectedOptionId(option.id)}
                disabled={!!current || checking}
                style={[styles.option, { borderColor: look.border, backgroundColor: look.bg }, state === 'dimmed' && { opacity: 0.55 }]}>
                <View style={[styles.optionLetter, { backgroundColor: look.letterBg }]}>
                  <Text style={[styles.optionLetterText, { color: look.letterColor }]}>{option.label}</Text>
                </View>
                <Text style={styles.optionText}>{option.text}</Text>
                {state === 'correct' && <Ionicons name="checkmark-circle" size={20} color={PT.green} />}
                {state === 'wrong' && <Ionicons name="close-circle" size={20} color={PT.red} />}
              </Pressable>
            );
          })}
        </View>

        {current && (
          <View style={{ marginTop: 18, gap: 10 }}>
            <ResultBanner feedback={current} />
            <StudyNotes explanation={current.explanation} revisionPoints={current.revisionPoints} />
          </View>
        )}
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        {current ? (
          <Pressable onPress={next} sound={isLast ? 'submit' : undefined} disabled={submitting} style={[styles.primaryBtn, submitting && { opacity: 0.6 }]}>
            {submitting ? (
              <ActivityIndicator color={PT.card} />
            ) : (
              <Text style={styles.primaryBtnText}>{isLast ? 'Finish & see review' : 'Next question'}</Text>
            )}
          </Pressable>
        ) : (
          <View style={styles.footerRow}>
            <Pressable onPress={() => check(null)} disabled={checking} style={styles.skipBtn}>
              <Text style={styles.skipText}>Skip & show answer</Text>
            </Pressable>
            <Pressable
              onPress={() => check(selectedOptionId)}
              disabled={selectedOptionId === null || checking}
              style={[styles.primaryBtn, { flex: 1 }, (selectedOptionId === null || checking) && styles.primaryBtnDisabled]}>
              {checking ? <ActivityIndicator color={PT.card} /> : <Text style={styles.primaryBtnText}>Check answer</Text>}
            </Pressable>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

function ResultBanner({ feedback }: { feedback: DailyAnswerFeedback & { skipped?: boolean } }) {
  if (feedback.isCorrect && feedback.correctOptionId == null) {
    return (
      <View style={[styles.banner, { backgroundColor: PT.tealSoft }]}>
        <Ionicons name="information-circle" size={18} color={PT.teal} />
        <Text style={[styles.bannerText, { color: PT.teal }]}>Dropped by UPSC — counted as correct for everyone</Text>
      </View>
    );
  }
  const [bg, color, icon, label] = feedback.skipped
    ? [PT.goldSoft, PT.goldDeep, 'arrow-forward-circle', 'Skipped — the correct answer is highlighted'] as const
    : feedback.isCorrect
      ? [PT.greenSoft, PT.greenDeep, 'checkmark-circle', 'Correct!'] as const
      : [PT.redSoft, PT.redDeep, 'close-circle', 'Not quite — the correct answer is highlighted'] as const;
  return (
    <View style={[styles.banner, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={[styles.bannerText, { color }]}>{label}</Text>
    </View>
  );
}

function ChallengeReview({ challenge }: { challenge: DailyChallengeResponse }) {
  const insets = useSafeAreaInsets();
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const progress = challenge.progress!;
  const review = challenge.review ?? [];

  const toggle = useCallback((id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return (
    <View style={styles.screen}>
      <FlatList
        data={review}
        keyExtractor={(q) => String(q.id)}
        contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <View style={styles.hero}>
              <SafeAreaView edges={['top']}>
                <Pressable onPress={() => router.replace('/')} hitSlop={10} style={styles.heroBack}>
                  <Ionicons name="chevron-back" size={22} color={PT.ink900} />
                </Pressable>
                <Text style={styles.heroEyebrow}>Today&apos;s Daily Challenge</Text>
                <View style={styles.heroScoreRow}>
                  <Text style={styles.heroScore}>{progress.accuracy}%</Text>
                  <StarRating count={progress.starsEarned} size={22} />
                </View>
                <Text style={styles.heroSub}>
                  {progress.correctAnswers}/{progress.completedQuestions} correct · a new challenge unlocks tomorrow
                </Text>
              </SafeAreaView>
            </View>
            <Text style={styles.sectionLabel}>Review every question</Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <ReviewCard question={{ ...item, questionNo: null }} index={index} expanded={expanded.has(item.id)} onToggle={toggle} />
        )}
        ListEmptyComponent={<Text style={styles.empty}>Review is not available for this challenge.</Text>}
      />
    </View>
  );
}

const OPTION_LOOK: Record<OptionState, { border: string; bg: string; letterBg: string; letterColor: string }> = {
  idle: { border: PT.line, bg: PT.card, letterBg: PT.bg, letterColor: PT.ink600 },
  dimmed: { border: PT.line, bg: PT.card, letterBg: PT.bg, letterColor: PT.ink600 },
  selected: { border: PT.purple500, bg: PT.purple50, letterBg: PT.purple500, letterColor: PT.card },
  correct: { border: PT.green, bg: PT.greenSoft, letterBg: PT.green, letterColor: PT.card },
  wrong: { border: PT.red, bg: PT.redSoft, letterBg: PT.red, letterColor: PT.card },
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: PT.bg },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: PT.bg },

  header: { paddingHorizontal: 18, paddingTop: 6, paddingBottom: 10 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: { width: 34, height: 34, borderRadius: 8, backgroundColor: PT.card, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 15, fontWeight: '700', color: PT.ink900 },
  subtitle: { fontSize: 11.5, fontWeight: '700', color: PT.ink400, marginTop: 1 },
  progressTrack: { height: 6, borderRadius: 8, backgroundColor: PT.line, overflow: 'hidden', marginTop: 12 },
  progressFill: { height: '100%', borderRadius: 8, backgroundColor: PT.purple500 },
  metaRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  subjectTag: {
    fontSize: 11.5,
    fontWeight: '700',
    color: PT.purple600,
    backgroundColor: PT.purple50,
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 8,
    overflow: 'hidden',
  },
  yearTag: {
    fontSize: 11.5,
    fontWeight: '700',
    color: PT.goldDeep,
    backgroundColor: PT.goldSoft,
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 8,
    overflow: 'hidden',
  },

  body: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 24 },
  questionText: { fontSize: 16.5, fontWeight: '700', color: PT.ink900, lineHeight: 25 },
  questionImage: { width: '100%', height: 200, borderRadius: 8, marginTop: 12 },
  options: { marginTop: 20, gap: 10 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 2, borderRadius: 8, padding: 13 },
  optionLetter: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  optionLetterText: { fontSize: 13, fontWeight: '700' },
  optionText: { flex: 1, fontSize: 14, fontWeight: '600', color: PT.ink900, lineHeight: 20 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 8 },
  bannerText: { flex: 1, fontSize: 13.5, fontWeight: '700' },

  footer: { backgroundColor: PT.card, borderTopWidth: 1, borderTopColor: PT.line, paddingHorizontal: 16, paddingTop: 10 },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 10 },
  skipBtn: { paddingVertical: 14, paddingHorizontal: 6 },
  skipText: { fontSize: 13, fontWeight: '700', color: PT.ink600 },
  primaryBtn: { backgroundColor: PT.purple600, borderRadius: 8, paddingVertical: 15, alignItems: 'center', marginBottom: 10 },
  primaryBtnDisabled: { backgroundColor: PT.ink300 },
  primaryBtnText: { fontSize: 15, fontWeight: '700', color: PT.card },

  hero: { paddingHorizontal: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: PT.line },
  heroBack: {
    width: 34,
    height: 34,
    borderRadius: 8,
    marginLeft: -8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  heroEyebrow: { fontSize: 13, color: PT.ink600 },
  heroScoreRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  heroScore: { fontSize: 42, fontWeight: '700', color: PT.ink900 },
  heroSub: { fontSize: 13, color: PT.ink600, marginTop: 6 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: PT.ink400,
    marginTop: 20,
    marginBottom: 10,
    marginHorizontal: 18,
  },
  empty: { textAlign: 'center', color: PT.ink400, fontWeight: '600', marginTop: 20 },
});
