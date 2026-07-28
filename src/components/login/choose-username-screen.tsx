import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
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

import { COLORS } from './colors';

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

  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isDobFocused, setIsDobFocused] = useState(false);
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

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.select({ ios: 'padding', default: undefined })}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <SafeAreaView style={styles.safeArea}>
            <Animated.View entering={FadeIn.duration(450)} style={styles.heroWrap}>
              <Image
                source={require('../../../assets/login/profile.png')}
                style={styles.heroImage}
                contentFit="contain"
              />
            </Animated.View>

            <Animated.View entering={FadeInUp.duration(450)} style={styles.content}>
              <Text style={styles.title}>Let&apos;s Get Started</Text>
              <Text style={styles.subtitle}>Tell us a few details about yourself</Text>

              <View style={styles.formContainer}>
                {/* Full Name */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.labelDark}>Full Name</Text>
                  <View
                    style={[
                      styles.inputRow,
                      isNameFocused && styles.inputRowFocused,
                    ]}>
                    <Ionicons
                      name="person-outline"
                      size={20}
                      color={COLORS.purple}
                      style={styles.leftIcon}
                    />
                    <TextInput
                      value={fullName}
                      onChangeText={handleFullNameChange}
                      placeholder="Enter your full name"
                      placeholderTextColor="#94A3B8"
                      autoCapitalize="words"
                      onFocus={() => setIsNameFocused(true)}
                      onBlur={() => setIsNameFocused(false)}
                      style={styles.inputField}
                    />
                  </View>
                </View>

                {/* Email Address */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.labelRow}>
                    <Text style={styles.labelDark}>Email Address </Text>
                    <Text style={styles.labelOptional}>(Optional)</Text>
                  </Text>
                  <View
                    style={[
                      styles.inputRow,
                      isEmailFocused && styles.inputRowFocused,
                    ]}>
                    <Ionicons
                      name="mail-outline"
                      size={20}
                      color={COLORS.purple}
                      style={styles.leftIcon}
                    />
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder="Enter your email address"
                      placeholderTextColor="#94A3B8"
                      autoCapitalize="none"
                      keyboardType="email-address"
                      onFocus={() => setIsEmailFocused(true)}
                      onBlur={() => setIsEmailFocused(false)}
                      style={styles.inputField}
                    />
                  </View>
                </View>

                {/* Password */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.labelDark}>Password</Text>
                  <View
                    style={[
                      styles.inputRow,
                      isPasswordFocused && styles.inputRowFocused,
                    ]}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color={COLORS.purple}
                      style={styles.leftIcon}
                    />
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Create a password"
                      placeholderTextColor="#94A3B8"
                      autoCapitalize="none"
                      secureTextEntry={!showPassword}
                      onFocus={() => setIsPasswordFocused(true)}
                      onBlur={() => setIsPasswordFocused(false)}
                      style={styles.inputField}
                    />
                    <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color={COLORS.purple}
                      />
                    </Pressable>
                  </View>
                  <Text style={styles.hintText}>Password must be at least 6 characters long</Text>
                </View>

                {/* State */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.labelRow}>
                    <Text style={styles.labelDark}>State </Text>
                    <Text style={styles.labelOptional}>(Optional)</Text>
                  </Text>
                  <Pressable
                    style={[
                      styles.inputRow,
                      modalVisible && styles.inputRowFocused,
                    ]}
                    onPress={() => setModalVisible(true)}>
                    <Ionicons
                      name="location-outline"
                      size={20}
                      color={COLORS.purple}
                      style={styles.leftIcon}
                    />
                    <Text
                      style={[
                        styles.stateValue,
                        !selectedState && styles.statePlaceholder,
                      ]}>
                      {selectedState || 'Select your state'}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color="#64748B" />
                  </Pressable>
                </View>

                {/* Date of Birth */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.labelRow}>
                    <Text style={styles.labelDark}>Date of Birth </Text>
                    <Text style={styles.labelOptional}>(Optional)</Text>
                  </Text>
                  <View
                    style={[
                      styles.inputRow,
                      isDobFocused && styles.inputRowFocused,
                    ]}>
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color={COLORS.purple}
                      style={styles.leftIcon}
                    />
                    <TextInput
                      value={dateOfBirth}
                      onChangeText={handleDobChange}
                      placeholder="DD/MM/YYYY"
                      placeholderTextColor="#94A3B8"
                      keyboardType="number-pad"
                      onFocus={() => setIsDobFocused(true)}
                      onBlur={() => setIsDobFocused(false)}
                      style={styles.inputField}
                    />
                  </View>
                </View>

                {/* Error Box */}
                {(localError || error) && (
                  <Animated.View entering={FadeIn.duration(200)} style={styles.errorBox}>
                    <Ionicons
                      name="alert-circle"
                      size={18}
                      color="#E53935"
                      style={styles.errorIcon}
                    />
                    <Text style={styles.errorText}>{localError || error}</Text>
                  </Animated.View>
                )}

                {/* Continue Button */}
                <Pressable
                  onPress={handleContinue}
                  disabled={submitting}
                  style={({ pressed }) => [
                    styles.buttonWrapper,
                    pressed && styles.buttonPressed,
                  ]}>
                  <LinearGradient
                    colors={['#6366F1', '#4F46E5']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.continueButton}>
                    {submitting ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <Text style={styles.continueText}>Continue</Text>
                        <Ionicons
                          name="arrow-forward"
                          size={20}
                          color="#FFFFFF"
                          style={styles.arrowIcon}
                        />
                      </>
                    )}
                  </LinearGradient>
                </Pressable>

                <Text style={styles.footerText}>
                  You can update this later in settings
                </Text>
              </View>
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
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setModalVisible(false)}
          />
          <View style={styles.modalSheet}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Select State / Union Territory</Text>
              <Pressable
                onPress={() => setModalVisible(false)}
                style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#0F172A" />
              </Pressable>
            </View>

            <View style={styles.searchBox}>
              <Ionicons
                name="search-outline"
                size={18}
                color="#94A3B8"
                style={styles.searchIcon}
              />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search state..."
                placeholderTextColor="#94A3B8"
                style={styles.searchInput}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color="#94A3B8" />
                </Pressable>
              )}
            </View>

            <ScrollView
              style={styles.stateList}
              contentContainerStyle={styles.stateListContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled">
              {selectedState ? (
                <Pressable
                  onPress={() => {
                    setSelectedState('');
                    setModalVisible(false);
                    setSearchQuery('');
                  }}
                  style={styles.clearOptionRow}>
                  <Text style={styles.clearOptionText}>Clear Selection</Text>
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
                      styles.stateRow,
                      isSelected && styles.stateRowSelected,
                      pressed && styles.stateRowPressed,
                    ]}>
                    <Text
                      style={[
                        styles.stateRowText,
                        isSelected && styles.stateRowTextSelected,
                      ]}>
                      {state}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color={COLORS.purple}
                      />
                    )}
                  </Pressable>
                );
              })}

              {filteredStates.length === 0 && (
                <Text style={styles.emptyStateText}>No states found matching query</Text>
              )}
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
    backgroundColor: '#FFFFFF',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  safeArea: {
    flex: 1,
  },
  heroWrap: {
    alignItems: 'center',
    marginTop: 2,
  },
  heroImage: {
    top: -30,
    width: 350,
    height: 350,
  },
  content: {
    top: -90,
    paddingHorizontal: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 22,
  },
  formContainer: {
    marginTop: 32,
  },
  fieldGroup: {
    marginBottom: 18,
  },
  labelDark: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  labelRow: {
    marginBottom: 8,
  },
  labelOptional: {
    fontSize: 14,
    fontWeight: '400',
    color: '#64748B',
  },
  hintText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    height: 56,
  },
  inputRowFocused: {
    borderColor: '#6366F1',
    shadowColor: '#6366F1',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  leftIcon: {
    marginRight: 12,
  },
  inputField: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '500',
    paddingVertical: 14,
  },
  stateValue: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '500',
  },
  statePlaceholder: {
    color: '#94A3B8',
    fontWeight: '400',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  errorIcon: {
    marginRight: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#E53935',
  },
  buttonWrapper: {
    marginTop: 18,
    borderRadius: 14,
    shadowColor: '#4F46E5',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  continueButton: {
    height: 56,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  arrowIcon: {
    marginLeft: 8,
  },
  footerText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 22,
    marginBottom: 10,
  },

  // ─── Modal Styles ───
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '80%',
    paddingTop: 12,
    paddingBottom: 28,
    paddingHorizontal: 24,
    shadowColor: '#0F172A',
    shadowOpacity: 0.25,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -6 },
    elevation: 16,
  },
  sheetHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 18,
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
    color: '#0F172A',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 14,
    backgroundColor: '#F8FAFC',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    paddingVertical: 10,
  },
  stateList: {
    maxHeight: 380,
  },
  stateListContent: {
    paddingBottom: 20,
  },
  stateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  stateRowSelected: {
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 12,
    borderRadius: 10,
    borderBottomWidth: 0,
    marginVertical: 2,
  },
  stateRowPressed: {
    opacity: 0.7,
  },
  stateRowText: {
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '500',
  },
  stateRowTextSelected: {
    color: '#6366F1',
    fontWeight: '700',
  },
  clearOptionRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    alignItems: 'center',
  },
  clearOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  emptyStateText: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 24,
    marginBottom: 16,
  },
});
