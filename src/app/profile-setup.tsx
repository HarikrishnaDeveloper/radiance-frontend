import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Toast, type ToastData } from '@/components/toast';
import { COLORS } from '@/constants/colors';
import { ApiError, useAuth } from '@/context/auth-context';

type TargetExam = 'UPSC_CSE' | 'GROUP_1' | 'OTHER';
type PrepLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
type PrepFocus = 'GS' | 'CSAT' | 'BOTH';

const EXAM_OPTIONS: { id: TargetExam; label: string }[] = [
  { id: 'UPSC_CSE', label: 'UPSC CSE' },
  { id: 'GROUP_1', label: 'Group 1' },
  { id: 'OTHER', label: 'Other' },
];

const PREP_LEVELS: { id: PrepLevel; title: string; subtitle: string }[] = [
  {
    id: 'BEGINNER',
    title: 'Beginner',
    subtitle: 'Just starting my preparation',
  },
  {
    id: 'INTERMEDIATE',
    title: 'Intermediate',
    subtitle: 'Already preparing and practicing',
  },
  {
    id: 'ADVANCED',
    title: 'Advanced',
    subtitle: 'Regularly solving PYQs and mock tests',
  },
];

const FOCUS_OPTIONS: { id: PrepFocus; label: string }[] = [
  { id: 'GS', label: 'GS' },
  { id: 'CSAT', label: 'CSAT' },
  { id: 'BOTH', label: 'Both' },
];

function formatPhoneDisplay(raw?: string | null) {
  if (!raw) return '+91 XXXXX XXXXX';
  const clean = raw.trim();
  if (clean.startsWith('+91') && clean.length === 13) {
    return `${clean.slice(0, 3)} ${clean.slice(3, 8)} ${clean.slice(8)}`;
  }
  return clean;
}

