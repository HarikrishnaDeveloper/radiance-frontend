import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Pressable } from '@/components/ui/pressable';

import { StudyNotes } from './study-notes';
import { PT, questionLabel } from './theme';

export type ReviewQuestion = {
  id: number;
  questionNo?: number | null;
  text: string;
  questionImage?: string | null;
  explanation: string | null;
  revisionPoints: string | null;
  isVoided: boolean;
  category: { id: number; name: string };
  options: { id: number; label: string; text: string; isCorrect: boolean }[];
  selectedOptionId: number | null;
  isCorrect: boolean;
};

export type Outcome = 'correct' | 'wrong' | 'skipped' | 'dropped';

export function outcomeOf(q: Pick<ReviewQuestion, 'isVoided' | 'isCorrect' | 'selectedOptionId'>): Outcome {
  if (q.isVoided) return 'dropped';
  if (q.isCorrect) return 'correct';
  return q.selectedOptionId == null ? 'skipped' : 'wrong';
}

export const OUTCOME_LOOK: Record<Outcome, { color: string; soft: string; icon: keyof typeof Ionicons.glyphMap; label: string }> = {
  correct: { color: PT.green, soft: PT.greenSoft, icon: 'checkmark-circle', label: 'Correct' },
  wrong: { color: PT.red, soft: PT.redSoft, icon: 'close-circle', label: 'Wrong' },
  skipped: { color: PT.ink400, soft: PT.bg, icon: 'remove-circle', label: 'Skipped' },
  dropped: { color: PT.teal, soft: PT.tealSoft, icon: 'information-circle', label: 'Dropped' },
};

// One answered question in a review list: the user's choice against the
// correct option, then the explanation and UPSC review points. Collapsed to
// the question text until tapped.
export const ReviewCard = React.memo(function ReviewCard({
  question,
  index,
  expanded,
  onToggle,
}: {
  question: ReviewQuestion;
  index: number;
  expanded: boolean;
  onToggle: (id: number) => void;
}) {
  const look = OUTCOME_LOOK[outcomeOf(question)];
  return (
    <View style={[styles.card, { borderLeftColor: look.color }]}>
      <Pressable onPress={() => onToggle(question.id)} style={styles.head}>
        <Text style={styles.no}>{questionLabel(question, index)}</Text>
        <Text style={styles.subject} numberOfLines={1}>
          {question.category.name}
        </Text>
        <View style={[styles.outcomePill, { backgroundColor: look.soft }]}>
          <Ionicons name={look.icon} size={13} color={look.color} />
          <Text style={[styles.outcomeText, { color: look.color }]}>{look.label}</Text>
        </View>
      </Pressable>

      <Pressable onPress={() => onToggle(question.id)}>
        <Text style={styles.text} numberOfLines={expanded ? undefined : 3}>
          {question.text}
        </Text>
      </Pressable>

      {expanded && (
        <View style={{ marginTop: 12, gap: 8 }}>
          {question.questionImage && (
            <Image
              source={{ uri: `${process.env.EXPO_PUBLIC_API_URL}${question.questionImage}` }}
              style={styles.image}
              contentFit="contain"
            />
          )}
          {question.isVoided && (
            <Text style={styles.droppedNote}>This question was dropped by UPSC — full marks awarded to everyone.</Text>
          )}
          {question.options.map((o) => {
            const isKey = o.isCorrect;
            const isMine = o.id === question.selectedOptionId;
            const bg = isKey ? PT.greenSoft : isMine ? PT.redSoft : PT.bg;
            const border = isKey ? PT.green : isMine ? PT.red : 'transparent';
            return (
              <View key={o.id} style={[styles.option, { backgroundColor: bg, borderColor: border }]}>
                <Text style={[styles.optionLabel, isKey && { color: PT.greenDeep }, isMine && !isKey && { color: PT.redDeep }]}>
                  {o.label}
                </Text>
                <Text style={styles.optionText}>{o.text}</Text>
                {isMine && <Text style={[styles.yourTag, { color: isKey ? PT.greenDeep : PT.redDeep }]}>Your answer</Text>}
                {isKey && !isMine && <Ionicons name="checkmark" size={16} color={PT.greenDeep} />}
              </View>
            );
          })}
          <View style={{ marginTop: 4 }}>
            <StudyNotes explanation={question.explanation} revisionPoints={question.revisionPoints} />
          </View>
        </View>
      )}

      <Pressable onPress={() => onToggle(question.id)} style={styles.expandRow}>
        <Text style={styles.expandText}>{expanded ? 'Hide explanation' : 'Show answer & explanation'}</Text>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={PT.purple600} />
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 18,
    marginBottom: 10,
    backgroundColor: PT.card,
    borderRadius: 8,
    padding: 14,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: PT.line,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  no: { fontSize: 12, fontWeight: '700', color: PT.ink900 },
  subject: { flex: 1, fontSize: 11.5, fontWeight: '700', color: PT.ink400 },
  outcomePill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 8 },
  outcomeText: { fontSize: 11, fontWeight: '700' },
  text: { fontSize: 14, lineHeight: 21, fontWeight: '600', color: PT.ink900 },
  image: { width: '100%', height: 180, borderRadius: 8 },
  droppedNote: { fontSize: 12.5, fontWeight: '700', color: PT.teal, backgroundColor: PT.tealSoft, padding: 10, borderRadius: 8 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 8, borderWidth: 1.5 },
  optionLabel: { width: 18, fontSize: 13, fontWeight: '700', color: PT.ink600 },
  optionText: { flex: 1, fontSize: 13, fontWeight: '600', color: PT.ink900, lineHeight: 18 },
  yourTag: { fontSize: 10.5, fontWeight: '700' },
  expandRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 },
  expandText: { fontSize: 12.5, fontWeight: '700', color: PT.purple600 },
});
