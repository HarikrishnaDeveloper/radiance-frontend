import { Ionicons } from '@expo/vector-icons';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from './colors';
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
  onSubmit,
}: Props) {
  return (
    <View style={styles.container}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.select({ ios: 'padding', default: undefined })}>
        <ScrollView contentContainerStyle={styles.scrollContent} bounces={false} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.topBar}>
              <View style={styles.backBtn} />
              <View style={styles.backBtn} />
            </View>

            <Animated.View entering={FadeIn.duration(400)} style={styles.stepIconWrap}>
              <View style={[styles.stepIconCircle, { backgroundColor: COLORS.purpleSoft }]}>
                <Text style={styles.stepIconEmoji}>🔑</Text>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInUp.duration(400)} style={styles.content}>
              <Text style={styles.title}>Set New Password</Text>
              <Text style={styles.subtitle}>Create a new password for your account</Text>

              <View style={[styles.inputGroup, { marginTop: 28 }]}>
                <Text style={styles.fieldLabel}>New Password</Text>
                <View style={styles.inputRow}>
                  <View style={styles.iconBox}><Text style={styles.iconText}>🔒</Text></View>
                  <TextInput
                    value={resetPassword}
                    onChangeText={onResetPasswordChange}
                    placeholder="Enter a new password"
                    placeholderTextColor={COLORS.grayLight}
                    secureTextEntry={!showResetPassword}
                    autoFocus
                    style={styles.inputField}
                  />
                  <Pressable onPress={onToggleShowResetPassword} hitSlop={12} style={styles.eyeBtn}>
                    <Ionicons name={showResetPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={COLORS.grayLight} />
                  </Pressable>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.fieldLabel}>Confirm Password</Text>
                <View style={styles.inputRow}>
                  <View style={styles.iconBox}><Text style={styles.iconText}>🔒</Text></View>
                  <TextInput
                    value={resetConfirmPassword}
                    onChangeText={onResetConfirmPasswordChange}
                    placeholder="Re-enter your password"
                    placeholderTextColor={COLORS.grayLight}
                    secureTextEntry={!showResetConfirmPassword}
                    style={styles.inputField}
                  />
                  <Pressable onPress={onToggleShowResetConfirmPassword} hitSlop={12} style={styles.eyeBtn}>
                    <Ionicons name={showResetConfirmPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={COLORS.grayLight} />
                  </Pressable>
                </View>
              </View>

              {error && (
                <Animated.View entering={FadeIn.duration(200)} style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </Animated.View>
              )}

              <Pressable
                onPress={onSubmit}
                style={({ pressed }) => [styles.navyButton, pressed && styles.buttonPressed]}>
                <Text style={styles.navyButtonText}>Reset Password</Text>
                <Text style={styles.navyButtonArrow}>→</Text>
              </Pressable>
            </Animated.View>
          </SafeAreaView>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
