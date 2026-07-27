import { Image } from 'expo-image';
import { useEffect, useRef, useState, useCallback } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError, useAuth } from '@/context/auth-context';

const COLORS = {
  navy: '#152B5C',
  blue: '#3E6BF0',
  blueSoft: '#EAF0FE',
  gold: '#F5A623',
  goldSoft: '#FFF8EC',
  greenSoft: '#E8F5E9',
  orangeSoft: '#FFF3E0',
  gray: '#6E7488',
  grayLight: '#A0A5B5',
  grayBorder: '#E8EAF0',
  white: '#FFFFFF',
  error: '#E53935',
  errorBg: '#FFF0F0',
};

const OTP_LENGTH = 6;
const RESEND_TIMER = 30;
const TOTAL_STEPS = 3;

type Screen = 'phone' | 'otp' | 'profile';

function StepDots({ current }: { current: number }) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <View key={i} style={[styles.dot, i === current - 1 ? styles.dotCurrent : i < current - 1 ? styles.dotActive : styles.dotInactive]} />
      ))}
    </View>
  );
}

function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = useRef<(TextInput | null)[]>([]);

  function handleChange(text: string, index: number) {
    const newValue = value.split('');
    if (text.length > 1) {
      const pasted = text.replace(/[^0-9]/g, '').slice(0, OTP_LENGTH);
      onChange(pasted);
      refs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
      return;
    }
    newValue[index] = text;
    onChange(newValue.join(''));
    if (text && index < OTP_LENGTH - 1) {
      refs.current[index + 1]?.focus();
    }
  }

  function handleKeyPress(key: string, index: number) {
    if (key === 'Backspace' && !value[index] && index > 0) {
      const newValue = value.split('');
      newValue[index - 1] = '';
      onChange(newValue.join(''));
      refs.current[index - 1]?.focus();
    }
  }

  return (
    <View style={styles.otpRow}>
      {Array.from({ length: OTP_LENGTH }).map((_, i) => (
        <TextInput
          key={i}
          ref={(r) => { refs.current[i] = r; }}
          value={value[i] || ''}
          onChangeText={(t) => handleChange(t, i)}
          onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
          keyboardType="number-pad"
          maxLength={2}
          style={[styles.otpBox, value[i] ? styles.otpBoxFilled : null]}
          selectTextOnFocus
        />
      ))}
    </View>
  );
}

