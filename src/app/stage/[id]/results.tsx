import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '@/constants/colors';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api-client';
import type { StageResultsResponse } from '@/types/api';

export default function StageResultsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const [results, setResults] = useState<StageResultsResponse | null>(null);

  useEffect(() => {
    if (!token || !id) return;
    api.stageResults(token, Number(id)).then(setResults);
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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryPct}>{results.accuracy}%</Text>
          <Text style={styles.summarySub}>{results.correctAnswers}/{results.completedQuestions} correct</Text>
        </View>

        {results.questions.map((question, i) => (
          <View key={question.id} style={styles.questionCard}>
            <Text style={styles.questionIndex}>Question {i + 1}</Text>
            <Text style={styles.questionText}>{question.text}</Text>
            {question.questionImage && (
              <Image
                source={{ uri: `${process.env.EXPO_PUBLIC_API_URL}${question.questionImage}` }}
                style={styles.questionImage}
                resizeMode="contain"
              />
            )}

            <View style={styles.options}>
              {question.options.map((option) => {
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
            {question.explanation && <Text style={styles.explanation}>{question.explanation}</Text>}
          </View>
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
    borderRadius: 12,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: COLORS.navy },
  headerSub: { fontSize: 12, color: COLORS.gray, fontWeight: '500', marginTop: 1 },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 32, gap: 14 },

  summaryCard: { backgroundColor: COLORS.white, borderRadius: 20, padding: 20, alignItems: 'center' },
  summaryPct: { fontSize: 32, fontWeight: '800', color: COLORS.navy },
  summarySub: { fontSize: 13, color: COLORS.gray, fontWeight: '600', marginTop: 4 },

  questionCard: { backgroundColor: COLORS.white, borderRadius: 18, padding: 18 },
  questionIndex: { fontSize: 11.5, fontWeight: '700', color: COLORS.grayLight },
  questionText: { fontSize: 15.5, fontWeight: '700', color: COLORS.navy, marginTop: 6, lineHeight: 22 },
  questionImage: { width: '100%', height: 160, borderRadius: 8, marginTop: 10 },

  options: { marginTop: 14, gap: 10 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 11, borderWidth: 1.5, borderRadius: 13, padding: 12 },
  optionLetter: { width: 24, height: 24, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  optionLetterText: { fontSize: 11.5, fontWeight: '800' },
  optionText: { flex: 1, fontSize: 13.5, fontWeight: '600', color: COLORS.navy },

  skippedNote: { fontSize: 12, fontStyle: 'italic', color: COLORS.grayLight, marginTop: 10 },
  explanation: { fontSize: 12.5, color: COLORS.gray, fontWeight: '500', lineHeight: 18, marginTop: 10 },

  doneBtn: { backgroundColor: COLORS.purple700, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  doneBtnText: { fontSize: 15, fontWeight: '800', color: COLORS.white },
});
