import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from './colors';
import { loginStyles as styles } from './login-styles';
import { StepDots } from './step-dots';

type Props = {
  username: string;
  onUsernameChange: (text: string) => void;
  error: string | null;
  onSubmit: () => void;
};

export function ChooseUsernameScreen({ username, onUsernameChange, error, onSubmit }: Props) {
  return (
    <View style={styles.container}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.select({ ios: 'padding', default: undefined })}>
        <ScrollView contentContainerStyle={styles.scrollContent} bounces={false} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.topBar}>
              <View style={styles.backBtn} />
              <StepDots current={4} />
              <View style={styles.backBtn} />
            </View>

            <Animated.View entering={FadeIn.duration(400)} style={styles.stepIconWrap}>
              <View style={[styles.stepIconCircle, { backgroundColor: COLORS.greenSoft }]}>
                <Text style={styles.stepIconEmoji}>👤</Text>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInUp.duration(400)} style={styles.content}>
              <Text style={styles.title}>Choose Username</Text>
              <Text style={styles.subtitle}>Pick a unique username for your profile</Text>

              <View style={[styles.inputGroup, { marginTop: 28 }]}>
                <View style={styles.inputRow}>
                  <View style={styles.iconBox}><Text style={styles.iconText}>👤</Text></View>
                  <TextInput
                    value={username}
                    onChangeText={onUsernameChange}
                    placeholder="Enter your username"
                    placeholderTextColor={COLORS.grayLight}
                    autoCapitalize="none"
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

              <Pressable
                onPress={onSubmit}
                style={({ pressed }) => [styles.navyButton, pressed && styles.buttonPressed]}>
                <Text style={styles.navyButtonText}>Get Started</Text>
                <Text style={styles.navyButtonArrow}>→</Text>
              </Pressable>
            </Animated.View>
          </SafeAreaView>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
