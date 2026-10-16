import { StyleSheet, Text, View } from 'react-native';

import { Pressable } from '@/components/ui/pressable';

import { HT } from './home-theme';

interface Props {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, subtitle, actionLabel, onAction }: Props) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
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
  row: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 10 },
  title: { fontSize: 18, fontWeight: '700', color: HT.ink, letterSpacing: -0.2 },
  subtitle: { fontSize: 13, color: HT.muted, marginTop: 2 },
  action: { fontSize: 14, fontWeight: '600', color: HT.primary },
});
