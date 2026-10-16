import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';

import { UI } from '@/constants/ui';
import { Pressable } from '@/components/ui/pressable';

type Tab<K extends string> = { key: K; label: string; count: number };

type Props<K extends string> = {
  tabs: Tab<K>[];
  value: K;
  onChange: (key: K) => void;
  style?: StyleProp<ViewStyle>;
};

const SPRING = { damping: 20, stiffness: 220 };

// Centred capsule filter: a violet pill slides behind the selected option.
export function FilterTabs<K extends string>({ tabs, value, onChange, style }: Props<K>) {
  const reduceMotion = useReducedMotion();
  const [layouts, setLayouts] = useState<Record<string, { x: number; width: number }>>({});
  const x = useSharedValue(0);
  const width = useSharedValue(0);

  const current = layouts[value];
  useEffect(() => {
    if (!current) return;
    x.value = reduceMotion ? current.x : withSpring(current.x, SPRING);
    width.value = reduceMotion ? current.width : withSpring(current.width, SPRING);
  }, [current, reduceMotion, x, width]);

  const pill = useAnimatedStyle(() => ({ width: width.value, transform: [{ translateX: x.value }] }));

  return (
    <View style={[styles.capsule, style]}>
      <Animated.View style={[styles.pill, pill]} />
      {tabs.map((tab) => {
        const active = tab.key === value;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            onLayout={(e) => {
              const { x: tx, width: tw } = e.nativeEvent.layout;
              setLayouts((prev) => ({ ...prev, [tab.key]: { x: tx, width: tw } }));
            }}
            style={styles.option}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${tab.label}, ${tab.count} subjects`}>
            <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  capsule: {
    flexDirection: 'row',
    alignSelf: 'center',
    marginTop: 14,
    padding: 4,
    borderRadius: 999,
    backgroundColor: '#F2F2F2',
  },
  pill: { position: 'absolute', top: 4, bottom: 4, left: 0, borderRadius: 999, backgroundColor: UI.accent },
  option: { paddingVertical: 8, paddingHorizontal: 14 },
  label: { fontSize: 13.5, fontWeight: '600', color: UI.grey },
  labelActive: { color: UI.bg },
});
