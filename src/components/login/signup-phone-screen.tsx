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
  error: string | null;
  submitting: boolean;
  onContinue: () => void;
  onGoToLogin: () => void;
};

export function SignupPhoneScreen({ phone, onPhoneChange, error, submitting, onContinue, onGoToLogin }: Props) {
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
              <Text style={styles.loginWelcome}>Create Your Account</Text>
              <Text style={styles.subtitle}>Let's get started on your UPSC journey</Text>

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

              {error && (
                <Animated.View entering={FadeIn.duration(200)} style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </Animated.View>
              )}

              <Pressable onPress={onContinue} disabled={submitting} style={({ pressed }) => [{ marginTop: 32 }, pressed && styles.buttonPressed]}>
                <LinearGradient
                  colors={[COLORS.purple, COLORS.purpleDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.purpleButton}>
                  <Text style={styles.purpleButtonText}>{submitting ? 'Sending…' : 'Continue'}</Text>
                  <Ionicons name="arrow-forward" size={18} color={COLORS.white} style={{ marginLeft: 10 }} />
                </LinearGradient>
              </Pressable>

              <View style={styles.signUpRow}>
                <Text style={styles.signUpLabel}>Already have an account? </Text>
                <Pressable onPress={onGoToLogin}>
                  <Text style={styles.signUpLink}>Login</Text>
                </Pressable>
              </View>
            </Animated.View>

            <Text style={styles.termsText}>
              By continuing, you agree to our <Text style={styles.termsLink}>Terms</Text> & <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </SafeAreaView>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
