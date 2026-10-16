import { UI } from '@/constants/ui';

// Home and its sub-pages use the shared palette under the names they were
// written with.
export const HT = {
  bg: UI.bg,
  surface: UI.bg,
  ink: UI.text,
  inkSoft: UI.grey,
  muted: UI.grey,
  hairline: UI.border,
  subtle: UI.subtle,

  primary: UI.accent,
  primaryDeep: UI.accentPressed,
  primarySoft: UI.accentSoft,
  gold: UI.accent,
  goldSoft: UI.accentSoft,
  goldDeep: UI.accent,
  green: UI.green,
  greenSoft: UI.greenSoft,
  amber: UI.accent,
  amberSoft: UI.accentSoft,
  red: UI.red,
  redSoft: UI.redSoft,

  radius: UI.radius,
} as const;
