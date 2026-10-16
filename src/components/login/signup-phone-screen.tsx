import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from './colors';
import { Toast } from '../toast';
import { loginStyles as styles } from './login-styles';
import { useErrorToast } from '@/hooks/use-error-toast';
import { Pressable } from '@/components/ui/pressable';

type Props = {
  phone: string;
  onPhoneChange: (text: string) => void;
  error: string | null;
  submitting: boolean;
  onContinue: () => void;
  onGoToLogin: () => void;
};

export function SignupPhoneScreen({ phone, onPhoneChange, error, submitting, onContinue, onGoToLogin }: Props) {
  const [toast, setToast] = useErrorToast(error);
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const isCompact = windowHeight < 700;
  const heroSize = Math.min(windowWidth * 0.4, windowHeight * (isCompact ? 0.16 : 0.32), 320);

  return (
    <View style={styles.loginContainer}>
      <Toast toast={toast} onHide={() => setToast(null)} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.select({ ios: 'padding', default: 'height' })}
        keyboardVerticalOffset={Platform.select({ ios: 0, default: 0 })}>
        <ScrollView
          contentContainerStyle={styles.loginScrollContent}
          bounces={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <SafeAreaView style={styles.loginSafeArea}>
            <Animated.View entering={FadeIn.duration(400)} style={styles.loginHero}>

              <Image
                style={{ width: heroSize, height: heroSize, alignSelf: 'center' }}
                source={require('../../../assets/images/logo.png')}
                contentFit="contain"
              />
            </Animated.View>

            <Animated.View entering={FadeInUp.duration(400)} style={styles.content}>
              <Text style={styles.loginWelcome}>Create Your Account</Text>
              <Text style={styles.subtitle}>Let&apos;s get started on your UPSC journey</Text>

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

              <Pressable onPress={onContinue} disabled={submitting} style={({ pressed }) => [{ marginTop: isCompact ? 20 : 32 }, pressed && styles.buttonPressed]}>
                <View style={[styles.purpleButton, { marginTop: isCompact ? 16 : 28 }, { backgroundColor: COLORS.purple }]}>
                  <Text style={styles.purpleButtonText}>{submitting ? 'Sending…' : 'Continue'}</Text>
                </View>
              </Pressable>

              <View style={[styles.signUpRow, isCompact && { marginTop: 20, paddingBottom: 8 }]}>
                <Text style={styles.signUpLabel}>Already have an account? </Text>
                <Pressable onPress={onGoToLogin}>
                  <Text style={styles.signUpLink}>Login</Text>
                </Pressable>
              </View>

              <Text style={styles.termsText}>
                By continuing, you agree to our <Text style={styles.termsLink}>Terms</Text> & <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </Animated.View>
          </SafeAreaView>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
