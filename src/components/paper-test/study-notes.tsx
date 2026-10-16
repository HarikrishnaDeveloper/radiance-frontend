import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { PT } from './theme';

// Explanation + UPSC review points for one question. Both come from the seed
// data as newline-separated lines: explanation lines read as paragraphs,
// review points as a bulleted cram list.
export function StudyNotes({
  explanation,
  revisionPoints,
}: {
  explanation: string | null | undefined;
  revisionPoints: string | null | undefined;
}) {
  const explanationLines = toLines(explanation);
  const points = toLines(revisionPoints);
  if (explanationLines.length === 0 && points.length === 0) {
    return (
      <View style={[styles.card, styles.emptyCard]}>
        <Ionicons name="time-outline" size={14} color={PT.ink400} />
        <Text style={styles.emptyText}>Explanation for this question is being added. Check back soon.</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {explanationLines.length > 0 && (
        <View style={styles.card}>
          <View style={styles.titleRow}>
            <Ionicons name="bulb" size={14} color={PT.purple600} />
            <Text style={[styles.title, { color: PT.purple600 }]}>Explanation</Text>
          </View>
          {explanationLines.map((line, i) => (
            <Text key={i} style={styles.paragraph}>
              {line}
            </Text>
          ))}
        </View>
      )}

      {points.length > 0 && (
        <View style={[styles.card, styles.reviewCard]}>
          <View style={styles.titleRow}>
            <Ionicons name="bookmark" size={13} color={PT.goldDeep} />
            <Text style={[styles.title, { color: PT.goldDeep }]}>UPSC Review Points</Text>
          </View>
          {points.map((point, i) => (
            <View key={i} style={styles.bulletRow}>
              <View style={styles.bullet} />
              <Text style={styles.bulletText}>{point}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function toLines(text: string | null | undefined) {
  return (text ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  card: { backgroundColor: PT.card, borderRadius: 8, padding: 14, borderWidth: 1, borderColor: PT.line },
  reviewCard: { backgroundColor: PT.goldSoft, borderColor: PT.line },
  emptyCard: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  emptyText: { flex: 1, fontSize: 12.5, color: PT.ink400, fontWeight: '600' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  title: { fontSize: 11, fontWeight: '700' },
  paragraph: { fontSize: 13.5, lineHeight: 20, color: PT.ink600, fontWeight: '500', marginBottom: 4 },
  bulletRow: { flexDirection: 'row', gap: 9, marginBottom: 5, paddingRight: 4 },
  bullet: { width: 5, height: 5, borderRadius: 3, backgroundColor: PT.goldDeep, marginTop: 8 },
  bulletText: { flex: 1, fontSize: 13, lineHeight: 19, color: PT.ink900, fontWeight: '600' },
});
