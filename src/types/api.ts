export type AttemptMode = 'FULL_PAPER' | 'CATEGORY_PRACTICE';

export type AuthUser = {
  id: string;
  username: string | null;
  name: string | null;
  phone?: string | null;
  email?: string | null;
  state?: string | null;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

export type CategorySummary = {
  id: number;
  name: string;
  questionCount: number;
  foodWorldName: string | null;
  icon: string | null;
  color: string | null;
  totalStages: number;
  completedStages: number;
  progress: number;
};

export type StageStatus = 'LOCKED' | 'UNLOCKED' | 'IN_PROGRESS' | 'COMPLETED';

export type StageSummary = {
  id: number;
  stageNumber: number;
  title: string;
  questionCount: number;
  rewardStars: number;
  status: StageStatus;
  starsEarned: number;
  accuracy: number;
};

export type CategoryDetailResponse = {
  id: number;
  name: string;
  foodWorldName: string | null;
  icon: string | null;
  color: string | null;
  questionCount: number;
  totalStages: number;
  completedStages: number;
  completionPercentage: number;
  stages: StageSummary[];
};

export type StageProgress = {
  status: StageStatus;
  completedQuestions: number;
  correctAnswers: number;
  accuracy: number;
  starsEarned: number;
};

export type PaperSummary = {
  id: number;
  year: number;
  title: string | null;
  examType: { code: string; name: string };
  questionCount: number;
};

export type ContinueAttempt = {
  id: number;
  mode: AttemptMode;
  totalQuestions: number;
  answeredCount: number;
  title: string;
};

export type RecentAchievement = {
  stageId: number;
  stageNumber: number;
  categoryName: string;
  foodWorldName: string | null;
  starsEarned: number;
  completedAt: string;
};

export type ContinueLearning =
  | { allCompleted: true }
  | {
      allCompleted: false;
      categoryId: number;
      categoryName: string;
      foodWorldName: string | null;
      stageId: number;
      stageNumber: number;
      questionProgress: { completed: number; total: number };
      resumeUrl: string;
    };

export type UserStats = {
  accuracy: number;
  questionsSolved: number;
};

export type TodaysFocus = {
  answeredToday: boolean;
  dailyChallenge: { completed: boolean; starsEarned: number | null };
};

export type DashboardResponse = {
  streak: number;
  longestStreak: number;
  stats: UserStats;
  recentActivity: boolean[];
  todaysFocus: TodaysFocus;
  continueAttempt: ContinueAttempt | null;
  categories: CategorySummary[];
  papers: PaperSummary[];
  categoryProgress: CategorySummary[];
  continueLearning: ContinueLearning;
  recentAchievements: RecentAchievement[];
};

export type StreakDayStatus = 'done' | 'today' | 'future' | 'missed';

export type StreakCalendarDay = { day: number; hasActivity: boolean; isToday: boolean } | null;

export type StreakResponse = {
  streak: number;
  longestStreak: number;
  totalActiveDays: number;
  daysKeptPercent: number;
  freezesAvailable: number;
  freezesUsed: number;
  nextMilestone: number;
  weekStrip: { label: string; status: StreakDayStatus }[];
  calendar: {
    year: number;
    month: number;
    days: StreakCalendarDay[];
  };
};

export type AttemptHistoryItem = {
  id: number;
  mode: AttemptMode;
  startedAt: string;
  completedAt: string | null;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  title: string;
};

export type SafeOption = {
  id: number;
  label: string;
  text: string;
};

export type QuestionDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export type SafeQuestion = {
  id: number;
  text: string;
  questionImage?: string | null;
  categoryId: number;
  difficulty: QuestionDifficulty;
  category: { id: number; name: string };
  questionPaper?: { year: number } | null;
  options: SafeOption[];
};

export type StageDetailResponse = {
  id: number;
  stageNumber: number;
  title: string;
  foodWorldName: string | null;
  questionCount: number;
  rewardStars: number;
  category: { id: number; name: string };
  rewardThresholds: { threeStars: number; twoStars: number; oneStar: number };
  progress: StageProgress | null;
  questions: SafeQuestion[];
};

export type StageSubmitResponse = {
  stageId: number;
  completedQuestions: number;
  correctAnswers: number;
  accuracy: number;
  starsEarned: number;
  firstCompletion: boolean;
  nextStageUnlocked: boolean;
  nextStageId: number | null;
  nextStageNumber: number | null;
};

export type StageResultQuestion = {
  id: number;
  text: string;
  questionImage: string | null;
  explanation: string | null;
  options: { id: number; label: string; text: string; isCorrect: boolean }[];
  selectedOptionId: number | null;
  isCorrect: boolean;
};

export type StageResultsResponse = {
  stageId: number;
  stageNumber: number;
  foodWorldName: string | null;
  category: { id: number; name: string };
  accuracy: number;
  correctAnswers: number;
  completedQuestions: number;
  questions: StageResultQuestion[];
};

export type DailyChallengeProgress = {
  completedQuestions: number;
  correctAnswers: number;
  accuracy: number;
  starsEarned: number;
  completedAt: string | null;
};

export type DailyChallengeResponse = {
  id: number;
  questionCount: number;
  questions: SafeQuestion[];
  progress: DailyChallengeProgress | null;
};

export type DailyChallengeSubmitResponse = {
  challengeId: number;
  completedQuestions: number;
  correctAnswers: number;
  accuracy: number;
  starsEarned: number;
};

export type AttemptAnswerState = {
  questionId: number;
  selectedOptionId: number | null;
  isCorrect: boolean;
};

export type AttemptDetailResponse = {
  id: number;
  mode: AttemptMode;
  totalQuestions: number;
  completedAt: string | null;
  questions: SafeQuestion[];
  answers: AttemptAnswerState[];
};

export type SubmitAnswerResponse = {
  isCorrect: boolean;
  correctOptionId: number | null;
  explanation: string | null;
};

export type CompleteAttemptResponse = {
  id: number;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  scorePercent: number;
};

export type ResultOption = SafeOption & { isCorrect: boolean };

export type ResultQuestion = {
  id: number;
  text: string;
  questionImage?: string | null;
  explanation: string | null;
  category: { id: number; name: string };
  questionPaper?: { year: number } | null;
  options: ResultOption[];
  selectedOptionId: number | null;
  isCorrect: boolean;
};

export type AttemptResultsResponse = {
  id: number;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  scorePercent: number;
  questions: ResultQuestion[];
};
