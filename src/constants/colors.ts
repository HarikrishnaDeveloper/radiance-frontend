// Shared color palette for the whole app. Every key that already existed in
// the login flow (src/components/login/colors.ts) keeps its exact value —
// this file is the canonical source now, login/colors.ts just re-exports it.
export const COLORS = {
  // Existing login-flow colors, unchanged
  navy: '#152B5C',
  blue: '#3E6BF0',
  blueSoft: '#EAF0FE',
  gold: '#F5A623',
  goldSoft: '#FFF8EC',
  greenSoft: '#E8F5E9',
  orangeSoft: '#FFF3E0',
  gray: '#6E7488',
  grayLight: '#A0A5B5',
  grayBorder: '#E8EAF0',
  white: '#FFFFFF',
  error: '#E53935',
  errorBg: '#FFF0F0',
  purple: '#5B3FE0',
  purpleDark: '#4429C0',
  purpleSoft: '#EFEBFB',
  loginBg: '#F6F4FC',

  // New shades added for the Home/Practice/Journey/Progress redesign —
  // interpolated around the existing purple/purpleDark anchors, plus a few
  // solid colors (green/teal) the login palette never needed.
  purple900: '#241454',
  purple700: '#4F2FD0',
  purple500: '#6D52E8',
  purple400: '#8B70EF',
  goldDeep: '#B77A0E',
  green: '#1FAE64',
  teal: '#0F9E93',
  tealSoft: '#E4F7F5',
} as const;
