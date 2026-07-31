import { Ionicons } from '@expo/vector-icons';
import type { TabTriggerSlotProps } from 'expo-router/ui';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/constants/colors';

const ICONS = {
  home: { active: 'home', inactive: 'home-outline' },
  practice: { active: 'book', inactive: 'book-outline' },
  journey: { active: 'map', inactive: 'map-outline' },
  progress: { active: 'stats-chart', inactive: 'stats-chart-outline' },
  profile: { active: 'person-circle', inactive: 'person-circle-outline' },
} as const satisfies Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }>;

const LABELS: Record<keyof typeof ICONS, string> = {
  home: 'Home',
  practice: 'Practice',
  journey: 'Journey',
  progress: 'Progress',
  profile: 'Profile',
};

type Props = TabTriggerSlotProps & { tabName: keyof typeof ICONS };

export function TabBarItem({ tabName, isFocused, ...props }: Props) {
  const icons = ICONS[tabName];
  return (
    <Pressable {...props} style={styles.item}>
      <View style={[styles.iconWrap, isFocused && styles.iconWrapActive]}>
        <Ionicons
          name={isFocused ? icons.active : icons.inactive}
          size={20}
          color={isFocused ? COLORS.purple : COLORS.grayLight}
        />
      </View>
      <Text style={[styles.label, { color: isFocused ? COLORS.purple : COLORS.grayLight }]}>
        {LABELS[tabName]}
      </Text>
    </Pressable>
  );
}

export const tabBarStyles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    paddingTop: 10,
    paddingBottom: 24,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.grayBorder,
  },
});

const styles = StyleSheet.create({
  item: {
    alignItems: 'center',
    gap: 4,
    width: 64,
  },
  iconWrap: {
    width: 38,
    height: 30,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: COLORS.purpleSoft,
  },
  label: {
    fontSize: 10.5,
    fontWeight: '700',
  },
});
