import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, Modal, ScrollView, SafeAreaView,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SKILLS, SKILL_LABELS, SKILL_EMOJIS, AP_CITIES } from '../../lib/config';
import { getJobs, applyToJob } from '../../lib/api';
import { useAuthStore } from '../../store/auth';
import type { Job } from '../../lib/types';

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff < 7) return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function slotsLeft(job: Job) {
  return Math.max(0, job.required_count - job.confirmed_count);
}

export default function JobFeed() {
  const { profile } = useAuthStore();
  const qc = useQueryClient();
  const [city, setCity] = useState<string>(profile?.city ?? '');
  const [skill, setSkill] = useState<string | null>(null);
  const [cityModal, setCityModal] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['jobs', skill, city],
    queryFn: () => getJobs({ skill: skill ?? undefined, city: city || undefined }).then(r => r.data),
  });

  const jobs: Job[] = data?.items ?? [];

  const applyMutation = useMutation({
    mutationFn: (job_id: string) => applyToJob(job_id),
    onMutate: (job_id) => setApplyingId(job_id),
    onSettled: () => setApplyingId(null),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
    onError: (e: any) => {
      const msg = e?.response?.data?.detail ?? 'Could not apply. Try again.';
      alert(msg);
    },
  });

  return (
    <View style={styles.container}>
      {/* City + skill header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.cityBtn} onPress={() => setCityModal(true)}>
          <Ionicons name="location" size={15} color={COLORS.primary} />
          <Text style={styles.cityText}>{city || 'All Cities'}</Text>
          <Ionicons name="chevron-down" size={14} color={COLORS.textSecondary} />
        </TouchableOpacity>
        {city ? (
          <TouchableOpacity onPress={() => setCity('')} style={styles.clearCity}>
            <Text style={styles.clearCityText}>Show all</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        style={styles.filterScroll} contentContainerStyle={styles.filterContent}
      >
        <TouchableOpacity
          style={[styles.chip, !skill && styles.chipActive]}
          onPress={() => setSkill(null)}
        >
          <Text style={[styles.chipText, !skill && styles.chipTextActive]}>All Skills</Text>
        </TouchableOpacity>
        {SKILLS.map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.chip, skill === s && styles.chipActive]}
            onPress={() => setSkill(skill === s ? null : s)}
          >
            <Text style={[styles.chipText, skill === s && styles.chipTextActive]}>
              {SKILL_EMOJIS[s]} {SKILL_LABELS[s]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={jobs}
        keyExtractor={j => j.job_id}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[COLORS.primary]} />}
        contentContainerStyle={{ padding: 14, gap: 12, paddingBottom: 24 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            {isLoading
              ? <Text style={styles.emptyText}>Loading jobs...</Text>
              : <>
                  <Text style={styles.emptyIcon}>🔍</Text>
                  <Text style={styles.emptyTitle}>No jobs right now</Text>
                  <Text style={styles.emptyText}>
                    {city ? `No open jobs in ${city}. Try "Show all".` : 'Check back later or try a different skill.'}
                  </Text>
                </>
            }
          </View>
        }
        renderItem={({ item }) => {
          const slots = slotsLeft(item);
          const isApplying = applyingId === item.job_id;
          const emoji = SKILL_EMOJIS[item.skill as keyof typeof SKILL_EMOJIS] ?? '🔨';
          return (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.skillBadge}>
                  <Text style={styles.skillEmoji}>{emoji}</Text>
                  <Text style={styles.skillLabel}>{SKILL_LABELS[item.skill as keyof typeof SKILL_LABELS] ?? item.skill}</Text>
                </View>
                <View style={[styles.slotBadge, slots === 0 && styles.slotBadgeFull]}>
                  <Text style={[styles.slotText, slots === 0 && styles.slotTextFull]}>
                    {slots === 0 ? 'Filled' : `${slots} slot${slots > 1 ? 's' : ''} left`}
                  </Text>
                </View>
              </View>

              <Text style={styles.location} numberOfLines={1}>
                <Ionicons name="location-outline" size={12} color={COLORS.textSecondary} /> {item.location}
              </Text>

              <View style={styles.cardMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name="calendar-outline" size={13} color={COLORS.textSecondary} />
                  <Text style={styles.metaText}>{formatDate(item.job_date)}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="cash-outline" size={13} color={COLORS.textSecondary} />
                  <Text style={styles.metaText}>₹{item.rate}/day</Text>
                </View>
                {item.contractor?.name ? (
                  <View style={styles.metaItem}>
                    <Ionicons name="person-outline" size={13} color={COLORS.textSecondary} />
                    <Text style={styles.metaText} numberOfLines={1}>{item.contractor.name}</Text>
                  </View>
                ) : null}
              </View>

              {slots > 0 && (
                <TouchableOpacity
                  style={[styles.applyBtn, isApplying && { opacity: 0.6 }]}
                  onPress={() => applyMutation.mutate(item.job_id)}
                  disabled={isApplying}
                  activeOpacity={0.85}
                >
                  <Text style={styles.applyBtnText}>{isApplying ? 'Applying…' : 'Apply Now'}</Text>
                  <Ionicons name="arrow-forward" size={15} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />

      {/* City picker modal */}
      <Modal visible={cityModal} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setCityModal(false)} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Select City</Text>
          <ScrollView>
            <TouchableOpacity
              style={[styles.cityOption, !city && styles.cityOptionActive]}
              onPress={() => { setCity(''); setCityModal(false); }}
            >
              <Text style={[styles.cityOptionText, !city && styles.cityOptionTextActive]}>All Cities</Text>
              {!city && <Ionicons name="checkmark" size={18} color={COLORS.primary} />}
            </TouchableOpacity>
            {AP_CITIES.map(c => (
              <TouchableOpacity
                key={c}
                style={[styles.cityOption, city === c && styles.cityOptionActive]}
                onPress={() => { setCity(c); setCityModal(false); }}
              >
                <Text style={[styles.cityOptionText, city === c && styles.cityOptionTextActive]}>{c}</Text>
                {city === c && <Ionicons name="checkmark" size={18} color={COLORS.primary} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  cityBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cityText: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  clearCity: { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: COLORS.background, borderRadius: 8 },
  clearCityText: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  filterScroll: { maxHeight: 50, backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  filterContent: { paddingHorizontal: 12, paddingVertical: 8, gap: 8, alignItems: 'center' },
  chip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  empty: { alignItems: 'center', paddingTop: 72 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 6 },
  emptyText: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', paddingHorizontal: 32 },
  card: {
    backgroundColor: COLORS.card, borderRadius: 14,
    padding: 16, borderWidth: 1, borderColor: COLORS.border,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  skillBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  skillEmoji: { fontSize: 18 },
  skillLabel: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
  slotBadge: { backgroundColor: '#E8F5E9', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  slotBadgeFull: { backgroundColor: '#F5F5F5' },
  slotText: { fontSize: 11, fontWeight: '700', color: '#2E7D32' },
  slotTextFull: { color: COLORS.textSecondary },
  location: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 10 },
  cardMeta: { flexDirection: 'row', gap: 14, flexWrap: 'wrap', marginBottom: 14 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  applyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 11,
  },
  applyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: {
    backgroundColor: COLORS.card, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, maxHeight: '65%',
  },
  modalHandle: { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 12 },
  cityOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  cityOptionActive: {},
  cityOptionText: { fontSize: 15, color: COLORS.textPrimary },
  cityOptionTextActive: { color: COLORS.primary, fontWeight: '700' },
});
