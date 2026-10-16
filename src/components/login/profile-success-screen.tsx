import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Pressable } from '@/components/ui/pressable';

import { COLORS } from './colors';

type Props = {
  onContinue: () => void;
};

export function ProfileSuccessScreen({ onContinue }: Props) {
  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        bounces={false}
        showsVerticalScrollIndicator={false}>
        <SafeAreaView style={styles.safeArea}>
          <Animated.View entering={FadeIn.duration(450)} style={styles.heroWrap}>
            <View style={styles.heroBadge}>
              <Ionicons name="checkmark" size={36} color={COLORS.purple} />
            </View>
          </Animated.View>

          <View style={styles.content}>
            {/* Title & Subtitle */}
            <Animated.View entering={FadeInUp.duration(450).delay(100)}>
              <Text style={styles.title}>Profile Created!</Text>
              <Text style={styles.subtitle}>
                Your account has been created successfully.
              </Text>
            </Animated.View>

            {/* Welcome Banner Card */}
            <Animated.View
              entering={FadeInUp.duration(450).delay(200)}
              style={styles.cardContainer}>
              <View style={styles.welcomeCard}>
                <View style={styles.badgeCircle}>
                  <Ionicons name="person-outline" size={24} color={COLORS.purple} />
                </View>
                <View style={styles.cardTextCol}>
                  <Text style={styles.cardTitle}>Welcome to Radiance!</Text>
                  <Text style={styles.cardSubtitle}>
                    Let&apos;s begin your UPSC preparation journey.
                  </Text>
                </View>
              </View>
            </Animated.View>

            {/* Continue to Dashboard Button */}
            <Animated.View entering={FadeInUp.duration(450).delay(300)}>
              <Pressable
                onPress={onContinue}
                style={({ pressed }) => [
                  styles.buttonWrapper,
                  pressed && styles.buttonPressed,
                ]}>
                <View style={[styles.continueButton, { backgroundColor: COLORS.purple }]}>
                  <Text style={styles.continueText}>Continue to Dashboard</Text>
                  {/* <Ionicons
                    name="arrow-forward"
                    size={20}
                    color={COLORS.white}
                    style={styles.arrowIcon}
                  /> */}
                </View>
              </Pressable>
            </Animated.View>
          </View>
        </SafeAreaView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 24,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
  },
  heroWrap: {
    alignItems: 'center',
    marginBottom: 10,
  },
  heroBadge: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: COLORS.purpleSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.navy,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginTop: 16,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  cardContainer: {
    marginTop: 36,
  },
  welcomeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.grayBorder,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  badgeCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.purpleSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardTextCol: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: COLORS.gray,
    lineHeight: 18,
  },
  buttonWrapper: {
    marginTop: 32,
    borderRadius: 8,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  continueButton: {
    height: 56,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.white,
  },
  arrowIcon: {
    marginLeft: 8,
  },
});
