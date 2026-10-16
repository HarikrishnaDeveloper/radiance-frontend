import type { PaperResultsResponse } from '@/types/api';

// Turns a student's recent paper results into study guidance: where marks are
// lost, whether scores are moving, how negative marking and time affect them.
// Pure functions over API data so the dashboard only renders.

export type SubjectInsight = {
  categoryId: number;
  name: string;
  correct: number;
  wrong: number;
  skipped: number;
  /** Correct out of answered, 0–100. */
  accuracy: number;
  /** Marks scored and available across recent tests. */
  score: number;
  maxScore: number;
  /** Marks not earned: skipped, wrong, and the penalty for wrong answers. */
  lost: number;
};

export type TrendPoint = { attemptId: number; label: string; pct: number; testMode: string };

export type TestInsights = {
  tests: number;
  trend: TrendPoint[];
  /** Latest score minus the average of up to three tests before it. */
  change: number | null;
  average: number;
  subjects: SubjectInsight[]; // weakest (most marks lost) first
  correct: number;
  wrong: number;
  skipped: number;
  /** Marks taken away by negative marking. */
  penalty: number;
  /** What the student would have scored with no penalty, as % of max. */
  penaltyPct: number;
  /** Exam-mode pacing: seconds used per question and allowed per question. */
  pace: { usedPerQ: number; allowedPerQ: number; usedPct: number } | null;
  /** The most recent attempt with wrong answers, for "review mistakes". */
  latestMistakes: { attemptId: number; wrong: number; label: string } | null;
};

const labelOf = (r: PaperResultsResponse) =>
  r.paper ? `${r.paper.year}${r.section ? ` · ${r.section.name}` : ''}` : (r.section?.name ?? 'Test');

export function buildInsights(results: PaperResultsResponse[]): TestInsights | null {
  if (results.length === 0) return null;
  const ordered = [...results].sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime());

  const trend = ordered.map((r) => ({ attemptId: r.id, label: labelOf(r), pct: Math.round(r.scorePercent), testMode: r.testMode }));
  const last = trend[trend.length - 1].pct;
  const before = trend.slice(-4, -1);
  const change = before.length ? Math.round(last - before.reduce((s, p) => s + p.pct, 0) / before.length) : null;
  const average = Math.round(trend.reduce((s, p) => s + p.pct, 0) / trend.length);

  // Per subject, across every section of every recent test.
  const bySubject = new Map<number, SubjectInsight>();
  let penalty = 0;
  let maxScore = 0;
  for (const r of ordered) {
    const wrongMark = Math.abs(r.marking.wrong);
    penalty += r.wrongCount * wrongMark;
    maxScore += r.maxScore;
    for (const s of r.sections) {
      const cur = bySubject.get(s.categoryId) ?? {
        categoryId: s.categoryId,
        name: s.name,
        correct: 0,
        wrong: 0,
        skipped: 0,
        accuracy: 0,
        score: 0,
        maxScore: 0,
        lost: 0,
      };
      cur.correct += s.correct;
      cur.wrong += s.wrong;
      cur.skipped += s.skipped;
      cur.score += s.score;
      cur.maxScore += s.maxScore;
      bySubject.set(s.categoryId, cur);
    }
  }
  const subjects = [...bySubject.values()]
    .map((s) => {
      const answered = s.correct + s.wrong;
      return { ...s, accuracy: answered ? Math.round((s.correct / answered) * 100) : 0, lost: Math.max(0, s.maxScore - s.score) };
    })
    .filter((s) => s.maxScore > 0)
    .sort((a, b) => b.lost / b.maxScore - a.lost / a.maxScore);

  const correct = ordered.reduce((s, r) => s + r.correctCount, 0);
  const wrong = ordered.reduce((s, r) => s + r.wrongCount, 0);
  const skipped = ordered.reduce((s, r) => s + r.skippedCount, 0);
  const penaltyPct = maxScore > 0 ? Math.round((penalty / maxScore) * 100) : 0;

  const timed = ordered.filter((r) => r.testMode === 'EXAM' && r.durationSeconds && r.totalQuestions > 0);
  const pace = timed.length
    ? (() => {
        const q = timed.reduce((s, r) => s + r.totalQuestions, 0);
        const used = timed.reduce((s, r) => s + r.timeTakenSeconds, 0);
        const allowed = timed.reduce((s, r) => s + (r.durationSeconds ?? 0), 0);
        return { usedPerQ: Math.round(used / q), allowedPerQ: Math.round(allowed / q), usedPct: Math.round((used / allowed) * 100) };
      })()
    : null;

  const withMistakes = [...ordered].reverse().find((r) => r.wrongCount > 0);
  const latestMistakes = withMistakes ? { attemptId: withMistakes.id, wrong: withMistakes.wrongCount, label: labelOf(withMistakes) } : null;

  return {
    tests: ordered.length,
    trend,
    change,
    average,
    subjects,
    correct,
    wrong,
    skipped,
    penalty,
    penaltyPct,
    pace,
    latestMistakes,
  };
}

export function formatSeconds(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m ? `${m}m ${String(s).padStart(2, '0')}s` : `${s}s`;
}
