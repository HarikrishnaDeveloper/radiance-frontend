import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '@/constants/colors';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api-client';
import type { StageResultsResponse } from '@/types/api';
import { dialog } from '@/components/ui/dialog';
import { Pressable } from '@/components/ui/pressable';

function ReviewQuestionCard({ question, index }: { question: any; index: number }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasExtra = !!(question.explanation || question.revisionPoints);

  return (
    <View style={styles.questionCard}>
      <Text style={styles.questionIndex}>Question {index + 1}</Text>
      <Text style={styles.questionText}>{question.text}</Text>
      {question.questionImage && (
        <Image
          source={{ uri: `${process.env.EXPO_PUBLIC_API_URL}${question.questionImage}` }}
          style={styles.questionImage}
          contentFit="contain"
          transition={200}
        />
      )}

      <View style={styles.options}>
        {question.options.map((option: any) => {
          const isSelected = option.id === question.selectedOptionId;
          let borderColor: string = COLORS.grayBorder;
          let backgroundColor: string = COLORS.loginBg;
          let letterBg: string = COLORS.white;
          let letterColor: string = COLORS.gray;
          if (option.isCorrect) {
            borderColor = COLORS.green;
            backgroundColor = COLORS.greenSoft;
            letterBg = COLORS.green;
            letterColor = COLORS.white;
          } else if (isSelected) {
            borderColor = COLORS.error;
            backgroundColor = COLORS.errorBg;
            letterBg = COLORS.error;
            letterColor = COLORS.white;
          }
          return (
            <View key={option.id} style={[styles.option, { borderColor, backgroundColor }]}>
              <View style={[styles.optionLetter, { backgroundColor: letterBg }]}>
                <Text style={[styles.optionLetterText, { color: letterColor }]}>{option.label}</Text>
              </View>
              <Text style={styles.optionText}>{option.text}</Text>
              {option.isCorrect && <Ionicons name="checkmark" size={16} color={COLORS.green} />}
              {!option.isCorrect && isSelected && <Ionicons name="close" size={16} color={COLORS.error} />}
            </View>
          );
        })}
      </View>

      {question.selectedOptionId === null && <Text style={styles.skippedNote}>You skipped this question.</Text>}

      {hasExtra && !isExpanded && (
        <Pressable style={styles.expandBtn} onPress={() => setIsExpanded(true)}>
          <Ionicons name="bulb" size={16} color={COLORS.purple700} />
          <Text style={styles.expandBtnText}>View Explanation & Review Points</Text>
        </Pressable>
      )}

      {isExpanded && question.explanation && (
        <View style={styles.explanationBox}>
          <Text style={styles.explanationTitle}>Explanation</Text>
          <Text style={styles.explanationText}>{question.explanation}</Text>
        </View>
      )}

      {isExpanded && question.revisionPoints && (
        <View style={styles.revisionBox}>
          <View style={styles.revisionTitleRow}>
            <Ionicons name="bookmark" size={12} color={COLORS.purple700} />
            <Text style={styles.revisionTitle}>UPSC Revision Point</Text>
          </View>
          <Text style={styles.revisionText}>{question.revisionPoints}</Text>
        </View>
      )}
    </View>
  );
}

export default function StageResultsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  const [results, setResults] = useState<StageResultsResponse | null>(null);

  useEffect(() => {
    if (!token || !id) return;
    api
      .stageResults(token, Number(id))
      .then(setResults)
      .catch(() => dialog.error('Could not load results', 'Please try again.', [{ text: 'OK', onPress: () => router.back() }]));
  }, [token, id]);

  if (!results) {
    return (
      <View style={styles.centerFill}>
        <ActivityIndicator color={COLORS.purple} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <Ionicons name="chevron-back" size={20} color={COLORS.navy} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Review Answers</Text>
          <Text style={styles.headerSub}>
            Stage {results.stageNumber} · {results.category.name}
          </Text>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: 32 + insets.bottom }]} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryPct}>{results.accuracy}%</Text>
          <Text style={styles.summarySub}>{results.correctAnswers}/{results.completedQuestions} correct</Text>
        </View>

        {results.questions.map((question, i) => (
          <ReviewQuestionCard key={question.id} question={question} index={i} />
        ))}

        <Pressable onPress={() => router.back()} style={styles.doneBtn}>
          <Text style={styles.doneBtnText}>Done</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.loginBg },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.loginBg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: COLORS.loginBg,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.navy },
  headerSub: { fontSize: 12, color: COLORS.gray, fontWeight: '500', marginTop: 1 },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 32, gap: 14 },

  summaryCard: { backgroundColor: COLORS.white, borderRadius: 8, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: COLORS.grayBorder },
  summaryPct: { fontSize: 32, fontWeight: '700', color: COLORS.navy },
  summarySub: { fontSize: 13, color: COLORS.gray, fontWeight: '600', marginTop: 4 },

  questionCard: { backgroundColor: COLORS.white, borderRadius: 8, padding: 18, borderWidth: 1, borderColor: COLORS.grayBorder },
  questionIndex: { fontSize: 11.5, fontWeight: '700', color: COLORS.grayLight },
  questionText: { fontSize: 15.5, fontWeight: '700', color: COLORS.navy, marginTop: 6, lineHeight: 22 },
  questionImage: { width: '100%', height: 160, borderRadius: 8, marginTop: 10 },

  options: { marginTop: 14, gap: 10 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 11, borderWidth: 1.5, borderRadius: 8, padding: 12 },
  optionLetter: { width: 24, height: 24, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  optionLetterText: { fontSize: 11.5, fontWeight: '700' },
  optionText: { flex: 1, fontSize: 13.5, fontWeight: '600', color: COLORS.navy },

  skippedNote: { fontSize: 12, fontStyle: 'italic', color: COLORS.grayLight, marginTop: 10 },
  
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginTop: 16,
    backgroundColor: COLORS.loginBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
  },
  expandBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.purple700 },

  explanationBox: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.grayBorder,
  },
  explanationTitle: { fontSize: 12.5, fontWeight: '700', color: COLORS.purple700, marginBottom: 4 },
  explanationText: { fontSize: 13, color: COLORS.gray, lineHeight: 18, fontWeight: '500' },

  revisionBox: { marginTop: 12, padding: 12, backgroundColor: COLORS.goldSoft, borderRadius: 8 },
  revisionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  revisionTitle: { fontSize: 12, fontWeight: '700', color: COLORS.purple700 },
  revisionText: { fontSize: 12.5, color: COLORS.gray, fontWeight: '500', lineHeight: 18 },

  doneBtn: { backgroundColor: COLORS.purple700, borderRadius: 8, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  doneBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.white },
});
