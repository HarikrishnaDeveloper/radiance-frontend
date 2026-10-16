import { UI } from '@/constants/ui';

// The test screens (tests tab, paper menu, test player, results) use only four
// colors: white, black, grey and violet. Soft fills and hairlines are light
// tints of grey and violet. There is no green/red — a correct answer is violet,
// a wrong one is black, and the ✓ / ✗ icons carry the difference.
export const TEST_COLORS = {
  white: UI.bg,
  black: UI.text,
  grey: UI.grey,
  violet: UI.accent,
} as const;

const greyTint = UI.subtle;
const greyLine = UI.border;
const violetTint = UI.accentSoft;

export const PT = {
  bg: TEST_COLORS.white,
  card: TEST_COLORS.white,
  ink900: TEST_COLORS.black,
  ink600: TEST_COLORS.grey,
  ink400: TEST_COLORS.grey,
  ink300: greyLine,
  line: greyLine,
  purple900: TEST_COLORS.black,
  purple700: TEST_COLORS.violet,
  purple600: TEST_COLORS.violet,
  purple500: TEST_COLORS.violet,
  purple400: TEST_COLORS.violet,
  purple100: violetTint,
  purple50: violetTint,
  gold: TEST_COLORS.violet,
  goldSoft: violetTint,
  goldDeep: TEST_COLORS.violet,
  green: TEST_COLORS.violet,
  greenSoft: violetTint,
  greenDeep: TEST_COLORS.violet,
  red: TEST_COLORS.black,
  redSoft: greyTint,
  redDeep: TEST_COLORS.black,
  teal: TEST_COLORS.grey,
  tealSoft: greyTint,
} as const;

export function formatDuration(totalSeconds: number) {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m);
  return `${h > 0 ? `${h}:` : ''}${mm}:${String(sec).padStart(2, '0')}`;
}

// "2 hrs", "45 min"
export function formatMinutes(totalSeconds: number) {
  const minutes = Math.round(totalSeconds / 60);
  if (minutes >= 60 && minutes % 60 === 0) return `${minutes / 60} hr${minutes === 60 ? '' : 's'}`;
  return `${minutes} min`;
}

// UPSC marks keep two decimals only when needed: 133.33, 120, -0.67.
export function formatMarks(marks: number) {
  return Number.isInteger(marks) ? String(marks) : marks.toFixed(2);
}

export function questionLabel(q: { questionNo?: number | null }, index: number) {
  return `Q${q.questionNo ?? index + 1}`;
}
