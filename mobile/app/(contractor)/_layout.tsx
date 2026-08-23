import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../lib/config';

export default function ContractorLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: { backgroundColor: COLORS.card, borderTopColor: COLORS.border, height: 56 + insets.bottom, paddingBottom: insets.bottom || 8 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerStyle: { backgroundColor: COLORS.background },
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '700', color: COLORS.textPrimary },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} />,
          headerTitle: 'My Jobs',
        }}
      />
      <Tabs.Screen
        name="post-job"
        options={{
          title: 'Post Job',
          tabBarIcon: ({ color, size }) => <Ionicons name="add-circle-outline" size={size} color={color} />,
          headerTitle: 'Post a Job',
        }}
      />
      <Tabs.Screen
        name="workers"
        options={{
          title: 'Workers',
          tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} />,
          headerTitle: 'Find Workers',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
          headerTitle: 'My Profile',
        }}
      />
      <Tabs.Screen name="job/[id]" options={{ href: null }} />
    </Tabs>
  );
}
