import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { playSound } from '@/lib/sounds';

export type ToastType = 'success' | 'error';

export type ToastData = { message: string; type: ToastType };

type Props = {
  toast: ToastData | null;
  onHide: () => void;
  duration?: number;
};

export function Toast({ toast, onHide, duration = 2800 }: Props) {
  useEffect(() => {
    if (!toast) return;
    playSound(toast.type === 'error' ? 'error' : 'correct');
    const id = setTimeout(onHide, duration);
    return () => clearTimeout(id);
  }, [toast, duration, onHide]);

  if (!toast) return null;

  const isSuccess = toast.type === 'success';

  return (
    <SafeAreaView pointerEvents="none" style={styles.wrap}>
      <Animated.View
        entering={FadeInDown.duration(250)}
        exiting={FadeOutUp.duration(200)}
        style={[styles.toast, isSuccess ? styles.success : styles.error]}>
        <Ionicons name={isSuccess ? 'checkmark-circle' : 'alert-circle'} size={18} color="#fff" style={styles.icon} />
        <Text style={styles.text}>{toast.message}</Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    maxWidth: '90%',
  },
  success: { backgroundColor: '#111111' },
  error: { backgroundColor: '#111111' },
  icon: { marginRight: 8 },
  text: { color: '#fff', fontSize: 13, fontWeight: '600', flexShrink: 1 },
});
