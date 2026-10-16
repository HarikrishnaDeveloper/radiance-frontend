import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { UI } from '@/constants/ui';

import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api-client';
import type { AttemptResultsResponse } from '@/types/api';
import { Pressable } from '@/components/ui/pressable';
import { playSound } from '@/lib/sounds';

// ─── Design tokens aligned with quiz_complete_page.html ───────────────────
const RC = {
  purple900: UI.accent,
  purple800: UI.accent,
  purple700: UI.accent,
  purple600: UI.accent,
  purple500: UI.accent,
  purple400: UI.accent,
  purple100: UI.accentSoft,
  purple50: UI.accentSoft,
  bg: UI.bg,
  card: UI.bg,
  ink900: UI.text,
  ink600: UI.grey,
  ink400: UI.greyLight,
  ink300: UI.border,
  line: UI.border,
  gold: UI.accent,
  goldSoft: UI.accentSoft,
  goldDeep: UI.accent,
  green: UI.green,
  greenSoft: UI.greenSoft,
  red: UI.red,
  redSoft: UI.redSoft,
  blue: UI.accent,
  blueSoft: UI.accentSoft,
} as const;

function Stars({ filled, size = 34, color = RC.gold, emptyColor = RC.ink300 }: { filled: number; size?: number; color?: string; emptyColor?: string }) {
  return (
    <View style={styles.scoreStarsRow}>
      {[1, 2, 3].map((i) => (
        <Ionicons
          key={i}
          name={i <= filled ? 'star' : 'star-outline'}
          size={size}
          color={i <= filled ? color : emptyColor}
        />
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

function ReviewQuestionCard({ question, index }: { question: any; index: number }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasExtra = !!(question.explanation || question.revisionPoints);

  return (
    <View style={styles.questionCard}>
      <View style={styles.questionMetaRow}>
        <Text style={styles.questionMetaText}>
          Q{index + 1} · {question.category.name}
        </Text>
        {question.questionPaper && (
          <Text style={styles.questionPaperTag}>
            UPSC {question.questionPaper.year}
          </Text>
        )}
      </View>
      
      <Text style={styles.questionText}>{question.text}</Text>

      <View style={styles.optionsList}>
        {question.options.map((option: any) => {
          const isSelected = option.id === question.selectedOptionId;
          const isCorrect = option.isCorrect;
          
          let borderColor: string = RC.line;
          let letterBg: string = RC.bg;
          let letterColor: string = RC.ink600;
          let fontColor: string = RC.ink900;

          if (isCorrect) {
            borderColor = RC.green;
            letterBg = RC.green;
            letterColor = '#fff';
          } else if (isSelected) {
            borderColor = RC.red;
            letterBg = RC.red;
            letterColor = '#fff';
          }

          return (
            <View key={option.id} style={[styles.optionRow, { borderColor }]}>
              <View style={[styles.optionLetterBox, { backgroundColor: letterBg }]}>
                <Text style={[styles.optionLetterText, { color: letterColor }]}>
                  {option.label}
                </Text>
              </View>
              <Text style={[styles.optionTextLabel, { color: fontColor }]}>
                {option.text}
              </Text>
              {isCorrect && (
                <Ionicons name="checkmark-circle" size={20} color={RC.green} style={styles.optionFeedbackIcon} />
              )}
              {isSelected && !isCorrect && (
                <Ionicons name="close-circle" size={20} color={RC.red} style={styles.optionFeedbackIcon} />
              )}
            </View>
          );
        })}
      </View>

      {hasExtra && !isExpanded && (
        <Pressable style={styles.expandBtn} onPress={() => setIsExpanded(true)}>
          <Ionicons name="bulb" size={16} color={RC.purple600} />
          <Text style={styles.expandBtnText}>View Explanation & Review Points</Text>
        </Pressable>
      )}

      {isExpanded && question.explanation && (
        <View style={styles.explanationBox}>
          <Text style={styles.explanationTitle}>Explanation</Text>
          <Text style={styles.explanationText}>{question.explanation}</Text>
        </View>
      )}

      {isExpanded && question.revisionPoints && (
        <View style={styles.revisionBox}>
          <View style={styles.revisionTitleRow}>
            <Ionicons name="bookmark" size={13} color={RC.goldDeep} />
            <Text style={styles.revisionTitle}>UPSC Revision Point</Text>
          </View>
          <Text style={styles.revisionText}>{question.revisionPoints}</Text>
        </View>
      )}
    </View>
  );
}

export default function ResultsScreen() {
  const { attemptId, done } = useLocalSearchParams<{ attemptId: string; done?: string }>();
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  
  const [results, setResults] = useState<AttemptResultsResponse | null>(null);
  const [streak, setStreak] = useState<number>(0);
  const [reviewY, setReviewY] = useState<number>(0);
  
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!token || !attemptId) return;
    Promise.all([
      api.getResults(token, Number(attemptId)),
      api.streak(token).catch(() => ({ streak: 0 })),
    ]).then(([res, streakRes]) => {
      if (done === '1') playSound('success');
      setResults(res);
      if (streakRes && 'streak' in streakRes) {
        setStreak(streakRes.streak);
      }
    });
  }, [token, attemptId, done]);

  if (!results) {
    return (
      <View style={styles.centerFill}>
        <ActivityIndicator color={RC.purple600} />
      </View>
    );
  }

  // Calculate Duration
  let timeString = '--:--';
  if (results.startedAt && results.completedAt) {
    const diffMs = new Date(results.completedAt).getTime() - new Date(results.startedAt).getTime();
    const totalSecs = Math.max(0, Math.floor(diffMs / 1000));
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    timeString = `${m}:${s.toString().padStart(2, '0')}`;
  }

  const handleReviewScroll = () => {
    if (scrollViewRef.current && reviewY > 0) {
      scrollViewRef.current.scrollTo({ y: reviewY, animated: true });
    }
  };

  const currentCategory = results.questions[0]?.category.name || 'Practice';
  const currentPaper = results.questions[0]?.questionPaper;

  return (
    <View style={styles.screen}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.celebrate}>
          <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
            <View style={styles.trophyWrap}>
              <View style={styles.trophyGlow}>
                <Ionicons name="checkmark" size={30} color={RC.purple600} />
              </View>
              <Text style={styles.eyebrow}>
                {currentPaper ? `UPSC ${currentPaper.year}` : currentCategory}
              </Text>
              <Text style={styles.celebrateTitle}>Quiz complete</Text>
            </View>
          </SafeAreaView>
        </View>

        {/* ── Body ── */}
        <View style={styles.bodyContent}>
          {/* Score Card */}
          <View style={styles.scoreCard}>
            <View style={styles.scoreStarsBlock}>
              <Stars filled={sessionStarCount(results.scorePercent)} />
              <Text style={styles.scoreFrac}>{results.correctCount}/{results.totalQuestions} Correct</Text>
              <Text style={styles.scorePctLabel}>{results.scorePercent}% Accuracy</Text>
            </View>
            
            <View style={styles.scoreDivider} />
            
            <View style={styles.scoreSide}>
              <View style={styles.scoreRow}>
                <View style={[styles.scoreDot, { backgroundColor: RC.green }]} />
                <Text style={styles.scoreVal}>{results.correctCount} Correct</Text>
              </View>
              <View style={styles.scoreRow}>
                <View style={[styles.scoreDot, { backgroundColor: RC.red }]} />
                <Text style={styles.scoreVal}>{results.wrongCount} Wrong</Text>
              </View>
            </View>
          </View>

          {/* Stats Grid */}
          <View style={styles.statGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: RC.blueSoft }]}>
                <Ionicons name="time" size={16} color={RC.blue} />
              </View>
              <Text style={styles.statVal}>{timeString}</Text>
              <Text style={styles.statLabel}>Time Taken</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: RC.goldSoft }]}>
                <Ionicons name="analytics" size={16} color={RC.goldDeep} />
              </View>
              <Text style={styles.statVal}>{results.scorePercent}%</Text>
              <Text style={styles.statLabel}>Accuracy</Text>
            </View>
          </View>

          {/* Streak Card */}
          {streak > 0 && (
            <View style={styles.bonusCard}>
              <View style={styles.bonusIcon}>
                <Ionicons name="flame" size={20} color={RC.gold} />
              </View>
              <View style={styles.bonusInfo}>
                <Text style={styles.bonusTitle}>{streak} Day Streak</Text>
                <Text style={styles.bonusSub}>Practise again tomorrow to keep it going</Text>
              </View>
            </View>
          )}

          {/* ── Action Buttons ── */}
          <View style={styles.actionBlock}>
            <Pressable onPress={() => router.replace('/')} style={styles.primaryBtnWrap}>
              <View style={[styles.btnPrimary, { backgroundColor: RC.purple600 }]}>
                <Text style={styles.btnPrimaryText}>Continue to Home</Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </View>
            </Pressable>

            <Pressable onPress={handleReviewScroll} style={styles.btnSecondary}>
              <Text style={styles.btnSecondaryText}>Review Answers</Text>
            </Pressable>
          </View>

          {/* ── Review Section Title ── */}
          <View
            onLayout={(event) => setReviewY(event.nativeEvent.layout.y)}
            style={styles.reviewHeader}
          >
            <Text style={styles.reviewTitle}>Question Review</Text>
          </View>

          {/* Question Cards */}
          <View style={styles.reviewList}>
            {results.questions.map((question, i) => (
              <ReviewQuestionCard key={question.id} question={question} index={i} />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: RC.bg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  centerFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: RC.bg,
  },
  headerSafeArea: {
    width: '100%',
    alignItems: 'center',
  },
  celebrate: {
    backgroundColor: RC.card,
    paddingBottom: 24,
    paddingHorizontal: 22,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    position: 'relative',
    overflow: 'hidden',
  },
  trophyWrap: {
    alignItems: 'center',
    marginTop: 14,
  },
  trophyGlow: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: RC.purple50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '400',
    color: RC.ink600,
    marginTop: 8,
  },
  celebrateTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.3,
    color: RC.ink900,
    marginTop: 4,
  },
  bodyContent: {
    paddingHorizontal: 22,
    marginTop: 0,
  },
  
  // ── Score Card ──
  scoreCard: {
    backgroundColor: RC.card,
    borderRadius: 8,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    borderWidth: 1,
    borderColor: RC.line,
  },
  scoreStarsBlock: {
    alignItems: 'center',
    flex: 1.1,
  },
  scoreStarsRow: {
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
  },
  scoreFrac: {
    fontSize: 15,
    fontWeight: '700',
    color: RC.ink900,
    marginTop: 10,
    letterSpacing: -0.2,
  },
  scorePctLabel: {
    fontSize: 11,
    color: RC.ink400,
    fontWeight: '700',
    marginTop: 2,
  },
  scoreDivider: {
    width: 1,
    height: '100%',
    backgroundColor: RC.line,
  },
  scoreSide: {
    flex: 0.9,
    justifyContent: 'center',
    gap: 12,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  scoreDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  scoreVal: {
    fontSize: 14,
    fontWeight: '700',
    color: RC.ink900,
  },

  // ── Stat Grid ──
  statGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: RC.card,
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: RC.line,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statVal: {
    fontSize: 17,
    fontWeight: '700',
    color: RC.ink900,
    letterSpacing: -0.2,
  },
  statLabel: {
    fontSize: 11,
    color: RC.ink600,
    marginTop: 2,
    fontWeight: '500',
  },

  // ── Bonus Card ──
  bonusCard: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    backgroundColor: RC.card,
    borderWidth: 1,
    borderColor: RC.line,
    borderRadius: 8,
    padding: 15,
  },
  bonusIcon: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: RC.purple50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bonusInfo: {
    flex: 1,
  },
  bonusTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: RC.ink900,
  },
  bonusSub: {
    fontSize: 11.5,
    color: RC.ink600,
    marginTop: 1,
    fontWeight: '500',
  },
  bonusXp: {
    fontSize: 13,
    fontWeight: '700',
    color: RC.goldDeep,
  },

  // ── Unlock Card ──
  unlockCard: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    backgroundColor: RC.card,
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: RC.line,
  },
  unlockBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlockTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: RC.ink900,
  },
  unlockSub: {
    fontSize: 11.5,
    color: RC.ink600,
    marginTop: 1,
    fontWeight: '500',
  },

  // ── Action Buttons ──
  actionBlock: {
    marginTop: 20,
    gap: 11,
  },
  primaryBtnWrap: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  btnPrimaryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  btnSecondary: {
    backgroundColor: RC.card,
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: RC.line,
  },
  btnSecondaryText: {
    color: RC.ink900,
    fontWeight: '700',
    fontSize: 14,
  },

  // ── Review Header ──
  reviewHeader: {
    marginTop: 32,
    marginBottom: 16,
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: RC.ink900,
  },

  // ── Review Section / Question Cards ──
  reviewList: {
    gap: 16,
  },
  questionCard: {
    backgroundColor: RC.card,
    borderRadius: 8,
    padding: 18,
    borderWidth: 1,
    borderColor: RC.line,
  },
  questionMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  questionMetaText: {
    fontSize: 11,
    color: RC.ink600,
    fontWeight: '600',
  },
  questionPaperTag: {
    fontSize: 11,
    color: RC.goldDeep,
    fontWeight: '700',
    backgroundColor: RC.goldSoft,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  questionText: {
    fontSize: 15,
    fontWeight: '700',
    color: RC.ink900,
    lineHeight: 21,
    marginBottom: 16,
  },
  optionsList: {
    gap: 10,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 10,
  },
  optionLetterBox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLetterText: {
    fontSize: 12,
    fontWeight: '700',
  },
  optionTextLabel: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '600',
  },
  optionFeedbackIcon: {
    marginLeft: 6,
  },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginTop: 16,
    backgroundColor: RC.purple50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: RC.purple100,
  },
  expandBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: RC.purple600,
  },
  explanationBox: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: RC.line,
  },
  explanationTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: RC.purple700,
    marginBottom: 4,
  },
  explanationText: {
    fontSize: 13,
    color: RC.ink600,
    lineHeight: 18,
    fontWeight: '500',
  },
  revisionBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: RC.goldSoft,
    borderRadius: 8,
  },
  revisionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  revisionTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: RC.goldDeep,
  },
  revisionText: {
    fontSize: 13,
    color: RC.ink600,
    lineHeight: 18,
    fontWeight: '500',
  },
});
