import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { COLORS } from '../../lib/config';

export default function RoleScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoLetter}>C</Text>
          </View>
          <Text style={styles.heading}>Who are you?</Text>
          <Text style={styles.subheading}>
            Tell us how you'll use Chowk so we can set up your account
          </Text>
        </View>

        <View style={styles.cardsContainer}>
          <TouchableOpacity
            style={styles.roleCard}
            onPress={() => router.push('/(setup)/worker-profile')}
            activeOpacity={0.85}
          >
            <Text style={styles.roleEmoji}>👷</Text>
            <Text style={styles.roleTitle}>I'm looking for work</Text>
            <Text style={styles.roleDescription}>
              Find daily wage jobs near you. Connect with contractors who need your skills.
            </Text>
            <View style={styles.roleTag}>
              <Text style={styles.roleTagText}>Worker</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleCard, styles.contractorCard]}
            onPress={() => router.push('/(setup)/contractor-profile')}
            activeOpacity={0.85}
          >
            <Text style={styles.roleEmoji}>🏗️</Text>
            <Text style={[styles.roleTitle, styles.contractorTitle]}>I need workers</Text>
            <Text style={[styles.roleDescription, styles.contractorDescription]}>
              Post jobs and hire skilled daily wage workers quickly and reliably.
            </Text>
            <View style={[styles.roleTag, styles.contractorTag]}>
              <Text style={[styles.roleTagText, styles.contractorTagText]}>Contractor</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoLetter: {
    fontSize: 30,
    fontWeight: '800',
    color: '#fff',
  },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subheading: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  cardsContainer: {
    gap: 16,
  },
  roleCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  contractorCard: {
    borderColor: COLORS.secondary,
    shadowColor: COLORS.secondary,
  },
  roleEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 8,
  },
  contractorTitle: {
    color: COLORS.secondary,
  },
  roleDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  contractorDescription: {},
  roleTag: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  contractorTag: {
    backgroundColor: COLORS.secondary,
  },
  roleTagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  contractorTagText: {},
});
