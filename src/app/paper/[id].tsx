import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatMarks, formatMinutes, PT } from '@/components/paper-test/theme';
import { useAuth } from '@/context/auth-context';
import { ApiError, api } from '@/lib/api-client';
import type { PaperAttemptSummary, PaperDetailResponse, TestMode } from '@/types/api';

const MODE_COPY: Record<TestMode, { title: string; icon: keyof typeof Ionicons.glyphMap; points: string[] }> = {
  EXAM: {
    title: 'Exam mode',
    icon: 'timer-outline',
    points: ['Timed like the real paper', '+2 correct · −0.67 wrong', 'Answers & explanations after you submit'],
  },
  PRACTICE: {
    title: 'Practice mode',
    icon: 'school-outline',
    points: ['No timer', 'Answer revealed instantly', 'Explanation & UPSC review points per question'],
  },
};

export default function PaperScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const [paper, setPaper] = useState<PaperDetailResponse | null>(null);
  const [mode, setMode] = useState<TestMode>('EXAM');
  const [starting, setStarting] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!token || !id) return;
      api.paperDetail(token, Number(id)).then(setPaper).catch(() => {});
    }, [token, id])
  );

  async function start(sectionCategoryId: number | null) {
    if (!token || !paper || starting) return;
    if (paper.locked) {
      router.push('/paywall');
      return;
    }
    setStarting(sectionCategoryId === null ? 'full' : String(sectionCategoryId));
    try {
      const attempt = await api.startPaperTest(token, { questionPaperId: paper.id, testMode: mode, sectionCategoryId });
      router.push(`/test/${attempt.id}`);
    } catch (e) {
      if (e instanceof ApiError && e.isSubscriptionRequired) router.push('/paywall');
      else Alert.alert('Could not start test', 'Please check your connection and try again.');
    } finally {
      setStarting(null);
    }
  }

  // An unfinished attempt is offered as "Resume" instead of starting another.
  function startOrResume(inProgressAttemptId: number | null, sectionCategoryId: number | null) {
    if (inProgressAttemptId) router.push(`/test/${inProgressAttemptId}`);
    else start(sectionCategoryId);
  }

  if (!paper) {
    return (
      <View style={styles.centerFill}>
        <ActivityIndicator color={PT.purple600} />
      </View>
    );
  }

  const completed = paper.attempts.filter((a) => a.completedAt);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[PT.purple700, PT.purple900]} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={styles.hero}>
          <SafeAreaView edges={['top']}>
            <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={18} color={PT.card} />
            </Pressable>
            <Text style={styles.eyebrow}>UPSC CSE Prelims · {paper.examType.name.replace('Prelims ', '')}</Text>
            <Text style={styles.heroTitle}>{paper.year} Question Paper</Text>
            <View style={styles.heroStats}>
              <HeroStat icon="document-text-outline" label={`${paper.questionCount} Questions`} />
              <HeroStat icon="time-outline" label={formatMinutes(paper.durationSeconds)} />
              <HeroStat icon="ribbon-outline" label={`${paper.marking.maxScore} Marks`} />
            </View>
            {paper.isFree && (
              <View style={styles.freeBadge}>
                <Ionicons name="gift-outline" size={12} color={PT.goldDeep} />
                <Text style={styles.freeBadgeText}>Free paper</Text>
              </View>
            )}
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.body}>
          {paper.locked && (
            <Pressable onPress={() => router.push('/paywall')} style={styles.lockCard}>
              <Ionicons name="lock-closed" size={20} color={PT.purple600} />
              <View style={{ flex: 1 }}>
                <Text style={styles.lockTitle}>Unlock all 30+ years of papers</Text>
                <Text style={styles.lockSub}>Every question with explanation & UPSC review points.</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={PT.purple600} />
            </Pressable>
          )}

          {/* ── Mode picker ── */}
          <Text style={styles.sectionLabel}>Choose how to attempt</Text>
          <View style={styles.modeRow}>
            {(['EXAM', 'PRACTICE'] as TestMode[]).map((m) => {
              const active = m === mode;
              const copy = MODE_COPY[m];
              return (
                <Pressable key={m} onPress={() => setMode(m)} style={[styles.modeCard, active && styles.modeCardActive]}>
                  <View style={styles.modeHead}>
                    <Ionicons name={copy.icon} size={17} color={active ? PT.purple600 : PT.ink400} />
                    <Text style={[styles.modeTitle, active && { color: PT.purple600 }]}>{copy.title}</Text>
                    <Ionicons
                      name={active ? 'radio-button-on' : 'radio-button-off'}
                      size={16}
                      color={active ? PT.purple600 : PT.ink300}
                      style={{ marginLeft: 'auto' }}
                    />
                  </View>
                  {copy.points.map((p) => (
                    <Text key={p} style={styles.modePoint}>
                      • {p}
                    </Text>
                  ))}
                </Pressable>
              );
            })}
          </View>

          {/* ── Full test ── */}
          <Pressable
            onPress={() => startOrResume(paper.inProgressAttemptId, null)}
            disabled={starting !== null}
            style={({ pressed }) => [styles.fullTest, pressed && { opacity: 0.9 }]}>
            <LinearGradient colors={[PT.purple500, PT.purple600]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fullTestInner}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fullTestTitle}>Full Paper Test</Text>
                <Text style={styles.fullTestSub}>
                  All {paper.questionCount} questions
                  {mode === 'EXAM' ? ` · ${formatMinutes(paper.durationSeconds)}` : ' · untimed'}
                </Text>
              </View>
              {starting === 'full' ? (
                <ActivityIndicator color={PT.card} />
              ) : (
                <View style={styles.fullTestCta}>
                  <Text style={styles.fullTestCtaText}>
                    {paper.locked ? 'Unlock' : paper.inProgressAttemptId ? 'Resume' : 'Start'}
                  </Text>
                  <Ionicons name={paper.locked ? 'lock-closed' : 'arrow-forward'} size={14} color={PT.purple600} />
                </View>
              )}
            </LinearGradient>
          </Pressable>

          {/* ── Subject sections ── */}
          <Text style={styles.sectionLabel}>Subject-wise sections</Text>
          <View style={styles.listCard}>
            {paper.sections.map((section, i) => (
              <Pressable
                key={section.categoryId}
                onPress={() => startOrResume(section.inProgressAttemptId, section.categoryId)}
                disabled={starting !== null}
                style={({ pressed }) => [styles.sectionRow, i > 0 && styles.rowBorder, pressed && { backgroundColor: PT.purple50 }]}>
                <View style={styles.sectionCount}>
                  <Text style={styles.sectionCountText}>{section.questionCount}</Text>
                  <Text style={styles.sectionCountUnit}>Qs</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionName}>{section.name}</Text>
                  <Text style={styles.sectionMeta}>
                    {mode === 'EXAM' ? formatMinutes(section.durationSeconds) : 'Untimed'} · {section.questionCount * paper.marking.correct} marks
                  </Text>
                </View>
                {starting === String(section.categoryId) ? (
                  <ActivityIndicator color={PT.purple600} />
                ) : section.inProgressAttemptId ? (
                  <Text style={styles.resumePill}>Resume</Text>
                ) : (
                  <Ionicons name={paper.locked ? 'lock-closed' : 'chevron-forward'} size={17} color={PT.ink400} />
                )}
              </Pressable>
            ))}
          </View>

          {/* ── History ── */}
          {completed.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Your attempts</Text>
              <View style={styles.listCard}>
                {completed.map((a, i) => (
                  <AttemptRow key={a.id} attempt={a} first={i === 0} />
                ))}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function HeroStat({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.heroStat}>
      <Ionicons name={icon} size={13} color="rgba(255,255,255,0.8)" />
      <Text style={styles.heroStatText}>{label}</Text>
    </View>
  );
}

