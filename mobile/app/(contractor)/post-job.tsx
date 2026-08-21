import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { postJob } from '../../lib/api';
import { COLORS, SKILLS, SKILL_LABELS } from '../../lib/config';

const TOMORROW = new Date(Date.now() + 86400000).toISOString().split('T')[0];

export default function PostJob() {
  const qc = useQueryClient();
  const [skill, setSkill] = useState('');
  const [count, setCount] = useState('');
  const [date, setDate] = useState(TOMORROW);
  const [rate, setRate] = useState('');
  const [location, setLocation] = useState('');
  const [city, setCity] = useState('');
  const [startTime, setStartTime] = useState('');

  const mutation = useMutation({
    mutationFn: () => {
      if (!skill || !count || !date || !rate || !location || !city) {
        throw new Error('Please fill all required fields');
      }
      return postJob({
        skill,
        required_count: parseInt(count),
        job_date: date,
        rate: parseInt(rate),
        location,
        city,
        start_time: startTime || undefined,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contractor-jobs'] });
      Alert.alert('Job Posted!', 'Matching workers will be notified shortly.', [
        { text: 'OK', onPress: () => router.push('/(contractor)') },
      ]);
    },
    onError: (e: any) => {
      Alert.alert('Error', e.message || e.response?.data?.detail || 'Failed to post job');
    },
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

      <Text style={styles.sectionLabel}>Skill Required *</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.skillScroll} contentContainerStyle={{ gap: 8 }}>
        {SKILLS.map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.skillChip, skill === s && styles.skillChipActive]}
            onPress={() => setSkill(s)}
          >
            <Text style={[styles.skillChipText, skill === s && styles.skillChipTextActive]}>
              {SKILL_LABELS[s]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.label}>Number of Workers *</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 5"
        value={count}
        onChangeText={setCount}
        keyboardType="numeric"
        placeholderTextColor={COLORS.textSecondary}
      />

      <Text style={styles.label}>Date (YYYY-MM-DD) *</Text>
      <TextInput
        style={styles.input}
        placeholder={TOMORROW}
        value={date}
        onChangeText={setDate}
        placeholderTextColor={COLORS.textSecondary}
      />

      <Text style={styles.label}>Daily Rate (₹) *</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 800"
        value={rate}
        onChangeText={setRate}
        keyboardType="numeric"
        placeholderTextColor={COLORS.textSecondary}
      />

      <Text style={styles.label}>Site Location / Address *</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Near Kanaka Durga Temple, Vijayawada"
        value={location}
        onChangeText={setLocation}
        placeholderTextColor={COLORS.textSecondary}
      />

      <Text style={styles.label}>City *</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Vijayawada"
        value={city}
        onChangeText={setCity}
        placeholderTextColor={COLORS.textSecondary}
      />

      <Text style={styles.label}>Start Time (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 08:00"
        value={startTime}
        onChangeText={setStartTime}
        placeholderTextColor={COLORS.textSecondary}
      />

      {skill && count && date && rate && location && city && (
        <View style={styles.preview}>
          <Text style={styles.previewTitle}>Preview</Text>
          <Text style={styles.previewText}>
            {count} {SKILL_LABELS[skill as keyof typeof SKILL_LABELS]} workers needed in {city}
          </Text>
          <Text style={styles.previewText}>Date: {date} · Rate: ₹{rate}/day</Text>
          {startTime && <Text style={styles.previewText}>Start: {startTime}</Text>}
        </View>
      )}

      <TouchableOpacity
        style={[styles.submitBtn, mutation.isPending && { opacity: 0.6 }]}
        onPress={() => mutation.mutate()}
        disabled={mutation.isPending}
      >
        <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
        <Text style={styles.submitText}>{mutation.isPending ? 'Posting...' : 'Post Job'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 40 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  skillScroll: { marginBottom: 16 },
  skillChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.card },
  skillChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  skillChipText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
  skillChipTextActive: { color: '#fff' },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: COLORS.card, borderRadius: 10, padding: 14, fontSize: 15, color: COLORS.textPrimary, borderWidth: 1, borderColor: COLORS.border },
  preview: { backgroundColor: COLORS.secondary + '10', borderRadius: 12, padding: 14, marginTop: 20, borderLeftWidth: 3, borderLeftColor: COLORS.primary },
  previewTitle: { fontSize: 12, fontWeight: '700', color: COLORS.primary, marginBottom: 6, textTransform: 'uppercase' },
  previewText: { fontSize: 14, color: COLORS.textPrimary, marginBottom: 2 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primary, borderRadius: 14, padding: 18, marginTop: 24 },
  submitText: { color: '#fff', fontSize: 17, fontWeight: '800' },
});
