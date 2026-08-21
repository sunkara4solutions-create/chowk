import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Modal } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getContractorMe, updateContractorMe, getContractorJobs } from '../../lib/api';
import { useAuthStore } from '../../store/auth';
import { COLORS } from '../../lib/config';
import type { ContractorProfile, Job } from '../../lib/types';

export default function ContractorProfileScreen() {
  const { clearAuth } = useAuthStore();
  const qc = useQueryClient();
  const [editModal, setEditModal] = useState(false);
  const [form, setForm] = useState({ name: '', company_name: '', city: '' });

  const { data: profile } = useQuery<ContractorProfile>({
    queryKey: ['contractor-me'],
    queryFn: () => getContractorMe().then(r => r.data),
  });

  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ['contractor-jobs'],
    queryFn: () => getContractorJobs().then(r => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: () => updateContractorMe({
      name: form.name,
      company_name: form.company_name || undefined,
      city: form.city,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contractor-me'] });
      setEditModal(false);
    },
    onError: (e: any) => Alert.alert('Error', e.response?.data?.detail ?? 'Failed to update'),
  });

  const handleEditOpen = () => {
    if (!profile) return;
    setForm({ name: profile.name, company_name: profile.company_name ?? '', city: profile.city });
    setEditModal(true);
  };

  const initials = profile?.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) ?? '?';
  const filledJobs = jobs.filter(j => j.status === 'filled').length;
  const totalWorkers = jobs.reduce((s, j) => s + j.confirmed_count, 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{profile?.name ?? '...'}</Text>
        {profile?.company_name && <Text style={styles.company}>{profile.company_name}</Text>}
        <Text style={styles.phone}>{profile?.phone ? `+91 ${profile.phone}` : ''}</Text>
      </View>

      <View style={styles.statsRow}>
        <StatBox label="Total Jobs" value={jobs.length} />
        <StatBox label="Filled" value={filledJobs} />
        <StatBox label="Workers Hired" value={totalWorkers} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Details</Text>
        <View style={styles.detailCard}>
          <DetailRow icon="location-outline" label="City" value={profile?.city ?? ''} />
          <DetailRow icon="calendar-outline" label="Member Since" value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : ''} />
        </View>
      </View>

      <TouchableOpacity style={styles.editBtn} onPress={handleEditOpen}>
        <Ionicons name="pencil-outline" size={16} color="#fff" />
        <Text style={styles.editBtnText}>Edit Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={() => Alert.alert('Logout', 'Are you sure?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Logout', style: 'destructive', onPress: async () => { await clearAuth(); router.replace('/(auth)/phone'); } },
        ])}
      >
        <Ionicons name="log-out-outline" size={16} color="#E74C3C" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <Modal visible={editModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={() => setEditModal(false)}>
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.inputLabel}>Full Name</Text>
          <TextInput style={styles.input} value={form.name} onChangeText={v => setForm(p => ({ ...p, name: v }))} />

          <Text style={styles.inputLabel}>Company Name (optional)</Text>
          <TextInput style={styles.input} value={form.company_name} onChangeText={v => setForm(p => ({ ...p, company_name: v }))} placeholder="Leave blank if none" placeholderTextColor={COLORS.textSecondary} />

          <Text style={styles.inputLabel}>City</Text>
          <TextInput style={styles.input} value={form.city} onChangeText={v => setForm(p => ({ ...p, city: v }))} />

          <TouchableOpacity
            style={[styles.saveBtn, updateMutation.isPending && { opacity: 0.6 }]}
            onPress={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
          >
            <Text style={styles.saveBtnText}>{updateMutation.isPending ? 'Saving...' : 'Save Changes'}</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </ScrollView>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function DetailRow({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <Ionicons name={icon} size={16} color={COLORS.primary} />
      </View>
      <View>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value || '—'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingBottom: 40 },
  header: { alignItems: 'center', backgroundColor: COLORS.secondary, paddingTop: 32, paddingBottom: 28 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '800' },
  name: { fontSize: 20, fontWeight: '800', color: '#fff' },
  company: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  phone: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 3 },
  statsRow: { flexDirection: 'row', padding: 16, gap: 10 },
  statBox: { flex: 1, backgroundColor: COLORS.card, borderRadius: 10, padding: 14, alignItems: 'center', elevation: 2 },
  statValue: { fontSize: 22, fontWeight: '800', color: COLORS.primary },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  section: { marginHorizontal: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  detailCard: { backgroundColor: COLORS.card, borderRadius: 12, overflow: 'hidden', elevation: 2 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  detailIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primary + '15', alignItems: 'center', justifyContent: 'center' },
  detailLabel: { fontSize: 11, color: COLORS.textSecondary },
  detailValue: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginTop: 1 },
  editBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: COLORS.primary, marginHorizontal: 16, marginTop: 8, borderRadius: 12, padding: 14 },
  editBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginHorizontal: 16, marginTop: 8, padding: 14 },
  logoutText: { color: '#E74C3C', fontWeight: '600', fontSize: 15 },
  modal: { flex: 1, backgroundColor: COLORS.background, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary },
  inputLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: COLORS.card, borderRadius: 10, padding: 14, fontSize: 15, color: COLORS.textPrimary, borderWidth: 1, borderColor: COLORS.border },
  saveBtn: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
