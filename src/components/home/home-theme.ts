import { Platform } from 'react-native';

// Home screen design tokens — "ink & gold": a deep indigo hero, warm gold
// accents, white surfaces with hairline borders and sharp 2px corners.
export const HT = {
  bg: '#F6F5F9',
  surface: '#FFFFFF',
  ink: '#16132B',
  inkSoft: '#4A4763',
  muted: '#8C89A3',
  hairline: '#E6E3EE',

  heroTop: '#0F0B24',
  heroBottom: '#2B1C6E',
  onHero: '#FFFFFF',
  onHeroMuted: 'rgba(255,255,255,0.62)',
  heroLine: 'rgba(255,255,255,0.14)',

  primary: '#4F2FD0',
  primaryDeep: '#3A1FA8',
  primarySoft: '#EEEAFD',
  gold: '#D4A93C',
  goldBright: '#F2C94C',
  goldSoft: '#FBF4E2',
  goldDeep: '#9A7416',
  green: '#1F9D63',
  greenSoft: '#E5F5EC',
  amber: '#C97A0B',
  amberSoft: '#FDF1DE',
  red: '#D64545',
  redSoft: '#FBE9E9',

  radius: 2,
} as const;

export const homeShadow = Platform.select({
  ios: { shadowColor: '#16132B', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.07, shadowRadius: 18 },
  android: { elevation: 3 },
  default: {},
});
