import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

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
          {/* Hero Illustration */}
          <Animated.View entering={FadeIn.duration(450)} style={styles.heroWrap}>
            <Image
              source={require('../../../assets/login/sucess.png')}
              style={styles.heroImage}
              contentFit="contain"
            />
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
                <LinearGradient
                  colors={['#6366F1', '#4F46E5']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.continueButton}>
                  <Text style={styles.continueText}>Continue to Dashboard</Text>
                  {/* <Ionicons
                    name="arrow-forward"
                    size={20}
                    color="#FFFFFF"
                    style={styles.arrowIcon}
                  /> */}
                </LinearGradient>
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
    backgroundColor: '#FFFFFF',
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
  heroImage: {
    width: 280,
    height: 280,
  },
  content: {
    paddingHorizontal: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginTop: 16,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
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
    borderColor: '#E2E8F0',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 18,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  badgeCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F5F3FF',
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
    color: '#0F172A',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  buttonWrapper: {
    marginTop: 32,
    borderRadius: 14,
    shadowColor: '#4F46E5',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  continueButton: {
    height: 56,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  arrowIcon: {
    marginLeft: 8,
  },
});
