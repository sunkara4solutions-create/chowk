import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { getJobApplicants, updateApplication } from '../../../lib/api';
import { COLORS, SKILL_LABELS } from '../../../lib/config';
import { openWhatsApp } from '../../../lib/whatsapp';
import type { Applicant } from '../../../lib/types';

export default function ContractorJobDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const qc = useQueryClient();

  const { data: applicants = [], isLoading } = useQuery<Applicant[]>({
    queryKey: ['applicants', id],
    queryFn: () => getJobApplicants(id!).then(r => r.data),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: ({ appId, status }: { appId: string; status: 'accepted' | 'rejected' }) =>
      updateApplication(appId, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['applicants', id] }),
    onError: (e: any) => Alert.alert('Error', e.response?.data?.detail ?? 'Failed to update'),
  });

  const pending = applicants.filter(a => a.status === 'pending');
  const accepted = applicants.filter(a => a.status === 'accepted');

  const renderApplicant = ({ item }: { item: Applicant }) => {
    const initials = item.worker.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    return (
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.workerName}>{item.worker.name}</Text>
            <Text style={styles.workerMeta}>
              {(item.worker.skills ?? []).map(s => SKILL_LABELS[s as keyof typeof SKILL_LABELS] ?? s).join(', ')}
            </Text>
            <Text style={styles.workerMeta}>
              {item.worker.experience}yr exp · ₹{item.worker.daily_rate}/day · {item.worker.city}
            </Text>
          </View>
        </View>

        {item.status === 'pending' ? (
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.acceptBtn}
              onPress={() => updateMutation.mutate({ appId: item.application_id, status: 'accepted' })}
            >
              <Ionicons name="checkmark" size={16} color="#fff" />
              <Text style={styles.acceptText}>Hire</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.rejectBtn}
              onPress={() => updateMutation.mutate({ appId: item.application_id, status: 'rejected' })}
            >
              <Ionicons name="close" size={16} color="#E74C3C" />
              <Text style={styles.rejectText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.waBtn}
              onPress={() => openWhatsApp(item.worker.phone)}
            >
              <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.acceptedRow}>
            <View style={[styles.statusBadge, item.status === 'accepted' ? styles.acceptedBadge : styles.rejectedBadge]}>
              <Text style={[styles.statusBadgeText, { color: item.status === 'accepted' ? COLORS.success : '#E74C3C' }]}>
                {item.status === 'accepted' ? '✓ Hired' : '✗ Rejected'}
              </Text>
            </View>
            {item.status === 'accepted' && (
              <TouchableOpacity style={styles.waBtn} onPress={() => openWhatsApp(item.worker.phone)}>
                <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        <Text style={styles.backText}>Back to Dashboard</Text>
      </TouchableOpacity>

      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          {pending.length} pending · {accepted.length} hired
        </Text>
      </View>

      <FlatList
        data={applicants}
        keyExtractor={a => a.application_id}
        renderItem={renderApplicant}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>👷</Text>
            <Text style={styles.emptyText}>{isLoading ? 'Loading...' : 'No applications yet'}</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 16 },
  backText: { fontSize: 15, color: COLORS.textPrimary, fontWeight: '600' },
  summary: { backgroundColor: COLORS.card, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  summaryText: { fontSize: 13, color: COLORS.textSecondary },
  card: { backgroundColor: COLORS.card, borderRadius: 12, padding: 14, marginHorizontal: 16, marginVertical: 6, elevation: 2 },
  cardRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.secondary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  info: { flex: 1 },
  workerName: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  workerMeta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8 },
  acceptBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: COLORS.success, borderRadius: 8, padding: 10 },
  acceptText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: '#E74C3C18', borderRadius: 8, padding: 10 },
  rejectText: { color: '#E74C3C', fontWeight: '700', fontSize: 14 },
  waBtn: { width: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: '#25D36615', borderRadius: 8 },
  acceptedRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusBadge: { flex: 1, alignItems: 'center', padding: 8, borderRadius: 8 },
  acceptedBadge: { backgroundColor: COLORS.success + '18' },
  rejectedBadge: { backgroundColor: '#E74C3C18' },
  statusBadgeText: { fontWeight: '700', fontSize: 13 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 36, marginBottom: 10 },
  emptyText: { fontSize: 15, color: COLORS.textSecondary, fontWeight: '600' },
});