function AttemptRow({ attempt, first }: { attempt: PaperAttemptSummary; first: boolean }) {
  const date = new Date(attempt.completedAt ?? attempt.startedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  return (
    <Pressable
      onPress={() => router.push(`/test/${attempt.id}/results`)}
      style={({ pressed }) => [styles.attemptRow, !first && styles.rowBorder, pressed && { backgroundColor: PT.purple50 }]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.attemptTitle}>
          {attempt.section?.name ?? 'Full paper'} · {attempt.testMode === 'EXAM' ? 'Exam' : 'Practice'}
        </Text>
        <Text style={styles.attemptMeta}>
          {date} · {attempt.correctCount}✓ {attempt.wrongCount}✗ {attempt.skippedCount} skipped
        </Text>
      </View>
      {attempt.score !== null && attempt.maxScore !== null && (
        <Text style={styles.attemptScore}>
          {formatMarks(attempt.score)}
          <Text style={styles.attemptMax}>/{attempt.maxScore}</Text>
        </Text>
      )}
      <Ionicons name="chevron-forward" size={16} color={PT.ink300} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: PT.bg },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: PT.bg },

  hero: { paddingHorizontal: 20, paddingBottom: 26, borderBottomLeftRadius: 2, borderBottomRightRadius: 2 },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  eyebrow: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: 0.3 },
  heroTitle: { fontSize: 26, fontWeight: '800', color: PT.card, marginTop: 4, letterSpacing: -0.4 },
  heroStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  heroStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 2,
  },
  heroStatText: { fontSize: 12, fontWeight: '700', color: PT.card },
  freeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: PT.goldSoft,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 2,
    marginTop: 12,
  },
  freeBadgeText: { fontSize: 11.5, fontWeight: '800', color: PT.goldDeep },

  body: { paddingHorizontal: 18, paddingTop: 18 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: PT.ink400,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 22,
    marginBottom: 10,
  },

  lockCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: PT.purple50,
    borderWidth: 1,
    borderColor: PT.purple100,
    borderRadius: 2,
    padding: 14,
  },
  lockTitle: { fontSize: 14, fontWeight: '800', color: PT.ink900 },
  lockSub: { fontSize: 12, color: PT.ink600, marginTop: 2, fontWeight: '500' },

  modeRow: { flexDirection: 'row', gap: 10 },
  modeCard: {
    flex: 1,
    backgroundColor: PT.card,
    borderRadius: 2,
    padding: 12,
    borderWidth: 2,
    borderColor: PT.line,
  },
  modeCardActive: { borderColor: PT.purple500, backgroundColor: PT.purple50 },
  modeHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  modeTitle: { fontSize: 13.5, fontWeight: '800', color: PT.ink900 },
  modePoint: { fontSize: 11.5, lineHeight: 16, color: PT.ink600, fontWeight: '500' },

  fullTest: { marginTop: 16, borderRadius: 2, overflow: 'hidden' },
  fullTestInner: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 12 },
  fullTestTitle: { fontSize: 17, fontWeight: '800', color: PT.card },
  fullTestSub: { fontSize: 12.5, fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginTop: 3 },
  fullTestCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: PT.card,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 2,
  },
  fullTestCtaText: { fontSize: 13, fontWeight: '800', color: PT.purple600 },

  listCard: { backgroundColor: PT.card, borderRadius: 2, overflow: 'hidden' },
  rowBorder: { borderTopWidth: 1, borderTopColor: PT.line },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 14 },
  sectionCount: {
    width: 44,
    height: 44,
    borderRadius: 2,
    backgroundColor: PT.purple50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCountText: { fontSize: 15, fontWeight: '800', color: PT.purple600, lineHeight: 17 },
  sectionCountUnit: { fontSize: 9, fontWeight: '700', color: PT.purple400 },
  sectionName: { fontSize: 14.5, fontWeight: '800', color: PT.ink900 },
  sectionMeta: { fontSize: 12, fontWeight: '500', color: PT.ink400, marginTop: 2 },
  resumePill: {
    fontSize: 11.5,
    fontWeight: '800',
    color: PT.goldDeep,
    backgroundColor: PT.goldSoft,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 2,
    overflow: 'hidden',
  },

  attemptRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13, paddingHorizontal: 14 },
  attemptTitle: { fontSize: 13.5, fontWeight: '800', color: PT.ink900 },
  attemptMeta: { fontSize: 11.5, fontWeight: '500', color: PT.ink400, marginTop: 2 },
  attemptScore: { fontSize: 16, fontWeight: '800', color: PT.purple600 },
  attemptMax: { fontSize: 11, fontWeight: '700', color: PT.ink400 },
});
