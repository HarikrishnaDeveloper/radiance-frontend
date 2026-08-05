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
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useEffect, useState } from 'react';
import { COLORS } from './colors';
import { Toast, type ToastData } from '../toast';
import { loginStyles as styles } from './login-styles';

type Props = {
  resetPassword: string;
  onResetPasswordChange: (text: string) => void;
  showResetPassword: boolean;
  onToggleShowResetPassword: () => void;
  resetConfirmPassword: string;
  onResetConfirmPasswordChange: (text: string) => void;
  showResetConfirmPassword: boolean;
  onToggleShowResetConfirmPassword: () => void;
  error: string | null;
  submitting?: boolean;
  onBack?: () => void;
  onSubmit: () => void;
};

export function ForgotPasswordScreen({
  resetPassword,
  onResetPasswordChange,
  showResetPassword,
  onToggleShowResetPassword,
  resetConfirmPassword,
  onResetConfirmPasswordChange,
  showResetConfirmPassword,
  onToggleShowResetConfirmPassword,
  error,
  submitting = false,
  onBack,
  onSubmit,
}: Props) {
  const len = resetPassword.length;
  const level = len === 0 ? 1 : len < 6 ? 1 : len < 8 ? 2 : len < 10 ? 3 : 4;
  const label = len === 0 ? 'Weak' : len < 6 ? 'Weak' : len < 8 ? 'Fair' : len < 10 ? 'Good' : 'Strong';
  const color =
    len === 0
      ? '#EF4444'
      : len < 6
        ? '#EF4444'
        : len < 8
          ? '#F59E0B'
          : len < 10
            ? COLORS.purple
            : '#10B981';

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
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <SafeAreaView style={styles.safeArea}>
            <View style={localStyles.topBar}>
              {onBack ? (
                <Pressable onPress={onBack} style={localStyles.backBtn} hitSlop={16}>
                  <Ionicons name="arrow-back" size={20} color={COLORS.purple} />
                </Pressable>
              ) : (
                <View style={localStyles.backBtn} />
              )}
            </View>

            <Animated.View
              entering={FadeIn.duration(400)}
              style={localStyles.illustrationWrap}
              pointerEvents="none">
              <Image
                style={localStyles.illustrationImage}
                source={require('../../../assets/login/profile.png')}
                contentFit="contain"
                pointerEvents="none"
              />
            </Animated.View>

            <Animated.View entering={FadeInUp.duration(400)} style={[styles.content, { zIndex: 10, elevation: 10 }]}>
              <Text style={[styles.title, { textAlign: 'center' }]}>Reset Password</Text>
              <Text style={styles.subtitle}>Set a new password for your account</Text>

              <View style={[styles.inputGroup, { marginTop: 32 }]}>
                <Text style={styles.fieldLabel}>New Password</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="lock-closed-outline" size={20} color={COLORS.purple} style={styles.inputLeadingIcon} />
                  <TextInput
                    value={resetPassword}
                    onChangeText={onResetPasswordChange}
                    placeholder="Enter new password"
                    placeholderTextColor={COLORS.grayLight}
                    secureTextEntry={!showResetPassword}
                    textContentType="newPassword"
                    autoComplete="password-new"
                    style={styles.inputField}
                  />
                  <Pressable onPress={onToggleShowResetPassword} hitSlop={16} style={styles.eyeBtn}>
                    <Ionicons
                      name={showResetPassword ? 'eye-outline' : 'eye-off-outline'}
                      size={20}
                      color={COLORS.grayLight}
                    />
                  </Pressable>
                </View>

                {/* Password Strength Bars & Helper */}
                <View style={localStyles.strengthSection}>
                  <View style={localStyles.strengthHeader}>
                    <View style={localStyles.barsRow}>
                      {[1, 2, 3, 4].map((idx) => (
                        <View
                          key={idx}
                          style={[
                            localStyles.barSegment,
                            idx <= level ? { backgroundColor: COLORS.purple } : { backgroundColor: '#E2E8F0' },
                          ]}
                        />
                      ))}
                    </View>
                    <Text style={[localStyles.strengthText, { color }]}>{label}</Text>
                  </View>
                  <Text style={localStyles.helperText}>
                    Use at least 8 characters with a mix of letters, numbers & symbols.
                  </Text>
                </View>
              </View>

              <View style={[styles.inputGroup, { marginTop: 24 }]}>
                <Text style={styles.fieldLabel}>Confirm New Password</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="lock-closed-outline" size={20} color={COLORS.purple} style={styles.inputLeadingIcon} />
                  <TextInput
                    value={resetConfirmPassword}
                    onChangeText={onResetConfirmPasswordChange}
                    placeholder="Confirm new password"
                    placeholderTextColor={COLORS.grayLight}
                    secureTextEntry={!showResetConfirmPassword}
                    textContentType="newPassword"
                    autoComplete="password-new"
                    style={styles.inputField}
                  />
                  <Pressable onPress={onToggleShowResetConfirmPassword} hitSlop={16} style={styles.eyeBtn}>
                    <Ionicons
                      name={showResetConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                      size={20}
                      color={COLORS.grayLight}
                    />
                  </Pressable>
                </View>
              </View>

              <Pressable
                onPress={onSubmit}
                disabled={submitting}
                style={({ pressed }) => [pressed && styles.buttonPressed]}>
                <LinearGradient
                  colors={[COLORS.purple, COLORS.purpleDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.purpleButton, { marginTop: 32 }]}>
                  <Text style={styles.purpleButtonText}>{submitting ? 'Resetting…' : 'Reset Password'}</Text>
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
    width: '85%',
    maxWidth: 320,
    aspectRatio: 1,
  },
  strengthSection: {
    marginTop: 12,
  },
  strengthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 16,
  },
  barSegment: {
    flex: 1,
    height: 5,
    borderRadius: 3,
  },
  strengthText: {
    fontSize: 13,
    fontWeight: '700',
  },
  helperText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
});
