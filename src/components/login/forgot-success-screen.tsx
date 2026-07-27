import { Ionicons } from '@expo/vector-icons';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from './colors';
import { loginStyles as styles } from './login-styles';

type Props = {
  onBackToLogin: () => void;
};

export function ForgotSuccessScreen({ onBackToLogin }: Props) {
  return (
    <View style={styles.container}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.select({ ios: 'padding', default: undefined })}>
        <ScrollView contentContainerStyle={styles.scrollContent} bounces={false} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <SafeAreaView style={styles.safeArea}>
            <Animated.View entering={FadeIn.duration(400)} style={[styles.stepIconWrap, { marginTop: 80 }]}>
              <View style={[styles.stepIconCircle, { width: 96, height: 96, borderRadius: 48, backgroundColor: COLORS.greenSoft }]}>
                <Ionicons name="checkmark-circle" size={56} color="#34A853" />
              </View>
            </Animated.View>

            <Animated.View entering={FadeInUp.duration(400)} style={[styles.content, { alignItems: 'center' }]}>
              <Text style={styles.title}>Password Reset!</Text>
              <Text style={[styles.subtitle, { textAlign: 'center' }]}>
                Your password has been reset successfully. Please login with your new password.
              </Text>

              <Pressable
                onPress={onBackToLogin}
                style={({ pressed }) => [styles.navyButton, { width: '100%', marginTop: 32 }, pressed && styles.buttonPressed]}>
                <Text style={styles.navyButtonText}>Back to Login</Text>
                <Text style={styles.navyButtonArrow}>→</Text>
              </Pressable>
            </Animated.View>
          </SafeAreaView>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
