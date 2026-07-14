import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { v4 as uuidv4 } from 'uuid';
import type { Photo } from '../types/report';
import { PHOTO_COMPRESSION_QUALITY, PHOTO_MAX_WIDTH, PHOTO_MAX_HEIGHT } from '../constants/config';

export interface CaptureResult {
  photo: Photo;
  success: boolean;
  error?: string;
}

export async function requestCameraPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  return status === 'granted';
}

export async function capturePhoto(reportId: string): Promise<CaptureResult> {
  try {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 1,
      allowsEditing: false,
      exif: true,
    });

    if (result.canceled || !result.assets?.length) {
      return { photo: null as any, success: false, error: 'Foto cancelada' };
    }

    const asset = result.assets[0];
    return await compressAndSave(asset.uri, reportId);
  } catch (error: any) {
    return { photo: null as any, success: false, error: error.message };
  }
}

export async function pickFromGallery(reportId: string): Promise<CaptureResult> {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
      allowsMultipleSelection: false,
    });

    if (result.canceled || !result.assets?.length) {
      return { photo: null as any, success: false, error: 'Selección cancelada' };
    }

    const asset = result.assets[0];
    return await compressAndSave(asset.uri, reportId);
  } catch (error: any) {
    return { photo: null as any, success: false, error: error.message };
  }
}

async function compressAndSave(uri: string, reportId: string): Promise<CaptureResult> {
  const manipulated = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: PHOTO_MAX_WIDTH, height: PHOTO_MAX_HEIGHT } }],
    {
      compress: PHOTO_COMPRESSION_QUALITY,
      format: ImageManipulator.SaveFormat.JPEG,
    }
  );

  const fileInfo = await FileSystem.getInfoAsync(manipulated.uri);
  if (!fileInfo.exists) {
    return { photo: null as any, success: false, error: 'Error al procesar la imagen' };
  }

  const base64 = await FileSystem.readAsStringAsync(manipulated.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const now = new Date().toISOString();
  const photo: Photo = {
    id: uuidv4(),
    reportId,
    uri: manipulated.uri,
    blobBase64: base64,
    width: manipulated.width,
    height: manipulated.height,
    fileSize: fileInfo.size ?? 0,
    takenAt: now,
    uploadStatus: 'pending',
    retryCount: 0,
  };

  return { photo, success: true };
}

export function createPreviewUri(photo: Photo): string {
  if (photo.blobBase64) {
    return `data:image/jpeg;base64,${photo.blobBase64}`;
  }
  return photo.uri;
}

export async function deletePhotoFile(uri: string): Promise<void> {
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {}
}
