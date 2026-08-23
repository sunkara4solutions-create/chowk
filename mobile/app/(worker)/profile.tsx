import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert, TextInput, Modal, Platform, StatusBar } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { getWorkerMe, updateWorkerMe, updateWorkerLocation, deleteAccount } from '../../lib/api';
import { useAuthStore } from '../../store/auth';
import { COLORS, SKILLS, SKILL_LABELS } from '../../lib/config';
import type { Worker } from '../../lib/types';

export default function WorkerProfile() {
  const { clearAuth } = useAuthStore();
  const qc = useQueryClient();
  const [editModal, setEditModal] = useState(false);
  const [form, setForm] = useState({ name: '', city: '', daily_rate: '', experience: '' });
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  const { data: worker } = useQuery<Worker>({
    queryKey: ['worker-me'],
    queryFn: () => getWorkerMe().then(r => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: () => updateWorkerMe({
      name: form.name,
      city: form.city,
      daily_rate: parseInt(form.daily_rate),
      experience: parseInt(form.experience),
      skills: selectedSkills,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['worker-me'] });
      setEditModal(false);
    },
    onError: (e: any) => Alert.alert('Error', e.response?.data?.detail ?? 'Failed to update'),
  });

  const availMutation = useMutation({
    mutationFn: (val: boolean) => updateWorkerMe({ is_available: val }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['worker-me'] }),
  });

  const handleEditOpen = () => {
    if (!worker) return;
    setForm({
      name: worker.name,
      city: worker.city,
      daily_rate: String(worker.daily_rate),
      experience: String(worker.experience),
    });
    setSelectedSkills(worker.skills ?? []);
    setEditModal(true);
  };

  const toggleSkill = (s: string) =>
    setSelectedSkills(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your profile, applications and all data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            try {
              await deleteAccount();
              clearAuth();
              router.replace('/(auth)/phone');
            } catch {
              Alert.alert('Error', 'Failed to delete account. Please try again.');
            }
          }
        },
      ]
    );
  };

  const handleVerifyLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow location access to verify your location.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const geo = await Location.reverseGeocodeAsync(loc.coords);
      const geocodedCity = [geo[0]?.city, geo[0]?.district, geo[0]?.subregion]
        .filter(Boolean).join(' ').toLowerCase();
      const profileCity = (worker?.city ?? '').toLowerCase();
      const cityMatch = profileCity.split(' ').some(w => w.length > 2 && geocodedCity.includes(w));

      const save = async (verified: boolean) => {
        await updateWorkerLocation(loc.coords.latitude, loc.coords.longitude, verified);
        qc.invalidateQueries({ queryKey: ['worker-me'] });
      };

      if (!cityMatch && geo[0]?.city) {
        await save(false);
        qc.invalidateQueries({ queryKey: ['worker-me'] });
        Alert.alert(
          'Location Not Verified',
          `Your GPS shows ${geo[0].city} but your profile says ${worker?.city}.\n\nUpdate your city in Edit Profile to match your actual location.`
        );
      } else {
        await save(cityMatch);
        if (cityMatch) Alert.alert('Verified ✅', 'Your location matches your city.');
      }
    } catch {
      Alert.alert('Error', 'Could not capture location. Please try again.');
    }
  };

  const initials = worker?.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) ?? '?';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{worker?.name ?? '...'}</Text>
        <Text style={styles.phone}>{worker?.phone ? `+91 ${worker.phone}` : ''}</Text>
      </View>

      <View style={styles.availCard}>
        <View>
          <Text style={styles.availLabel}>Available for Work</Text>
          <Text style={styles.availSub}>{worker?.is_available ? 'You are visible to contractors' : 'You are hidden from contractors'}</Text>
        </View>
        <Switch
          value={worker?.is_available ?? true}
          onValueChange={v => availMutation.mutate(v)}
          trackColor={{ false: COLORS.border, true: COLORS.success }}
          thumbColor="#fff"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Details</Text>
        <View style={styles.detailCard}>
          <DetailRow icon="briefcase-outline" label="Skills" value={(worker?.skills ?? []).map(s => SKILL_LABELS[s as keyof typeof SKILL_LABELS] ?? s).join(', ')} />
          <DetailRow icon="location-outline" label="City" value={worker?.city ?? ''} />
          <DetailRow icon="school-outline" label="Experience" value={`${worker?.experience ?? 0} years`} />
          <DetailRow icon="cash-outline" label="Daily Rate" value={`₹${worker?.daily_rate ?? 0}/day`} />
        </View>
      </View>

      <View style={styles.verifyRow}>
        <View style={[styles.verifyChip, styles.verifyChipGreen]}>
          <Ionicons name="call-outline" size={13} color="#155724" />
          <Text style={styles.verifyChipText}>Phone Verified</Text>
        </View>
        {worker?.location_verified ? (
          <View style={[styles.verifyChip, styles.verifyChipGreen]}>
            <Ionicons name="location-outline" size={13} color="#155724" />
            <Text style={styles.verifyChipText}>Location Verified</Text>
          </View>
        ) : (
          <TouchableOpacity style={[styles.verifyChip, styles.verifyChipAmber]} onPress={handleVerifyLocation}>
            <Ionicons name="location-outline" size={13} color="#856404" />
            <Text style={[styles.verifyChipText, { color: '#856404' }]}>Verify Location</Text>
          </TouchableOpacity>
        )}
        {worker?.aadhaar_verified ? (
          <View style={[styles.verifyChip, styles.verifyChipGreen]}>
            <Ionicons name="shield-checkmark-outline" size={13} color="#155724" />
            <Text style={styles.verifyChipText}>Aadhaar ✓</Text>
          </View>
        ) : (
          <TouchableOpacity style={[styles.verifyChip, styles.verifyChipGrey]} onPress={() => router.push('/(setup)/aadhaar')}>
            <Ionicons name="shield-outline" size={13} color={COLORS.textSecondary} />
            <Text style={[styles.verifyChipText, { color: COLORS.textSecondary }]}>Add Aadhaar</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity style={styles.editBtn} onPress={handleEditOpen}>
        <Ionicons name="pencil-outline" size={16} color="#fff" />
        <Text style={styles.editBtnText}>Edit Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={() => Alert.alert('Logout', 'Are you sure?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Logout', style: 'destructive', onPress: () => { clearAuth(); router.replace('/(auth)/phone'); } },
        ])}
      >
        <Ionicons name="log-out-outline" size={16} color="#E74C3C" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount}>
        <Ionicons name="trash-outline" size={14} color="#999" />
        <Text style={styles.deleteText}>Delete Account</Text>
      </TouchableOpacity>

      <Modal visible={editModal} animationType="slide" presentationStyle="pageSheet">
        <ScrollView
          style={styles.modal}
          contentContainerStyle={{ padding: 20, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 20 : 20, paddingBottom: 40 }}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={() => setEditModal(false)}>
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.inputLabel}>Full Name</Text>
          <TextInput style={styles.input} value={form.name} onChangeText={v => setForm(p => ({ ...p, name: v }))} />

          <Text style={styles.inputLabel}>City</Text>
          <TextInput style={styles.input} value={form.city} onChangeText={v => setForm(p => ({ ...p, city: v }))} />

          <Text style={styles.inputLabel}>Daily Rate (₹)</Text>
          <TextInput style={styles.input} value={form.daily_rate} onChangeText={v => setForm(p => ({ ...p, daily_rate: v }))} keyboardType="numeric" />

          <Text style={styles.inputLabel}>Experience (years)</Text>
          <TextInput style={styles.input} value={form.experience} onChangeText={v => setForm(p => ({ ...p, experience: v }))} keyboardType="numeric" />

          <Text style={styles.inputLabel}>Skills</Text>
          <View style={styles.skillGrid}>
            {SKILLS.map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.skillChip, selectedSkills.includes(s) && styles.skillChipActive]}
                onPress={() => toggleSkill(s)}
              >
                <Text style={[styles.skillChipText, selectedSkills.includes(s) && styles.skillChipTextActive]}>
                  {SKILL_LABELS[s]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, updateMutation.isPending && { opacity: 0.6 }]}
            onPress={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
          >
            <Text style={styles.saveBtnText}>{updateMutation.isPending ? 'Saving...' : 'Save Changes'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    </ScrollView>
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
  avatarSection: { alignItems: 'center', paddingTop: 32, paddingBottom: 24, backgroundColor: COLORS.card },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '800' },
  name: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary },
  phone: { fontSize: 14, color: COLORS.textSecondary, marginTop: 3 },
  availCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.card, margin: 16, borderRadius: 12, padding: 16, elevation: 2 },
  availLabel: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  availSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  section: { marginHorizontal: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  detailCard: { backgroundColor: COLORS.card, borderRadius: 12, overflow: 'hidden', elevation: 2 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  detailIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primary + '15', alignItems: 'center', justifyContent: 'center' },
  detailLabel: { fontSize: 11, color: COLORS.textSecondary },
  detailValue: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginTop: 1 },
  editBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: COLORS.primary, marginHorizontal: 16, marginTop: 8, marginBottom: 8, borderRadius: 12, padding: 14 },
  editBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginHorizontal: 16, marginTop: 4, padding: 14 },
  logoutText: { color: '#E74C3C', fontWeight: '600', fontSize: 15 },
  modal: { flex: 1, backgroundColor: COLORS.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary },
  inputLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: COLORS.card, borderRadius: 10, padding: 14, fontSize: 15, color: COLORS.textPrimary, borderWidth: 1, borderColor: COLORS.border },
  skillGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  skillChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.card },
  skillChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  skillChipText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
  skillChipTextActive: { color: '#fff' },
  saveBtn: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  verifyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginHorizontal: 16, marginBottom: 12 },
  verifyChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  verifyChipGreen: { backgroundColor: '#d4edda', borderColor: '#c3e6cb' },
  verifyChipAmber: { backgroundColor: '#fff3cd', borderColor: '#ffc107' },
  verifyChipGrey: { backgroundColor: COLORS.card, borderColor: COLORS.border },
  verifyChipText: { fontSize: 12, fontWeight: '600', color: '#155724' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginHorizontal: 16, marginTop: 4, padding: 12 },
  deleteText: { color: '#999', fontSize: 13 },
});
