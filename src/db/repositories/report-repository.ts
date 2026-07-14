import { getDatabase } from '../database';
import type { Report } from '../../types/report';

export const ReportRepository = {
  async findAll(): Promise<Report[]> {
    const db = getDatabase();
    const rows = await db.getAllAsync<any>(
      'SELECT * FROM reports ORDER BY created_at DESC'
    );
    return rows.map(mapRowToReport);
  },

  async findById(id: string): Promise<Report | null> {
    const db = getDatabase();
    const row = await db.getFirstAsync<any>(
      'SELECT * FROM reports WHERE id = ?',
      [id]
    );
    return row ? mapRowToReport(row) : null;
  },

  async findByStatus(status: string): Promise<Report[]> {
    const db = getDatabase();
    const rows = await db.getAllAsync<any>(
      'SELECT * FROM reports WHERE status = ? ORDER BY created_at DESC',
      [status]
    );
    return rows.map(mapRowToReport);
  },

  async create(report: Report): Promise<void> {
    const db = getDatabase();
    await db.runAsync(
      `INSERT INTO reports (
        id, technician_id, technician_name, elevator_id, building_name,
        address, mode, status, technician_notes, formal_report,
        problem_description, solution_applied, ocr_text, signature,
        signature_geo_lat, signature_geo_lng, signature_timestamp,
        zone_classifications, created_at, updated_at, synced_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        report.id,
        report.technicianId,
        report.technicianName,
        report.elevatorId,
        report.buildingName,
        report.address,
        report.mode,
        report.status,
        report.technicianNotes || '',
        report.formalReport || null,
        report.problemDescription || null,
        report.solutionApplied || null,
        report.ocrText || null,
        report.signature || null,
        report.signatureGeo?.lat ?? null,
        report.signatureGeo?.lng ?? null,
        report.signatureTimestamp || null,
        report.zoneClassifications ? JSON.stringify(report.zoneClassifications) : null,
        report.createdAt,
        report.updatedAt,
        report.syncedAt || null,
      ]
    );
  },

  async update(id: string, updates: Partial<Report>): Promise<void> {
    const db = getDatabase();
    const fields: string[] = [];
    const values: any[] = [];

    const fieldMap: Record<string, string> = {
      status: 'status',
      technicianNotes: 'technician_notes',
      formalReport: 'formal_report',
      problemDescription: 'problem_description',
      solutionApplied: 'solution_applied',
      ocrText: 'ocr_text',
      signature: 'signature',
      signatureGeo: 'signature_geo',
      technicianName: 'technician_name',
      address: 'address',
    };

    for (const [key, col] of Object.entries(fieldMap)) {
      if (key in updates) {
        const val = (updates as any)[key];
        if (key === 'signatureGeo') {
          fields.push('signature_geo_lat = ?', 'signature_geo_lng = ?');
          values.push(val?.lat ?? null, val?.lng ?? null);
        } else if (key === 'zoneClassifications') {
          fields.push('zone_classifications = ?');
          values.push(JSON.stringify(val));
        } else {
          fields.push(`${col} = ?`);
          values.push(val ?? null);
        }
      }
    }

    if ('updatedAt' in updates) {
      fields.push('updated_at = ?');
      values.push(updates.updatedAt);
    } else {
      fields.push('updated_at = ?');
      values.push(new Date().toISOString());
    }

    if ('syncedAt' in updates) {
      fields.push('synced_at = ?');
      values.push(updates.syncedAt);
    }

    if (fields.length === 0) return;

    values.push(id);
    await db.runAsync(
      `UPDATE reports SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  },

  async delete(id: string): Promise<void> {
    const db = getDatabase();
    await db.runAsync('DELETE FROM reports WHERE id = ?', [id]);
  },

  async count(): Promise<number> {
    const db = getDatabase();
    const row = await db.getFirstAsync<any>('SELECT COUNT(*) as count FROM reports');
    return row?.count ?? 0;
  },
};

function mapRowToReport(row: any): Report {
  return {
    id: row.id,
    technicianId: row.technician_id,
    technicianName: row.technician_name,
    elevatorId: row.elevator_id,
    buildingName: row.building_name,
    address: row.address,
    mode: row.mode,
    status: row.status,
    technicianNotes: row.technician_notes || '',
    formalReport: row.formal_report || undefined,
    problemDescription: row.problem_description || undefined,
    solutionApplied: row.solution_applied || undefined,
    ocrText: row.ocr_text || undefined,
    signature: row.signature || undefined,
    signatureGeo: row.signature_geo_lat != null
      ? { lat: row.signature_geo_lat, lng: row.signature_geo_lng }
      : undefined,
    signatureTimestamp: row.signature_timestamp || undefined,
    zoneClassifications: row.zone_classifications
      ? JSON.parse(row.zone_classifications)
      : undefined,
    photos: [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncedAt: row.synced_at || undefined,
  };
}
