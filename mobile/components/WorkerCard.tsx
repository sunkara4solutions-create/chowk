import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SKILL_LABELS } from '../lib/config';
import { openWhatsApp } from '../lib/whatsapp';
import type { Worker } from '../lib/types';

interface Props {
  worker: Worker;
  distanceKm?: number;
}

export default function WorkerCard({ worker, distanceKm }: Props) {
  const initials = worker.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{worker.name}</Text>
            <View style={[styles.dot, { backgroundColor: worker.is_available ? COLORS.success : COLORS.textSecondary }]} />
          </View>
          <Text style={styles.meta}>
            {worker.city} · {worker.experience}yr exp · ₹{worker.daily_rate}/day
          </Text>
          {distanceKm !== undefined && (
            <Text style={styles.distance}>{distanceKm} km away</Text>
          )}
        </View>
        <TouchableOpacity style={styles.wa} onPress={() => openWhatsApp(worker.phone)}>
          <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
        </TouchableOpacity>
      </View>
      <View style={styles.skills}>
        {(worker.skills || []).map(s => (
          <View key={s} style={styles.chip}>
            <Text style={styles.chipText}>
              {SKILL_LABELS[s as keyof typeof SKILL_LABELS] ?? s}
            </Text>
          </View>
        ))}
      </View>
    </View>
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
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  dot: { width: 7, height: 7, borderRadius: 4 },
  meta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  distance: { fontSize: 12, color: COLORS.primary, marginTop: 1, fontWeight: '600' },
  wa: { padding: 6 },
  skills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  chip: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8,
  },
  chipText: { fontSize: 11, color: COLORS.primary, fontWeight: '600' },
});
