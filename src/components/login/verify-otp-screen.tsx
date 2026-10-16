import { Ionicons } from '@expo/vector-icons';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from './colors';
import { Toast } from '../toast';
import { loginStyles as styles } from './login-styles';
import { OtpInput } from './otp-input';
import { useErrorToast } from '@/hooks/use-error-toast';
import { Pressable } from '@/components/ui/pressable';

type Props = {
  phone: string;
  otpCode: string;
  onOtpChange: (v: string) => void;
  resendTimer: number;
  formatTimer: (s: number) => string;
  error: string | null;
  submitting: boolean;
  onBack: () => void;
  onResend: () => void;
  onVerify: () => void;
};

export function VerifyOtpScreen({
  phone,
  otpCode,
  onOtpChange,
  resendTimer,
  formatTimer,
  error,
  submitting,
  onBack,
  onResend,
  onVerify,
}: Props) {
  const [toast, setToast] = useErrorToast(error);

  return (
    <View style={styles.container}>
      <Toast toast={toast} onHide={() => setToast(null)} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.select({ ios: 'padding', default: undefined })}>
        <ScrollView contentContainerStyle={styles.scrollContent} bounces={false} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.topBar}>
              <Pressable onPress={onBack} style={styles.backBtn} hitSlop={12}>
                <Text style={styles.backArrow}>‹</Text>
              </Pressable>
              {/* <StepDots current={2} /> */}
              <View style={styles.backBtn} />
            </View>

            <Animated.View entering={FadeIn.duration(400)} style={styles.iconWrap}>
              <View style={styles.iconCircle}>
                <Ionicons name="chatbubble-ellipses-outline" size={28} color={COLORS.purple} />
              </View>
            </Animated.View>

            <Animated.View entering={FadeInUp.duration(400)} style={[styles.content, { zIndex: 10 }]}>
              <Text style={[styles.title, { textAlign: 'center' }]}>Verify Your Number</Text>
              <Text style={styles.subtitle}>Enter the 6-digit OTP sent to</Text>
              <View style={styles.phoneEditRow}>
                <Text style={styles.otpPhoneNumber}>+91 {phone.trim()}</Text>
                <Pressable onPress={onBack}>
                  <Text style={styles.editLink}>Edit</Text>
                </Pressable>
              </View>

              <View style={{ marginTop: 28, marginBottom: 8 }}>
                <OtpInput value={otpCode} onChange={onOtpChange} />
              </View>

              <View style={styles.resendRow}>
                <Text style={styles.resendLabel}>Didn&apos;t get it? </Text>
                <Pressable onPress={onResend} disabled={resendTimer > 0}>
                  <Text style={[styles.resendLink, resendTimer > 0 && styles.resendDisabled]}>
                    {resendTimer > 0 ? `Resend OTP (${formatTimer(resendTimer)})` : 'Resend OTP'}
                  </Text>
                </Pressable>
              </View>

              <Pressable onPress={onVerify} disabled={submitting} style={({ pressed }) => [(pressed || submitting) && styles.buttonPressed]}>
                <View style={[styles.otpVerifyButton, { backgroundColor: COLORS.purple }]}>
                  <Text style={styles.otpVerifyButtonText}>{submitting ? 'Verifying…' : 'Verify'}</Text>
                  {/* <Ionicons name="arrow-forward" size={18} color={COLORS.white} style={{ marginLeft: 10 }} /> */}
                </View>
              </Pressable>
            </Animated.View>
          </SafeAreaView>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
