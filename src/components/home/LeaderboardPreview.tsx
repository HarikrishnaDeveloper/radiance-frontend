import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import type { LeaderboardEntry, LeaderboardResponse } from '@/types/api';
import { Pressable } from '@/components/ui/pressable';

import { HT } from './home-theme';
import { SectionHeader } from './SectionHeader';

interface Props {
  leaderboard: LeaderboardResponse;
}

// Top students by full-paper test marks, plus the student's own rank when
// they're outside the top rows.
export function LeaderboardPreview({ leaderboard }: Props) {
  const { top, me, totalRanked } = leaderboard;
  const meInTop = top.some((e) => e.isMe);

  return (
    <View style={styles.section}>
      <SectionHeader
        subtitle="From full paper tests"
        title="Leaderboard"
        actionLabel={top.length > 0 ? 'View all' : undefined}
        onAction={() => router.push('/leaderboard')}
      />
      <View style={styles.card}>
        {top.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="trophy-outline" size={18} color={HT.muted} />
            <Text style={styles.emptyText}>No rankings yet. Take a full paper test in Exam mode to get on the board.</Text>
          </View>
        ) : (
          <>
            {top.map((entry, i) => (
              <LeaderboardRow key={entry.userId} entry={entry} first={i === 0} />
            ))}
            {me && !meInTop && (
              <>
                <View style={styles.gap}>
                  <Text style={styles.gapText}>···</Text>
                </View>
                <LeaderboardRow entry={me} first />
              </>
            )}
          </>
        )}
        {top.length > 0 && !me && (
          <Pressable onPress={() => router.push('/tests')} style={styles.footer} accessibilityRole="button">
            <Text style={styles.footerText}>Take a full paper test in Exam mode to get ranked</Text>
            <Ionicons name="arrow-forward" size={13} color={HT.primary} />
          </Pressable>
        )}
        {me && (
          <View style={styles.footer}>
            <Text style={styles.footerMuted}>
              You&apos;re #{me.rank} of {totalRanked}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

// Top three ranks get the accent; everyone else a plain grey disc.
const MEDAL = [HT.primary, HT.primary, HT.primary];

export function LeaderboardRow({ entry, first }: { entry: LeaderboardEntry; first?: boolean }) {
  const medal = entry.rank <= 3 ? MEDAL[entry.rank - 1] : null;
  return (
    <View
      style={[styles.row, !first && styles.rowBorder, entry.isMe && styles.rowMe]}
      accessibilityLabel={`Rank ${entry.rank}, ${entry.isMe ? 'you' : entry.name}, ${entry.scorePercent}%`}>
      <View style={[styles.rank, medal ? { backgroundColor: medal } : null]}>
        <Text style={[styles.rankText, medal ? { color: HT.surface } : null]}>{entry.rank}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.name} numberOfLines={1}>
          {entry.name}
          {entry.isMe && <Text style={styles.you}> (You)</Text>}
        </Text>
        <Text style={styles.meta}>
          {entry.papersAttempted} {entry.papersAttempted === 1 ? 'paper' : 'papers'}
        </Text>
      </View>
      <Text style={styles.score}>{entry.scorePercent}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 28 },
  card: { backgroundColor: HT.surface, borderRadius: HT.radius, borderWidth: 1, borderColor: HT.hairline, overflow: 'hidden' },
  empty: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16 },
  emptyText: { flex: 1, fontSize: 13, fontWeight: '500', color: HT.muted, lineHeight: 19 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  rowBorder: { borderTopWidth: 1, borderTopColor: HT.hairline },
  rowMe: { backgroundColor: HT.primarySoft },
  rank: { width: 28, height: 28, borderRadius: 14, backgroundColor: HT.bg, alignItems: 'center', justifyContent: 'center' },
  rankText: { fontSize: 12, fontWeight: '700', color: HT.inkSoft, fontVariant: ['tabular-nums'] },
  name: { fontSize: 14, fontWeight: '700', color: HT.ink },
  you: { color: HT.primary, fontWeight: '700' },
  meta: { fontSize: 11, fontWeight: '600', color: HT.muted, marginTop: 2 },
  score: { fontSize: 15, fontWeight: '700', color: HT.ink, fontVariant: ['tabular-nums'] },

  gap: { alignItems: 'center', borderTopWidth: 1, borderTopColor: HT.hairline, paddingVertical: 2 },
  gapText: { color: HT.muted, fontWeight: '700' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: HT.hairline,
    paddingVertical: 11,
    backgroundColor: '#FAFAFA',
  },
  footerText: { fontSize: 12.5, fontWeight: '700', color: HT.primary },
  footerMuted: { fontSize: 12, fontWeight: '600', color: HT.muted },
});
