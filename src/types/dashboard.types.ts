import type { Ionicons } from '@expo/vector-icons';
import type { Href } from 'expo-router';

import type { LeaderboardResponse, StudyTaskStatus } from './api';

// What the Home screen renders, derived from GET /api/dashboard by
// useHomeDashboard. Every number here is computed by the backend; this layer
// only formats it.

export type PlanItem = {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  progress: number;
  target: number;
  status: StudyTaskStatus;
  route: Href;
};

export type ContinueItem = {
  title: string;
  type: string;
  /** e.g. "4 of 10 questions" */
  progressLabel: string;
  progress: number; // 0-100
  started: boolean;
  route: Href;
};

export type CategoryItem = {
  categoryId: number;
  name: string;
  accuracy: number; // 0-100
  answered: number;
};

export type HomeData = {
  greeting: string;
  studentName: string;
  targetLabel: string | null;
  notificationCount: number;
  streak: number;
  dailyGoal: { completed: number; total: number };
  continueLearning: ContinueItem | null;
  stats: { questionsSolved: number; accuracy: number; syllabusCoverage: number; paperTests: number };
  todaysPlan: PlanItem[];
  performance: { strong: CategoryItem[]; weak: CategoryItem[]; hasRatedCategories: boolean; minAnswers: number };
  leaderboard: LeaderboardResponse;
};
