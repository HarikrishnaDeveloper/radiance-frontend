import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HT } from '@/components/home/home-theme';
import { PageHeader } from '@/components/home/PageHeader';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api-client';
import type { AppNotification } from '@/types/api';
import { Pressable } from '@/components/ui/pressable';

// Reminders and study updates. They come with the dashboard and are derived
// from the student's current state, so each one disappears once it's acted on.
export default function NotificationsScreen() {
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<AppNotification[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      api
        .dashboard(token, (d) => setItems(d.notifications))
        .then((d) => setItems(d.notifications))
        .catch(() => setItems((prev) => prev ?? []));
    }, [token])
  );

  return (
    <View style={styles.screen}>
      <PageHeader title="Notifications" />
      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: 20 + insets.bottom }]} showsVerticalScrollIndicator={false}>
        {items && items.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={28} color={HT.muted} />
            <Text style={styles.emptyText}>You&apos;re all caught up.</Text>
          </View>
        )}
        {items?.map((n) => (
          <Pressable
            key={n.id}
            onPress={() => router.push(n.route as Href)}
            style={({ pressed }) => [styles.card, pressed && { backgroundColor: HT.bg }]}
            accessibilityRole="button"
            accessibilityLabel={`${n.title}. ${n.body}`}>
            <View style={[styles.icon, n.kind === 'reminder' ? styles.iconReminder : styles.iconUpdate]}>
              <Ionicons
                name={n.kind === 'reminder' ? 'alarm-outline' : 'information-circle-outline'}
                size={17}
                color={n.kind === 'reminder' ? HT.goldDeep : HT.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{n.title}</Text>
              <Text style={styles.text}>{n.body}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={HT.muted} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: HT.bg },
  body: { padding: 20, gap: 10 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyText: { color: HT.muted, fontWeight: '600' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: HT.surface,
    borderRadius: HT.radius,
    borderWidth: 1,
    borderColor: HT.hairline,
    padding: 14,
  },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  iconReminder: { backgroundColor: HT.goldSoft },
  iconUpdate: { backgroundColor: HT.primarySoft },
  title: { fontSize: 14, fontWeight: '700', color: HT.ink },
  text: { fontSize: 12.5, fontWeight: '500', color: HT.muted, marginTop: 3, lineHeight: 18 },
});
