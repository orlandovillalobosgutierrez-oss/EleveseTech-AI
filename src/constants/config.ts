import type { ReportZone } from '../types/report';

// ─── API ───────────────────────────────────────────────────────────────────

export const API_BASE_URL: string = 'https://api.elevese.com/v1';

// ─── Gemini Vision ─────────────────────────────────────────────────────────

export const GEMINI_VISION_ENDPOINT: string =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export const GEMINI_API_KEY: string = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

// ─── Webhook ───────────────────────────────────────────────────────────────

export const WEBHOOK_URL: string = '';

// ─── Photo / Media ─────────────────────────────────────────────────────────

export const MAX_PHOTOS_PER_REPORT: number = 25;
export const PHOTO_COMPRESSION_QUALITY: number = 0.5;
export const PHOTO_MAX_WIDTH: number = 1920;
export const PHOTO_MAX_HEIGHT: number = 1920;

// ─── Sync ──────────────────────────────────────────────────────────────────

export const SYNC_RETRY_MAX: number = 5;
export const SYNC_RETRY_BASE_DELAY_MS: number = 2000;

// ─── Report Zone Labels (Spanish) ──────────────────────────────────────────

export const REPORT_ZONE_LABELS: Record<ReportZone, string> = {
  machine_room_control: 'Cuarto de Máquinas / Control',
  machine_room_motor: 'Cuarto de Máquinas / Motor',
  shaft_rails: 'Cubo / Rieles',
  floor_doors: 'Puertas de Piso y Cabina',
  pit: 'Fosa / Pozo',
};
