import { UI } from './ui';

// Key names used across the login flow and tab screens, mapped onto the single
// palette in ./ui (white background, black/grey text, icon violet accent).
export const COLORS = {
  navy: UI.text,
  blue: UI.accent,
  blueSoft: UI.accentSoft,
  gold: UI.accent,
  goldSoft: UI.accentSoft,
  greenSoft: UI.greenSoft,
  orangeSoft: UI.accentSoft,
  gray: UI.grey,
  grayLight: UI.greyLight,
  grayBorder: UI.border,
  white: UI.bg,
  error: UI.red,
  errorBg: UI.redSoft,
  purple: UI.accent,
  purpleDark: UI.accentPressed,
  purpleSoft: UI.accentSoft,
  loginBg: UI.bg,

  purple900: UI.text,
  purple700: UI.accent,
  purple500: UI.accent,
  purple400: UI.accent,
  goldDeep: UI.accent,
  green: UI.green,
  teal: UI.grey,
  tealSoft: UI.subtle,
} as const;
