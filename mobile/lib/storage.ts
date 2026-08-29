import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'chowk_token';
const ROLE_KEY = 'chowk_role';

export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  return await SecureStore.getItemAsync(TOKEN_KEY);
}

export async function removeToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function saveRole(role: string): Promise<void> {
  await SecureStore.setItemAsync(ROLE_KEY, role);
}

export async function getRole(): Promise<string | null> {
  return await SecureStore.getItemAsync(ROLE_KEY);
}

export async function removeAll(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(ROLE_KEY);
}

const ONBOARDING_KEY = 'chowk_onboarding_seen';

export async function hasSeenOnboarding(): Promise<boolean> {
  return !!(await SecureStore.getItemAsync(ONBOARDING_KEY));
}

export async function markOnboardingSeen(): Promise<void> {
  await SecureStore.setItemAsync(ONBOARDING_KEY, '1');
}
