import { ExternalBlob } from '@/backend';

/**
 * Convert a browser File object to an ExternalBlob with optional upload progress tracking
 */
export async function fileToExternalBlob(
  file: File,
  onProgress?: (percentage: number) => void
): Promise<ExternalBlob> {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  
  let blob = ExternalBlob.fromBytes(uint8Array);
  
  if (onProgress) {
    blob = blob.withUploadProgress(onProgress);
  }
  
  return blob;
}

/**
 * Get a human-readable file size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
