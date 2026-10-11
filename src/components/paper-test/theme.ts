// Design tokens for the previous-year paper screens (paper menu, test player,
// results). Same palette as the stage quiz (src/app/quiz/[attemptId].tsx) so
// both test experiences read as one product.
export const PT = {
  bg: '#F7F6FB',
  card: '#FFFFFF',
  ink900: '#1B1830',
  ink600: '#635F7A',
  ink400: '#9C98B4',
  ink300: '#C6C3DA',
  line: '#ECE9F7',
  purple900: '#241454',
  purple700: '#4F2FD0',
  purple600: '#5E2CE0',
  purple500: '#6D3AF0',
  purple400: '#8B5CF6',
  purple100: '#EEE9FE',
  purple50: '#F6F3FF',
  gold: '#F5A623',
  goldSoft: '#FFF3DC',
  goldDeep: '#B77A0E',
  green: '#1FAE64',
  greenSoft: '#E6F8EF',
  greenDeep: '#158A50',
  red: '#E14848',
  redSoft: '#FDECEC',
  redDeep: '#B93030',
  teal: '#0F9E93',
  tealSoft: '#E4F7F5',
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
