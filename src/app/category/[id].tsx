import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { StagePath } from '@/components/stage-path';
import { Toast, type ToastData } from '@/components/toast';
import { dialog } from '@/components/ui/dialog';
import { UI } from '@/constants/ui';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api-client';
import type { CategoryDetailResponse, StageSummary } from '@/types/api';
import { Pressable } from '@/components/ui/pressable';
import { playSound } from '@/lib/sounds';

const PATH_INSET = 40; // horizontal padding around the stage path

export default function CategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const insets = useSafeAreaInsets();

  const [category, setCategory] = useState<CategoryDetailResponse | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const pathTop = useRef(0);
  const scrolledToCurrent = useRef(false);

  // Reload on focus so finishing a stage and coming back shows the new progress.
  useFocusEffect(
    useCallback(() => {
      if (!token || !id) return;
      api
        .categoryDetail(token, Number(id), setCategory)
        .then(setCategory)
        .catch(() =>
          dialog.error('Could not load subject', 'Please try again.', [{ text: 'OK', onPress: () => router.back() }])
        );
    }, [token, id])
  );

  // Bring the stage to play next into view the first time the path lays out.
  const scrollToCurrent = useCallback((y: number) => {
    if (scrolledToCurrent.current) return;
    scrolledToCurrent.current = true;
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: Math.max(0, pathTop.current + y - 220), animated: true }));
  }, []);

  function handleStagePress(stage: StageSummary, index: number) {
    if (stage.status === 'LOCKED') {
      setToast({ type: 'error', message: `Finish stage ${index} to unlock this one` });
      return;
    }
    if (stage.requiresSubscription && stage.status !== 'COMPLETED') {
      router.push('/paywall');
      return;
    }
    playSound('open');
    router.push(`/stage/${stage.id}`);
  }

  if (!category) {
    return (
      <View style={styles.centerFill}>
        <ActivityIndicator color={UI.accent} />
      </View>
    );
  }

  const stars = category.stages.reduce((sum, s) => sum + s.starsEarned, 0);
  const maxStars = category.stages.reduce((sum, s) => sum + s.rewardStars, 0);

  return (
    <View style={styles.screen}>
      <Toast toast={toast} onHide={() => setToast(null)} />

      {/* Header stays put while the path scrolls, like a game HUD. */}
      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back} accessibilityRole="button" accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={24} color={UI.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={1}>
              {category.foodWorldName ?? category.name}
            </Text>
            {category.foodWorldName ? <Text style={styles.subtitle}>{category.name}</Text> : null}
          </View>
        </View>

        <View style={styles.stats}>
          <Stat icon="flag" value={`${category.completedStages}/${category.totalStages}`} label="Stages" />
          <Stat icon="star" value={`${stars}/${maxStars}`} label="Stars" />
          <Stat icon="trending-up" value={`${category.completionPercentage}%`} label="Done" />
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${category.completionPercentage}%` }]} />
        </View>
      </SafeAreaView>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 24 + insets.bottom }}
        showsVerticalScrollIndicator={false}>
        <View onLayout={(e) => (pathTop.current = e.nativeEvent.layout.y)}>
          <StagePath
            stages={category.stages}
            onStagePress={handleStagePress}
            horizontalInset={PATH_INSET}
            onCurrentY={scrollToCurrent}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function Stat({ icon, value, label }: { icon: keyof typeof Ionicons.glyphMap; value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={16} color={UI.accent} />
      <View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: UI.bg },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: UI.bg },

  header: { backgroundColor: UI.bg, paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: UI.border },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  back: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginLeft: -6 },
  title: { fontSize: 22, fontWeight: '700', color: UI.text, letterSpacing: -0.3 },
  subtitle: { fontSize: 13, color: UI.grey, marginTop: 1 },

  stats: { flexDirection: 'row', gap: 8, marginTop: 14 },
  stat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: UI.radius,
    borderWidth: 1,
    borderColor: UI.border,
  },
  statValue: { fontSize: 15, fontWeight: '700', color: UI.text, fontVariant: ['tabular-nums'] },
  statLabel: { fontSize: 11.5, color: UI.grey },

  track: { height: 6, borderRadius: 3, backgroundColor: UI.border, marginTop: 12, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3, backgroundColor: UI.accent },
});
