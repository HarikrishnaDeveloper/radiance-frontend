import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '@/constants/colors';
import { useAuth } from '@/context/auth-context';
import { ApiError, api } from '@/lib/api-client';
import type { SubscriptionStatusResponse } from '@/types/api';

const PERKS = [
  'Unlimited stages across every subject',
  'Full past-year question bank, no caps',
  'Cancel anytime — no lock-in',
];

function formatRupees(paise: number) {
  return `₹${Math.round(paise / 100)}`;
}

export default function PaywallScreen() {
  const { token, user, refreshUser } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatusResponse | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) return;
    api.subscriptionStatus(token).then(setStatus).catch(() => {});
  }, [token]);

  const isActive = user?.isPremium ?? false;

  async function handleSubscribe() {
    if (!token || busy) return;
    setBusy(true);
    try {
      const order = await api.createSubscription(token);
      const result = await RazorpayCheckout.open({
        key: order.keyId,
        subscription_id: order.subscriptionId,
        amount: order.amount,
        currency: order.currency,
        name: 'Radiance',
        description: 'Premium — Monthly',
        theme: { color: COLORS.purple },
        prefill: {
          contact: user?.phone ?? undefined,
          email: user?.email ?? undefined,
        },
      });

      await api.verifySubscription(token, {
        razorpay_payment_id: result.razorpay_payment_id,
        razorpay_subscription_id: result.razorpay_subscription_id!,
        razorpay_signature: result.razorpay_signature!,
      });
      await refreshUser();
      Alert.alert('You’re subscribed!', 'Enjoy unlimited access to every stage.', [
        { text: 'Continue', onPress: () => router.back() },
      ]);
    } catch (e) {
      // RazorpayCheckout.open() rejects with { code, description } when the user
      // cancels the sheet — that's not a real error, so stay quiet for it.
      const description = (e as { description?: string })?.description;
      if (description) {
        Alert.alert('Payment not completed', description);
      } else if (e instanceof ApiError) {
        Alert.alert('Something went wrong', e.message);
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel() {
    if (!token || busy) return;
    Alert.alert('Cancel subscription?', 'You’ll lose access to gated stages immediately.', [
      { text: 'Keep subscription', style: 'cancel' },
      {
        text: 'Cancel subscription',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            await api.cancelSubscription(token);
            await refreshUser();
          } catch (e) {
            Alert.alert('Could not cancel', e instanceof ApiError ? e.message : 'Try again in a moment.');
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn} hitSlop={10}>
          <Ionicons name="close" size={20} color={COLORS.gray} />
        </Pressable>

        <View style={styles.hero}>
          <View style={styles.heroBadge}>
            <Ionicons name="rocket" size={28} color={COLORS.purple} />
          </View>
          <Text style={styles.title}>{isActive ? 'You’re on Premium' : 'Unlock Full Access'}</Text>
          <Text style={styles.subtitle}>
            {isActive
              ? 'Your subscription renews automatically every month.'
              : `Your first ${status?.freeStageLimit ?? 2} stages are free. Subscribe to keep going.`}
          </Text>
        </View>

        <View style={styles.card}>
          {!isActive && (
            <View style={styles.priceRow}>
              <Text style={styles.price}>{formatRupees(status?.monthlyAmountPaise ?? 3000)}</Text>
              <Text style={styles.pricePeriod}>/ month</Text>
            </View>
          )}

          {PERKS.map((perk) => (
            <View key={perk} style={styles.perkRow}>
              <Ionicons name="checkmark-circle" size={18} color={COLORS.green} />
              <Text style={styles.perkText}>{perk}</Text>
            </View>
          ))}

          {status?.subscription?.currentEnd && isActive && (
            <Text style={styles.renewalNote}>
              Next renewal: {new Date(status.subscription.currentEnd).toLocaleDateString()}
            </Text>
          )}
        </View>

        <View style={styles.actions}>
          {isActive ? (
            <Pressable onPress={handleCancel} disabled={busy} style={styles.secondaryBtn}>
              {busy ? <ActivityIndicator color={COLORS.error} /> : <Text style={styles.secondaryBtnText}>Cancel Subscription</Text>}
            </Pressable>
          ) : (
            <Pressable onPress={handleSubscribe} disabled={busy}>
              <LinearGradient
                colors={[COLORS.purple, COLORS.purpleDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryBtn}>
                {busy ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.primaryBtnText}>Subscribe — {formatRupees(status?.monthlyAmountPaise ?? 3000)}/mo</Text>
                )}
              </LinearGradient>
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.loginBg },
  safeArea: { flex: 1, paddingHorizontal: 24 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  hero: { alignItems: 'center', marginTop: 18 },
  heroBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.purpleSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.navy, marginTop: 16, textAlign: 'center' },
  subtitle: { fontSize: 14, color: COLORS.gray, marginTop: 8, textAlign: 'center', lineHeight: 20, paddingHorizontal: 12 },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    marginTop: 28,
    gap: 14,
  },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginBottom: 4 },
  price: { fontSize: 34, fontWeight: '800', color: COLORS.navy },
  pricePeriod: { fontSize: 14, color: COLORS.gray, marginBottom: 6 },
  perkRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  perkText: { fontSize: 14, color: COLORS.navy, fontWeight: '500', flex: 1 },
  renewalNote: { fontSize: 12.5, color: COLORS.grayLight, marginTop: 4 },

  actions: { marginTop: 'auto', paddingBottom: 20, gap: 10 },
  primaryBtn: {
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { fontSize: 16, fontWeight: '800', color: COLORS.white },
  secondaryBtn: {
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.errorBg,
  },
  secondaryBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.error },
});