export default function ProfileSetupScreen() {
  const { user, completeProfile } = useAuth();

  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const attemptYears = useMemo(() => {
    return [
      String(currentYear),
      String(currentYear + 1),
      String(currentYear + 2),
      String(currentYear + 3),
      String(currentYear + 4),
      'Later',
      'Not decided',
    ];
  }, [currentYear]);

  // Form State
  const [fullName, setFullName] = useState(user?.profile?.fullName ?? user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [targetExam, setTargetExam] = useState<TargetExam>('UPSC_CSE');
  const [preparationLevel, setPreparationLevel] = useState<PrepLevel>('BEGINNER');
  const [targetAttempt, setTargetAttempt] = useState<string>(String(currentYear + 1)); // Default 2027
  const [preparationFocus, setPreparationFocus] = useState<PrepFocus>('BOTH');

  const [attemptModalVisible, setAttemptModalVisible] = useState(false);
  const [examModalVisible, setExamModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);

  const selectedExamLabel = useMemo(() => {
    return EXAM_OPTIONS.find((e) => e.id === targetExam)?.label ?? 'UPSC CSE';
  }, [targetExam]);

  async function handleContinue() {
    const trimmedName = fullName.trim();
    if (!trimmedName) {
      setToast({ type: 'error', message: 'Full name is required' });
      return;
    }
    if (!targetExam) {
      setToast({ type: 'error', message: 'Please select your target exam' });
      return;
    }
    if (!preparationLevel) {
      setToast({ type: 'error', message: 'Please select your preparation level' });
      return;
    }
    if (!preparationFocus) {
      setToast({ type: 'error', message: 'Please select your preparation focus' });
      return;
    }

    setToast(null);
    setSubmitting(true);
    try {
      await completeProfile({
        fullName: trimmedName,
        email: email.trim() || undefined,
        targetExam,
        preparationLevel,
        targetAttempt,
        preparationFocus,
      });

      router.replace('/profile-success');
    } catch (e) {
      setToast({
        type: 'error',
        message: e instanceof ApiError ? e.message : 'Could not save profile. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Toast toast={toast} onHide={() => setToast(null)} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.select({ ios: 'padding', default: 'height' })}
        keyboardVerticalOffset={Platform.select({ ios: 0, default: 0 })}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <SafeAreaView style={styles.safeArea}>
            <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
              <View style={styles.iconCircle}>
                <Ionicons name="sparkles" size={26} color={COLORS.purple} />
              </View>
              <Text style={styles.title}>Complete Profile</Text>
              <Text style={styles.subtitle}>
                Let&apos;s personalize your UPSC preparation experience
              </Text>
            </Animated.View>

            <Animated.View entering={FadeInUp.duration(400).delay(100)} style={styles.formContent}>
              {/* Phone Number (Read-only) */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <View style={[styles.inputRow, styles.readOnlyRow]}>
                  <Ionicons
                    name="call-outline"
                    size={18}
                    color={COLORS.purple}
                    style={styles.leadingIcon}
                  />
                  <Text style={styles.readOnlyText}>{formatPhoneDisplay(user?.phone)}</Text>
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={15} color={COLORS.green} />
                    <Text style={styles.verifiedText}>Verified</Text>
                  </View>
                </View>
              </View>

              {/* Full Name * (Required) */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>
                  Full Name <Text style={styles.requiredStar}>*</Text>
                </Text>
                <View style={styles.inputRow}>
                  <Ionicons
                    name="person-outline"
                    size={18}
                    color={COLORS.purple}
                    style={styles.leadingIcon}
                  />
                  <TextInput
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Enter your full name"
                    placeholderTextColor={COLORS.grayLight}
                    autoCapitalize="words"
                    style={styles.textInput}
                  />
                </View>
              </View>

              {/* Email Address (Optional) */}
              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Email Address</Text>
                  <Text style={styles.optionalTag}>Optional</Text>
                </View>
                <View style={styles.inputRow}>
                  <Ionicons
                    name="mail-outline"
                    size={18}
                    color={COLORS.purple}
                    style={styles.leadingIcon}
                  />
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email address"
                    placeholderTextColor={COLORS.grayLight}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    style={styles.textInput}
                  />
                </View>
              </View>

              {/* Target Exam * (Required) */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>
                  Target Exam <Text style={styles.requiredStar}>*</Text>
                </Text>
                <Pressable
                  style={styles.dropdownSelector}
                  onPress={() => setExamModalVisible(true)}>
                  <View style={styles.dropdownInner}>
                    <Ionicons
                      name="school-outline"
                      size={18}
                      color={COLORS.purple}
                      style={styles.leadingIcon}
                    />
                    <Text style={styles.dropdownValueText}>{selectedExamLabel}</Text>
                  </View>
                  <Ionicons name="chevron-down" size={18} color={COLORS.gray} />
                </Pressable>
              </View>

              {/* Preparation Level * (Required) */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>
                  Preparation Level <Text style={styles.requiredStar}>*</Text>
                </Text>
                <Text style={styles.fieldHelper}>How would you describe your preparation?</Text>
                <View style={styles.levelGroup}>
                  {PREP_LEVELS.map((lvl) => {
                    const isSelected = preparationLevel === lvl.id;
                    return (
                      <Pressable
                        key={lvl.id}
                        onPress={() => setPreparationLevel(lvl.id)}
                        style={({ pressed }) => [
                          styles.levelCard,
                          isSelected && styles.levelCardSelected,
                          pressed && styles.cardPressed,
                        ]}>
                        <View style={styles.radioRow}>
                          <View
                            style={[
                              styles.radioCircle,
                              isSelected && styles.radioCircleSelected,
                            ]}>
                            {isSelected && <View style={styles.radioDot} />}
                          </View>
                          <View style={styles.levelTextCol}>
                            <Text
                              style={[
                                styles.levelTitle,
                                isSelected && styles.levelTitleSelected,
                              ]}>
                              {lvl.title}
                            </Text>
                            <Text style={styles.levelSubtitle}>{lvl.subtitle}</Text>
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Target Attempt (Optional) */}
              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Target Attempt</Text>
                  <Text style={styles.optionalTag}>Optional</Text>
                </View>
                <Pressable
                  style={styles.dropdownSelector}
                  onPress={() => setAttemptModalVisible(true)}>
                  <View style={styles.dropdownInner}>
                    <Ionicons
                      name="calendar-outline"
                      size={18}
                      color={COLORS.purple}
                      style={styles.leadingIcon}
                    />
                    <Text style={styles.dropdownValueText}>{targetAttempt}</Text>
                  </View>
                  <Ionicons name="chevron-down" size={18} color={COLORS.gray} />
                </Pressable>
              </View>

              {/* Preparation Focus * (Required) */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>
                  Preparation Focus <Text style={styles.requiredStar}>*</Text>
                </Text>
                <Text style={styles.fieldHelper}>What do you want to practice?</Text>
                <View style={styles.focusRow}>
                  {FOCUS_OPTIONS.map((opt) => {
                    const isSelected = preparationFocus === opt.id;
                    return (
                      <Pressable
                        key={opt.id}
                        onPress={() => setPreparationFocus(opt.id)}
                        style={({ pressed }) => [
                          styles.focusOption,
                          isSelected && styles.focusOptionSelected,
                          pressed && styles.cardPressed,
                        ]}>
                        <View
                          style={[
                            styles.radioCircle,
                            isSelected && styles.radioCircleSelected,
                          ]}>
                          {isSelected && <View style={styles.radioDot} />}
                        </View>
                        <Text
                          style={[
                            styles.focusText,
                            isSelected && styles.focusTextSelected,
                          ]}>
                          {opt.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Continue Button */}
              <Pressable
                onPress={handleContinue}
                disabled={submitting}
                style={({ pressed }) => [
                  styles.continueBtnWrapper,
                  pressed && styles.buttonPressed,
                ]}>
                <LinearGradient
                  colors={[COLORS.purple, COLORS.purpleDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.continueBtn}>
                  {submitting ? (
                    <ActivityIndicator color={COLORS.white} size="small" />
                  ) : (
                    <Text style={styles.continueBtnText}>Continue</Text>
                  )}
                </LinearGradient>
              </Pressable>

              <Text style={styles.footerNote}>You can update your profile anytime in settings</Text>
            </Animated.View>
          </SafeAreaView>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Target Exam Modal */}
      <Modal
        visible={examModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setExamModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setExamModalVisible(false)}
          />
          <View style={styles.modalSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Select Target Exam</Text>
              <Pressable
                onPress={() => setExamModalVisible(false)}
                style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={COLORS.navy} />
              </Pressable>
            </View>
            <View style={styles.optionsList}>
              {EXAM_OPTIONS.map((exam) => {
                const isSelected = targetExam === exam.id;
                return (
                  <Pressable
                    key={exam.id}
                    onPress={() => {
                      setTargetExam(exam.id);
                      setExamModalVisible(false);
                    }}
                    style={({ pressed }) => [
                      styles.modalOptionRow,
                      isSelected && styles.modalOptionRowSelected,
                      pressed && styles.cardPressed,
                    ]}>
                    <Text
                      style={[
                        styles.modalOptionText,
                        isSelected && styles.modalOptionTextSelected,
                      ]}>
                      {exam.label}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={COLORS.purple}
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

      {/* Target Attempt Modal */}
      <Modal
        visible={attemptModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAttemptModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setAttemptModalVisible(false)}
          />
          <View style={styles.modalSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Select Target Attempt</Text>
              <Pressable
                onPress={() => setAttemptModalVisible(false)}
                style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={COLORS.navy} />
              </Pressable>
            </View>
            <ScrollView
              style={styles.attemptListScroll}
              showsVerticalScrollIndicator={false}>
              {attemptYears.map((year) => {
                const isSelected = targetAttempt === year;
                return (
                  <Pressable
                    key={year}
                    onPress={() => {
                      setTargetAttempt(year);
                      setAttemptModalVisible(false);
                    }}
                    style={({ pressed }) => [
                      styles.modalOptionRow,
                      isSelected && styles.modalOptionRowSelected,
                      pressed && styles.cardPressed,
                    ]}>
                    <Text
                      style={[
                        styles.modalOptionText,
                        isSelected && styles.modalOptionTextSelected,
                      ]}>
                      {year}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={COLORS.purple}
                      />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  iconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.purpleSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.navy,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
    maxWidth: 290,
  },
  formContent: {
    width: '100%',
  },
  fieldGroup: {
    marginBottom: 18,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 6,
  },
  requiredStar: {
    color: COLORS.error,
  },
  optionalTag: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.grayLight,
  },
  fieldHelper: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 8,
    marginTop: -2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.grayBorder,
    borderRadius: 2,
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    minHeight: 52,
  },
  readOnlyRow: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  leadingIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.navy,
    fontWeight: '500',
    paddingVertical: 12,
  },
  readOnlyText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.navy,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.greenSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 2,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.green,
  },
  dropdownSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: COLORS.grayBorder,
    borderRadius: 2,
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    minHeight: 52,
  },
  dropdownInner: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dropdownValueText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.navy,
  },
  levelGroup: {
    gap: 8,
  },
  levelCard: {
    borderWidth: 1.5,
    borderColor: COLORS.grayBorder,
    borderRadius: 2,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
  },
  levelCardSelected: {
    borderColor: COLORS.purple,
    backgroundColor: COLORS.purpleSoft,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.grayLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioCircleSelected: {
    borderColor: COLORS.purple,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.purple,
  },
  levelTextCol: {
    flex: 1,
  },
  levelTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.navy,
  },
  levelTitleSelected: {
    color: COLORS.purple,
  },
  levelSubtitle: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  focusRow: {
    flexDirection: 'row',
    gap: 10,
  },
  focusOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.grayBorder,
    borderRadius: 2,
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: COLORS.white,
  },
  focusOptionSelected: {
    borderColor: COLORS.purple,
    backgroundColor: COLORS.purpleSoft,
  },
  focusText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.navy,
  },
  focusTextSelected: {
    fontWeight: '700',
    color: COLORS.purple,
  },
  continueBtnWrapper: {
    marginTop: 28,
    borderRadius: 2,
    shadowColor: COLORS.purple,
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  continueBtn: {
    height: 54,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  cardPressed: {
    opacity: 0.75,
  },
  footerNote: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.grayLight,
    marginTop: 14,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(21, 43, 92, 0.45)',
  },
  modalSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    paddingTop: 12,
    paddingBottom: 32,
    paddingHorizontal: 24,
    maxHeight: '75%',
  },
  sheetHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.grayBorder,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.navy,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsList: {
    gap: 4,
  },
  attemptListScroll: {
    maxHeight: 300,
  },
  modalOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 2,
  },
  modalOptionRowSelected: {
    backgroundColor: COLORS.purpleSoft,
  },
  modalOptionText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.navy,
  },
  modalOptionTextSelected: {
    fontWeight: '700',
    color: COLORS.purple,
  },
});
