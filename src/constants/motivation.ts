// Shown on Home, one per calendar day (see quoteForDate).
const QUOTES = [
  'Success is the sum of small efforts, repeated day in and day out.',
  'Consistency beats intensity. Show up today.',
  'Every previous-year question you master is one less surprise in the exam hall.',
  'Revise what you got wrong — that is where your marks are hiding.',
  'Discipline is choosing what you want most over what you want now.',
  'Slow progress is still progress.',
  'The syllabus is finite. Your effort can cover it.',
  'Read the question twice, mark the answer once.',
  'Small daily improvements lead to stunning results.',
  'You do not have to be great to start, but you have to start to be great.',
  'An hour of focused practice beats a day of distracted reading.',
  'Your future rank is built by today’s routine.',
];

export function quoteForDate(date = new Date()) {
  const dayNumber = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
  return QUOTES[dayNumber % QUOTES.length];
}
