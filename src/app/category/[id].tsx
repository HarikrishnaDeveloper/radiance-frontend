import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StagePath } from '@/components/stage-path';
import { Toast, type ToastData } from '@/components/toast';
import { COLORS } from '@/constants/colors';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api-client';
import type { CategoryDetailResponse, StageSummary } from '@/types/api';

export default function CategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();

  const [category, setCategory] = useState<CategoryDetailResponse | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);

  useEffect(() => {
    if (!token || !id) return;
    api.categoryDetail(token, Number(id)).then(setCategory);
  }, [token, id]);

  function handleStagePress(stage: StageSummary, index: number) {
    if (stage.status === 'LOCKED') {
      setToast({ type: 'error', message: `Complete Stage ${index} first` });
      return;
    }
    router.push(`/stage/${stage.id}`);
  }

  if (!category) {
    return (
      <View style={styles.centerFill}>
        <ActivityIndicator color={COLORS.purple} />
      </View>
    );
  }

  return (
    <>
      <Toast toast={toast} onHide={() => setToast(null)} />
      <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <SafeAreaView style={styles.safeArea}>
          <Text style={styles.title}>{category.foodWorldName ?? category.name}</Text>
          {category.foodWorldName && <Text style={styles.subtitle}>{category.name}</Text>}

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${category.completionPercentage}%` }]} />
          </View>
          <Text style={styles.progressCaption}>
            {category.completedStages}/{category.totalStages} stages · {category.completionPercentage}%
          </Text>

          <View style={{ height: 24 }} />
          <StagePath stages={category.stages} onStagePress={handleStagePress} />
        </SafeAreaView>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.loginBg },
  scrollContent: { flexGrow: 1 },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.loginBg },
  safeArea: { paddingHorizontal: 22, paddingVertical: 24 },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.navy },
  subtitle: { fontSize: 14, color: COLORS.gray, marginTop: 2, fontWeight: '500' },
  progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden', marginTop: 16, backgroundColor: COLORS.grayBorder },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: COLORS.purple },
  progressCaption: { fontSize: 12, color: COLORS.gray, marginTop: 6, fontWeight: '500' },
});
