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
  phone: string;
  onPhoneChange: (text: string) => void;
  error: string | null;
  submitting?: boolean;
  onBack: () => void;
  onSendCode: () => void;
};

export function ForgotPhoneScreen({ phone, onPhoneChange, error, submitting = false, onBack, onSendCode }: Props) {
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
              <Pressable onPress={onBack} style={localStyles.backBtn} hitSlop={16}>
                <Ionicons name="arrow-back" size={20} color={COLORS.purple} />
              </Pressable>
            </View>

            <Animated.View entering={FadeIn.duration(400)} style={localStyles.illustrationWrap} pointerEvents="none">
              <Image
                style={localStyles.illustrationImage}
                source={require('../../../assets/login/forgetpassword.png')}
                contentFit="contain"
                pointerEvents="none"
              />
            </Animated.View>

            <Animated.View entering={FadeInUp.duration(400)} style={[styles.content, { zIndex: 10, elevation: 10 }]}>
              <Text style={[styles.title, { textAlign: 'center' }]}>Forgot Password?</Text>
              <Text style={styles.subtitle}>Enter your registered mobile number</Text>

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
                    autoComplete="off"
                    importantForAutofill="no"
                    textContentType="none"
                    style={styles.inputField}
                  />
                </View>
              </View>

              <Pressable
                onPress={onSendCode}
                disabled={submitting}
                style={({ pressed }) => [pressed && styles.buttonPressed]}>
                <LinearGradient
                  colors={[COLORS.purple, COLORS.purpleDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.purpleButton, { marginTop: 28 }]}>
                  <Text style={styles.purpleButtonText}>{submitting ? 'Sending…' : 'Send OTP'}</Text>
                  {/* <Ionicons name="arrow-forward" size={18} color={COLORS.white} style={{ marginLeft: 10 }} /> */}
                </LinearGradient>
              </Pressable>

              <View style={styles.signUpRow}>
                <Pressable onPress={onBack}>
                  <Text style={styles.signUpLink}>Back to Login</Text>
                </Pressable>
              </View>
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
    width: '90%',
    maxWidth: 320,
    aspectRatio: 1,
  },
});
