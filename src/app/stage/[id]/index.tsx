import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StarRating } from '@/components/star-rating';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { COLORS } from '@/constants/colors';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api-client';
import type { StageDetailResponse, StageSubmitResponse, StreakResponse } from '@/types/api';

const XP_PER_CORRECT = 15;
const STREAK_BONUS_XP = 20;
const STREAK_BONUS_THRESHOLD = 2;

function formatElapsed(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

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
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [streak, setStreak] = useState<StreakResponse | null>(null);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    if (!token || !id) return;
    api.stageDetail(token, Number(id)).then(setStage);
  }, [token, id]);

  useEffect(() => {
    if (!token || !result) return;
    api.streak(token).then(setStreak);
  }, [token, result]);

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
      setElapsedSeconds(Math.round((Date.now() - startTimeRef.current) / 1000));
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
    const xpEarned = result.correctAnswers * XP_PER_CORRECT;
    const showStreakBonus = !!streak && streak.streak >= STREAK_BONUS_THRESHOLD;
    const wrongAnswers = result.completedQuestions - result.correctAnswers;

    return (
      <View style={completeStyles.screen}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <LinearGradient colors={[COLORS.purple700, COLORS.purple900]} style={completeStyles.celebrate}>
            <SafeAreaView edges={['top']}>
              <View style={completeStyles.trophyWrap}>
                <View style={completeStyles.trophyGlow}>
                  <Ionicons name="trophy" size={48} color={COLORS.gold} />
                </View>
                <Text style={completeStyles.eyebrow}>
                  Stage {stage.stageNumber} · {stage.category.name}
                </Text>
                <Text style={completeStyles.celebrateTitle}>Quiz Complete!</Text>
                <Text style={completeStyles.celebrateSub}>Great work — you're one step closer to your goal.</Text>
              </View>
            </SafeAreaView>
          </LinearGradient>

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
                  <Ionicons name="time-outline" size={16} color={COLORS.blue} />
                </View>
                <Text style={completeStyles.statVal}>{formatElapsed(elapsedSeconds)}</Text>
                <Text style={completeStyles.statLabel}>Time Taken</Text>
              </View>
              <View style={completeStyles.statCard}>
                <View style={[completeStyles.statIcon, { backgroundColor: COLORS.goldSoft }]}>
                  <Ionicons name="flash" size={16} color={COLORS.goldDeep} />
                </View>
                <Text style={completeStyles.statVal}>+{xpEarned} XP</Text>
                <Text style={completeStyles.statLabel}>Earned</Text>
              </View>
            </View>

            {showStreakBonus && (
              <View style={completeStyles.bonusCard}>
                <View style={completeStyles.bonusIcon}>
                  <Ionicons name="flame" size={19} color={COLORS.gold} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={completeStyles.bonusTitle}>{streak!.streak} Day Streak Bonus</Text>
                  <Text style={completeStyles.bonusSub}>Extra reward for staying consistent</Text>
                </View>
                <Text style={completeStyles.bonusXp}>+{STREAK_BONUS_XP} XP</Text>
              </View>
            )}

            {result.firstCompletion && (
              <View style={completeStyles.unlockCard}>
                <View style={completeStyles.unlockBadge}>
                  <Ionicons name="star" size={20} color={COLORS.white} />
                </View>
                <View>
                  <Text style={completeStyles.unlockTitle}>Checkpoint Cleared</Text>
                  <Text style={completeStyles.unlockSub}>New achievement added to your profile</Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        <View style={completeStyles.actions}>
          {result.nextStageUnlocked && result.nextStageId ? (
            <Pressable onPress={() => router.replace(`/stage/${result.nextStageId}`)} style={completeStyles.btnPrimary}>
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
            <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
              <ThemedText style={styles.questionText}>{currentQuestion.text}</ThemedText>
              {currentQuestion.questionImage && (
                <Image
                  source={{ uri: `${process.env.EXPO_PUBLIC_API_URL}${currentQuestion.questionImage}` }}
                  style={styles.questionImage}
                  resizeMode="contain"
                />
              )}

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
            </ScrollView>

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
  contentScroll: {
    flex: 1,
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
    marginTop: Spacing.three,
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
    paddingTop: Spacing.three,
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
});

const completeStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.loginBg },

  celebrate: { paddingHorizontal: 22, paddingBottom: 30, paddingTop: 6 },
  trophyWrap: { alignItems: 'center', marginTop: 14 },
  trophyGlow: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(245,166,35,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.6)',
    marginTop: 10,
  },
  celebrateTitle: { fontSize: 24, fontWeight: '800', color: COLORS.white, marginTop: 4, letterSpacing: -0.3 },
  celebrateSub: { fontSize: 13, color: 'rgba(255,255,255,0.65)', fontWeight: '500', marginTop: 4, textAlign: 'center' },

  body: { paddingHorizontal: 22, marginTop: -14 },

  scoreCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  scoreStarsBlock: { alignItems: 'center' },
  scoreFrac: { fontSize: 14.5, fontWeight: '800', color: COLORS.navy, marginTop: 10 },
  scorePctLabel: { fontSize: 11, color: COLORS.grayLight, fontWeight: '700', marginTop: 2 },
  scoreDivider: { width: 1, alignSelf: 'stretch', backgroundColor: COLORS.grayBorder },
  scoreSide: { flex: 1, gap: 12 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  scoreDot: { width: 8, height: 8, borderRadius: 4 },
  scoreVal: { fontSize: 14, fontWeight: '800', color: COLORS.navy },

  statGrid: { flexDirection: 'row', gap: 12, marginTop: 14 },
  statCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: 18, padding: 15 },
  statIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statVal: { fontSize: 17, fontWeight: '800', color: COLORS.navy, letterSpacing: -0.2 },
  statLabel: { fontSize: 11, color: COLORS.gray, marginTop: 2, fontWeight: '500' },

  bonusCard: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    backgroundColor: COLORS.goldSoft,
    borderWidth: 1,
    borderColor: '#FBE7BE',
    borderRadius: 18,
    padding: 15,
  },
  bonusIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bonusTitle: { fontSize: 13.5, fontWeight: '800', color: COLORS.navy },
  bonusSub: { fontSize: 11.5, color: COLORS.gray, marginTop: 1, fontWeight: '500' },
  bonusXp: { fontSize: 13, fontWeight: '800', color: COLORS.goldDeep },

  unlockCard: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 15,
  },
  unlockBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlockTitle: { fontSize: 13.5, fontWeight: '800', color: COLORS.navy },
  unlockSub: { fontSize: 11.5, color: COLORS.gray, marginTop: 1, fontWeight: '500' },

  actions: { paddingHorizontal: 22, paddingTop: 16, paddingBottom: 20 },
  btnPrimary: {
    backgroundColor: COLORS.purple700,
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnPrimaryText: { fontSize: 15, fontWeight: '800', color: COLORS.white },
  btnSecondary: {
    marginTop: 11,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
  },
  btnSecondaryText: { fontSize: 14, fontWeight: '700', color: COLORS.navy },
});
