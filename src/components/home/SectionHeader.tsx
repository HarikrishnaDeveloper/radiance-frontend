import { Pressable, StyleSheet, Text, View } from 'react-native';

import { HT } from './home-theme';

interface Props {
  eyebrow: string;
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeader({ eyebrow, title, actionLabel, onAction }: Props) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
      {actionLabel && onAction && (
        <Pressable onPress={onAction} hitSlop={8} accessibilityRole="button">
          <Text style={styles.action}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12 },
  eyebrow: { fontSize: 10.5, fontWeight: '800', color: HT.goldDeep, letterSpacing: 1.4, textTransform: 'uppercase' },
  title: { fontSize: 18, fontWeight: '800', color: HT.ink, marginTop: 3, letterSpacing: -0.3 },
  action: { fontSize: 12.5, fontWeight: '800', color: HT.primary, letterSpacing: 0.2 },
});
