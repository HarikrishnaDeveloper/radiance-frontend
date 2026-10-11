import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import { quoteForDate } from '@/constants/motivation';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api-client';
import type { AuthUser, DashboardResponse } from '@/types/api';
import type { HomeData, PlanItem, WeakAreaLevel } from '@/types/dashboard.types';

const EXAM_LABELS: Record<string, string> = { UPSC_CSE: 'UPSC CSE', GROUP_1: 'Group 1' };

// Home screen data: the real dashboard from the API, reloaded whenever Home
// regains focus (e.g. after finishing a test), shaped for the Home components.
export function useHomeDashboard() {
  const { token, user } = useAuth();
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

  const data = useMemo(() => (dashboard ? toHomeData(dashboard, user) : null), [dashboard, user]);

  return {
    data,
    isLoading: !dashboard && !error,
    error: dashboard ? null : error,
    refreshing,
    refetch: () => load(true),
  };
}

function toHomeData(d: DashboardResponse, user: AuthUser | null): HomeData {
  const totalStages = d.categoryProgress.reduce((sum, c) => sum + (c.totalStages ?? 0), 0);
  const completedStages = d.categoryProgress.reduce((sum, c) => sum + (c.completedStages ?? 0), 0);

  return {
    greeting: greetingFor(new Date()),
    studentName: firstName(user),
    targetLabel: targetLabel(user),
    streak: d.streak,
    overallProgress: totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0,
    questionsSolved: d.stats.questionsSolved,
    accuracy: d.stats.accuracy,
    paperTestsCompleted: d.stats.paperTestsCompleted ?? 0,
    todaysPlan: planFor(d),
    continueLearning: continueFor(d),
    weakAreas: (d.weakAreas ?? []).map((w) => ({
      categoryId: w.categoryId,
      topicName: w.name,
      accuracy: w.accuracy,
      answered: w.answered,
      level: levelFor(w.accuracy),
    })),
    dailyMotivation: quoteForDate(),
  };
}

function planFor(d: DashboardResponse): PlanItem[] {
  const plan: PlanItem[] = [
    {
      id: 'daily-challenge',
      title: "Complete today's Daily Challenge",
      isCompleted: d.todaysFocus.dailyChallenge.completed,
      route: '/daily-challenge',
    },
    {
      id: 'streak',
      title: d.streak > 0 ? `Keep your ${d.streak}-day streak going` : 'Answer a question to start a streak',
      isCompleted: d.todaysFocus.answeredToday,
      route: '/practice',
    },
  ];
  if (!d.continueLearning.allCompleted) {
    const c = d.continueLearning;
    plan.push({
      id: 'stage',
      title: `Clear ${c.foodWorldName ?? c.categoryName} · Stage ${c.stageNumber}`,
      isCompleted: false,
      route: `/stage/${c.stageId}`,
    });
  }
  return plan;
}

function continueFor(d: DashboardResponse): HomeData['continueLearning'] {
  const attempt = d.continueAttempt;
  if (attempt) {
    return {
      title: attempt.title,
      type: attempt.mode === 'FULL_PAPER' ? 'Paper test' : 'Practice',
      progress: attempt.totalQuestions > 0 ? Math.round((attempt.answeredCount / attempt.totalQuestions) * 100) : 0,
      route: attempt.mode === 'FULL_PAPER' ? `/test/${attempt.id}` : `/quiz/${attempt.id}`,
    };
  }
  const c = d.continueLearning;
  if (c.allCompleted) return null;
  const { completed, total } = c.questionProgress;
  return {
    title: `${c.foodWorldName ?? c.categoryName} · Stage ${c.stageNumber}`,
    type: 'Stage',
    progress: total > 0 ? Math.round((completed / total) * 100) : 0,
    route: `/stage/${c.stageId}`,
  };
}

function greetingFor(now: Date) {
  const hour = now.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function firstName(user: AuthUser | null) {
  const full = user?.profile?.fullName?.trim() || user?.name?.trim() || user?.username?.trim();
  return full ? full.split(/\s+/)[0] : '';
}

function targetLabel(user: AuthUser | null) {
  const profile = user?.profile;
  const exam = profile ? EXAM_LABELS[profile.targetExam] : undefined;
  if (!exam) return null;
  return profile?.targetAttempt ? `${exam} ${profile.targetAttempt}` : exam;
}

function levelFor(accuracy: number): WeakAreaLevel {
  if (accuracy < 50) return 'red';
  if (accuracy < 70) return 'orange';
  return 'green';
}
