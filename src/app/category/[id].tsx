import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StarRating } from '@/components/star-rating';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Toast, type ToastData } from '@/components/toast';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api-client';
import type { CategoryDetailResponse, StageSummary } from '@/types/api';

export default function CategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const theme = useTheme();

  const [category, setCategory] = useState<CategoryDetailResponse | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);

  useEffect(() => {
    if (!token || !id) return;
    api.categoryDetail(token, Number(id)).then(setCategory);
  }, [token, id]);

  if (!category) {
    return (
      <ThemedView style={styles.centerFill}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  function statusIcon(status: StageSummary['status']) {
    if (status === 'COMPLETED') return 'checkmark-circle';
    if (status === 'LOCKED') return 'lock-closed';
    return 'play-circle';
  }

  function handleStagePress(stage: StageSummary, index: number) {
    if (stage.status === 'LOCKED') {
      setToast({ type: 'error', message: `Complete Stage ${index} first` });
      return;
    }
    router.push(`/stage/${stage.id}`);
  }

  return (
    <>
      <Toast toast={toast} onHide={() => setToast(null)} />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <ThemedView style={styles.container}>
          <SafeAreaView style={styles.safeArea}>
            <ThemedText type="title" style={styles.title}>
              {category.foodWorldName ?? category.name}
            </ThemedText>
            {category.foodWorldName && (
              <ThemedText themeColor="textSecondary">{category.name}</ThemedText>
            )}

            <ThemedView type="backgroundElement" style={styles.progressTrack}>
              <ThemedView
                style={[
                  styles.progressFill,
                  { width: `${category.completionPercentage}%`, backgroundColor: theme.text },
                ]}
              />
            </ThemedView>
            <ThemedText themeColor="textSecondary" type="small">
              {category.completedStages}/{category.totalStages} stages · {category.completionPercentage}%
            </ThemedText>

            <ThemedView style={styles.list}>
              {category.stages.map((stage, i) => {
                const locked = stage.status === 'LOCKED';
                return (
                  <Pressable key={stage.id} onPress={() => handleStagePress(stage, i)}>
                    <ThemedView
                      type="backgroundElement"
                      style={[styles.stageRow, locked && styles.stageRowLocked]}>
                      <Ionicons
                        name={statusIcon(stage.status)}
                        size={22}
                        color={locked ? theme.textSecondary : theme.text}
                        style={styles.stageIcon}
                      />
                      <ThemedView style={styles.stageInfo}>
                        <ThemedText type="smallBold">{stage.title}</ThemedText>
                        <ThemedText themeColor="textSecondary" type="small">
                          {stage.questionCount} questions
                        </ThemedText>
                      </ThemedView>
                      <StarRating count={stage.starsEarned} />
                    </ThemedView>
                  </Pressable>
                );
              })}
            </ThemedView>
          </SafeAreaView>
        </ThemedView>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  centerFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  safeArea: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    gap: Spacing.one,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: Spacing.three,
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
  },
  list: {
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  stageRowLocked: {
    opacity: 0.5,
  },
  stageIcon: {
    marginRight: Spacing.one,
  },
  stageInfo: {
    flex: 1,
    gap: 2,
  },
});
