import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HT } from '@/components/home/home-theme';
import { PageHeader } from '@/components/home/PageHeader';
import { SectionHeader } from '@/components/home/SectionHeader';
import { Toast, type ToastData } from '@/components/toast';
import { GOAL_META, GOAL_ORDER, STATUS_LABEL } from '@/constants/study-goals';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api-client';
import type { StudyDay, StudyGoal, StudyGoalType, StudyPlanResponse, StudyTaskStatus } from '@/types/api';
import { Pressable } from '@/components/ui/pressable';

type Draft = Record<StudyGoalType, { enabled: boolean; target: number }>;

// Starting targets for goals the student hasn't switched on yet.
const SUGGESTED_TARGET: Record<StudyGoalType, number> = { STAGES: 2, QUESTIONS: 30, DAILY_CHALLENGE: 1, FULL_TEST: 1 };

const STATUS_COLOR: Record<StudyTaskStatus, string> = { PENDING: HT.muted, IN_PROGRESS: HT.amber, COMPLETED: HT.green };

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function draftFrom(goals: StudyGoal[]): Draft {
  const draft = {} as Draft;
  for (const type of GOAL_ORDER) {
    const goal = goals.find((g) => g.type === type);
    draft[type] = { enabled: Boolean(goal), target: goal?.target ?? SUGGESTED_TARGET[type] };
  }
  return draft;
}

function goalsFrom(draft: Draft): StudyGoal[] {
  return GOAL_ORDER.filter((t) => draft[t].enabled).map((type) => ({ type, target: draft[type].target }));
}

function sameGoals(a: StudyGoal[], b: StudyGoal[]) {
  return a.length === b.length && a.every((g, i) => g.type === b[i].type && g.target === b[i].target);
}

// "2026-10-12" (a UTC day) → "Mon, 12 Oct"
function dayLabel(date: string) {
  const d = new Date(`${date}T00:00:00Z`);
  return `${WEEKDAYS[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

// Configure recurring daily goals and review the daily reports they produce.
export default function DailyTasksScreen() {
  const { token } = useAuth();
  const [data, setData] = useState<StudyPlanResponse | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setData(await api.studyPlan(token, setData));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load your study plan.');
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // Seed the editor from the saved plan the first time it arrives.
  if (data && !draft) setDraft(draftFrom(data.goals));

  const goals = draft ? goalsFrom(draft) : [];
  const dirty = Boolean(data && draft && !sameGoals(goals, data.goals));

  const save = async () => {
    if (!token || goals.length === 0) return;
    setSaving(true);
    try {
      const fresh = await api.saveStudyPlan(token, goals);
      setData(fresh);
      setDraft(draftFrom(fresh.goals));
      setToast({ type: 'success', message: 'Study plan saved' });
    } catch (e) {
      setToast({ type: 'error', message: e instanceof Error ? e.message : 'Could not save your plan.' });
    } finally {
      setSaving(false);
    }
  };

  const update = (type: StudyGoalType, change: Partial<Draft[StudyGoalType]>) =>
    setDraft((d) => (d ? { ...d, [type]: { ...d[type], ...change } } : d));

  return (
    <View style={styles.screen}>
      <PageHeader title="Daily tasks" subtitle="Set your goals and track each day" />

      {!data ? (
        <View style={styles.center}>
          {error ? (
            <>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable onPress={load} style={styles.retryBtn} accessibilityRole="button">
                <Text style={styles.retryText}>Try again</Text>
              </Pressable>
            </>
          ) : (
            <ActivityIndicator color={HT.primary} />
          )}
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          <SectionHeader title="Today's report" subtitle={dayLabel(data.today.date)} />
          <DayReport day={data.today} interactive />

          <View style={{ height: 28 }} />
          <SectionHeader title="Daily goals" subtitle="Repeats every day" />
          <View style={styles.card}>
            {draft &&
              GOAL_ORDER.map((type, i) => {
                const meta = GOAL_META[type];
                const { min, max } = data.limits[type];
                const goal = draft[type];
                const fixed = min === max;
                return (
                  <View key={type} style={[styles.goalRow, i > 0 && styles.rowBorder]}>
                    <View style={styles.goalIcon}>
                      <Ionicons name={meta.icon} size={16} color={HT.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.goalLabel}>{meta.label}</Text>
                      <Text style={styles.goalDesc}>{meta.description}</Text>
                      {goal.enabled && !fixed && (
                        <View style={styles.stepper}>
                          <StepButton
                            icon="remove"
                            disabled={goal.target <= min}
                            onPress={() => update(type, { target: Math.max(min, goal.target - meta.step) })}
                            label={`Fewer ${meta.label}`}
                          />
                          <Text style={styles.stepValue}>{meta.unit(goal.target)} / day</Text>
                          <StepButton
                            icon="add"
                            disabled={goal.target >= max}
                            onPress={() => update(type, { target: Math.min(max, goal.target + meta.step) })}
                            label={`More ${meta.label}`}
                          />
                        </View>
                      )}
                    </View>
                    <Switch
                      value={goal.enabled}
                      onValueChange={(enabled) => update(type, { enabled })}
                      trackColor={{ false: HT.hairline, true: HT.primary }}
                      thumbColor={HT.surface}
                      accessibilityLabel={`${meta.label} goal`}
                    />
                  </View>
                );
              })}
          </View>
          <Text style={styles.note}>
            Changes apply to today and every day after. Past reports keep the goals they had.
          </Text>

          <Pressable
            onPress={save}
            disabled={!dirty || saving || goals.length === 0}
            style={[styles.saveBtn, (!dirty || goals.length === 0) && styles.saveBtnDisabled]}
            accessibilityRole="button">
            {saving ? (
              <ActivityIndicator color={HT.surface} />
            ) : (
              <Text style={styles.saveText}>{goals.length === 0 ? 'Turn on at least one goal' : 'Save plan'}</Text>
            )}
          </Pressable>

          {data.history.length > 0 && (
            <>
              <View style={{ height: 28 }} />
              <SectionHeader title="Past reports" subtitle="Last 14 days" />
              {data.history.map((day) => (
                <View key={day.date} style={{ marginBottom: 12 }}>
                  <Text style={styles.historyDate}>{dayLabel(day.date)}</Text>
                  <DayReport day={day} />
                </View>
              ))}
            </>
          )}
        </ScrollView>
      )}

      <SafeAreaView edges={['bottom']} />
      <Toast toast={toast} onHide={() => setToast(null)} />
    </View>
  );
}

function DayReport({ day, interactive }: { day: StudyDay; interactive?: boolean }) {
  const allDone = day.total > 0 && day.completed === day.total;
  return (
    <View style={styles.card}>
      <View style={styles.reportHead}>
        <Text style={styles.reportSummary}>
          <Text style={styles.reportStrong}>{day.completed}</Text> of {day.total} completed
        </Text>
        {allDone && (
          <View style={styles.doneChip}>
            <Ionicons name="checkmark-circle" size={13} color={HT.green} />
            <Text style={styles.doneChipText}>Goal met</Text>
          </View>
        )}
      </View>
      {day.tasks.map((task) => {
        const meta = GOAL_META[task.type];
        const pct = task.target > 0 ? Math.round((task.progress / task.target) * 100) : 0;
        const row = (
          <>
            <View style={{ flex: 1 }}>
              <View style={styles.taskHead}>
                <Text style={styles.taskTitle}>{meta.title(task.target)}</Text>
                <Text style={[styles.taskStatus, { color: STATUS_COLOR[task.status] }]}>{STATUS_LABEL[task.status]}</Text>
              </View>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${Math.max(pct, 2)}%`, backgroundColor: STATUS_COLOR[task.status] }]} />
              </View>
              <Text style={styles.taskCount}>
                {task.progress} of {meta.unit(task.target)}
              </Text>
            </View>
            {interactive && task.status !== 'COMPLETED' && <Ionicons name="chevron-forward" size={16} color={HT.muted} />}
          </>
        );
        return interactive && task.status !== 'COMPLETED' ? (
          <Pressable
            key={task.type}
            onPress={() => router.push(meta.route)}
            style={({ pressed }) => [styles.taskRow, pressed && { backgroundColor: HT.bg }]}
            accessibilityRole="button">
            {row}
          </Pressable>
        ) : (
          <View key={task.type} style={styles.taskRow}>
            {row}
          </View>
        );
      })}
    </View>
  );
}

