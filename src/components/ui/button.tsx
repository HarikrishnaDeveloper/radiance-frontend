import { ActivityIndicator, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { UI } from '@/constants/ui';
import { Pressable } from '@/components/ui/pressable';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';

type Props = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

const LOOK: Record<ButtonVariant, { bg: string; pressed: string; border: string; text: string }> = {
  primary: { bg: UI.accent, pressed: UI.accentPressed, border: UI.accent, text: UI.bg },
  secondary: { bg: UI.bg, pressed: UI.subtle, border: UI.border, text: UI.text },
  danger: { bg: UI.red, pressed: '#B32E22', border: UI.red, text: UI.bg },
};

// The app's one button: violet for the main action, outlined for the rest,
// red only for actions that lose something (exit, cancel subscription).
export function Button({ label, onPress, variant = 'primary', loading, disabled, style }: Props) {
  const look = LOOK[variant];
  const inactive = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: pressed ? look.pressed : look.bg, borderColor: look.border },
        disabled && !loading && styles.disabled,
        style,
      ]}>
      {loading ? <ActivityIndicator color={look.text} /> : <Text style={[styles.label, { color: look.text }]}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    borderRadius: UI.radius,
    borderWidth: 1,
  },
  disabled: { opacity: 0.45 },
  label: { fontSize: 15, fontWeight: '600' },
});
