import { Linking, Alert } from 'react-native';

export async function openWhatsApp(phone: string, message?: string): Promise<void> {
  const cleanPhone = phone.replace(/\D/g, '');
  const defaultMessage = message || 'Hi, I found you on Chowk app.';
  const encodedMessage = encodeURIComponent(defaultMessage);
  const url = `https://wa.me/91${cleanPhone}?text=${encodedMessage}`;

  const supported = await Linking.canOpenURL(url);
  if (supported) {
    await Linking.openURL(url);
  } else {
    Alert.alert('WhatsApp not installed', 'Please install WhatsApp to contact this person.');
  }
}
