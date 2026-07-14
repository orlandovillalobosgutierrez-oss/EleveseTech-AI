import { ViewStyle } from 'react-native';
import type { ReportZone } from '../types/report';

// ─── Colors ────────────────────────────────────────────────────────────────

export const Colors = {
  primary: '#1A3A5C',
  secondary: '#E87500',
  success: '#2E7D32',
  error: '#C62828',
  warning: '#F57F17',
  background: '#F5F5F5',
  surface: '#FFFFFF',
  surfaceVariant: '#E8EDF2',
  text: '#212121',
  textSecondary: '#757575',
  textOnPrimary: '#FFFFFF',
  border: '#D0D0D0',
  zoneColors: {
    machine_room_control: '#1565C0',
    machine_room_motor: '#2E7D32',
    shaft_rails: '#6A1B9A',
    floor_doors: '#E65100',
    pit: '#37474F',
  } as Record<ReportZone, string>,
} as const;

// ─── Typography ────────────────────────────────────────────────────────────

export const Typography = {
  fontSizes: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  } as const,
  fontWeights: {
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
} as const;

// ─── Spacing ───────────────────────────────────────────────────────────────

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

// ─── Shadows (iOS shadow + Android elevation) ──────────────────────────────

export const Shadows: Record<'small' | 'medium' | 'large', ViewStyle> = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};

// ─── Border Radius ─────────────────────────────────────────────────────────

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

// ─── Aliases (lowercase for convenience) ────────────────────────────────────

export const colors = Colors;
export const typography = Typography;
export const spacing = Spacing;
export const shadows = Shadows;
export const borderRadius = BorderRadius;
