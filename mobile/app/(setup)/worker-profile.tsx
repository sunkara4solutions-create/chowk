import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { COLORS, SKILLS, SKILL_LABELS } from '../../lib/config';
import { registerWorker, updateWorkerLocation } from '../../lib/api';
import { useAuthStore } from '../../store/auth';

export default function WorkerProfileScreen() {
  const [name, setName] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [city, setCity] = useState('');
  const [experience, setExperience] = useState('');
  const [dailyRate, setDailyRate] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleRegister = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter your full name.');
      return;
    }
    if (selectedSkills.length === 0) {
      Alert.alert('Required', 'Please select at least one skill.');
      return;
    }
    if (!city.trim()) {
      Alert.alert('Required', 'Please enter your city.');
      return;
    }
    if (!experience || isNaN(Number(experience))) {
      Alert.alert('Required', 'Please enter your years of experience.');
      return;
    }
    if (!dailyRate || isNaN(Number(dailyRate))) {
      Alert.alert('Required', 'Please enter your daily rate.');
      return;
    }

    setLoading(true);
    try {
      const response = await registerWorker({
        name: name.trim(),
        skills: selectedSkills,
        city: city.trim(),
        experience: Number(experience),
        daily_rate: Number(dailyRate),
      });
      const { access_token, role, profile } = response.data;
      await setAuth(access_token, role, profile);

      // Capture GPS and verify it matches the entered city
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          const geo = await Location.reverseGeocodeAsync(loc.coords);
          const geocodedCity = [geo[0]?.city, geo[0]?.district, geo[0]?.subregion]
            .filter(Boolean).join(' ').toLowerCase();
          const profileCity = city.trim().toLowerCase();
          const cityMatch = profileCity.split(' ').some(w => w.length > 2 && geocodedCity.includes(w));
          await updateWorkerLocation(loc.coords.latitude, loc.coords.longitude, cityMatch);
        }
      } catch {}

      router.replace('/(setup)/whatsapp-choice');
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Registration failed. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Set up your Worker profile</Text>
        <Text style={styles.subheading}>This helps contractors find and hire you</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Raju Verma"
            placeholderTextColor={COLORS.textSecondary}
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Your Skills *</Text>
          <Text style={styles.helperText}>Select all skills that apply</Text>
          <View style={styles.skillsGrid}>
            {SKILLS.map((skill) => {
              const selected = selectedSkills.includes(skill);
              return (
                <TouchableOpacity
                  key={skill}
                  style={[styles.skillChip, selected && styles.skillChipSelected]}
                  onPress={() => toggleSkill(skill)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.skillChipText, selected && styles.skillChipTextSelected]}>
                    {SKILL_LABELS[skill]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>City *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Guntur"
            placeholderTextColor={COLORS.textSecondary}
            value={city}
            onChangeText={setCity}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.field, styles.halfField]}>
            <Text style={styles.label}>Experience (years) *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 5"
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="numeric"
              value={experience}
              onChangeText={setExperience}
            />
          </View>
          <View style={[styles.field, styles.halfField]}>
            <Text style={styles.label}>Daily Rate (₹) *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 600"
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="numeric"
              value={dailyRate}
              onChangeText={setDailyRate}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.registerButton, loading && styles.registerButtonDisabled]}
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.registerButtonText}>Create Worker Profile</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 16,
  },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  subheading: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 28,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.card,
    minHeight: 48,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
    marginBottom: 20,
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  skillChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skillChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  skillChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  skillChipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  registerButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});
