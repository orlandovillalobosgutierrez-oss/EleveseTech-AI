import { PhotoRepository } from '../db/repositories/photo-repository';
import { ReportRepository } from '../db/repositories/report-repository';
import { useSyncStore } from '../store/useSyncStore';
import { useNetworkStore } from '../store/useNetworkStore';
import { apiRequest, uploadFile } from './api-client';
import { WEBHOOK_URL } from '../constants/config';
import { v4 as uuidv4 } from 'uuid';
import type { SyncQueueItem } from '../types/report';

export async function enqueueSyncItem(
  reportId: string,
  type: SyncQueueItem['type'],
  payload: string
): Promise<void> {
  const item: SyncQueueItem = {
    id: uuidv4(),
    reportId,
    type,
    status: 'pending',
    payload,
    retryCount: 0,
    maxRetries: 5,
    createdAt: new Date().toISOString(),
  };

  useSyncStore.getState().addToQueue(item);
}

export async function processSyncQueue(): Promise<void> {
  const { isConnected } = useNetworkStore.getState();
  if (!isConnected) return;

  const { queue, updateQueueItem } = useSyncStore.getState();
  const networkStore = useNetworkStore.getState();
  const pendingItems = queue.filter(
    (item) => item.status === 'pending' || (item.status === 'failed' && item.retryCount < item.maxRetries)
  );

  if (pendingItems.length === 0) return;

  networkStore.setSyncing(true);

  for (const item of pendingItems) {
    updateQueueItem(item.id, { status: 'in_progress' });

    try {
      if (item.type === 'upload_photos') {
        await processPhotoUpload(item);
      } else if (item.type === 'webhook_report') {
        await processWebhookReport(item);
      }
      updateQueueItem(item.id, { status: 'done' });
    } catch (error: any) {
      const newRetryCount = item.retryCount + 1;
      updateQueueItem(item.id, {
        retryCount: newRetryCount,
        status: newRetryCount >= item.maxRetries ? 'failed' : 'failed',
        errorMessage: error.message,
        lastAttemptAt: new Date().toISOString(),
      });
    }
  }

  networkStore.setSyncing(false);
}

async function processPhotoUpload(item: SyncQueueItem): Promise<void> {
  const photoIds: string[] = JSON.parse(item.payload);
  const photos = await Promise.all(photoIds.map((id) => PhotoRepository.findById(id)));

  for (const photo of photos) {
    if (!photo || photo.uploadStatus === 'done') continue;

    await PhotoRepository.update(photo.id, { uploadStatus: 'uploading' });

    const response = await uploadFile('/photos/upload', photo.uri, 'photo', {
      reportId: photo.reportId,
      photoId: photo.id,
    });

    if (response.error) throw new Error(response.error);

    await PhotoRepository.update(photo.id, { uploadStatus: 'done' });
  }
}

async function processWebhookReport(item: SyncQueueItem): Promise<void> {
  const { reportId } = item;
  const report = await ReportRepository.findById(reportId);
  if (!report) throw new Error('Report not found');

  const photos = await PhotoRepository.findByReportId(reportId);

  const payload = {
    report: {
      id: report.id,
      technicianId: report.technicianId,
      technicianName: report.technicianName,
      elevatorId: report.elevatorId,
      buildingName: report.buildingName,
      address: report.address,
      mode: report.mode,
      status: report.status,
      technicianNotes: report.technicianNotes,
      formalReport: report.formalReport,
      problemDescription: report.problemDescription,
      solutionApplied: report.solutionApplied,
      ocrText: report.ocrText,
      signature: report.signature,
      signatureGeo: report.signatureGeo,
      signatureTimestamp: report.signatureTimestamp,
      zoneClassifications: report.zoneClassifications,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
    },
    photos: photos.map((p) => ({
      id: p.id,
      zoneCategory: p.zoneCategory,
      width: p.width,
      height: p.height,
      fileSize: p.fileSize,
      takenAt: p.takenAt,
      blobBase64: p.blobBase64,
    })),
  };

  const response = await apiRequest(WEBHOOK_URL, {
    method: 'POST',
    body: payload,
  });

  if (response.error) throw new Error(response.error);

  await ReportRepository.update(reportId, {
    status: 'synced',
    syncedAt: new Date().toISOString(),
  });
}

export async function sendReportToWebhook(reportId: string): Promise<void> {
  const report = await ReportRepository.findById(reportId);
  if (!report) throw new Error('Report not found');

  const photos = await PhotoRepository.findByReportId(reportId);

  const payload = {
    report: {
      id: report.id,
      technicianId: report.technicianId,
      technicianName: report.technicianName,
      elevatorId: report.elevatorId,
      buildingName: report.buildingName,
      address: report.address,
      mode: report.mode,
      status: report.status,
      technicianNotes: report.technicianNotes,
      formalReport: report.formalReport,
      problemDescription: report.problemDescription,
      solutionApplied: report.solutionApplied,
      ocrText: report.ocrText,
      signature: report.signature,
      signatureGeo: report.signatureGeo,
      signatureTimestamp: report.signatureTimestamp,
      zoneClassifications: report.zoneClassifications,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
    },
    photos: photos.map((p) => ({
      id: p.id,
      zoneCategory: p.zoneCategory,
      width: p.width,
      height: p.height,
      fileSize: p.fileSize,
      takenAt: p.takenAt,
      blobBase64: p.blobBase64,
    })),
  };

  if (WEBHOOK_URL) {
    const response = await apiRequest(WEBHOOK_URL, {
      method: 'POST',
      body: payload,
    });

    if (response.error) {
      await enqueueSyncItem(reportId, 'webhook_report', JSON.stringify(payload));
      throw new Error(response.error);
    }

    await ReportRepository.update(reportId, {
      status: 'synced',
      syncedAt: new Date().toISOString(),
    });
  } else {
    await enqueueSyncItem(reportId, 'webhook_report', JSON.stringify(payload));
  }
}
