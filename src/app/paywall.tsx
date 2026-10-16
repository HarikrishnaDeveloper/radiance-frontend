import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '@/constants/colors';
import { useAuth } from '@/context/auth-context';
import { ApiError, api } from '@/lib/api-client';
import type { SubscriptionStatusResponse } from '@/types/api';
import { dialog } from '@/components/ui/dialog';
import { Pressable } from '@/components/ui/pressable';
import { playSound } from '@/lib/sounds';

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
      playSound('success');
      dialog.alert('You’re subscribed!', 'Enjoy unlimited access to every stage.', [
        { text: 'Continue', onPress: () => router.back() },
      ]);
    } catch (e) {
      // RazorpayCheckout.open() rejects with { code, description } when the user
      // cancels the sheet — that's not a real error, so stay quiet for it.
      const description = (e as { description?: string })?.description;
      if (description) {
        dialog.error('Payment not completed', description);
      } else if (e instanceof ApiError) {
        dialog.error('Something went wrong', e.message);
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel() {
    if (!token || busy) return;
    dialog.alert('Cancel subscription?', 'You’ll lose access to gated stages immediately.', [
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
            dialog.error('Could not cancel', e instanceof ApiError ? e.message : 'Try again in a moment.');
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  }

  return (
    <View style={styles.screen}>
      {/* Scrolls on short phones so the subscribe button is never cut off. */}
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false} showsVerticalScrollIndicator={false}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <Pressable onPress={() => router.back()} style={styles.closeBtn} hitSlop={10}>
            <Ionicons name="close" size={20} color={COLORS.gray} />
          </Pressable>

          <View style={styles.hero}>
            <View style={styles.heroBadge}>
              <Ionicons name="lock-open-outline" size={26} color={COLORS.purple} />
            </View>
            <Text style={styles.title}>{isActive ? 'You’re on Premium' : 'Unlock full access'}</Text>
            <Text style={styles.subtitle}>
              {isActive
                ? 'Your subscription renews automatically every month.'
                : status
                ? `Your first ${status.freeStageLimit} stages are free. Subscribe to keep going.`
                : ''}
            </Text>
          </View>

          <View style={styles.card}>
            {!isActive && status && (
              <View style={styles.priceRow}>
                <Text style={styles.price}>{formatRupees(status.monthlyAmountPaise)}</Text>
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
              <Pressable onPress={handleSubscribe} disabled={busy || !status}>
                <View style={[styles.primaryBtn, { backgroundColor: COLORS.purple }]}>
                  {busy ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={styles.primaryBtnText}>
                    {status ? `Subscribe — ${formatRupees(status.monthlyAmountPaise)}/mo` : 'Subscribe'}
                  </Text>
                  )}
                </View>
              </Pressable>
            )}
          </View>
        </SafeAreaView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.loginBg },
  scrollContent: { flexGrow: 1 },
  safeArea: { flex: 1, paddingHorizontal: 24, width: '100%', maxWidth: 520, alignSelf: 'center' },
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
  title: { fontSize: 24, fontWeight: '700', color: COLORS.navy, marginTop: 16, textAlign: 'center' },
  subtitle: { fontSize: 14, color: COLORS.gray, marginTop: 8, textAlign: 'center', lineHeight: 20, paddingHorizontal: 12 },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 20,
    marginTop: 28,
    gap: 14,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
  },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginBottom: 4 },
  price: { fontSize: 34, fontWeight: '700', color: COLORS.navy },
  pricePeriod: { fontSize: 14, color: COLORS.gray, marginBottom: 6 },
  perkRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  perkText: { fontSize: 14, color: COLORS.navy, fontWeight: '500', flex: 1 },
  renewalNote: { fontSize: 12.5, color: COLORS.grayLight, marginTop: 4 },

  actions: { marginTop: 'auto', paddingTop: 24, paddingBottom: 20, gap: 10 },
  primaryBtn: {
    borderRadius: 8,
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.white },
  secondaryBtn: {
    borderRadius: 8,
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.errorBg,
  },
  secondaryBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.error },
});
