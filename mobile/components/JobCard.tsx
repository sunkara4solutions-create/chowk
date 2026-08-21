import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SKILL_LABELS } from '../lib/config';
import type { Job } from '../lib/types';

interface Props {
  job: Job;
  onPress: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  open: COLORS.success,
  filled: COLORS.textSecondary,
  cancelled: '#E74C3C',
  closed: '#E74C3C',
  completed: COLORS.textSecondary,
};

export default function JobCard({ job, onPress }: Props) {
  const fillPct = job.required_count > 0
    ? Math.round((job.confirmed_count / job.required_count) * 100)
    : 0;

  const dateStr = new Date(job.job_date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', weekday: 'short',
  });

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.header}>
        <View style={styles.skillRow}>
          <View style={[styles.skillDot, { backgroundColor: COLORS.primary }]} />
          <Text style={styles.skill}>
            {SKILL_LABELS[job.skill as keyof typeof SKILL_LABELS] ?? job.skill}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: STATUS_COLORS[job.status] + '20' }]}>
          <Text style={[styles.badgeText, { color: STATUS_COLORS[job.status] }]}>
            {job.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.row}>
        <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} />
        <Text style={styles.meta}>{job.location}, {job.city}</Text>
      </View>
      <View style={styles.row}>
        <Ionicons name="calendar-outline" size={14} color={COLORS.textSecondary} />
        <Text style={styles.meta}>{dateStr}</Text>
        {job.start_time && (
          <Text style={styles.meta}> · {job.start_time}</Text>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.rate}>₹{job.rate}<Text style={styles.perDay}>/day</Text></Text>
        <View style={styles.fillWrap}>
          <Text style={styles.fillText}>{job.confirmed_count}/{job.required_count} filled</Text>
          <View style={styles.fillBar}>
            <View style={[styles.fillProgress, { width: `${fillPct}%` as any }]} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  skillRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  skillDot: { width: 8, height: 8, borderRadius: 4 },
  skill: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 },
  meta: { fontSize: 13, color: COLORS.textSecondary },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 10 },
  rate: { fontSize: 20, fontWeight: '800', color: COLORS.primary },
  perDay: { fontSize: 13, fontWeight: '400', color: COLORS.textSecondary },
  fillWrap: { alignItems: 'flex-end', gap: 3 },
  fillText: { fontSize: 12, color: COLORS.textSecondary },
  fillBar: { width: 80, height: 4, backgroundColor: COLORS.border, borderRadius: 2 },
  fillProgress: { height: 4, backgroundColor: COLORS.success, borderRadius: 2 },
});
