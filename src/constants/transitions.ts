import { Easing } from 'react-native';
import { Easing as ReanimatedEasing } from 'react-native-reanimated';

// Shared motion tokens for navigation, so tabs, stack screens and in-screen
// view switches all move with the same rhythm.

// Material "emphasized decelerate": quick start, long gentle settle. The same
// curve twice: React Navigation's tab transitions run on RN's Animated (plain
// JS easing), while Reanimated layout animations need a worklet easing.
export const EASE_OUT = Easing.bezier(0.2, 0, 0, 1);
export const EASE_OUT_WORKLET = ReanimatedEasing.bezier(0.2, 0, 0, 1);

export const TAB_DURATION = 260;
export const VIEW_DURATION = 220;
// iOS only (Android uses the platform's own timing for stack transitions).
export const STACK_FADE_DURATION = 280;

// Tabs: a shared-axis X transition. The incoming tab slides this far in from
// the side of the tab that was tapped while the two crossfade; each is at most
// 30% visible at the midpoint, so they don't read as overlapping.
export const TAB_SHIFT = 24;
