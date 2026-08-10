import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProgressRing } from '@/components/progress-ring';
import { COLORS } from '@/constants/colors';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api-client';
import type { CategorySummary } from '@/types/api';

type FilterKey = 'all' | 'in_progress' | 'completed' | 'not_started';

function statusOf(category: CategorySummary): Exclude<FilterKey, 'all'> {
  if (category.totalStages === 0 || category.completedStages === 0) return 'not_started';
  if (category.completedStages >= category.totalStages) return 'completed';
  return 'in_progress';
}

export default function PracticeScreen() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<CategorySummary[] | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const result = await api.categories(token, (freshData) => {
        setCategories(freshData);
      });
      setCategories(result);
    } catch {
      // Swallowed as we want to remain silent if cached data exists
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const filtered = useMemo(() => {
    if (!categories) return [];
    const q = search.trim().toLowerCase();
    return categories.filter((c) => {
      const matchesSearch = !q || c.name.toLowerCase().includes(q) || (c.foodWorldName ?? '').toLowerCase().includes(q);
      const matchesFilter = filter === 'all' || statusOf(c) === filter;
      return matchesSearch && matchesFilter;
    });
  }, [categories, search, filter]);

  async function startQuickPractice() {
    if (!token || !categories || categories.length === 0) return;
    const attempt = await api.createAttempt(token, {
      mode: 'CATEGORY_PRACTICE',
      categoryIds: categories.map((c) => c.id),
    });
    router.push(`/quiz/${attempt.id}`);
  }

  if (!categories) {
    return (
      <View style={styles.centerFill}>
        <ActivityIndicator color={COLORS.purple} />
      </View>
    );
  }

  const chips: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'completed', label: 'Completed' },
    { key: 'not_started', label: 'Not Started' },
  ];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <SafeAreaView edges={['top']}>
          <Text style={styles.pageTitle}>Practice</Text>
          <Text style={styles.pageSub}>
            {categories.length} subjects · {categories.reduce((sum, c) => sum + c.questionCount, 0)}+ questions
          </Text>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={16} color="rgba(255,255,255,0.6)" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search subjects"
              placeholderTextColor="rgba(255,255,255,0.55)"
              style={styles.searchInput}
            />
          </View>
        </SafeAreaView>
      </View>

      <View style={styles.section}>
        <Pressable onPress={startQuickPractice}>
          <View style={styles.modeCard}>
            <View style={styles.modeIcon}>
              <Ionicons name="flash" size={19} color={COLORS.gold} />
            </View>
            <View style={styles.modeBody}>
              <Text style={styles.modeName}>Quick Practice</Text>
              <Text style={styles.modeSub}>10 random questions across all subjects</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.white} />
          </View>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>All Subjects</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {chips.map((chip) => (
            <Pressable key={chip.key} onPress={() => setFilter(chip.key)}>
              <View style={[styles.chip, filter === chip.key && styles.chipActive]}>
                <Text style={[styles.chipText, filter === chip.key && styles.chipTextActive]}>{chip.label}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>

        <View style={{ height: 16 }} />

        {filtered.map((category) => (
          <Pressable key={category.id} onPress={() => router.push(`/category/${category.id}`)}>
            <View style={styles.subjectCard}>
              <ProgressRing percent={category.progress} size={54} strokeWidth={5} color={COLORS.purple} trackColor={COLORS.purpleSoft} />
              <View style={styles.subjectBody}>
                <Text style={styles.subjectName}>{category.foodWorldName ?? category.name}</Text>
                <Text style={styles.subjectMeta}>
                  {category.questionCount} Questions · {category.totalStages} Stages
                </Text>
              </View>
              <View style={styles.subjectBtn}>
                <Ionicons name="chevron-forward" size={15} color={COLORS.purple} />
              </View>
            </View>
          </Pressable>
        ))}

        {filtered.length === 0 && <Text style={styles.emptyText}>No subjects match this filter.</Text>}
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.loginBg },
  scrollContent: { flexGrow: 1 },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.loginBg },

  header: { backgroundColor: COLORS.purple700, paddingHorizontal: 22, paddingBottom: 22, paddingTop: 6 },
  pageTitle: { fontSize: 22, fontWeight: '800', color: COLORS.white },
  pageSub: { fontSize: 13, color: 'rgba(255,255,255,0.68)', marginTop: 3, fontWeight: '500' },
  searchBar: {
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: { color: COLORS.white, fontSize: 13.5, fontWeight: '500', flex: 1, padding: 0 },

  section: { paddingHorizontal: 22, paddingTop: 22 },
  sectionTitle: { fontSize: 16.5, fontWeight: '800', color: COLORS.navy, marginBottom: 14 },

  modeCard: {
    backgroundColor: COLORS.purple,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  modeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeBody: { flex: 1 },
  modeName: { fontSize: 14, fontWeight: '800', color: COLORS.white },
  modeSub: { fontSize: 11.5, color: 'rgba(255,255,255,0.7)', marginTop: 2, fontWeight: '500' },

  chipRow: { flexDirection: 'row', gap: 9 },
  chip: {
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
    backgroundColor: COLORS.white,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 100,
  },
  chipActive: { backgroundColor: COLORS.purple, borderColor: COLORS.purple },
  chipText: { fontSize: 12.5, fontWeight: '700', color: COLORS.gray },
  chipTextActive: { color: COLORS.white },

  subjectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 15,
    marginBottom: 12,
  },
  subjectBody: { flex: 1 },
  subjectName: { fontSize: 15, fontWeight: '800', color: COLORS.navy },
  subjectMeta: { fontSize: 12, color: COLORS.gray, marginTop: 2, fontWeight: '500' },
  subjectBtn: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: COLORS.purpleSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: { textAlign: 'center', color: COLORS.grayLight, marginTop: 20 },
});
