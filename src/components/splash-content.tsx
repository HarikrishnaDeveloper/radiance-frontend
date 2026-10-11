import { Image } from 'expo-image';
import Constants from 'expo-constants';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useAnimatedReaction, useSharedValue, withTiming, runOnJS, type SharedValue } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

function SafeAnimatedText({ progress, style }: { progress: SharedValue<number>; style?: any }) {
  const [percent, setPercent] = useState(0);

  useAnimatedReaction(
    () => Math.min(100, Math.round(progress.value)),
    (curr, prev) => {
      if (curr !== prev) {
        runOnJS(setPercent)(curr);
      }
    }
  );

  return <Text style={style}>{percent}%</Text>;
}

const COLORS = {
  navy: '#152B5C',
  blue: '#3E6BF0',
  blueSoft: '#EAF0FE',
  gold: '#F5A623',
  gray: '#6E7488',
  footer: '#DCE7FC',
  footerBorder: '#B9C7EA',
  statDivider: '#E3E6EC',
};

function Stat({ glyph, line1, line2 }: { glyph: string; line1: string; line2: string }) {
  return (
    <View style={styles.stat}>
      <View style={styles.statIcon}>
        <Text style={styles.statIconGlyph}>{glyph}</Text>
      </View>
      <Text style={styles.statLine1}>{line1}</Text>
      <Text style={styles.statLine2}>{line2}</Text>
    </View>
  );
}

export function SplashContent() {
  const progress = useSharedValue(0);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
    progress.value = withTiming(100, { duration: 900 });
  }, [progress]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${Math.min(100, Math.max(0, progress.value))}%`,
  }));

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.contentScroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} bounces={false}>
        <Image
          style={styles.logoImage}
          source={require('../../assets/images/logo.png')}
          contentFit="contain"
        />
        <Text style={styles.tagline}>Your UPSC Journey Starts Here</Text>

        {/* s */}

        <Image
          style={styles.buildingImage}
          source={require('../../assets/splashscreen/building.png')}
          contentFit="cover"
        />

        <View style={styles.card}>
          <View style={styles.cardIcon}>
            <Text style={styles.cardIconGlyph}>💡</Text>
          </View>
          <View style={styles.cardTextWrap}>
            <Text style={styles.cardTitle}>Did you know?</Text>
            <Text style={styles.cardBody}>
              Nearly every UPSC Prelims paper contains concepts repeated or adapted from previous years.
            </Text>
          </View>
        </View>

        <Text style={styles.progressLabel}>Preparing your study space...</Text>
        <View style={styles.progressRow}>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, barStyle]} />
          </View>
          <SafeAnimatedText progress={progress} style={styles.progressPercent} />
        </View>

        <View style={styles.statsRow}>
          <Stat glyph="📖" line1="30 Years" line2="PYQs" />
          <View style={styles.statDivider} />
          <Stat glyph="🎯" line1="Daily" line2="Practice" />
          <View style={styles.statDivider} />
          <Stat glyph="🏆" line1="Mock" line2="Tests" />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Made with Love for UPSC Aspirants</Text>
        <View style={styles.versionPill}>
          <Text style={styles.versionText}>Version {Constants.expoConfig?.version}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'space-between',
  },
  contentScroll: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 12,
  },
  logoImage: {
    width: '80%',
    height: 70,
    marginTop: 48,
    marginBottom: 6,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 4,
    color: COLORS.navy,
    marginTop: -60,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  divider: {
    width: 36,
    height: 1,
    backgroundColor: COLORS.blue,
    opacity: 0.4,
  },
  subtitleNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.blue,
  },
  tagline: {
    fontSize: 15,
    color: '#6E7488',
    marginTop: 6,
    marginBottom: 20,
  },
  starDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    width: '70%',
  },
  starLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.gold,
    opacity: 0.4,
  },
  starGlyph: {
    color: COLORS.gold,
    fontSize: 14,
  },
  buildingImage: {
    width: '120%',
    height: 280,
    marginTop: 10,
  },
  card: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    padding: 18,
    width: '100%',
    marginTop: -20,
    shadowColor: '#0B1F4D',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconGlyph: {
    fontSize: 20,
  },
  cardTextWrap: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.navy,
  },
  cardBody: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.gray,
  },
  progressLabel: {
    marginTop: 36,
    fontSize: 15,
    fontWeight: '700',
    color: '#152B5C',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    marginTop: 8,
  },
  progressTrack: {
    flex: 1,
    height: 10,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#c026d3',
  },
  progressPercent: {
    fontSize: 13,
    fontWeight: '700',
    color: '#152B5C',
    width: 36,
    textAlign: 'right',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: 26,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  statDivider: {
    width: 1,
    height: 44,
    backgroundColor: COLORS.statDivider,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconGlyph: {
    fontSize: 20,
  },
  statLine1: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
  },
  statLine2: {
    fontSize: 12,
    color: COLORS.gray,
  },
  footer: {
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
    paddingVertical: 18,
    paddingBottom: 24,
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6E7488',
  },
  versionPill: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  versionText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9CA3AF',
  },
});
