import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

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
    borderRadius: 12,
    maxWidth: '90%',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  success: { backgroundColor: '#1F8A46' },
  error: { backgroundColor: '#E53935' },
  icon: { marginRight: 8 },
  text: { color: '#fff', fontSize: 13, fontWeight: '600', flexShrink: 1 },
});
