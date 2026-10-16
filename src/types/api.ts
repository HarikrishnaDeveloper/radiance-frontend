export type AttemptMode = 'FULL_PAPER' | 'CATEGORY_PRACTICE';

export type UserProfileData = {
  fullName: string;
  targetExam: string;
  preparationLevel: string;
  targetAttempt?: string | null;
  preparationFocus: string;
};

export type AuthUser = {
  id: string;
  username: string | null;
  name: string | null;
  phone?: string | null;
  email?: string | null;
  state?: string | null;
  profileCompleted: boolean;
  profile?: UserProfileData | null;
  isTestUser: boolean;
  isPremium: boolean;
};

export type SubscriptionStatus =
  | 'CREATED'
  | 'AUTHENTICATED'
  | 'ACTIVE'
  | 'PENDING'
  | 'HALTED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'EXPIRED';

export type SubscriptionStatusResponse = {
  isTestUser: boolean;
  isPremium: boolean;
  freeStageLimit: number;
  freeStagesUsed: number;
  monthlyAmountPaise: number;
  subscription: { status: SubscriptionStatus; currentStart: string | null; currentEnd: string | null } | null;
};

export type CreateSubscriptionResponse = {
  subscriptionId: string;
  keyId: string;
  amount: number;
  currency: string;
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
  requiresSubscription: boolean;
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
  // Only on GET /api/papers — the dashboard's paper list omits these.
  durationSeconds?: number;
  locked?: boolean;
  isFree?: boolean;
  attemptCount?: number;
  bestScore?: { score: number; maxScore: number; attemptId: number } | null;
  inProgressAttemptId?: number | null;
};

// EXAM: one overall timer, UPSC marking, feedback only after submitting.
// PRACTICE: untimed, explanation + review points right after each answer.
export type TestMode = 'EXAM' | 'PRACTICE';

export type Marking = { correct: number; wrong: number };

export type PaperSection = {
  categoryId: number;
  name: string;
  questionCount: number;
  durationSeconds: number;
  inProgressAttemptId: number | null;
};

export type PaperAttemptSummary = {
  id: number;
  testMode: TestMode;
  section: { id: number; name: string } | null;
  startedAt: string;
  completedAt: string | null;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  score: number | null;
  maxScore: number | null;
};

export type PaperDetailResponse = {
  id: number;
  year: number;
  title: string | null;
  examType: { code: string; name: string };
  questionCount: number;
  durationSeconds: number;
  marking: Marking & { maxScore: number };
  locked: boolean;
  isFree: boolean;
  sections: PaperSection[];
  inProgressAttemptId: number | null;
  attempts: PaperAttemptSummary[];
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
  /** correct ÷ (correct + incorrect) × 100 */
  accuracy: number;
  questionsSolved: number;
  /** Completed stages ÷ published stages × 100 */
  syllabusCoverage: number;
  /** Completed whole-paper tests */
  paperTestsCompleted: number;
};

export type CategoryScore = { categoryId: number; name: string; answered: number; correct: number; accuracy: number };

export type CategoryPerformance = {
  strong: CategoryScore[];
  weak: CategoryScore[];
  ratedCategories: number;
  minAnswersToRate: number;
};

export type StudyGoalType = 'STAGES' | 'QUESTIONS' | 'DAILY_CHALLENGE' | 'FULL_TEST';

export type StudyTaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export type StudyTask = { type: StudyGoalType; target: number; progress: number; status: StudyTaskStatus };

/** One day's tasks; `date` is a UTC YYYY-MM-DD. */
export type StudyDay = { date: string; tasks: StudyTask[]; completed: number; total: number };

export type StudyGoal = { type: StudyGoalType; target: number };

export type StudyPlanResponse = {
  goals: StudyGoal[];
  limits: Record<StudyGoalType, { min: number; max: number }>;
  today: StudyDay;
  /** Earlier days, most recent first. */
  history: StudyDay[];
};

export type LeaderboardEntry = {
  rank: number;
  userId: string;
  name: string;
  scorePercent: number;
  papersAttempted: number;
  isMe: boolean;
};

export type LeaderboardResponse = {
  top: LeaderboardEntry[];
  me: LeaderboardEntry | null;
  totalRanked: number;
};

export type AppNotification = {
  id: string;
  kind: 'reminder' | 'update';
  title: string;
  body: string;
  route: string;
};

