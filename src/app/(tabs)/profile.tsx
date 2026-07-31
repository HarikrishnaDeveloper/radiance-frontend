import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '@/constants/colors';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api-client';
import type { AttemptHistoryItem, DashboardResponse } from '@/types/api';

function initials(name: string | null | undefined, username: string | null | undefined) {
  const source = (name ?? username ?? '').trim();
  if (!source) return '?';
  const parts = source.split(/\s+/);
  return parts.length > 1 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : source.slice(0, 2).toUpperCase();
}

export default function ProfileScreen() {
  const { token, user, logout, completeProfile } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [history, setHistory] = useState<AttemptHistoryItem[]>([]);

  const [editVisible, setEditVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editState, setEditState] = useState('');
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    const [dashboardRes, historyRes] = await Promise.all([api.dashboard(token), api.attemptHistory(token, true)]);
    setDashboard(dashboardRes);
    setHistory(historyRes);
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
        name: trimmedName,
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
            <View style={styles.headerTop}>
              <Text style={styles.pageTitle}>Profile</Text>
              <Pressable style={styles.iconPill} onPress={openEdit}>
                <Ionicons name="settings-outline" size={17} color={COLORS.white} />
              </Pressable>
            </View>
          </SafeAreaView>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(user?.name, user?.username)}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name ?? user?.username}</Text>
            {user?.state && (
              <View style={styles.goalChip}>
                <Ionicons name="location" size={12} color={COLORS.purple} />
                <Text style={styles.goalChipText}>{user.state}</Text>
              </View>
            )}
          </View>
          <Pressable style={styles.editBtn} onPress={openEdit}>
            <Ionicons name="create-outline" size={16} color={COLORS.gray} />
          </Pressable>
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
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.menuCard}>
            {infoRows.map((row, i) => (
              <View key={row.label} style={[styles.menuRow, i === infoRows.length - 1 && styles.menuRowLast]}>
                <View style={[styles.menuIcon, { backgroundColor: COLORS.purpleSoft }]}>
                  <Ionicons name={row.icon} size={18} color={COLORS.purple} />
                </View>
                <Text style={styles.menuLabel}>{row.label}</Text>
                <Text style={styles.menuValue}>{row.value}</Text>
              </View>
            ))}
            {infoRows.length === 0 && <Text style={styles.emptyText}>No account details yet.</Text>}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Attempt History</Text>
          <View style={styles.menuCard}>
            {history.length === 0 && <Text style={styles.emptyText}>No completed attempts yet.</Text>}
            {history.map((attempt, i) => (
              <Pressable key={attempt.id} onPress={() => router.push(`/results/${attempt.id}`)}>
                <View style={[styles.menuRow, i === history.length - 1 && styles.menuRowLast]}>
                  <View style={[styles.menuIcon, { backgroundColor: COLORS.greenSoft }]}>
                    <Ionicons name="document-text-outline" size={18} color={COLORS.green} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.menuLabel}>{attempt.title}</Text>
                    <Text style={styles.menuSub}>
                      {attempt.correctCount} / {attempt.totalQuestions} correct
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.grayLight} />
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Pressable onPress={() => logout()} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={16} color={COLORS.error} />
            <Text style={styles.logoutText}>Log Out</Text>
          </Pressable>
          <Text style={styles.versionText}>Radiance · Version {Constants.expoConfig?.version ?? '1.0.0'}</Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      <Modal visible={editVisible} transparent animationType="fade" onRequestClose={() => setEditVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Profile</Text>

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

            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancel} onPress={() => setEditVisible(false)} disabled={saving}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalSave} onPress={saveEdit} disabled={saving}>
                {saving ? <ActivityIndicator color={COLORS.white} size="small" /> : <Text style={styles.modalSaveText}>Save</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.loginBg },
  scrollContent: { flexGrow: 1 },

  header: { backgroundColor: COLORS.purple700, paddingHorizontal: 22, paddingBottom: 46, paddingTop: 6 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pageTitle: { fontSize: 19, fontWeight: '800', color: COLORS.white },
  iconPill: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileCard: {
    marginTop: -40,
    marginHorizontal: 22,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  avatar: {
    width: 66,
    height: 66,
    borderRadius: 20,
    backgroundColor: COLORS.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: COLORS.white, fontSize: 22, fontWeight: '800' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 17, fontWeight: '800', color: COLORS.navy },
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
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.loginBg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statStrip: {
    marginTop: 14,
    marginHorizontal: 22,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    flexDirection: 'row',
    paddingVertical: 16,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: COLORS.grayBorder },
  statVal: { fontSize: 16.5, fontWeight: '800', color: COLORS.navy },
  statLabel: { fontSize: 11, color: COLORS.grayLight, fontWeight: '600', marginTop: 3 },

  section: { paddingHorizontal: 22, paddingTop: 22 },
  sectionTitle: { fontSize: 16.5, fontWeight: '800', color: COLORS.navy, marginBottom: 14 },

  menuCard: { backgroundColor: COLORS.white, borderRadius: 20, overflow: 'hidden' },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayBorder,
  },
  menuRowLast: { borderBottomWidth: 0 },
  menuIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { fontSize: 14, fontWeight: '700', color: COLORS.navy, flex: 1 },
  menuValue: { fontSize: 13, fontWeight: '600', color: COLORS.gray },
  menuSub: { fontSize: 12, color: COLORS.gray, marginTop: 2, fontWeight: '500' },
  emptyText: { textAlign: 'center', color: COLORS.grayLight, padding: 16 },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 15,
  },
  logoutText: { color: COLORS.error, fontSize: 14, fontWeight: '800' },
  versionText: { textAlign: 'center', fontSize: 11.5, color: COLORS.grayLight, fontWeight: '500', marginTop: 14 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(21,43,92,0.45)', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: COLORS.white, borderRadius: 20, padding: 22 },
  modalTitle: { fontSize: 17, fontWeight: '800', color: COLORS.navy, marginBottom: 16 },
  fieldLabel: { fontSize: 12.5, fontWeight: '700', color: COLORS.gray, marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.grayBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.navy,
  },
  modalError: { color: COLORS.error, fontSize: 12.5, fontWeight: '600', marginTop: 12 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 22 },
  modalCancel: { flex: 1, paddingVertical: 13, alignItems: 'center', borderRadius: 12, backgroundColor: COLORS.loginBg },
  modalCancelText: { color: COLORS.gray, fontWeight: '700' },
  modalSave: { flex: 1, paddingVertical: 13, alignItems: 'center', borderRadius: 12, backgroundColor: COLORS.purple },
  modalSaveText: { color: COLORS.white, fontWeight: '700' },
});
