import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HT } from '@/components/home/home-theme';
import { LeaderboardRow } from '@/components/home/LeaderboardPreview';
import { SectionHeader } from '@/components/home/SectionHeader';
import { Pressable } from '@/components/ui/pressable';
import { ScrollEdgeFade, ScrollItem } from '@/components/ui/scroll-item';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api-client';
import type { LeaderboardEntry, LeaderboardResponse } from '@/types/api';

const accent = (alpha: number) => `${HT.primary}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;

const initials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  return (parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : name.slice(0, 2)).toUpperCase();
};

// Leaderboard tab: the All India ranking from full-paper tests (Exam mode,
// whole papers only). Laid out like Home: a soft violet header with your
// rank, then the top three and the full list in plain cards.
export default function LeaderboardScreen() {
  const { token } = useAuth();
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setData(await api.leaderboard(token, setData));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the leaderboard.');
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const podium = data?.top.filter((e) => e.rank <= 3) ?? [];
  const rest = data?.top.filter((e) => e.rank > 3) ?? [];
  const meInList = data?.top.some((e) => e.isMe);

  return (
    <View style={styles.screen}>
      <Header data={data} />

      {!data ? (
        <View style={styles.center}>
          {error ? (
            <>
              <Text style={styles.muted}>{error}</Text>
              <Pressable onPress={load} style={styles.btn} accessibilityRole="button">
                <Text style={styles.btnText}>Try again</Text>
              </Pressable>
            </>
          ) : (
            <ActivityIndicator color={HT.primary} />
          )}
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <Animated.ScrollView
            onScroll={onScroll}
            scrollEventThrottle={16}
            contentContainerStyle={styles.body}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={HT.primary} colors={[HT.primary]} />}>
            {podium.length === 0 ? (
              <ScrollItem scrollY={scrollY} style={styles.block}>
                <View style={[styles.card, styles.empty]}>
                  <Ionicons name="trophy-outline" size={18} color={HT.muted} />
                  <Text style={styles.emptyText}>No rankings yet. Take a full paper test in Exam mode to get on the board.</Text>
                </View>
              </ScrollItem>
            ) : (
              <ScrollItem scrollY={scrollY} style={styles.block}>
                <SectionHeader title="Top of India" subtitle="Full paper tests in Exam mode" />
                <View style={styles.podium}>
                  {[2, 1, 3].map((r) => {
                    const entry = podium.find((e) => e.rank === r);
                    return entry ? <TopCard key={entry.userId} entry={entry} /> : <View key={r} style={{ flex: 1 }} />;
                  })}
                </View>
              </ScrollItem>
            )}

            {(rest.length > 0 || (data.me && !meInList)) && (
              <ScrollItem scrollY={scrollY} style={styles.block}>
                <SectionHeader title="All India ranking" />
                <View style={styles.card}>
                  {rest.map((entry, i) => (
                    <LeaderboardRow key={entry.userId} entry={entry} first={i === 0} />
                  ))}
                  {data.me && !meInList && (
                    <>
                      {rest.length > 0 && (
                        <View style={styles.gap}>
                          <Text style={styles.gapText}>···</Text>
                        </View>
                      )}
                      <LeaderboardRow entry={data.me} first={rest.length === 0} />
                    </>
                  )}
                </View>
              </ScrollItem>
            )}
          </Animated.ScrollView>
          <ScrollEdgeFade color={HT.bg} />

          {/* How ranking works: pinned above the tab bar, outside the scroll. */}
          <View style={styles.footer}>
            <Ionicons name="information-circle-outline" size={15} color={HT.primary} />
            <Text style={styles.footnote}>
              Ranked by your average best score on each full paper taken in Exam mode, with UPSC marking (+2 / −⅔). Practice and
              daily tasks don&apos;t add marks.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Header ─────────────────────────────────────────────────────────────
// Same panel as Home's header; your rank and score sit where Home shows the
// streak and today's goal.

function Header({ data }: { data: LeaderboardResponse | null }) {
  const me = data?.me ?? null;
  const total = data?.totalRanked ?? 0;
  const topPct = me ? Math.max(1, Math.ceil((me.rank / Math.max(total, 1)) * 100)) : null;
  const above = me ? data?.top.find((e) => e.rank === me.rank - 1) : undefined;
  const gap = me && above ? Math.max(0, Math.round((above.scorePercent - me.scorePercent) * 10) / 10) : null;

  return (
    <LinearGradient colors={[HT.primarySoft, accent(0.05)]} start={{ x: 0, y: 0 }} end={{ x: 0.4, y: 1 }} style={styles.panel}>
      {/* <View style={styles.glow} pointerEvents="none" /> */}
      <SafeAreaView edges={['top']} style={styles.hero}>
        <View style={styles.topRow}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={styles.eyebrow}>All India{data ? ` · ${total.toLocaleString()} aspirants` : ''}</Text>
            <Text style={styles.title}>Leaderboard</Text>
          </View>
          <View style={styles.iconDisc}>
            <Ionicons name="trophy-outline" size={21} color={HT.primary} />
          </View>
        </View>

        {data && (
          <View style={styles.metaRow}>
            <View style={styles.rankPill} accessibilityLabel={me ? `Your rank ${me.rank} of ${total}` : 'Not ranked yet'}>
              <Text style={styles.rankValue}>{me ? `${me.rank}` : '—'}</Text>
              <Text style={styles.rankLabel}>{me ? `Top ${topPct}%` : 'Not ranked'}</Text>
            </View>

            {me ? (
              <View style={styles.scoreCard}>
                <View style={styles.scoreHead}>
                  <Text style={styles.scoreLabel}>Your average score</Text>
                  <Text style={styles.scoreValue}>{me.scorePercent}%</Text>
                </View>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${Math.min(Math.max(me.scorePercent, 0), 100)}%` }]} />
                </View>
                <Text style={styles.scoreNote} numberOfLines={1}>
                  {me.rank === 1
                    ? 'You lead All India'
                    : gap !== null
                      ? `${gap}% behind #${me.rank - 1}`
                      : `${me.papersAttempted} ${me.papersAttempted === 1 ? 'paper' : 'papers'} counted`}
                </Text>
              </View>
            ) : (
              <Pressable onPress={() => router.push('/tests')} style={styles.scoreCard} accessibilityRole="button">
                <Text style={styles.scoreLabel}>Get your All India rank</Text>
                <View style={styles.ctaRow}>
                  <Text style={styles.ctaText}>Take a full paper</Text>
                  <Ionicons name="arrow-forward" size={14} color={HT.primary} />
                </View>
              </Pressable>
            )}
          </View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

