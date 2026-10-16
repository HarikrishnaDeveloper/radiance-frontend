import type { Ionicons } from '@expo/vector-icons';
import type { Href } from 'expo-router';

import type { StudyGoalType, StudyTaskStatus } from '@/types/api';

type GoalMeta = {
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  unit: (n: number) => string;
  /** Task title for a target, e.g. "Complete 2 practice stages". */
  title: (target: number) => string;
  route: Href;
  /** Stepper increment on the Daily Tasks screen. */
  step: number;
};

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export const GOAL_META: Record<StudyGoalType, GoalMeta> = {
  STAGES: {
    label: 'Category practice',
    description: 'Clear subject-wise PYQ stages',
    icon: 'book',
    unit: (n) => plural(n, 'stage', 'stages'),
    title: (n) => `Complete ${plural(n, 'practice stage', 'practice stages')}`,
    route: '/practice',
    step: 1,
  },
  QUESTIONS: {
    label: 'Questions',
    description: 'Answer PYQs in any mode',
    icon: 'help-circle',
    unit: (n) => plural(n, 'question', 'questions'),
    title: (n) => `Answer ${plural(n, 'question', 'questions')}`,
    route: '/practice',
    step: 10,
  },
  DAILY_CHALLENGE: {
    label: 'Daily Challenge',
    description: '10 mixed questions, once a day',
    icon: 'flash',
    unit: () => 'challenge',
    title: () => "Finish today's Daily Challenge",
    route: '/daily-challenge',
    step: 1,
  },
  FULL_TEST: {
    label: 'Full paper test',
    description: 'Timed exam simulation',
    icon: 'document-text',
    unit: (n) => plural(n, 'test', 'tests'),
    title: (n) => `Complete ${plural(n, 'full paper test', 'full paper tests')}`,
    route: '/tests',
    step: 1,
  },
};

export const GOAL_ORDER: StudyGoalType[] = ['STAGES', 'QUESTIONS', 'DAILY_CHALLENGE', 'FULL_TEST'];

export const STATUS_LABEL: Record<StudyTaskStatus, string> = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
};
