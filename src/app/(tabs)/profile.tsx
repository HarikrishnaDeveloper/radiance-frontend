import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '@/constants/colors';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api-client';
import { playSound, setSoundsEnabled, useSoundsEnabled } from '@/lib/sounds';
import type { DashboardResponse } from '@/types/api';
import { Button } from '@/components/ui/button';
import { dialog, DialogTitle, dialogStyles } from '@/components/ui/dialog';
import { Pressable } from '@/components/ui/pressable';

function initials(name: string | null | undefined, username: string | null | undefined) {
  const source = (name ?? username ?? '').trim();
  if (!source) return '?';
  const parts = source.split(/\s+/);
  return parts.length > 1 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : source.slice(0, 2).toUpperCase();
}

const EXAM_LABELS: Record<string, string> = { UPSC_CSE: 'UPSC CSE', GROUP_1: 'Group 1', OTHER: 'Other' };
const FOCUS_LABELS: Record<string, string> = { GS: 'GS', CSAT: 'CSAT', BOTH: 'Both (GS & CSAT)' };

const examLabel = (exam: string | null | undefined) => (exam ? (EXAM_LABELS[exam] ?? null) : null);
const focusLabel = (focus: string | null | undefined) => (focus ? (FOCUS_LABELS[focus] ?? null) : null);

