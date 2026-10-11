import { StyleSheet, Text, View } from 'react-native';

import { HT } from './home-theme';

interface Props {
  text: string;
}

export function DailyMotivation({ text }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.mark}>“</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.eyebrow}>Thought of the day</Text>
        <Text style={styles.text}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: HT.surface,
    borderRadius: HT.radius,
    borderWidth: 1,
    borderColor: HT.hairline,
    borderLeftWidth: 3,
    borderLeftColor: HT.gold,
    padding: 18,
    marginBottom: 12,
  },
  mark: { fontSize: 40, lineHeight: 42, fontWeight: '800', color: HT.gold, marginTop: -4 },
  eyebrow: { fontSize: 10.5, fontWeight: '800', color: HT.goldDeep, letterSpacing: 1.4, textTransform: 'uppercase' },
  text: { fontSize: 15, fontWeight: '600', fontStyle: 'italic', color: HT.inkSoft, lineHeight: 22, marginTop: 6 },
});
