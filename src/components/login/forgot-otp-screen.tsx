import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useEffect, useState } from 'react';
import { COLORS } from './colors';
import { Toast, type ToastData } from '../toast';
import { loginStyles as styles } from './login-styles';
import { OtpInput } from './otp-input';

type Props = {
  phone: string;
  resetOtpCode: string;
  onOtpChange: (v: string) => void;
  error: string | null;
  submitting?: boolean;
  onBack: () => void;
  onResend: () => void;
  onVerify: () => void;
};

export function ForgotOtpScreen({
  phone,
  resetOtpCode,
  onOtpChange,
  error,
  submitting = false,
  onBack,
  onResend,
  onVerify,
}: Props) {
  const [toast, setToast] = useState<ToastData | null>(null);

  useEffect(() => {
    if (error) {
      setToast({ type: 'error', message: error });
    } else {
      setToast(null);
    }
  }, [error]);

  return (
    <View style={styles.container}>
      <Toast toast={toast} onHide={() => setToast(null)} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.select({ ios: 'padding', default: undefined })}>
        <ScrollView contentContainerStyle={styles.scrollContent} bounces={false} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <SafeAreaView style={styles.safeArea}>
            <View style={localStyles.topBar}>
              <Pressable onPress={onBack} style={localStyles.backBtn} hitSlop={16}>
                <Ionicons name="arrow-back" size={20} color={COLORS.purple} />
              </Pressable>
            </View>

            <Animated.View entering={FadeIn.duration(400)} style={localStyles.illustrationWrap} pointerEvents="none">
              <Image
                style={localStyles.illustrationImage}
                source={require('../../../assets/login/otp-screen.png')}
                contentFit="contain"
                pointerEvents="none"
              />
            </Animated.View>

            <Animated.View entering={FadeInUp.duration(400)} style={[styles.content, { zIndex: 10, elevation: 10 }]}>
              <Text style={[styles.title, { textAlign: 'center' }]}>Verify Your Number</Text>
              <Text style={styles.subtitle}>Enter the 6-digit OTP sent to</Text>
              <View style={styles.phoneEditRow}>
                <Text style={styles.otpPhoneNumber}>+91 {phone.trim()}</Text>
              </View>

              <View style={{ marginTop: 28, marginBottom: 8 }}>
                <OtpInput value={resetOtpCode} onChange={onOtpChange} />
              </View>

              <View style={styles.resendRow}>
                <Text style={styles.resendLabel}>Didn't get it? </Text>
                <Pressable onPress={onResend} disabled={submitting}>
                  <Text style={styles.resendLink}>Resend OTP</Text>
                </Pressable>
              </View>

              <Pressable onPress={onVerify} disabled={submitting} style={({ pressed }) => [pressed && styles.buttonPressed]}>
                <LinearGradient
                  colors={[COLORS.purple, COLORS.purpleDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.otpVerifyButton}>
                  <Text style={styles.otpVerifyButtonText}>{submitting ? 'Verifying…' : 'Verify'}</Text>
                  {/* <Ionicons name="arrow-forward" size={18} color={COLORS.white} style={{ marginLeft: 10 }} /> */}
                </LinearGradient>
              </Pressable>
            </Animated.View>
          </SafeAreaView>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const localStyles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 4,
    zIndex: 10,
    elevation: 10,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F8F7FF',
    borderWidth: 1.5,
    borderColor: '#E6E4F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationWrap: {
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 16,
    overflow: 'visible',
    zIndex: 1,
  },
  illustrationImage: {
    width: 320,
    height: 320,
    top: -20,
  },
});
