// ──────────────────────────────────────────────
// EleveseTech – Sync / Offline-Queue Types
// ──────────────────────────────────────────────

/**
 * Overall sync health for a report.
 *
 * - idle: nothing pending
 * - uploading: one or more photos currently being uploaded
 * - webhook_pending: report payload waiting to be sent
 * - completed: all items synced successfully
 * - partial: some items failed
 * - error: all retries exhausted
 */
export type SyncStatus =
  | 'idle'
  | 'uploading'
  | 'webhook_pending'
  | 'completed'
  | 'partial'
  | 'error';
