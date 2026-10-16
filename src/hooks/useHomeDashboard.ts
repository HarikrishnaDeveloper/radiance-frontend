import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import { GOAL_META } from '@/constants/study-goals';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api-client';
import type { CategoryScore, DashboardResponse } from '@/types/api';
import type { CategoryItem, HomeData } from '@/types/dashboard.types';

const EXAM_LABELS: Record<string, string> = { UPSC_CSE: 'UPSC CSE', GROUP_1: 'Group 1' };

// Home screen data: the real dashboard from the API, reloaded whenever Home
// regains focus (e.g. after finishing a test), shaped for the Home components.
export function useHomeDashboard() {
  const { token } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (force = false) => {
      if (!token) return;
      if (force) setRefreshing(true);
      try {
        // Cached copy renders instantly; onUpdate swaps in the fresh one.
        const data = await api.dashboard(token, setDashboard, force);
        setDashboard(data);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e : new Error('Failed to load dashboard'));
      } finally {
        setRefreshing(false);
      }
    },
    [token]
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const data = useMemo(() => (dashboard ? toHomeData(dashboard) : null), [dashboard]);

  return {
    data,
    isLoading: !dashboard && !error,
    error: dashboard ? null : error,
    refreshing,
    refetch: () => load(true),
  };
}

function toHomeData(d: DashboardResponse): HomeData {
  return {
    greeting: greetingFor(new Date()),
    studentName: d.student.name.trim().split(/\s+/)[0] ?? '',
    targetLabel: targetLabel(d.student),
    notificationCount: d.notifications.length,
    streak: d.streak,
    dailyGoal: { completed: d.dailyGoal.completed, total: d.dailyGoal.total },
    continueLearning: continueFor(d),
    stats: {
      questionsSolved: d.stats.questionsSolved,
      accuracy: d.stats.accuracy,
      syllabusCoverage: d.stats.syllabusCoverage,
      paperTests: d.stats.paperTestsCompleted,
    },
    todaysPlan: d.dailyGoal.tasks.map((task) => {
      const meta = GOAL_META[task.type];
      return {
        id: task.type,
        title: meta.title(task.target),
        icon: meta.icon,
        progress: task.progress,
        target: task.target,
        status: task.status,
        // "Clear N stages" goes straight to the student's next stage when there is one.
        route: task.type === 'STAGES' && !d.continueLearning.allCompleted ? `/stage/${d.continueLearning.stageId}` : meta.route,
      };
    }),
    performance: toPerformance(d),
    leaderboard: d.leaderboard,
  };
}

// Strong / weak subjects, shared by Home and the Practice tab.
export function toPerformance(d: DashboardResponse): HomeData['performance'] {
  return {
    strong: d.categoryPerformance.strong.map(toCategoryItem),
    weak: d.categoryPerformance.weak.map(toCategoryItem),
    hasRatedCategories: d.categoryPerformance.ratedCategories > 0,
    minAnswers: d.categoryPerformance.minAnswersToRate,
  };
}

function toCategoryItem(c: CategoryScore): CategoryItem {
  return { categoryId: c.categoryId, name: c.name, accuracy: c.accuracy, answered: c.answered };
}

// The unfinished test/practice set if there is one, otherwise the student's
// current (or next) stage. Null when every stage is done and nothing is open.
function continueFor(d: DashboardResponse): HomeData['continueLearning'] {
  const attempt = d.continueAttempt;
  if (attempt) {
    return {
      title: attempt.title,
      type: attempt.mode === 'FULL_PAPER' ? 'Paper test' : 'Category practice',
      progressLabel: `${attempt.answeredCount} of ${attempt.totalQuestions} questions`,
      progress: attempt.totalQuestions > 0 ? Math.round((attempt.answeredCount / attempt.totalQuestions) * 100) : 0,
      started: true,
      route: attempt.mode === 'FULL_PAPER' ? `/test/${attempt.id}` : `/quiz/${attempt.id}`,
    };
  }
  const c = d.continueLearning;
  if (c.allCompleted) return null;
  const { completed, total } = c.questionProgress;
  return {
    title: `${c.categoryName} · Stage ${c.stageNumber}`,
    type: 'Category practice',
    progressLabel: `${completed} of ${total} questions`,
    progress: total > 0 ? Math.round((completed / total) * 100) : 0,
    started: completed > 0,
    route: `/stage/${c.stageId}`,
  };
}

function greetingFor(now: Date) {
  const hour = now.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function targetLabel(student: DashboardResponse['student']) {
  const exam = student.targetExam ? EXAM_LABELS[student.targetExam] : undefined;
  if (!exam) return null;
  return student.targetAttempt ? `${exam} ${student.targetAttempt}` : exam;
}
