import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from './colors';
import { loginStyles as styles } from './login-styles';
import { Toast, type ToastData } from '../toast';

type Props = {
  phone: string;
  onPhoneChange: (text: string) => void;
  password: string;
  onPasswordChange: (text: string) => void;
  showPassword: boolean;
  onToggleShowPassword: () => void;
  toast: ToastData | null;
  onHideToast: () => void;
  submitting: boolean;
  onLogin: () => void;
  onForgotPassword: () => void;
  onGoToSignUp: () => void;
};

export function WelcomeBackScreen({
  phone,
  onPhoneChange,
  password,
  onPasswordChange,
  showPassword,
  onToggleShowPassword,
  toast,
  onHideToast,
  submitting,
  onLogin,
  onForgotPassword,
  onGoToSignUp,
}: Props) {
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const isCompact = windowHeight < 700;
  const heroSize = Math.min(windowWidth * 0.8, windowHeight * (isCompact ? 0.16 : 0.32), 320);

  return (
    <View style={styles.loginContainer}>
      <Toast toast={toast} onHide={onHideToast} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.select({ ios: 'padding', default: 'height' })}
        keyboardVerticalOffset={Platform.select({ ios: 0, default: 0 })}>
        <SafeAreaView style={styles.loginSafeArea}>
          <Animated.View entering={FadeIn.duration(400)} style={styles.loginHero}>
            <Image
              style={{ width: heroSize, height: heroSize, alignSelf: 'center' }}
              source={require('../../../assets/login/book.png')}
              contentFit="cover"
              contentPosition="top"
            />
          </Animated.View>

          <Animated.View entering={FadeInUp.duration(400)} style={styles.content}>
            <Text style={styles.loginWelcome}>Welcome Back</Text>
            <Text style={styles.subtitle}>Login to continue your UPSC journey</Text>

            <View style={[styles.inputGroup, { marginTop: isCompact ? 16 : 40 }]}>
              <Text style={styles.fieldLabel}>Mobile Number</Text>
              <View style={styles.inputRow}>
                <Text style={styles.countryCode}>+91</Text>
                <Ionicons name="chevron-down" size={14} color={COLORS.grayLight} />
                <View style={styles.inputDivider} />
                <Ionicons name="call-outline" size={18} color={COLORS.purple} style={styles.inputLeadingIcon} />
                <TextInput
                  value={phone}
                  onChangeText={onPhoneChange}
                  placeholder="Enter your mobile number"
                  placeholderTextColor={COLORS.grayLight}
                  keyboardType="phone-pad"
                  autoFocus
                  style={styles.inputField}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.fieldLabel}>Password</Text>
                <Pressable onPress={onForgotPassword} hitSlop={8}>
                  <Text style={styles.forgotPassword}>Forgot Password?</Text>
                </Pressable>
              </View>
              <View style={styles.inputRow}>
                <Ionicons name="lock-closed-outline" size={18} color={COLORS.purple} style={[styles.inputLeadingIcon, { marginLeft: 14 }]} />
                <TextInput
                  value={password}
                  onChangeText={onPasswordChange}
                  placeholder="Enter your password"
                  placeholderTextColor={COLORS.grayLight}
                  secureTextEntry={!showPassword}
                  style={styles.inputField}
                />
                <Pressable onPress={onToggleShowPassword} hitSlop={12} style={styles.eyeBtn}>
                  <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={COLORS.grayLight} />
                </Pressable>
              </View>
            </View>

            <Pressable onPress={onLogin} disabled={submitting} style={({ pressed }) => [{ marginTop: isCompact ? 20 : 32 }, pressed && styles.buttonPressed]}>
              <LinearGradient
                colors={[COLORS.purple, COLORS.purpleDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.purpleButton, { marginTop: isCompact ? 16 : 28 }]}>
                <Text style={styles.purpleButtonText}>{submitting ? 'Logging in…' : 'Login'}</Text>
                {/* <Ionicons name="arrow-forward" size={18} color={COLORS.white} style={{ marginLeft: 10 }} /> */}
              </LinearGradient>
            </Pressable>

            <View style={[styles.signUpRow, isCompact && { marginTop: 20, paddingBottom: 8 }]}>
              <Text style={styles.signUpLabel}>Don't have an account? </Text>
              <Pressable onPress={onGoToSignUp}>
                <Text style={styles.signUpLink}>Sign Up</Text>
              </Pressable>
            </View>
          </Animated.View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}
