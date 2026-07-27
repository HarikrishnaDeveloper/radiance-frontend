import { Ionicons } from '@expo/vector-icons';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from './colors';
import { loginStyles as styles } from './login-styles';
import { StepDots } from './step-dots';

type Props = {
  newPassword: string;
  onNewPasswordChange: (text: string) => void;
  showNewPassword: boolean;
  onToggleShowNewPassword: () => void;
  confirmNewPassword: string;
  onConfirmNewPasswordChange: (text: string) => void;
  showConfirmNewPassword: boolean;
  onToggleShowConfirmNewPassword: () => void;
  error: string | null;
  onContinue: () => void;
};

export function CreatePasswordScreen({
  newPassword,
  onNewPasswordChange,
  showNewPassword,
  onToggleShowNewPassword,
  confirmNewPassword,
  onConfirmNewPasswordChange,
  showConfirmNewPassword,
  onToggleShowConfirmNewPassword,
  error,
  onContinue,
}: Props) {
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
              <View style={[styles.stepIconCircle, { backgroundColor: COLORS.purpleSoft }]}>
                <Text style={styles.stepIconEmoji}>🔑</Text>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInUp.duration(400)} style={styles.content}>
              <Text style={styles.title}>Create Password</Text>
              <Text style={styles.subtitle}>Set a password to secure your account</Text>

              <View style={[styles.inputGroup, { marginTop: 28 }]}>
                <Text style={styles.fieldLabel}>New Password</Text>
                <View style={styles.inputRow}>
                  <View style={styles.iconBox}><Text style={styles.iconText}>🔒</Text></View>
                  <TextInput
                    value={newPassword}
                    onChangeText={onNewPasswordChange}
                    placeholder="Enter a new password"
                    placeholderTextColor={COLORS.grayLight}
                    secureTextEntry={!showNewPassword}
                    autoFocus
                    style={styles.inputField}
                  />
                  <Pressable onPress={onToggleShowNewPassword} hitSlop={12} style={styles.eyeBtn}>
                    <Ionicons name={showNewPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={COLORS.grayLight} />
                  </Pressable>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.fieldLabel}>Confirm Password</Text>
                <View style={styles.inputRow}>
                  <View style={styles.iconBox}><Text style={styles.iconText}>🔒</Text></View>
                  <TextInput
                    value={confirmNewPassword}
                    onChangeText={onConfirmNewPasswordChange}
                    placeholder="Re-enter your password"
                    placeholderTextColor={COLORS.grayLight}
                    secureTextEntry={!showConfirmNewPassword}
                    style={styles.inputField}
                  />
                  <Pressable onPress={onToggleShowConfirmNewPassword} hitSlop={12} style={styles.eyeBtn}>
                    <Ionicons name={showConfirmNewPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={COLORS.grayLight} />
                  </Pressable>
                </View>
              </View>

              {error && (
                <Animated.View entering={FadeIn.duration(200)} style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </Animated.View>
              )}

              <Pressable
                onPress={onContinue}
                style={({ pressed }) => [styles.navyButton, pressed && styles.buttonPressed]}>
                <Text style={styles.navyButtonText}>Continue</Text>
                <Text style={styles.navyButtonArrow}>→</Text>
              </Pressable>
            </Animated.View>
          </SafeAreaView>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
