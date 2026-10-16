import { useEffect, useState, type ReactNode } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';

import { UI } from '@/constants/ui';
import { playSound } from '@/lib/sounds';
import { Pressable } from '@/components/ui/pressable';

import { Button, type ButtonVariant } from './button';

// ─── Shared look ────────────────────────────────────────────────────────
// Every popup in the app (alerts, confirms, forms) uses this overlay + card so
// they all look the same on Android and iOS.

type DialogFrameProps = {
  visible: boolean;
  onRequestClose: () => void;
  /** Tapping outside the card closes it (off for confirmations that need an answer). */
  dismissOnBackdrop?: boolean;
  children: ReactNode;
};

export function DialogFrame({ visible, onRequestClose, dismissOnBackdrop = true, children }: DialogFrameProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onRequestClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={dismissOnBackdrop ? onRequestClose : undefined} />
        <View style={styles.card}>{children}</View>
      </View>
    </Modal>
  );
}

export function DialogTitle({ children }: { children: ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function DialogMessage({ children }: { children: ReactNode }) {
  return <Text style={styles.message}>{children}</Text>;
}

export const dialogStyles = StyleSheet.create({
  // Buttons side by side; a single button fills the width.
  actions: { flexDirection: 'row', gap: 10, marginTop: 22 },
  action: { flex: 1 },
});

// ─── Imperative alert (drop-in for Alert.alert) ─────────────────────────

export type DialogButton = {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
};

type DialogRequest = { title: string; message?: string; buttons: DialogButton[] };

let show: ((request: DialogRequest) => void) | null = null;

export const dialog = {
  /** Same arguments as React Native's Alert.alert, rendered in the app's own style. */
  alert(title: string, message?: string, buttons: DialogButton[] = [{ text: 'OK' }]) {
    show?.({ title, message, buttons: buttons.length ? buttons : [{ text: 'OK' }] });
  },
  /** alert() for something that failed: same dialog, with the error sound. */
  error(title: string, message?: string, buttons?: DialogButton[]) {
    playSound('error');
    dialog.alert(title, message, buttons);
  },
};

function variantFor(button: DialogButton, index: number, count: number): ButtonVariant {
  if (button.style === 'destructive') return 'danger';
  if (button.style === 'cancel') return 'secondary';
  // The last non-cancel button is the main action.
  return index === count - 1 ? 'primary' : 'secondary';
}

/** Mount once near the root; renders whatever dialog.alert() asks for. */
export function DialogHost() {
  const [queue, setQueue] = useState<DialogRequest[]>([]);
  const current = queue[0];

  useEffect(() => {
    show = (request) => setQueue((q) => [...q, request]);
    return () => {
      show = null;
    };
  }, []);

  const close = (button?: DialogButton) => {
    setQueue((q) => q.slice(1));
    button?.onPress?.();
  };

  if (!current) return null;
  const cancel = current.buttons.find((b) => b.style === 'cancel');
  // Cancel goes first (left), the main action last (right).
  const ordered = [...current.buttons].sort((a, b) => Number(b.style === 'cancel') - Number(a.style === 'cancel'));

  return (
    <DialogFrame
      visible
      onRequestClose={() => close(cancel ?? (current.buttons.length === 1 ? current.buttons[0] : undefined))}
      dismissOnBackdrop={false}>
      <DialogTitle>{current.title}</DialogTitle>
      {current.message ? (
        <ScrollView style={styles.messageScroll} bounces={false}>
          <DialogMessage>{current.message}</DialogMessage>
        </ScrollView>
      ) : null}
      <View style={[dialogStyles.actions, ordered.length > 2 && styles.actionsStacked]}>
        {ordered.map((button, i) => (
          <Button
            key={`${button.text}-${i}`}
            label={button.text}
            variant={variantFor(button, i, ordered.length)}
            onPress={() => close(button)}
            style={ordered.length > 2 ? undefined : dialogStyles.action}
          />
        ))}
      </View>
    </DialogFrame>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 400, backgroundColor: UI.bg, borderRadius: 14, padding: 22 },
  title: { fontSize: 18, fontWeight: '700', color: UI.text },
  message: { fontSize: 15, lineHeight: 22, color: UI.grey },
  messageScroll: { marginTop: 8, maxHeight: 240 },
  actionsStacked: { flexDirection: 'column-reverse' },
});
