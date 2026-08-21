export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';

export const SKILLS = [
  'painter',
  'mason',
  'electrician',
  'plumber',
  'carpenter',
  'welder',
  'tiles_worker',
  'helper',
  'construction_laborer',
] as const;

export type Skill = (typeof SKILLS)[number];

export const SKILL_LABELS: Record<Skill, string> = {
  painter: 'Painter',
  mason: 'Mason',
  electrician: 'Electrician',
  plumber: 'Plumber',
  carpenter: 'Carpenter',
  welder: 'Welder',
  tiles_worker: 'Tiles Worker',
  helper: 'Helper',
  construction_laborer: 'Construction Laborer',
};

export const COLORS = {
  primary: '#E85C1A',
  secondary: '#1C1C2E',
  success: '#27AE60',
  warning: '#F5A623',
  background: '#F8F9FA',
  card: '#FFFFFF',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
};

export const SKILL_EMOJIS: Record<Skill, string> = {
  painter: '🎨',
  mason: '🧱',
  electrician: '⚡',
  plumber: '🔧',
  carpenter: '🪵',
  welder: '🔥',
  tiles_worker: '🪟',
  helper: '👷',
  construction_laborer: '🏗️',
};

export const AP_CITIES = [
  // Chittoor district
  'Palamaner', 'Chittoor', 'Tirupati', 'Madanapalle', 'Puttur',
  'Srikalahasti', 'Nagari', 'Kuppam', 'Punganur', 'Piler',
  // Rest of AP
  'Vijayawada', 'Guntur', 'Visakhapatnam', 'Kakinada',
  'Rajahmundry', 'Kurnool', 'Nellore', 'Kadapa', 'Anantapur',
  'Eluru', 'Ongole', 'Nandyal', 'Tenali', 'Machilipatnam',
];

export const DEFAULT_REGION = {
  latitude: 16.3066,
  longitude: 80.4365,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};
