import { View } from 'react-native';

import { loginStyles as styles, TOTAL_STEPS } from './login-styles';

export function StepDots({ current, total = TOTAL_STEPS }: { current: number; total?: number }) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={[styles.dot, i === current - 1 ? styles.dotCurrent : i < current - 1 ? styles.dotActive : styles.dotInactive]} />
      ))}
    </View>
  );
}
