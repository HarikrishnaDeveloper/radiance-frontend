import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Pressable } from '@/components/ui/pressable';

import { HT } from './home-theme';
import { SectionHeader } from './SectionHeader';

const ACTIONS: { title: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap; tint: string; soft: string; route: Href }[] = [
  { title: 'Category Practice', subtitle: 'Subject-wise PYQs & explanations', icon: 'book', tint: HT.primary, soft: HT.primarySoft, route: '/practice' },
  { title: 'Full Paper Tests', subtitle: 'Timed exam simulations', icon: 'document-text', tint: HT.primary, soft: HT.primarySoft, route: '/tests' },
  { title: 'Leaderboard', subtitle: 'See where you rank', icon: 'trophy', tint: HT.primary, soft: HT.primarySoft, route: '/leaderboard' },
  { title: 'Daily Tasks', subtitle: 'Set & review study goals', icon: 'checkbox', tint: HT.primary, soft: HT.primarySoft, route: '/daily-tasks' },
];

export function QuickActions() {
  return (
    <View style={styles.section}>
      <SectionHeader title="Shortcuts" />
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
  // flexBasis below 50% leaves room for the gap, so two tiles fit per row on
  // every phone width (a 48.5% width + 10px gap overflowed on 320–360px phones).
  tile: {
    flexBasis: '40%',
    flexGrow: 1,
    backgroundColor: HT.surface,
    borderRadius: HT.radius,
    borderWidth: 1,
    borderColor: HT.hairline,
    padding: 14,
  },
  tilePressed: { borderColor: HT.primary, backgroundColor: HT.primarySoft },
  icon: { width: 36, height: 36, borderRadius: HT.radius, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  title: { fontSize: 14.5, fontWeight: '600', color: HT.ink, paddingRight: 14 },
  subtitle: { fontSize: 12.5, color: HT.muted, marginTop: 3, lineHeight: 17 },
  arrow: { position: 'absolute', top: 14, right: 14 },
});