export type TodaysFocus = {
  answeredToday: boolean;
  dailyChallenge: { completed: boolean; starsEarned: number | null };
};

export type DashboardResponse = {
  student: { name: string; targetExam: string | null; targetAttempt: string | null };
  streak: number;
  longestStreak: number;
  stats: UserStats;
  dailyGoal: StudyDay;
  categoryPerformance: CategoryPerformance;
  leaderboard: LeaderboardResponse;
  notifications: AppNotification[];
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
  testMode?: TestMode;
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
  // Number in the original printed paper; only set for past-paper questions.
  questionNo?: number | null;
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
  revisionPoints: string | null;
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

export type DailyChallengeReviewQuestion = {
  id: number;
  questionNo: number | null;
  text: string;
  questionImage: string | null;
  explanation: string | null;
  revisionPoints: string | null;
  isVoided: boolean;
  category: { id: number; name: string };
  questionPaper: { year: number } | null;
  options: { id: number; label: string; text: string; isCorrect: boolean }[];
  correctOptionId: number | null;
  selectedOptionId: number | null;
  isCorrect: boolean;
};

export type DailyChallengeResponse = {
  id: number;
  questionCount: number;
  questions: SafeQuestion[];
  progress: DailyChallengeProgress | null;
  // Present once today's challenge is completed.
  review?: DailyChallengeReviewQuestion[] | null;
};

export type DailyAnswerFeedback = SubmitAnswerResponse & { selectedOptionId: number | null };

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

// An unfinished EXAM attempt returns only the saved choice; everything else
// returns the feedback too, so a resumed PRACTICE test can show it again.
export type PaperAnswerState = {
  questionId: number;
  selectedOptionId: number | null;
  isCorrect?: boolean;
  correctOptionId?: number | null;
  explanation?: string | null;
  revisionPoints?: string | null;
};

export type AttemptDetailResponse = {
  id: number;
  mode: AttemptMode;
  totalQuestions: number;
  completedAt: string | null;
  questions: SafeQuestion[];
  answers: AttemptAnswerState[];
};

export type PaperAttemptDetailResponse = Omit<AttemptDetailResponse, 'answers'> & {
  testMode: TestMode;
  startedAt: string;
  durationSeconds: number | null;
  deadline: string | null;
  serverNow: string;
  paper: { id: number; year: number; title: string | null } | null;
  section: { id: number; name: string } | null;
  answers: PaperAnswerState[];
};

export type SubmitAnswerResponse = {
  isCorrect: boolean;
  correctOptionId: number | null;
  explanation: string | null;
  revisionPoints: string | null;
};

export type SavePaperAnswerResponse =
  | { saved: true; selectedOptionId: number | null }
  | (SubmitAnswerResponse & { selectedOptionId: number | null; saved?: undefined });

export type CompleteAttemptResponse = {
  id: number;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  scorePercent: number;
  score?: number | null;
  maxScore?: number | null;
};

export type SectionResult = {
  categoryId: number;
  name: string;
  total: number;
  correct: number;
  wrong: number;
  skipped: number;
  score: number;
  maxScore: number;
  accuracy: number;
};

export type PaperResultQuestion = {
  id: number;
  questionNo: number | null;
  text: string;
  questionImage: string | null;
  explanation: string | null;
  revisionPoints: string | null;
  isVoided: boolean;
  category: { id: number; name: string };
  options: { id: number; label: string; text: string; isCorrect: boolean }[];
  correctOptionId: number | null;
  selectedOptionId: number | null;
  isCorrect: boolean;
};

export type PaperResultsResponse = {
  id: number;
  mode: AttemptMode;
  testMode: TestMode;
  paper: { id: number; year: number; title: string | null } | null;
  section: { id: number; name: string } | null;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  score: number;
  maxScore: number;
  marking: Marking;
  startedAt: string;
  completedAt: string;
  timeTakenSeconds: number;
  durationSeconds: number | null;
  scorePercent: number;
  sections: SectionResult[];
  questions: PaperResultQuestion[];
};

export type ResultOption = SafeOption & { isCorrect: boolean };

export type ResultQuestion = {
  id: number;
  text: string;
  questionImage?: string | null;
  explanation: string | null;
  revisionPoints: string | null;
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
  startedAt?: string | null;
  completedAt?: string | null;
  questions: ResultQuestion[];
};
