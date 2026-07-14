// ──────────────────────────────────────────────
// EleveseTech – API / Cloud-Communication Types
// ──────────────────────────────────────────────

import type { ReportMode, ReportZone } from './report';

// ── Vision API (AI photo classification) ────

export interface VisionApiRequest {
  imageBase64: string; // compressed JPEG base64
  reportMode: ReportMode;
  zones: ReportZone[]; // candidate zones the classifier considers
}

export interface VisionApiResponse {
  zone: ReportZone;
  confidence: number; // 0 – 1
}

// ── LLM API (formal report generation) ──────

export interface LLMRequest {
  mode: ReportMode;
  technicianNotes: string;
  ocrText?: string; // corrective-mode OCR result
  problemDescription?: string;
  solutionApplied?: string;
}

export interface LLMResponse {
  formalReport: string; // generated formal text
}

// ── Webhook (sync / push to backend) ────────

export interface WebhookPayload {
  reportId: string;
  technicianId: string;
  elevatorId: string;
  mode: ReportMode;
  status: string;
  photos: Array<{
    id: string;
    zoneCategory?: ReportZone;
    width: number;
    height: number;
    fileSize: number;
    takenAt: string;
  }>;
  formalReport?: string;
  problemDescription?: string;
  solutionApplied?: string;
  ocrText?: string;
  signature?: string;
  signatureGeo?: { lat: number; lng: number };
  signatureTimestamp?: string;
  createdAt: string;
  updatedAt: string;
}
