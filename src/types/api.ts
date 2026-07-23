export type AttemptMode = 'FULL_PAPER' | 'CATEGORY_PRACTICE';

export type AuthUser = {
  id: string;
  username: string;
  name: string | null;
};

export type LoginResponse = {
  token: string;
  user: AuthUser;
};

export type CategorySummary = {
  id: number;
  name: string;
  questionCount: number;
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

export type DashboardResponse = {
  streak: number;
  continueAttempt: ContinueAttempt | null;
  categories: CategorySummary[];
  papers: PaperSummary[];
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

export type SafeQuestion = {
  id: number;
  text: string;
  categoryId: number;
  category: { id: number; name: string };
  options: SafeOption[];
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
  explanation: string | null;
  category: { id: number; name: string };
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
