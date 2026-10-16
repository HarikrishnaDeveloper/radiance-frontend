// The app's single palette: white background, black text, grey secondary
// text, and the violet from the app icon for buttons and anything highlighted.
// Green/red are kept only to mark right and wrong answers.
export const UI = {
  bg: '#FFFFFF',
  subtle: '#F5F5F5',

  text: '#111111',
  grey: '#6B6B6B',
  greyLight: '#9E9E9E',

  border: '#E6E6E6',

  accent: '#8103FB',
  accentPressed: '#6803E3',
  accentSoft: '#F3E9FF',

  green: '#1E8E4E',
  greenSoft: '#E9F6EE',
  red: '#D33A2C',
  redSoft: '#FDECEA',

  radius: 8,
} as const;
