import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { HT } from './home-theme';
import { SectionHeader } from './SectionHeader';

const ACTIONS: { title: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap; tint: string; soft: string; route: Href }[] = [
  { title: 'PYQ Practice', subtitle: 'Subject-wise questions', icon: 'book', tint: HT.primary, soft: HT.primarySoft, route: '/practice' },
  { title: 'Daily Challenge', subtitle: '10 questions every day', icon: 'flash', tint: HT.goldDeep, soft: HT.goldSoft, route: '/daily-challenge' },
  { title: 'PYQ Papers', subtitle: 'Full tests & sections', icon: 'document-text', tint: HT.green, soft: HT.greenSoft, route: '/tests' },
  { title: 'My Progress', subtitle: 'Accuracy & streaks', icon: 'stats-chart', tint: HT.red, soft: HT.redSoft, route: '/progress' },
];

export function QuickActions() {
  return (
    <View style={styles.section}>
      <SectionHeader eyebrow="Explore" title="Quick actions" />
      <View style={styles.grid}>
        {ACTIONS.map((action) => (
          <Pressable
            key={action.title}
            onPress={() => router.push(action.route)}
            style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
            accessibilityRole="button"
            accessibilityLabel={action.title}>
            <View style={[styles.icon, { backgroundColor: action.soft }]}>
              <Ionicons name={action.icon} size={18} color={action.tint} />
            </View>
            <Text style={styles.title}>{action.title}</Text>
            <Text style={styles.subtitle}>{action.subtitle}</Text>
            <Ionicons name="arrow-forward" size={14} color={HT.muted} style={styles.arrow} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 28 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: {
    width: '48.5%',
    flexGrow: 1,
    backgroundColor: HT.surface,
    borderRadius: HT.radius,
    borderWidth: 1,
    borderColor: HT.hairline,
    padding: 14,
  },
  tilePressed: { borderColor: HT.primary, backgroundColor: '#FBFAFF' },
  icon: { width: 36, height: 36, borderRadius: HT.radius, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  title: { fontSize: 14, fontWeight: '800', color: HT.ink },
  subtitle: { fontSize: 11.5, fontWeight: '500', color: HT.muted, marginTop: 3 },
  arrow: { position: 'absolute', top: 14, right: 14 },
});
