import { StyleSheet, Text, View } from 'react-native';

import { UI } from '@/constants/ui';
import { Pressable } from '@/components/ui/pressable';

type Props<K extends string> = {
  views: { key: K; label: string }[];
  value: K;
  onChange: (key: K) => void;
};

// Two-or-more-way switch at the top of a tab (e.g. "All subjects | Analytics").
export function ViewSwitcher<K extends string>({ views, value, onChange }: Props<K>) {
  return (
    <View style={styles.switcher} accessibilityRole="tablist">
      {views.map((v) => {
        const active = v.key === value;
        return (
          <Pressable
            key={v.key}
            onPress={() => onChange(v.key)}
            style={[styles.btn, active && styles.btnActive]}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}>
            <Text style={[styles.text, active && styles.textActive]}>{v.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  switcher: { flexDirection: 'row', marginTop: 16, padding: 4, borderRadius: 10, backgroundColor: '#F2F2F2' },
  btn: { flex: 1, paddingVertical: 9, borderRadius: 8, alignItems: 'center' },
  btnActive: { backgroundColor: UI.bg, borderWidth: 1, borderColor: UI.border },
  text: { fontSize: 14, fontWeight: '500', color: UI.grey },
  textActive: { color: UI.text, fontWeight: '700' },
});
