import { Stack } from 'expo-router';
import { COLORS } from '../../lib/config';

export default function SetupLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.background },
        headerTintColor: COLORS.textPrimary,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="role" options={{ headerShown: false }} />
      <Stack.Screen name="worker-profile" options={{ title: 'Worker Profile', headerBackTitle: 'Back' }} />
      <Stack.Screen name="contractor-profile" options={{ title: 'Contractor Profile', headerBackTitle: 'Back' }} />
      <Stack.Screen name="whatsapp-choice" options={{ title: '', headerBackVisible: false }} />
      <Stack.Screen name="aadhaar" options={{ title: 'Verify Aadhaar', headerBackTitle: 'Back' }} />
    </Stack>
  );
}
