import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { STATUS_LABEL } from '@/constants/study-goals';
import type { StudyTaskStatus } from '@/types/api';
import type { PlanItem } from '@/types/dashboard.types';
import { Pressable } from '@/components/ui/pressable';

import { HT } from './home-theme';
import { SectionHeader } from './SectionHeader';

interface Props {
  plan: PlanItem[];
}

// Done first, then what's under way, then what's left — reads top to bottom
// like the day so far.
const ORDER: Record<StudyTaskStatus, number> = { COMPLETED: 0, IN_PROGRESS: 1, PENDING: 2 };

// Today's tasks from the student's study plan as a vertical timeline.
export function TodaysPlan({ plan }: Props) {
  const done = plan.filter((item) => item.status === 'COMPLETED').length;

  if (plan.length === 0) {
    return (
      <View style={styles.section}>
        <SectionHeader title="Today's plan" />
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No goals set for today</Text>
          <Text style={styles.emptyText}>Pick how many stages, questions or tests you want to do each day.</Text>
          <Pressable
            onPress={() => router.push('/daily-tasks')}
            style={({ pressed }) => [styles.emptyBtn, pressed && { backgroundColor: HT.primaryDeep }]}
            accessibilityRole="button">
            <Text style={styles.emptyBtnText}>Set daily goals</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const items = [...plan].sort((a, b) => ORDER[a.status] - ORDER[b.status]);

  return (
    <View style={styles.section}>
      <SectionHeader
        title="Today's plan"
        subtitle={`${done} of ${plan.length} done`}
        actionLabel="Edit plan"
        onAction={() => router.push('/daily-tasks')}
      />
      <View style={styles.card}>
        {items.map((item, i) => {
          const completed = item.status === 'COMPLETED';
          const started = item.status === 'IN_PROGRESS';
          const last = i === items.length - 1;
          const pct = item.target > 0 ? Math.min(100, (item.progress / item.target) * 100) : 0;
          return (
            <Pressable
              key={item.id}
              onPress={() => router.push(item.route)}
              disabled={completed}
              style={({ pressed }) => [styles.row, pressed && { backgroundColor: HT.primarySoft }]}
              accessibilityRole="button"
              accessibilityLabel={`${item.title}, ${item.progress} of ${item.target}, ${STATUS_LABEL[item.status]}`}>
              {/* Rail: the dot plus the line down to the next task */}
              <View style={styles.rail}>
                <View style={[styles.lineTop, i === 0 && styles.lineHidden]} />
                <View style={[styles.dot, started && styles.dotStarted, completed && styles.dotDone]}>
                  {completed && <Ionicons name="checkmark" size={12} color={HT.surface} />}
                  {started && <View style={styles.dotInner} />}
                </View>
                <View style={[styles.lineBottom, last && styles.lineHidden]} />
              </View>

              <View style={styles.body}>
                <View style={styles.head}>
                  <Text style={[styles.title, completed && styles.titleDone]} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={[styles.count, started && styles.countStarted]}>
                    {completed ? 'Done' : `${item.progress}/${item.target}`}
                  </Text>
                </View>
                {started && (
                  <View style={styles.track}>
                    <View style={[styles.fill, { width: `${pct}%` }]} />
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const DOT = 20;

const styles = StyleSheet.create({
  section: { marginBottom: 28 },
  card: { borderRadius: HT.radius, borderWidth: 1, borderColor: HT.hairline, backgroundColor: HT.surface, paddingVertical: 6, overflow: 'hidden' },

  row: { flexDirection: 'row', paddingHorizontal: 16 },
  rail: { width: DOT, alignItems: 'center' },
  lineTop: { width: 2, height: 14, backgroundColor: HT.hairline },
  lineBottom: { width: 2, flex: 1, minHeight: 14, backgroundColor: HT.hairline },
  lineHidden: { backgroundColor: 'transparent' },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    borderWidth: 2,
    borderColor: HT.hairline,
    backgroundColor: HT.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotStarted: { borderColor: HT.primary },
  dotInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: HT.primary },
  dotDone: { borderColor: HT.primary, backgroundColor: HT.primary },

  body: { flex: 1, marginLeft: 14, paddingTop: 13, paddingBottom: 14 },
  head: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 },
  title: { flexShrink: 1, fontSize: 15, color: HT.ink },
  titleDone: { color: HT.muted },
  count: { fontSize: 14, color: HT.muted, fontVariant: ['tabular-nums'] },
  countStarted: { color: HT.primary, fontWeight: '600' },
  track: { height: 4, borderRadius: 2, backgroundColor: HT.hairline, marginTop: 8, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 2, backgroundColor: HT.primary },

  empty: { padding: 16, borderRadius: HT.radius, borderWidth: 1, borderColor: HT.hairline, backgroundColor: HT.surface },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: HT.ink },
  emptyText: { fontSize: 13.5, color: HT.muted, lineHeight: 19, marginTop: 4 },
  emptyBtn: { alignSelf: 'flex-start', marginTop: 14, backgroundColor: HT.primary, paddingVertical: 10, paddingHorizontal: 18, borderRadius: HT.radius },
  emptyBtnText: { fontSize: 14, fontWeight: '600', color: HT.surface },
});
