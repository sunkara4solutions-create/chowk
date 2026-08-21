import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { getJobs, applyToJob } from '../../../lib/api';
import { COLORS, SKILL_LABELS } from '../../../lib/config';
import { openWhatsApp } from '../../../lib/whatsapp';
import type { Job } from '../../../lib/types';

export default function JobDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const qc = useQueryClient();

  const { data: jobsData } = useQuery({
    queryKey: ['jobs', null],
    queryFn: () => import('../../../lib/api').then(m => m.getJobs().then(r => r.data)),
  });
  const job: Job | undefined = jobsData?.items?.find((j: Job) => j.job_id === id);

  const applyMutation = useMutation({
    mutationFn: () => applyToJob(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applications'] });
      Alert.alert('Applied!', 'You have successfully applied for this job.');
    },
    onError: (e: any) => {
      Alert.alert('Error', e.response?.data?.detail ?? 'Failed to apply');
    },
  });

  if (!job) {
    return (
      <View style={styles.center}>
        <Text style={styles.loading}>Loading...</Text>
      </View>
    );
  }

  const fillPct = job.required_count > 0 ? (job.confirmed_count / job.required_count) * 100 : 0;
  const dateStr = new Date(job.job_date).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
      </TouchableOpacity>

      <View style={styles.card}>
        <Text style={styles.skill}>
          {SKILL_LABELS[job.skill as keyof typeof SKILL_LABELS] ?? job.skill}
        </Text>

        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.infoText}>{job.location}, {job.city}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.infoText}>{dateStr}</Text>
        </View>
        {job.start_time && (
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.infoText}>Starts at {job.start_time}</Text>
          </View>
        )}

        <View style={styles.rateBox}>
          <Text style={styles.rateLabel}>Daily Rate</Text>
          <Text style={styles.rate}>₹{job.rate}</Text>
        </View>

        <View style={styles.fillSection}>
          <Text style={styles.fillLabel}>{job.confirmed_count} of {job.required_count} workers filled</Text>
          <View style={styles.fillBar}>
            <View style={[styles.fillProgress, { width: `${fillPct}%` as any }]} />
          </View>
        </View>

        {job.contractor && (
          <View style={styles.contractorBox}>
            <Text style={styles.contractorLabel}>Posted by</Text>
            <View style={styles.contractorRow}>
              <Text style={styles.contractorName}>{job.contractor.name}</Text>
              <TouchableOpacity
                style={styles.waBtn}
                onPress={() => openWhatsApp(job.contractor!.phone, `Hi, I saw your job posting for ${SKILL_LABELS[job.skill as keyof typeof SKILL_LABELS] ?? job.skill} on Chowk`)}
              >
                <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
                <Text style={styles.waBtnText}>WhatsApp</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {job.status === 'open' && (
        <TouchableOpacity
          style={[styles.applyBtn, applyMutation.isPending && styles.applyBtnDisabled]}
          onPress={() => applyMutation.mutate()}
          disabled={applyMutation.isPending}
        >
          <Text style={styles.applyBtnText}>
            {applyMutation.isPending ? 'Applying...' : '✅  Apply for this Job'}
          </Text>
        </TouchableOpacity>
      )}
      {job.status === 'filled' && (
        <View style={styles.filledBox}>
          <Text style={styles.filledText}>This job is fully filled</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loading: { color: COLORS.textSecondary },
  back: { marginBottom: 12 },
  card: { backgroundColor: COLORS.card, borderRadius: 16, padding: 18, marginBottom: 16 },
  skill: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 14 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  infoText: { fontSize: 14, color: COLORS.textSecondary },
  rateBox: { backgroundColor: COLORS.primary + '12', borderRadius: 10, padding: 14, marginTop: 12, marginBottom: 12 },
  rateLabel: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 2 },
  rate: { fontSize: 28, fontWeight: '800', color: COLORS.primary },
  fillSection: { marginBottom: 16 },
  fillLabel: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 6 },
  fillBar: { height: 6, backgroundColor: COLORS.border, borderRadius: 3 },
  fillProgress: { height: 6, backgroundColor: COLORS.success, borderRadius: 3 },
  contractorBox: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 14 },
  contractorLabel: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 6 },
  contractorRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  contractorName: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  waBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#25D36618', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  waBtnText: { color: '#25D366', fontWeight: '700', fontSize: 13 },
  applyBtn: { backgroundColor: COLORS.primary, borderRadius: 14, padding: 18, alignItems: 'center' },
  applyBtnDisabled: { opacity: 0.6 },
  applyBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  filledBox: { backgroundColor: COLORS.textSecondary + '18', borderRadius: 14, padding: 18, alignItems: 'center' },
  filledText: { color: COLORS.textSecondary, fontWeight: '600' },
});