// ─── Top three ──────────────────────────────────────────────────────────

function TopCard({ entry }: { entry: LeaderboardEntry }) {
  const first = entry.rank === 1;
  return (
    <View
      style={[styles.topCard, first && styles.topCardFirst, entry.isMe && styles.topCardMe]}
      accessible
      accessibilityLabel={`Rank ${entry.rank}, ${entry.isMe ? 'you' : entry.name}, ${entry.scorePercent}%`}>
      <View style={[styles.medal, first && styles.medalFirst]}>
        <Text style={[styles.medalText, first && { color: HT.surface }]}>{entry.rank}</Text>
      </View>
      <View style={[styles.avatar, first && styles.avatarFirst]}>
        <Text style={[styles.avatarText, first && { fontSize: 17 }]}>{initials(entry.name)}</Text>
      </View>
      <Text style={styles.topName} numberOfLines={1}>
        {entry.isMe ? 'You' : entry.name.split(' ')[0]}
      </Text>
      <Text style={styles.topScore}>{entry.scorePercent}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: HT.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  muted: { color: HT.muted, textAlign: 'center', fontWeight: '500' },
  btn: { marginTop: 18, alignSelf: 'center', backgroundColor: HT.primary, paddingVertical: 12, paddingHorizontal: 26, borderRadius: HT.radius },
  btnText: { color: HT.surface, fontWeight: '700' },

  // Header panel (matches Home)
  panel: { borderBottomLeftRadius: 24, borderBottomRightRadius: 24, borderBottomWidth: 1, borderColor: accent(0.1), overflow: 'hidden' },
  glow: { position: 'absolute', top: -90, right: -70, width: 220, height: 220, borderRadius: 110, backgroundColor: accent(0.07) },
  hero: { paddingHorizontal: 20, paddingBottom: 18 },
  topRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  eyebrow: { fontSize: 14, color: HT.muted },
  title: { fontSize: 26, fontWeight: '700', color: HT.ink, marginTop: 2, letterSpacing: -0.4 },
  iconDisc: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: HT.bg,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: `0px 2px 8px ${accent(0.12)}`,
  },
  metaRow: { flexDirection: 'row', alignItems: 'stretch', gap: 10, marginTop: 18 },
  rankPill: {
    minWidth: 92,
    justifyContent: 'center',
    paddingHorizontal: 14,
    backgroundColor: HT.bg,
    borderWidth: 1,
    borderColor: accent(0.15),
    borderRadius: HT.radius,
  },
  rankValue: { fontSize: 22, fontWeight: '700', color: HT.ink, fontVariant: ['tabular-nums'], letterSpacing: -0.4 },
  rankLabel: { fontSize: 12, color: HT.primary, fontWeight: '600' },
  scoreCard: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: HT.bg,
    borderWidth: 1,
    borderColor: accent(0.15),
    borderRadius: HT.radius,
    justifyContent: 'center',
  },
  scoreHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  scoreLabel: { fontSize: 12, color: HT.muted },
  scoreValue: { fontSize: 13, fontWeight: '700', color: HT.ink, fontVariant: ['tabular-nums'] },
  track: { height: 4, borderRadius: 2, backgroundColor: HT.hairline, marginTop: 8, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 2, backgroundColor: HT.primary },
  scoreNote: { fontSize: 11.5, color: HT.muted, marginTop: 6 },
  ctaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  ctaText: { fontSize: 14, fontWeight: '700', color: HT.primary },

  body: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24 },
  block: { marginBottom: 28 },
  card: { backgroundColor: HT.surface, borderRadius: HT.radius, borderWidth: 1, borderColor: HT.hairline, overflow: 'hidden' },
  empty: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16 },
  emptyText: { flex: 1, fontSize: 13, fontWeight: '500', color: HT.muted, lineHeight: 19 },

  // Top three
  podium: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  topCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: HT.hairline,
    borderRadius: HT.radius,
    backgroundColor: HT.surface,
  },
  topCardFirst: { paddingVertical: 20, borderColor: accent(0.3), backgroundColor: HT.primarySoft },
  topCardMe: { borderColor: HT.primary },
  medal: { width: 22, height: 22, borderRadius: 11, backgroundColor: HT.primarySoft, alignItems: 'center', justifyContent: 'center' },
  medalFirst: { backgroundColor: HT.primary },
  medalText: { fontSize: 11.5, fontWeight: '700', color: HT.primary, fontVariant: ['tabular-nums'] },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: HT.subtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  avatarFirst: { width: 52, height: 52, borderRadius: 26, backgroundColor: HT.bg },
  avatarText: { fontSize: 15, fontWeight: '700', color: HT.inkSoft },
  topName: { fontSize: 13.5, fontWeight: '700', color: HT.ink, marginTop: 8, maxWidth: '100%' },
  topScore: { fontSize: 12.5, color: HT.muted, marginTop: 2, fontVariant: ['tabular-nums'] },

  gap: { alignItems: 'center', borderTopWidth: 1, borderTopColor: HT.hairline, paddingVertical: 2 },
  gapText: { color: HT.muted, fontWeight: '700' },
  footer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: HT.hairline,
    backgroundColor: HT.bg,
  },
  footnote: { flex: 1, fontSize: 11.5, color: HT.muted, lineHeight: 16 },
});
