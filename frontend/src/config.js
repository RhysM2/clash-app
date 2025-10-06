// API Configuration
export const API_URL = 'http://20.77.2.142:3000/api';

// Tracker.gg inspired dark theme colors
export const COLORS = {
  // Backgrounds
  bgPrimary: '#0F1923',      // Dark navy (main background)
  bgSecondary: '#1A2332',    // Slightly lighter navy (cards)
  bgTertiary: '#232F3E',     // Card hover/accent backgrounds

  // Neon accent gradients (tracker.gg style)
  accentPurple: '#A855F7',
  accentBlue: '#3B82F6',
  accentPink: '#EC4899',
  accentCyan: '#06B6D4',

  // Text colors
  textPrimary: '#FFFFFF',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',

  // Status colors
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',

  // Borders
  borderPrimary: '#2D3748',
  borderAccent: 'rgba(168, 85, 247, 0.3)',
};

// Rarity colors with neon glow effect
export const RARITY_COLORS = {
  common: '#94A3B8',         // Gray
  rare: '#F59E0B',           // Orange
  epic: '#A855F7',           // Neon Purple
  legendary: '#FBBF24',      // Gold
  champion: '#06B6D4'        // Cyan
};

// Gradient backgrounds for stat cards
export const GRADIENTS = {
  primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  success: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
  warning: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
  danger: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
  purple: 'linear-gradient(135deg, #A855F7 0%, #9333EA 100%)',
  blue: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
  pink: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)',
  neon: 'linear-gradient(135deg, #A855F7 0%, #EC4899 50%, #3B82F6 100%)',
};

// Battle type display names
export const BATTLE_TYPES = {
  PvP: 'Ladder (PvP)',
  PathOfLegend: 'Path of Legend',
  Casual1v1: 'Casual 1v1',
  Tournament: 'Tournament'
};

// Time range options
export const TIME_RANGES = [
  { value: 'all', label: 'All Time' },
  { value: '1h', label: 'Last Hour' },
  { value: '6h', label: 'Last 6 Hours' },
  { value: '24h', label: 'Last 24 Hours' },
  { value: '3d', label: 'Last 3 Days' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '14d', label: 'Last 2 Weeks' },
  { value: '30d', label: 'Last 30 Days' }
];
