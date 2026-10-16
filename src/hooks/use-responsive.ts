import { useWindowDimensions } from 'react-native';

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

// Screen-size buckets shared by every screen, so small phones (320–359px wide,
// under 700px tall) get tighter layouts instead of clipped or wrapped content.
export function useResponsive() {
  const { width, height } = useWindowDimensions();
  return {
    width,
    height,
    isNarrow: width < 360,
    isShort: height < 700,
    // Login/onboarding illustrations: a share of the screen height, not a fixed 250px.
    illustrationHeight: Math.round(clamp(height * 0.28, 140, 250)),
  };
}
