import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StagePath } from '@/components/stage-path';
import { Toast, type ToastData } from '@/components/toast';
import { COLORS } from '@/constants/colors';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api-client';
import type { CategoryDetailResponse, CategorySummary, PaperSummary, StageSummary } from '@/types/api';

type Pane = 'path' | 'papers';

export default function JourneyScreen() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [papers, setPapers] = useState<PaperSummary[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [categoryDetail, setCategoryDetail] = useState<CategoryDetailResponse | null>(null);
  const [pane, setPane] = useState<Pane>('path');
  const [toast, setToast] = useState<ToastData | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const [categoriesRes, papersRes] = await Promise.all([
        api.categories(token, (freshCats) => setCategories(freshCats)),
        api.papers(token, (freshPapers) => setPapers(freshPapers))
      ]);
      setCategories(categoriesRes);
      setPapers(papersRes);
      setSelectedCategoryId((prev) => prev ?? categoriesRes[0]?.id ?? null);
    } catch {
      // Keep displaying old data if available
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const loadCategoryDetail = useCallback(
    async (categoryId: number) => {
      if (!token) return;
      try {
        const detail = await api.categoryDetail(token, categoryId, (freshDetail) => {
          setCategoryDetail(freshDetail);
        });
        setCategoryDetail(detail);
      } catch {
        // Silent recovery
      }
    },
    [token]
  );

  useFocusEffect(
    useCallback(() => {
      if (selectedCategoryId) loadCategoryDetail(selectedCategoryId);
    }, [selectedCategoryId, loadCategoryDetail])
  );

  async function startFullPaper(questionPaperId: number) {
    if (!token) return;
    const attempt = await api.createAttempt(token, { mode: 'FULL_PAPER', questionPaperId });
    router.push(`/quiz/${attempt.id}`);
  }

  function handleStagePress(stage: StageSummary, index: number) {
    if (stage.status === 'LOCKED') {
      setToast({ type: 'error', message: `Complete Stage ${index} first` });
      return;
    }
    router.push(`/stage/${stage.id}`);
  }

  return (
    <View style={styles.screen}>
      <Toast toast={toast} onHide={() => setToast(null)} />
      <View style={styles.header}>
        <SafeAreaView edges={['top']}>
          <Text style={styles.pageTitle}>Journey</Text>
          <Text style={styles.pageSub}>Your path through the syllabus</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {categories.map((category) => {
              const active = category.id === selectedCategoryId;
              return (
                <Pressable key={category.id} onPress={() => setSelectedCategoryId(category.id)}>
                  <View style={[styles.chip, active && styles.chipActive]}>
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {category.foodWorldName ?? category.name}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </View>

      <View style={styles.segment}>
        <Pressable style={styles.segmentBtn} onPress={() => setPane('path')}>
          <View style={[styles.segmentInner, pane === 'path' && styles.segmentInnerActive]}>
            <Text style={[styles.segmentText, pane === 'path' && styles.segmentTextActive]}>Stage Path</Text>
          </View>
        </Pressable>
        <Pressable style={styles.segmentBtn} onPress={() => setPane('papers')}>
          <View style={[styles.segmentInner, pane === 'papers' && styles.segmentInnerActive]}>
            <Text style={[styles.segmentText, pane === 'papers' && styles.segmentTextActive]}>Previous Papers</Text>
          </View>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {pane === 'path' ? (
          categoryDetail ? (
            <>
              <View style={styles.progressSummary}>
                <Text style={styles.progressTitle}>
                  Stage {categoryDetail.stages.filter((s) => s.status === 'COMPLETED').length + 1} of{' '}
                  {categoryDetail.totalStages}
                </Text>
                <Text style={styles.progressSub}>
                  {categoryDetail.foodWorldName ?? categoryDetail.name} · {categoryDetail.completionPercentage}% complete
                </Text>
              </View>
              <StagePath stages={categoryDetail.stages} onStagePress={handleStagePress} />
            </>
          ) : (
            <View style={styles.centerFill}>
              <ActivityIndicator color={COLORS.purple} />
            </View>
          )
        ) : (
          <View style={styles.papersList}>
            {papers.map((paper, i) => (
              <Pressable key={paper.id} onPress={() => startFullPaper(paper.id)}>
                <View style={[styles.yearItem, i === papers.length - 1 && styles.yearItemLast]}>
                  <Text style={styles.yearTitle}>{paper.title ?? `${paper.year} Paper`}</Text>
                  <Text style={styles.yearMeta}>{paper.questionCount} Questions</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.loginBg },
  centerFill: { paddingTop: 60, alignItems: 'center' },
  scrollContent: { paddingHorizontal: 22, paddingTop: 18 },

  header: { backgroundColor: COLORS.purple700, paddingHorizontal: 22, paddingBottom: 18, paddingTop: 6 },
  pageTitle: { fontSize: 22, fontWeight: '800', color: COLORS.white },
  pageSub: { fontSize: 13, color: 'rgba(255,255,255,0.68)', marginTop: 3, fontWeight: '500' },

  chipRow: { flexDirection: 'row', gap: 9, marginTop: 16 },
  chip: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 9,
    paddingHorizontal: 15,
    borderRadius: 100,
  },
  chipActive: { backgroundColor: COLORS.white, borderColor: COLORS.white },
  chipText: { fontSize: 12.5, fontWeight: '700', color: 'rgba(255,255,255,0.7)' },
  chipTextActive: { color: COLORS.purple700 },

  segment: {
    margin: 18,
    marginBottom: 0,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 4,
    flexDirection: 'row',
  },
  segmentBtn: { flex: 1 },
  segmentInner: { paddingVertical: 10, borderRadius: 11, alignItems: 'center' },
  segmentInnerActive: { backgroundColor: COLORS.purple },
  segmentText: { fontSize: 13, fontWeight: '700', color: COLORS.grayLight },
  segmentTextActive: { color: COLORS.white },

  progressSummary: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 17,
    marginBottom: 10,
  },
  progressTitle: { fontSize: 14.5, fontWeight: '800', color: COLORS.navy },
  progressSub: { fontSize: 12, color: COLORS.gray, marginTop: 2, fontWeight: '500' },

  papersList: { backgroundColor: COLORS.white, borderRadius: 22, overflow: 'hidden' },
  yearItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayBorder,
  },
  yearItemLast: { borderBottomWidth: 0 },
  yearTitle: { fontSize: 14.5, fontWeight: '800', color: COLORS.navy },
  yearMeta: { fontSize: 12, color: COLORS.gray, marginTop: 2, fontWeight: '500' },
});
