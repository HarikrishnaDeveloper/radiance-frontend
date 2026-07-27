import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from './colors';
import { loginStyles as styles } from './login-styles';

type Props = {
  phone: string;
  onPhoneChange: (text: string) => void;
  password: string;
  onPasswordChange: (text: string) => void;
  showPassword: boolean;
  onToggleShowPassword: () => void;
  error: string | null;
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
  error,
  submitting,
  onLogin,
  onForgotPassword,
  onGoToSignUp,
}: Props) {
  return (
    <View style={styles.loginContainer}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.select({ ios: 'padding', default: undefined })}>
        <ScrollView contentContainerStyle={styles.loginScrollContent} bounces={false} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <SafeAreaView style={styles.safeArea}>
            <Animated.View entering={FadeIn.duration(400)} style={styles.loginHero}>
              <Image
                style={styles.loginBookImage}
                source={require('../../../assets/login/book.png')}
                contentFit="cover"
                contentPosition="top"
              />
            </Animated.View>

            <Animated.View entering={FadeInUp.duration(400)} style={styles.content}>
              <Text style={styles.loginWelcome}>Welcome Back</Text>
              <Text style={styles.subtitle}>Login to continue your UPSC journey</Text>

              <View style={[styles.inputGroup, { marginTop: 40 }]}>
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

              {error && (
                <Animated.View entering={FadeIn.duration(200)} style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </Animated.View>
              )}

              <Pressable onPress={onLogin} disabled={submitting} style={({ pressed }) => [{ marginTop: 32 }, pressed && styles.buttonPressed]}>
                <LinearGradient
                  colors={[COLORS.purple, COLORS.purpleDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.purpleButton}>
                  <Text style={styles.purpleButtonText}>{submitting ? 'Logging in…' : 'Login'}</Text>
                  <Ionicons name="arrow-forward" size={18} color={COLORS.white} style={{ marginLeft: 10 }} />
                </LinearGradient>
              </Pressable>

              <View style={styles.signUpRow}>
                <Text style={styles.signUpLabel}>Don't have an account? </Text>
                <Pressable onPress={onGoToSignUp}>
                  <Text style={styles.signUpLink}>Sign Up</Text>
                </Pressable>
              </View>
            </Animated.View>
          </SafeAreaView>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