function StepButton({ icon, disabled, onPress, label }: { icon: 'add' | 'remove'; disabled: boolean; onPress: () => void; label: string }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      style={[styles.stepBtn, disabled && { opacity: 0.35 }]}
      accessibilityRole="button"
      accessibilityLabel={label}>
      <Ionicons name={icon} size={15} color={HT.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: HT.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  errorText: { color: HT.muted, textAlign: 'center', fontWeight: '500' },
  retryBtn: { marginTop: 16, backgroundColor: HT.primary, paddingVertical: 11, paddingHorizontal: 26, borderRadius: HT.radius },
  retryText: { color: HT.surface, fontWeight: '700' },
  body: { padding: 20, paddingBottom: 40 },

  card: { backgroundColor: HT.surface, borderRadius: HT.radius, borderWidth: 1, borderColor: HT.hairline, overflow: 'hidden' },
  rowBorder: { borderTopWidth: 1, borderTopColor: HT.hairline },

  reportHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 11,
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 1,
    borderBottomColor: HT.hairline,
  },
  reportSummary: { fontSize: 12.5, fontWeight: '600', color: HT.muted },
  reportStrong: { fontWeight: '700', color: HT.ink },
  doneChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  doneChipText: { fontSize: 11.5, fontWeight: '700', color: HT.green },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  taskHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  taskTitle: { flex: 1, fontSize: 13.5, fontWeight: '700', color: HT.ink },
  taskStatus: { fontSize: 11, fontWeight: '700' },
  track: { height: 4, backgroundColor: HT.hairline, borderRadius: HT.radius, marginTop: 8, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: HT.radius },
  taskCount: { fontSize: 11, fontWeight: '600', color: HT.muted, marginTop: 5 },

  goalRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  goalIcon: { width: 32, height: 32, borderRadius: HT.radius, backgroundColor: HT.primarySoft, alignItems: 'center', justifyContent: 'center' },
  goalLabel: { fontSize: 14, fontWeight: '700', color: HT.ink },
  goalDesc: { fontSize: 12, fontWeight: '500', color: HT.muted, marginTop: 2 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: HT.radius,
    borderWidth: 1,
    borderColor: HT.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: { flexShrink: 1, fontSize: 13, fontWeight: '700', color: HT.ink, minWidth: 88, textAlign: 'center' },

  note: { fontSize: 12, fontWeight: '500', color: HT.muted, marginTop: 10, lineHeight: 17 },
  saveBtn: { marginTop: 16, backgroundColor: HT.primary, paddingVertical: 14, alignItems: 'center', borderRadius: HT.radius },
  saveBtnDisabled: { backgroundColor: HT.primarySoft },
  saveText: { color: HT.surface, fontWeight: '700', fontSize: 14.5 },

  historyDate: { fontSize: 12, fontWeight: '700', color: HT.inkSoft, marginBottom: 6 },
});
