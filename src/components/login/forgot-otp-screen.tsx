import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from './colors';
import { loginStyles as styles } from './login-styles';
import { OtpInput } from './otp-input';

type Props = {
  phone: string;
  resetOtpCode: string;
  onOtpChange: (v: string) => void;
  error: string | null;
  onBack: () => void;
  onResend: () => void;
  onVerify: () => void;
};

export function ForgotOtpScreen({ phone, resetOtpCode, onOtpChange, error, onBack, onResend, onVerify }: Props) {
  return (
    <View style={styles.container}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.select({ ios: 'padding', default: undefined })}>
        <ScrollView contentContainerStyle={styles.scrollContent} bounces={false} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.topBar}>
              <Pressable onPress={onBack} style={styles.backBtn} hitSlop={12}>
                <Text style={styles.backArrow}>‹</Text>
              </Pressable>
              <View style={styles.backBtn} />
            </View>

            <Animated.View entering={FadeIn.duration(400)} style={styles.stepIconWrap}>
              <Image
                style={styles.otpHeroImage}
                source={require('../../../assets/login/otp-screen.png')}
                contentFit="contain"
              />
            </Animated.View>

            <Animated.View entering={FadeInUp.duration(400)} style={styles.content}>
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
                <Pressable onPress={onResend}>
                  <Text style={styles.resendLink}>Resend OTP</Text>
                </Pressable>
              </View>

              {error && (
                <Animated.View entering={FadeIn.duration(200)} style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </Animated.View>
              )}

              <Pressable onPress={onVerify} style={({ pressed }) => [pressed && styles.buttonPressed]}>
                <LinearGradient
                  colors={[COLORS.purple, COLORS.purpleDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.otpVerifyButton}>
                  <Text style={styles.otpVerifyButtonText}>Verify</Text>
                  <Ionicons name="arrow-forward" size={18} color={COLORS.white} style={{ marginLeft: 10 }} />
                </LinearGradient>
              </Pressable>
            </Animated.View>
          </SafeAreaView>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
