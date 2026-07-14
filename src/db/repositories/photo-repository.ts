import { getDatabase } from '../database';
import type { Photo } from '../../types/report';

export const PhotoRepository = {
  async findByReportId(reportId: string): Promise<Photo[]> {
    const db = getDatabase();
    const rows = await db.getAllAsync<any>(
      'SELECT * FROM photos WHERE report_id = ? ORDER BY taken_at ASC',
      [reportId]
    );
    return rows.map(mapRowToPhoto);
  },

  async findById(id: string): Promise<Photo | null> {
    const db = getDatabase();
    const row = await db.getFirstAsync<any>(
      'SELECT * FROM photos WHERE id = ?',
      [id]
    );
    return row ? mapRowToPhoto(row) : null;
  },

  async create(photo: Photo): Promise<void> {
    const db = getDatabase();
    await db.runAsync(
      `INSERT INTO photos (
        id, report_id, uri, blob_base64, zone_category, width,
        height, file_size, taken_at, upload_status, retry_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        photo.id,
        photo.reportId,
        photo.uri,
        photo.blobBase64 || null,
        photo.zoneCategory || null,
        photo.width,
        photo.height,
        photo.fileSize,
        photo.takenAt,
        photo.uploadStatus,
        photo.retryCount,
      ]
    );
  },

  async bulkCreate(photos: Photo[]): Promise<void> {
    const db = getDatabase();
    const stmt = await db.prepareAsync(
      `INSERT INTO photos (
        id, report_id, uri, blob_base64, zone_category, width,
        height, file_size, taken_at, upload_status, retry_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const photo of photos) {
      await stmt.executeAsync([
        photo.id,
        photo.reportId,
        photo.uri,
        photo.blobBase64 || null,
        photo.zoneCategory || null,
        photo.width,
        photo.height,
        photo.fileSize,
        photo.takenAt,
        photo.uploadStatus,
        photo.retryCount,
      ]);
    }
    await stmt.finalizeAsync();
  },

  async update(id: string, updates: Partial<Photo>): Promise<void> {
    const db = getDatabase();
    const fields: string[] = [];
    const values: any[] = [];

    if ('zoneCategory' in updates) {
      fields.push('zone_category = ?');
      values.push(updates.zoneCategory ?? null);
    }
    if ('uploadStatus' in updates) {
      fields.push('upload_status = ?');
      values.push(updates.uploadStatus);
    }
    if ('retryCount' in updates) {
      fields.push('retry_count = ?');
      values.push(updates.retryCount);
    }
    if ('blobBase64' in updates) {
      fields.push('blob_base64 = ?');
      values.push(updates.blobBase64 ?? null);
    }

    if (fields.length === 0) return;
    values.push(id);
    await db.runAsync(
      `UPDATE photos SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  },

  async deleteByReportId(reportId: string): Promise<void> {
    const db = getDatabase();
    await db.runAsync('DELETE FROM photos WHERE report_id = ?', [reportId]);
  },

  async deleteById(id: string): Promise<void> {
    const db = getDatabase();
    await db.runAsync('DELETE FROM photos WHERE id = ?', [id]);
  },

  async countByReportId(reportId: string): Promise<number> {
    const db = getDatabase();
    const row = await db.getFirstAsync<any>(
      'SELECT COUNT(*) as count FROM photos WHERE report_id = ?',
      [reportId]
    );
    return row?.count ?? 0;
  },

  async getPendingUploads(): Promise<Photo[]> {
    const db = getDatabase();
    const rows = await db.getAllAsync<any>(
      "SELECT * FROM photos WHERE upload_status = 'pending' OR upload_status = 'failed' ORDER BY taken_at ASC"
    );
    return rows.map(mapRowToPhoto);
  },
};

function mapRowToPhoto(row: any): Photo {
  return {
    id: row.id,
    reportId: row.report_id,
    uri: row.uri,
    blobBase64: row.blob_base64 || undefined,
    zoneCategory: row.zone_category || undefined,
    width: row.width,
    height: row.height,
    fileSize: row.file_size,
    takenAt: row.taken_at,
    uploadStatus: row.upload_status,
    retryCount: row.retry_count,
  };
}
