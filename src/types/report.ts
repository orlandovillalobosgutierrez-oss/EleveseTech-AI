// ──────────────────────────────────────────────
// EleveseTech – Domain Types (Reports, Photos, Sync)
// ──────────────────────────────────────────────

// The five elevator zones for AI photo classification
export type ReportZone =
  | 'machine_room_control'
  | 'machine_room_motor'
  | 'shaft_rails'
  | 'floor_doors'
  | 'pit';

// App operating mode
export type ReportMode = 'preventive' | 'corrective';

// Lifecycle status for a report
export type ReportStatus =
  | 'draft'
  | 'ai_processing'
  | 'ready_for_review'
  | 'signed'
  | 'syncing'
  | 'synced'
  | 'failed';

// Photo upload state
export type PhotoUploadStatus = 'pending' | 'uploading' | 'done' | 'failed';

// ── Photo ────────────────────────────────────

export interface Photo {
  id: string;
  reportId: string;
  uri: string; // local file URI
  blobBase64?: string; // compressed JPEG base64
  zoneCategory?: ReportZone; // assigned by AI after classification
  width: number;
  height: number;
  fileSize: number; // bytes
  takenAt: string; // ISO timestamp
  uploadStatus: PhotoUploadStatus;
  retryCount: number;
}

// ── Report ───────────────────────────────────

export interface Report {
  id: string;
  technicianId: string;
  technicianName: string;
  elevatorId: string;
  buildingName: string;
  address: string;
  mode: ReportMode;
  status: ReportStatus;
  photos: Photo[];

  // Common fields
  technicianNotes: string; // informal notes from tech
  formalReport?: string; // AI-generated formal text

  // Corrective-mode specific
  problemDescription?: string; // for corrective mode
  solutionApplied?: string; // for corrective mode
  ocrText?: string; // OCR'd error codes from displays

  // Signature
  signature?: string; // base64 PNG of signature
  signatureGeo?: { lat: number; lng: number };
  signatureTimestamp?: string;

  // AI classification results: zone -> list of photo IDs
  zoneClassifications?: Record<ReportZone, string[]>;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
}

// ── Sync Queue ───────────────────────────────

export type SyncQueueType = 'upload_photos' | 'webhook_report';
export type SyncQueueStatus = 'pending' | 'in_progress' | 'done' | 'failed';

export interface SyncQueueItem {
  id: string;
  reportId: string;
  type: SyncQueueType;
  status: SyncQueueStatus;
  payload: string; // JSON serialized
  retryCount: number;
  maxRetries: number;
  createdAt: string;
  lastAttemptAt?: string;
  errorMessage?: string;
}
