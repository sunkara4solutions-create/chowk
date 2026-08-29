import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Alert, Modal, FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { postIndividualJob } from '../../lib/api';
import { COLORS, SKILLS, SKILL_LABELS, SKILL_EMOJIS, AP_CITIES } from '../../lib/config';

const DATE_PRESETS = [
  { label: 'Today', offset: 0 },
  { label: 'Tomorrow', offset: 1 },
  { label: 'In 2 days', offset: 2 },
  { label: 'In 3 days', offset: 3 },
];

function offsetDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function PostIndividualJob() {
  const qc = useQueryClient();
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState('');
  const [skill, setSkill] = useState('');
  const [dateStr, setDateStr] = useState(offsetDate(1));
  const [rate, setRate] = useState('');
  const [location, setLocation] = useState('');
  const [city, setCity] = useState('');
  const [description, setDescription] = useState('');

  const [skillModal, setSkillModal] = useState(false);
  const [cityModal, setCityModal] = useState(false);

  const isReady = title.trim() && skill && dateStr && location.trim() && city;

  const mutation = useMutation({
    mutationFn: () => postIndividualJob({
      title: title.trim(),
      skill,
      job_date: dateStr,
      rate: rate ? parseInt(rate) : undefined,
      location: location.trim(),
      city,
      description: description.trim() || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-individual-jobs'] });
      Alert.alert('Job Posted!', 'Workers will be able to bid on your job.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: (e: any) => {
      Alert.alert('Error', e.response?.data?.detail || 'Failed to post job');
    },
  });

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title */}
        <Text style={styles.label}>What do you need done? *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Fix leaking tap in bathroom"
          value={title}
          onChangeText={setTitle}
          placeholderTextColor={COLORS.textSecondary}
        />

        {/* Skill */}
        <Text style={styles.label}>Type of work *</Text>
        <TouchableOpacity style={styles.picker} onPress={() => setSkillModal(true)}>
          <Text style={skill ? styles.pickerValue : styles.pickerPlaceholder}>
            {skill ? `${SKILL_EMOJIS[skill as keyof typeof SKILL_EMOJIS]}  ${SKILL_LABELS[skill as keyof typeof SKILL_LABELS]}` : 'Select skill needed'}
          </Text>
          <Ionicons name="chevron-down" size={18} color={COLORS.textSecondary} />
        </TouchableOpacity>

        {/* Date */}
        <Text style={styles.label}>When do you need it? *</Text>
        <View style={styles.dateRow}>
          {DATE_PRESETS.map(p => {
            const val = offsetDate(p.offset);
            return (
              <TouchableOpacity
                key={p.label}
                style={[styles.dateChip, dateStr === val && styles.dateChipActive]}
                onPress={() => setDateStr(val)}
              >
                <Text style={[styles.dateChipText, dateStr === val && styles.dateChipTextActive]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={styles.dateSub}>{formatDateLabel(dateStr)}</Text>

        {/* Location */}
        <Text style={styles.label}>Address / Location *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 12 Gandhi Nagar, near SBI ATM"
          value={location}
          onChangeText={setLocation}
          placeholderTextColor={COLORS.textSecondary}
        />

        {/* City */}
        <Text style={styles.label}>City *</Text>
        <TouchableOpacity style={styles.picker} onPress={() => setCityModal(true)}>
          <Text style={city ? styles.pickerValue : styles.pickerPlaceholder}>
            {city || 'Select city'}
          </Text>
          <Ionicons name="chevron-down" size={18} color={COLORS.textSecondary} />
        </TouchableOpacity>

        {/* Rate */}
        <Text style={styles.label}>Your budget (₹) — optional</Text>
        <TextInput
          style={styles.input}
          placeholder="Leave blank to let workers name their price"
          value={rate}
          onChangeText={t => setRate(t.replace(/\D/g, ''))}
          keyboardType="number-pad"
          placeholderTextColor={COLORS.textSecondary}
        />

        {/* Description */}
        <Text style={styles.label}>Additional details — optional</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Any extra info workers should know..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          placeholderTextColor={COLORS.textSecondary}
        />
      </ScrollView>

      {/* Submit */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={[styles.submitBtn, !isReady && styles.submitBtnDisabled]}
          onPress={() => mutation.mutate()}
          disabled={!isReady || mutation.isPending}
        >
          <Ionicons name="megaphone-outline" size={18} color="#fff" />
          <Text style={styles.submitBtnText}>
            {mutation.isPending ? 'Posting...' : 'Post Job'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Skill modal */}
      <Modal visible={skillModal} transparent animationType="slide">
        <TouchableOpacity style={styles.overlay} onPress={() => setSkillModal(false)} />
        <View style={[styles.modal, { paddingBottom: insets.bottom + 16 }]}>
          <Text style={styles.modalTitle}>Select skill needed</Text>
          <FlatList
            data={SKILLS}
            keyExtractor={s => s}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.modalItem, skill === item && styles.modalItemActive]}
                onPress={() => { setSkill(item); setSkillModal(false); }}
              >
                <Text style={styles.modalItemText}>
                  {SKILL_EMOJIS[item]}  {SKILL_LABELS[item]}
                </Text>
                {skill === item && <Ionicons name="checkmark" size={18} color={COLORS.primary} />}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      {/* City modal */}
      <Modal visible={cityModal} transparent animationType="slide">
        <TouchableOpacity style={styles.overlay} onPress={() => setCityModal(false)} />
        <View style={[styles.modal, { paddingBottom: insets.bottom + 16 }]}>
          <Text style={styles.modalTitle}>Select city</Text>
          <FlatList
            data={AP_CITIES}
            keyExtractor={c => c}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.modalItem, city === item && styles.modalItemActive]}
                onPress={() => { setCity(item); setCityModal(false); }}
              >
                <Text style={styles.modalItemText}>{item}</Text>
                {city === item && <Ionicons name="checkmark" size={18} color={COLORS.primary} />}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 4 },
  label: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary, marginTop: 16, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.card, borderRadius: 12, padding: 14,
    fontSize: 15, color: COLORS.textPrimary, borderWidth: 1, borderColor: COLORS.border,
  },
  textArea: { minHeight: 80 },
  picker: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.card, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: COLORS.border,
  },
  pickerValue: { fontSize: 15, color: COLORS.textPrimary },
  pickerPlaceholder: { fontSize: 15, color: COLORS.textSecondary },
  dateRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 6 },
  dateChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
  },
  dateChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  dateChipText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  dateChipTextActive: { color: '#fff' },
  dateSub: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.background, padding: 16,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.primary, borderRadius: 14, padding: 16,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  overlay: { flex: 1, backgroundColor: '#00000040' },
  modal: {
    backgroundColor: COLORS.card, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: '60%', paddingTop: 16,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, paddingHorizontal: 16, marginBottom: 8 },
  modalItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  modalItemActive: { backgroundColor: COLORS.primary + '10' },
  modalItemText: { fontSize: 15, color: COLORS.textPrimary },
});
