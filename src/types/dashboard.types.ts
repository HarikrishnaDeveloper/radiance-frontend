import type { Href } from 'expo-router';

// What the Home screen renders, derived from GET /api/dashboard and the
// signed-in user's profile by useHomeDashboard.

export type PlanItem = {
  id: string;
  title: string;
  isCompleted: boolean;
  route: Href;
};

export type ContinueItem = {
  title: string;
  type: string;
  progress: number; // 0-100
  route: Href;
};

export type WeakAreaLevel = 'red' | 'orange' | 'green';

export type WeakAreaItem = {
  categoryId: number;
  topicName: string;
  accuracy: number; // 0-100
  answered: number;
  level: WeakAreaLevel;
};

export type HomeData = {
  greeting: string;
  studentName: string;
  targetLabel: string | null;
  streak: number;
  overallProgress: number; // 0-100, share of stages completed
  questionsSolved: number;
  accuracy: number; // 0-100
  paperTestsCompleted: number;
  todaysPlan: PlanItem[];
  continueLearning: ContinueItem | null;
  weakAreas: WeakAreaItem[];
  dailyMotivation: string;
};
