import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useState } from 'react';
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

import { COLORS } from './colors';
import { Toast, type ToastData } from '../toast';
import { loginStyles as styles } from './login-styles';

const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  // Union Territories
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
];

type Props = {
  username: string;
  onUsernameChange: (text: string) => void;
  error: string | null;
  submitting?: boolean;
  onSubmit: (details: {
    fullName: string;
    email?: string;
    state?: string;
    dateOfBirth?: string;
    password: string;
  }) => void;
};

export function ChooseUsernameScreen({
  username,
  onUsernameChange,
  error,
  submitting = false,
  onSubmit,
}: Props) {
  const [fullName, setFullName] = useState(username || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedState, setSelectedState] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');

  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const filteredStates = useMemo(() => {
    if (!searchQuery.trim()) return INDIAN_STATES;
    const q = searchQuery.trim().toLowerCase();
    return INDIAN_STATES.filter((s) => s.toLowerCase().includes(q));
  }, [searchQuery]);

  function handleFullNameChange(text: string) {
    setFullName(text);
    onUsernameChange(text);
    if (localError) setLocalError(null);
  }

  function handleDobChange(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, 8);
    let formatted = digits;
    if (digits.length > 4) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    } else if (digits.length > 2) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    setDateOfBirth(formatted);
    if (localError) setLocalError(null);
  }

  function parseDobToIso(text: string): string | null {
    const match = text.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return null;
    const [, dd, mm, yyyy] = match;
    const day = Number(dd);
    const month = Number(mm);
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    const iso = `${yyyy}-${mm}-${dd}`;
    return Number.isNaN(new Date(iso).getTime()) ? null : iso;
  }

  function handleContinue() {
    const trimmedName = fullName.trim();
    if (!trimmedName) {
      setLocalError('Please enter your full name');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters long');
      return;
    }
    let isoDob: string | undefined;
    if (dateOfBirth.trim()) {
      const parsed = parseDobToIso(dateOfBirth);
      if (!parsed) {
        setLocalError('Enter date of birth as DD/MM/YYYY');
        return;
      }
      isoDob = parsed;
    }
    setLocalError(null);
    onSubmit({
      fullName: trimmedName,
      email: email.trim() || undefined,
      state: selectedState || undefined,
      dateOfBirth: isoDob,
      password,
    });
  }

  const displayError = localError || error;
  const [toast, setToast] = useState<ToastData | null>(null);

  useEffect(() => {
    if (displayError) {
      setToast({ type: 'error', message: displayError });
    } else {
      setToast(null);
    }
  }, [displayError]);

  return (
    <View style={styles.loginContainer}>
      <Toast toast={toast} onHide={() => { setToast(null); if (localError) setLocalError(null); }} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.select({ ios: 'padding', default: 'height' })}
        keyboardVerticalOffset={Platform.select({ ios: 0, default: 0 })}>
        <ScrollView
          contentContainerStyle={styles.loginScrollContent}
          bounces={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <SafeAreaView style={styles.safeArea}>
            <Animated.View entering={FadeIn.duration(400)} style={styles.loginHero}>
              <Image
                style={styles.loginBookImage}
                source={require('../../../assets/login/profile.png')}
                contentFit="contain"
              />
            </Animated.View>

            <Animated.View entering={FadeInUp.duration(400)} style={styles.content}>
              <Text style={styles.loginWelcome}>Let&apos;s Get Started</Text>
              <Text style={styles.subtitle}>Tell us a few details about yourself</Text>

              <View style={[styles.inputGroup, { marginTop: 32 }]}>
                <Text style={styles.fieldLabel}>Full Name</Text>
                <View style={styles.inputRow}>
                  <Ionicons
                    name="person-outline"
                    size={18}
                    color={COLORS.purple}
                    style={[styles.inputLeadingIcon, { marginLeft: 14 }]}
                  />
                  <TextInput
                    value={fullName}
                    onChangeText={handleFullNameChange}
                    placeholder="Enter your full name"
                    placeholderTextColor={COLORS.grayLight}
                    autoCapitalize="words"
                    style={styles.inputField}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={localStyles.labelRow}>
                  <Text style={styles.fieldLabel}>Email Address </Text>
                  <Text style={localStyles.labelOptional}>(Optional)</Text>
                </Text>
                <View style={styles.inputRow}>
                  <Ionicons
                    name="mail-outline"
                    size={18}
                    color={COLORS.purple}
                    style={[styles.inputLeadingIcon, { marginLeft: 14 }]}
                  />
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email address"
                    placeholderTextColor={COLORS.grayLight}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    style={styles.inputField}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.fieldLabel}>Password</Text>
                <View style={styles.inputRow}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color={COLORS.purple}
                    style={[styles.inputLeadingIcon, { marginLeft: 14 }]}
                  />
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Create a password"
                    placeholderTextColor={COLORS.grayLight}
                    autoCapitalize="none"
                    secureTextEntry={!showPassword}
                    style={styles.inputField}
                  />
                  <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={12} style={styles.eyeBtn}>
                    <Ionicons
                      name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                      size={18}
                      color={COLORS.grayLight}
                    />
                  </Pressable>
                </View>
                <Text style={localStyles.hintText}>Password must be at least 6 characters long</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={localStyles.labelRow}>
                  <Text style={styles.fieldLabel}>State </Text>
                  <Text style={localStyles.labelOptional}>(Optional)</Text>
                </Text>
                <Pressable style={styles.inputRow} onPress={() => setModalVisible(true)}>
                  <Ionicons
                    name="location-outline"
                    size={18}
                    color={COLORS.purple}
                    style={[styles.inputLeadingIcon, { marginLeft: 14 }]}
                  />
                  <Text
                    style={[
                      localStyles.stateValue,
                      !selectedState && localStyles.statePlaceholder,
                    ]}>
                    {selectedState || 'Select your state'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={COLORS.grayLight} style={{ marginRight: 12 }} />
                </Pressable>
              </View>

              <View style={styles.inputGroup}>
                <Text style={localStyles.labelRow}>
                  <Text style={styles.fieldLabel}>Date of Birth </Text>
                  <Text style={localStyles.labelOptional}>(Optional)</Text>
                </Text>
                <View style={styles.inputRow}>
                  <Ionicons
                    name="calendar-outline"
                    size={18}
                    color={COLORS.purple}
                    style={[styles.inputLeadingIcon, { marginLeft: 14 }]}
                  />
                  <TextInput
                    value={dateOfBirth}
                    onChangeText={handleDobChange}
                    placeholder="DD/MM/YYYY"
                    placeholderTextColor={COLORS.grayLight}
                    keyboardType="number-pad"
                    style={styles.inputField}
                  />
                </View>
              </View>

              <Pressable
                onPress={handleContinue}
                disabled={submitting}
                style={({ pressed }) => [{ marginTop: 28 }, pressed && styles.buttonPressed]}>
                <LinearGradient
                  colors={[COLORS.purple, COLORS.purpleDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.purpleButton, { marginTop: 0 }]}>
                  {submitting ? (
                    <ActivityIndicator color={COLORS.white} size="small" />
                  ) : (
                    <Text style={styles.purpleButtonText}>Continue</Text>
                  )}
                </LinearGradient>
              </Pressable>

              <Text style={styles.assuranceText}>You can update this later in settings</Text>
            </Animated.View>
          </SafeAreaView>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* State Picker Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView
          style={localStyles.modalOverlay}
          behavior={Platform.select({ ios: 'padding', default: 'height' })}>
          <Pressable style={localStyles.modalBackdrop} onPress={() => setModalVisible(false)} />
          <View style={localStyles.modalSheet}>
            <View style={localStyles.sheetHandle} />

            <View style={localStyles.sheetHeader}>
              <Text style={localStyles.sheetTitle}>Select State / Union Territory</Text>
              <Pressable onPress={() => setModalVisible(false)} style={localStyles.closeBtn}>
                <Ionicons name="close" size={20} color={COLORS.navy} />
              </Pressable>
            </View>

            <View style={[styles.inputRow, localStyles.searchBox]}>
              <Ionicons
                name="search-outline"
                size={18}
                color={COLORS.grayLight}
                style={[styles.inputLeadingIcon, { marginLeft: 14 }]}
              />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search state..."
                placeholderTextColor={COLORS.grayLight}
                style={styles.inputField}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')} style={{ marginRight: 12 }}>
                  <Ionicons name="close-circle" size={18} color={COLORS.grayLight} />
                </Pressable>
              )}
            </View>

            <ScrollView
              style={localStyles.stateList}
              contentContainerStyle={localStyles.stateListContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled">
              {selectedState ? (
                <Pressable
                  onPress={() => {
                    setSelectedState('');
                    setModalVisible(false);
                    setSearchQuery('');
                  }}
                  style={localStyles.clearOptionRow}>
                  <Text style={localStyles.clearOptionText}>Clear Selection</Text>
                </Pressable>
              ) : null}

              {filteredStates.map((state) => {
                const isSelected = selectedState === state;
                return (
                  <Pressable
                    key={state}
                    onPress={() => {
                      setSelectedState(state);
                      setModalVisible(false);
                      setSearchQuery('');
                    }}
                    style={({ pressed }) => [
                      localStyles.stateRow,
                      isSelected && localStyles.stateRowSelected,
                      pressed && localStyles.stateRowPressed,
                    ]}>
                    <Text
                      style={[
                        localStyles.stateRowText,
                        isSelected && localStyles.stateRowTextSelected,
                      ]}>
                      {state}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color={COLORS.purple} />
                    )}
                  </Pressable>
                );
              })}

              {filteredStates.length === 0 && (
                <Text style={localStyles.emptyStateText}>No states found matching query</Text>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const localStyles = StyleSheet.create({
  labelRow: { marginBottom: 8 },
  labelOptional: { fontSize: 14, fontWeight: '400', color: COLORS.grayLight },
  hintText: { fontSize: 12, color: COLORS.grayLight, marginTop: 6 },

  stateValue: { flex: 1, fontSize: 15, color: COLORS.navy, fontWeight: '500', paddingVertical: 14 },
  statePlaceholder: { color: COLORS.grayLight, fontWeight: '400' },

  // ─── State Picker Modal ───
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(21, 43, 92, 0.45)' },
  modalSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '80%',
    paddingTop: 12,
    paddingBottom: 28,
    paddingHorizontal: 24,
    shadowColor: COLORS.navy,
    shadowOpacity: 0.25,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -6 },
    elevation: 16,
  },
  sheetHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.grayBorder,
    alignSelf: 'center',
    marginBottom: 18,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: COLORS.navy },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBox: {
    marginBottom: 14,
  },
  stateList: { maxHeight: 380 },
  stateListContent: { paddingBottom: 20 },
  stateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayBorder,
  },
  stateRowSelected: {
    backgroundColor: COLORS.purpleSoft,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderBottomWidth: 0,
    marginVertical: 2,
  },
  stateRowPressed: { opacity: 0.7 },
  stateRowText: { fontSize: 15, color: COLORS.navy, fontWeight: '500' },
  stateRowTextSelected: { color: COLORS.purple, fontWeight: '700' },
  clearOptionRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayBorder,
    alignItems: 'center',
  },
  clearOptionText: { fontSize: 14, fontWeight: '600', color: COLORS.gray },
  emptyStateText: {
    textAlign: 'center',
    color: COLORS.grayLight,
    fontSize: 14,
    marginTop: 24,
    marginBottom: 16,
  },
});
