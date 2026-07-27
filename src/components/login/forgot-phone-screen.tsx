import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from './colors';
import { loginStyles as styles } from './login-styles';

type Props = {
  phone: string;
  onPhoneChange: (text: string) => void;
  error: string | null;
  onBack: () => void;
  onSendCode: () => void;
};

export function ForgotPhoneScreen({ phone, onPhoneChange, error, onBack, onSendCode }: Props) {
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
              <View style={[styles.stepIconCircle, { backgroundColor: COLORS.purpleSoft }]}>
                <Text style={styles.stepIconEmoji}>🔑</Text>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInUp.duration(400)} style={styles.content}>
              <Text style={styles.title}>Reset Password</Text>
              <Text style={styles.subtitle}>Enter your mobile number to receive a verification code</Text>

              <View style={[styles.inputGroup, { marginTop: 28 }]}>
                <View style={styles.inputRow}>
                  <View style={styles.iconBox}><Text style={styles.iconText}>📱</Text></View>
                  <View style={styles.phonePrefix}>
                    <Text style={styles.floatLabel}>Mobile Number</Text>
                    <View style={styles.phonePrefixRow}>
                      <Text style={styles.phonePrefixCode}>+91</Text>
                      <TextInput
                        value={phone}
                        onChangeText={onPhoneChange}
                        placeholder="Enter mobile number"
                        placeholderTextColor={COLORS.grayLight}
                        keyboardType="phone-pad"
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
                onPress={onSendCode}
                style={({ pressed }) => [styles.navyButton, pressed && styles.buttonPressed]}>
                <Text style={styles.navyButtonText}>Send Code</Text>
                <Text style={styles.navyButtonArrow}>→</Text>
              </Pressable>
            </Animated.View>
          </SafeAreaView>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
