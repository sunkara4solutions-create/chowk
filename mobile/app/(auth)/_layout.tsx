import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen name="phone" options={{ headerShown: false }} />
      <Stack.Screen
        name="otp"
        options={{
          headerShown: true,
          title: 'Verify OTP',
          headerBackTitle: 'Back',
        }}
      />
    </Stack>
  );
}