export default function ProfileScreen() {
  const { token, user, logout, completeProfile } = useAuth();
  const soundsOn = useSoundsEnabled();
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);

  const [editVisible, setEditVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editState, setEditState] = useState('');
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setDashboard(await api.dashboard(token));
    } catch {
      // Stats show "–" until the dashboard loads.
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function openEdit() {
    setEditName(user?.name ?? '');
    setEditEmail(user?.email ?? '');
    setEditState(user?.state ?? '');
    setEditError(null);
    setEditVisible(true);
  }

  async function saveEdit() {
    const trimmedName = editName.trim();
    if (!trimmedName) {
      setEditError('Name is required');
      return;
    }
    setSaving(true);
    try {
      await completeProfile({
        fullName: trimmedName,
        email: editEmail.trim() || undefined,
        state: editState.trim() || undefined,
      });
      setEditVisible(false);
    } catch {
      setEditError('Could not save changes');
    } finally {
      setSaving(false);
    }
  }

  const stagesDone = dashboard?.categoryProgress.reduce((sum, c) => sum + c.completedStages, 0) ?? 0;

  const prepRows = [
    {
      icon: 'school-outline' as const,
      label: 'Target Exam',
      value: examLabel(user?.profile?.targetExam),
    },
    {
      icon: 'stats-chart-outline' as const,
      label: 'Preparation Level',
      value: user?.profile?.preparationLevel ? user.profile.preparationLevel.charAt(0) + user.profile.preparationLevel.slice(1).toLowerCase() : null,
    },
    {
      icon: 'calendar-outline' as const,
      label: 'Target Attempt',
      value: user?.profile?.targetAttempt ?? null,
    },
    {
      icon: 'compass-outline' as const,
      label: 'Preparation Focus',
      value: focusLabel(user?.profile?.preparationFocus),
    },
  ].filter((row) => row.value);

  const infoRows = [
    { icon: 'at-outline' as const, label: 'Username', value: user?.username },
    { icon: 'call-outline' as const, label: 'Phone', value: user?.phone },
    { icon: 'mail-outline' as const, label: 'Email', value: user?.email },
    { icon: 'location-outline' as const, label: 'State', value: user?.state },
  ].filter((row) => row.value);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <SafeAreaView edges={['top']}>
            <Text style={styles.pageTitle}>Profile</Text>
          </SafeAreaView>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(user?.profile?.fullName ?? user?.name, user?.username)}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName} numberOfLines={2}>{user?.profile?.fullName ?? user?.name ?? user?.username}</Text>
            {examLabel(user?.profile?.targetExam) && (
              <View style={styles.goalChip}>
                <Ionicons name="school" size={12} color={COLORS.purple} />
                <Text style={styles.goalChipText}>
                  {examLabel(user?.profile?.targetExam)}
                  {user?.profile?.targetAttempt ? ` • ${user.profile.targetAttempt}` : ''}
                </Text>
              </View>
            )}
            <Pressable
              onPress={openEdit}
              style={({ pressed }) => [styles.editBtn, pressed && { backgroundColor: COLORS.purpleSoft }]}
              accessibilityRole="button"
              accessibilityLabel="Edit profile">
              <Ionicons name="create-outline" size={15} color={COLORS.purple} />
              <Text style={styles.editBtnText}>Edit profile</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.statStrip}>
          <View style={styles.statItem}>
            <Text style={styles.statVal}>{dashboard?.streak ?? '–'}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={[styles.statItem, styles.statDivider]}>
            <Text style={styles.statVal}>{stagesDone}</Text>
            <Text style={styles.statLabel}>Stages Done</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statVal}>{dashboard?.stats.accuracy ?? '–'}%</Text>
            <Text style={styles.statLabel}>Accuracy</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preparation Goals</Text>
          <View style={styles.menuCard}>
            {prepRows.map((row, i) => (
              <View key={row.label} style={[styles.menuRow, i === prepRows.length - 1 && styles.menuRowLast]}>
                <View style={[styles.menuIcon, { backgroundColor: COLORS.purpleSoft }]}>
                  <Ionicons name={row.icon} size={18} color={COLORS.purple} />
                </View>
                <Text style={styles.menuLabel}>{row.label}</Text>
                <Text style={styles.menuValue} numberOfLines={1}>{row.value}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.menuCard}>
            {infoRows.map((row, i) => (
              <View key={row.label} style={[styles.menuRow, i === infoRows.length - 1 && styles.menuRowLast]}>
                <View style={[styles.menuIcon, { backgroundColor: COLORS.purpleSoft }]}>
                  <Ionicons name={row.icon} size={18} color={COLORS.purple} />
                </View>
                <Text style={styles.menuLabel}>{row.label}</Text>
                <Text style={styles.menuValue} numberOfLines={1}>{row.value}</Text>
              </View>
            ))}
            {infoRows.length === 0 && <Text style={styles.emptyText}>No account details yet.</Text>}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.menuCard}>
            <View style={[styles.menuRow, styles.menuRowLast]}>
              <View style={[styles.menuIcon, { backgroundColor: COLORS.purpleSoft }]}>
                <Ionicons name={soundsOn ? 'volume-high-outline' : 'volume-mute-outline'} size={18} color={COLORS.purple} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuLabel}>Sound effects</Text>
                <Text style={styles.menuSub}>Taps, answers and alerts</Text>
              </View>
              <Switch
                value={soundsOn}
                onValueChange={(on) => {
                  setSoundsEnabled(on);
                  // A quick preview so turning sounds on is audible straight away.
                  if (on) playSound('correct');
                }}
                trackColor={{ true: COLORS.purple, false: COLORS.grayBorder }}
                thumbColor={COLORS.white}
                ios_backgroundColor={COLORS.grayBorder}
                accessibilityLabel="Sound effects"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Pressable
            onPress={() =>
              dialog.alert('Log out?', 'You can log back in any time with your phone number.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Log out', style: 'destructive', onPress: () => logout() },
              ])
            }
            style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={16} color={COLORS.error} />
            <Text style={styles.logoutText}>Log out</Text>
          </Pressable>
          {Constants.expoConfig?.version && <Text style={styles.versionText}>Radiance · Version {Constants.expoConfig.version}</Text>}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      <Modal visible={editVisible} transparent animationType="fade" onRequestClose={() => setEditVisible(false)}>
        {/* Keeps the form above the keyboard and scrollable on short phones. */}
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled" bounces={false}>
            <View style={styles.modalCard}>
              <DialogTitle>Edit profile</DialogTitle>

              <Text style={styles.fieldLabel}>Name</Text>
              <TextInput value={editName} onChangeText={setEditName} style={styles.input} placeholder="Your name" placeholderTextColor={COLORS.grayLight} />

              <Text style={styles.fieldLabel}>Email</Text>
              <TextInput
                value={editEmail}
                onChangeText={setEditEmail}
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={COLORS.grayLight}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <Text style={styles.fieldLabel}>State</Text>
              <TextInput
                value={editState}
                onChangeText={setEditState}
                style={styles.input}
                placeholder="Your state"
                placeholderTextColor={COLORS.grayLight}
              />

              {editError && <Text style={styles.modalError}>{editError}</Text>}

              <View style={dialogStyles.actions}>
                <Button label="Cancel" variant="secondary" onPress={() => setEditVisible(false)} disabled={saving} style={dialogStyles.action} />
                <Button label="Save" onPress={saveEdit} loading={saving} style={dialogStyles.action} />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.loginBg },
  scrollContent: { flexGrow: 1 },

  header: { backgroundColor: COLORS.white, paddingHorizontal: 22, paddingBottom: 4, paddingTop: 12 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pageTitle: { fontSize: 28, fontWeight: '700', color: COLORS.navy, letterSpacing: -0.5 },
  iconPill: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileCard: {
    marginTop: 12,
    marginHorizontal: 22,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
    borderRadius: 8,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  avatar: {
    width: 66,
    height: 66,
    borderRadius: 8,
    backgroundColor: COLORS.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: COLORS.white, fontSize: 22, fontWeight: '700' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 17, fontWeight: '700', color: COLORS.navy },
  goalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    marginTop: 6,
    backgroundColor: COLORS.purpleSoft,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  goalChipText: { fontSize: 11.5, fontWeight: '700', color: COLORS.purple },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 10,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.purple,
  },
  editBtnText: { fontSize: 13.5, fontWeight: '600', color: COLORS.purple },

  statStrip: {
    marginTop: 12,
    marginHorizontal: 22,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
    borderRadius: 8,
    flexDirection: 'row',
    paddingVertical: 16,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: COLORS.grayBorder },
  statVal: { fontSize: 16.5, fontWeight: '700', color: COLORS.navy },
  statLabel: { fontSize: 11, color: COLORS.grayLight, fontWeight: '600', marginTop: 3 },

  section: { paddingHorizontal: 22, paddingTop: 22 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.navy, marginBottom: 12 },

  menuCard: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.grayBorder, borderRadius: 8, overflow: 'hidden' },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayBorder,
  },
  menuRowLast: { borderBottomWidth: 0 },
  menuIcon: { width: 38, height: 38, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { fontSize: 14, fontWeight: '700', color: COLORS.navy, flex: 1 },
  menuValue: { flexShrink: 1, maxWidth: '55%', fontSize: 13, fontWeight: '600', color: COLORS.gray, textAlign: 'right' },
  menuSub: { fontSize: 12, color: COLORS.gray, marginTop: 2, fontWeight: '500' },
  emptyText: { textAlign: 'center', color: COLORS.grayLight, padding: 16 },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
    borderRadius: 8,
    padding: 15,
  },
  logoutText: { color: COLORS.error, fontSize: 14, fontWeight: '700' },
  versionText: { textAlign: 'center', fontSize: 11.5, color: COLORS.grayLight, fontWeight: '500', marginTop: 14 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalScroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  // Same card as components/ui/dialog so every popup matches.
  modalCard: { width: '100%', maxWidth: 400, alignSelf: 'center', backgroundColor: COLORS.white, borderRadius: 14, padding: 22 },
  fieldLabel: { fontSize: 12.5, fontWeight: '700', color: COLORS.gray, marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.grayBorder,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.navy,
  },
  modalError: { color: COLORS.error, fontSize: 12.5, fontWeight: '600', marginTop: 12 },
});