export default function LoginScreen() {
  const { user, requestOtp, verifyOtp, completeProfile } = useAuth();

  const [screen, setScreen] = useState<Screen>(user ? 'profile' : 'phone');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setInterval(() => setResendTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [resendTimer]);

  const formatTimer = useCallback((s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  }, []);

  async function handleSendOtp() {
    const rawPhone = phone.trim().replace(/\s/g, '');
    if (rawPhone.length < 10) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await requestOtp(`+91${rawPhone}`);
      setScreen('otp');
      setResendTimer(RESEND_TIMER);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not reach the server');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyOtp() {
    if (otpCode.length < OTP_LENGTH) {
      setError('Enter the complete 6-digit code');
      return;
    }
    const fullPhone = `+91${phone.trim().replace(/\s/g, '')}`;
    setError(null);
    setSubmitting(true);
    try {
      const verifiedUser = await verifyOtp(fullPhone, otpCode);
      if (!verifiedUser.name) {
        setScreen('profile');
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not reach the server');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResendOtp() {
    if (resendTimer > 0) return;
    setSubmitting(true);
    try {
      await requestOtp(`+91${phone.trim().replace(/\s/g, '')}`);
      setResendTimer(RESEND_TIMER);
      setOtpCode('');
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not reach the server');
    } finally {
      setSubmitting(false);
    }
  }

  function handleFinishProfile() {
    if (!fullName.trim()) {
      setError('Enter your name');
      return;
    }
    setError(null);
    completeProfile(fullName.trim());
  }

  function goBackToPhone() {
    setError(null);
    setOtpCode('');
    setScreen('phone');
  }

  // ─── PHONE ───
  if (screen === 'phone') {
    return (
      <View style={styles.container}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.select({ ios: 'padding', default: undefined })}>
          <ScrollView contentContainerStyle={styles.scrollContent} bounces={false} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <SafeAreaView style={styles.safeArea}>
              <Animated.View entering={FadeIn.duration(400)} style={styles.brandRow}>
                <Text style={styles.starIcon}>✦</Text>
                <Text style={styles.brandTitleSmall}>RADIANCE</Text>
                <View style={styles.goldLine} />
                <StepDots current={1} />
              </Animated.View>

              <Animated.View entering={FadeInUp.duration(400)} style={styles.content}>
                <Text style={styles.title}>Let's Get Started</Text>
                <Text style={styles.subtitle}>Enter your mobile number to continue</Text>

                <View style={[styles.inputGroup, { marginTop: 28 }]}>
                  <View style={styles.inputRow}>
                    <View style={styles.iconBox}><Text style={styles.iconText}>📱</Text></View>
                    <View style={styles.phonePrefix}>
                      <Text style={styles.floatLabel}>Mobile Number</Text>
                      <View style={styles.phonePrefixRow}>
                        <Text style={styles.phonePrefixCode}>+91</Text>
                        <TextInput
                          value={phone}
                          onChangeText={setPhone}
                          placeholder="Enter mobile number"
                          placeholderTextColor={COLORS.grayLight}
                          keyboardType="phone-pad"
                          maxLength={10}
                          autoFocus
                          style={styles.phoneInlineInput}
                        />
                      </View>
                    </View>
                  </View>
                </View>

                {error && (
                  <Animated.View entering={FadeIn.duration(200)} style={styles.errorBox}>
                    <Text style={styles.errorText}>{error}</Text>
                  </Animated.View>
                )}

                <Pressable
                  onPress={handleSendOtp}
                  disabled={submitting}
                  style={({ pressed }) => [styles.navyButton, (pressed || submitting) && styles.buttonPressed]}>
                  <Text style={styles.navyButtonText}>{submitting ? 'Sending…' : 'Continue'}</Text>
                  <Text style={styles.navyButtonArrow}>→</Text>
                </Pressable>

                <Text style={styles.assuranceText}>We'll text you a one-time code</Text>
              </Animated.View>

              <View style={styles.buildingSection}>
                <Image style={styles.buildingImage} source={require('../../assets/splashscreen/building.png')} contentFit="contain" />
              </View>

              <Text style={styles.termsText}>
                By continuing, you agree to our <Text style={styles.termsLink}>Terms</Text> & <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </SafeAreaView>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  // ─── OTP ───
  if (screen === 'otp') {
    return (
      <View style={styles.container}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.select({ ios: 'padding', default: undefined })}>
          <ScrollView contentContainerStyle={styles.scrollContent} bounces={false} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <SafeAreaView style={styles.safeArea}>
              <View style={styles.topBar}>
                <Pressable onPress={goBackToPhone} style={styles.backBtn} hitSlop={12}>
                  <Text style={styles.backArrow}>‹</Text>
                </Pressable>
                <StepDots current={2} />
                <View style={styles.backBtn} />
              </View>

              <Animated.View entering={FadeIn.duration(400)} style={styles.stepIconWrap}>
                <View style={[styles.stepIconCircle, { backgroundColor: COLORS.orangeSoft }]}>
                  <Text style={styles.stepIconEmoji}>🛡️</Text>
                </View>
              </Animated.View>

              <Animated.View entering={FadeInUp.duration(400)} style={styles.content}>
                <Text style={styles.title}>Verify Your Number</Text>
                <View style={styles.phoneEditRow}>
                  <Text style={styles.subtitle}>Code sent to +91 {phone.trim()}</Text>
                  <Pressable onPress={goBackToPhone}>
                    <Text style={styles.editLink}>Edit</Text>
                  </Pressable>
                </View>

                <View style={{ marginTop: 28, marginBottom: 8 }}>
                  <OtpInput value={otpCode} onChange={setOtpCode} />
                </View>

                <View style={styles.resendRow}>
                  <Text style={styles.resendLabel}>Didn't get it? </Text>
                  <Pressable onPress={handleResendOtp} disabled={resendTimer > 0}>
                    <Text style={[styles.resendLink, resendTimer > 0 && styles.resendDisabled]}>Resend</Text>
                  </Pressable>
                </View>
                {resendTimer > 0 && <Text style={styles.timerText}>{formatTimer(resendTimer)}</Text>}

                {error && (
                  <Animated.View entering={FadeIn.duration(200)} style={styles.errorBox}>
                    <Text style={styles.errorText}>{error}</Text>
                  </Animated.View>
                )}

                <Pressable
                  onPress={handleVerifyOtp}
                  disabled={submitting}
                  style={({ pressed }) => [styles.navyButton, { marginTop: 24 }, (pressed || submitting) && styles.buttonPressed]}>
                  <Text style={styles.navyButtonText}>{submitting ? 'Verifying…' : 'Verify & Continue'}</Text>
                  <Text style={styles.navyButtonArrow}>→</Text>
                </Pressable>
              </Animated.View>
            </SafeAreaView>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  // ─── PROFILE ───
  return (
    <View style={styles.container}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.select({ ios: 'padding', default: undefined })}>
        <ScrollView contentContainerStyle={styles.scrollContent} bounces={false} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.topBar}>
              <View style={styles.backBtn} />
              <StepDots current={3} />
              <View style={styles.backBtn} />
            </View>

            <Animated.View entering={FadeIn.duration(400)} style={styles.stepIconWrap}>
              <View style={[styles.stepIconCircle, { backgroundColor: COLORS.greenSoft }]}>
                <Text style={styles.stepIconEmoji}>👤</Text>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInUp.duration(400)} style={styles.content}>
              <Text style={styles.title}>What's Your Name?</Text>
              <Text style={styles.subtitle}>This is how we'll greet you in the app</Text>

              <View style={[styles.inputGroup, { marginTop: 28 }]}>
                <View style={styles.inputRow}>
                  <View style={styles.iconBox}><Text style={styles.iconText}>👤</Text></View>
                  <TextInput
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Enter your full name"
                    placeholderTextColor={COLORS.grayLight}
                    autoFocus
                    style={styles.inputField}
                  />
                </View>
              </View>

              {error && (
                <Animated.View entering={FadeIn.duration(200)} style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </Animated.View>
              )}

              <Pressable
                onPress={handleFinishProfile}
                style={({ pressed }) => [styles.navyButton, pressed && styles.buttonPressed]}>
                <Text style={styles.navyButtonText}>Get Started</Text>
                <Text style={styles.navyButtonArrow}>→</Text>
              </Pressable>
            </Animated.View>
          </SafeAreaView>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  safeArea: { flex: 1 },

  // ─── Top bar (back + dots) ───
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: { fontSize: 26, fontWeight: '600', color: COLORS.navy, marginTop: -2 },

  // ─── Brand (phone screen header) ───
  brandRow: { alignItems: 'center', paddingTop: 16, gap: 10 },
  starIcon: { fontSize: 28, color: COLORS.gold },
  brandTitleSmall: { fontSize: 22, fontWeight: '800', letterSpacing: 4, color: COLORS.navy },
  goldLine: { width: 28, height: 3, borderRadius: 2, backgroundColor: COLORS.gold },

  // ─── Step dots ───
  dotsRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotInactive: { backgroundColor: COLORS.grayBorder },
  dotActive: { backgroundColor: COLORS.gold },
  dotCurrent: { width: 20, borderRadius: 4, backgroundColor: COLORS.gold },

  // ─── Step icon ───
  stepIconWrap: { alignItems: 'center', marginVertical: 20 },
  stepIconCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  stepIconEmoji: { fontSize: 32 },

  // ─── Content ───
  content: { paddingHorizontal: 28, paddingTop: 8 },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.navy },
  subtitle: { fontSize: 15, color: COLORS.gray, marginTop: 6, lineHeight: 22 },

  // ─── Inputs ───
  inputGroup: { marginBottom: 14 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.grayBorder,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    paddingHorizontal: 4,
  },
  iconBox: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 18 },
  inputField: { flex: 1, fontSize: 16, color: COLORS.navy, paddingVertical: 14 },

  floatLabel: { fontSize: 11, fontWeight: '600', color: COLORS.gray, marginBottom: 2 },
  phonePrefix: { flex: 1, paddingVertical: 8 },
  phonePrefixRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  phonePrefixCode: { fontSize: 16, fontWeight: '700', color: COLORS.navy },
  phoneInlineInput: { flex: 1, fontSize: 16, color: COLORS.navy, paddingVertical: 0 },

  // ─── OTP ───
  otpRow: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  otpBox: {
    width: 46,
    height: 56,
    borderWidth: 1.5,
    borderColor: COLORS.grayBorder,
    borderRadius: 14,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.navy,
    backgroundColor: COLORS.white,
  },
  otpBoxFilled: { borderColor: COLORS.navy, backgroundColor: COLORS.blueSoft },
  phoneEditRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  editLink: { fontSize: 14, fontWeight: '600', color: COLORS.blue },
  resendRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  resendLabel: { fontSize: 13, color: COLORS.gray },
  resendLink: { fontSize: 13, fontWeight: '700', color: COLORS.blue },
  resendDisabled: { color: COLORS.grayLight },
  timerText: { textAlign: 'center', fontSize: 16, fontWeight: '700', color: COLORS.gold, marginTop: 8 },

  // ─── Button ───
  navyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.navy,
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 14,
    shadowColor: COLORS.navy,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  buttonPressed: { opacity: 0.8 },
  navyButtonText: { fontSize: 17, fontWeight: '700', color: COLORS.white },
  navyButtonArrow: { fontSize: 20, color: COLORS.white, position: 'absolute', right: 24 },

  // ─── Building ───
  buildingSection: { marginTop: 32, height: 140, width: '100%', overflow: 'hidden' },
  buildingImage: { width: '110%', height: '100%', alignSelf: 'center', opacity: 0.35 },

  // ─── Error ───
  errorBox: {
    backgroundColor: COLORS.errorBg,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    marginTop: 14,
  },
  errorText: { fontSize: 13, fontWeight: '600', color: COLORS.error },

  // ─── Assurance / terms ───
  assuranceText: { textAlign: 'center', fontSize: 13, color: COLORS.gray, marginTop: 14 },
  termsText: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.grayLight,
    lineHeight: 18,
    paddingHorizontal: 28,
    paddingBottom: 20,
    paddingTop: 8,
  },
  termsLink: { color: COLORS.blue, fontWeight: '600', textDecorationLine: 'underline' },
});
