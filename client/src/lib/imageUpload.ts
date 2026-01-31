export interface ImageUploadConfig {
  maxSize: number; // in bytes
  allowedTypes: string[];
  maxWidth?: number;
  maxHeight?: number;
}

export interface ValidationError {
  field: string;
  message: string;
}

export const PROFILE_IMAGE_CONFIG: ImageUploadConfig = {
  maxSize: 2 * 1024 * 1024, // 2MB
  allowedTypes: ["image/jpeg", "image/png", "image/webp"],
  maxWidth: 800,
  maxHeight: 800,
};

export const PROPERTY_IMAGE_CONFIG: ImageUploadConfig = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ["image/jpeg", "image/png", "image/webp"],
  maxWidth: 1920,
  maxHeight: 1080,
};

export const DOCUMENT_CONFIG: ImageUploadConfig = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ["image/jpeg", "image/png", "application/pdf"],
};

export function validateImageFile(file: File, config: ImageUploadConfig): ValidationError[] {
  const errors: ValidationError[] = [];

  if (file.size > config.maxSize) {
    errors.push({
      field: "size",
      message: `File size exceeds ${formatFileSize(config.maxSize)}`,
    });
  }

  if (!config.allowedTypes.includes(file.type)) {
    errors.push({
      field: "type",
      message: `File type ${file.type} is not supported`,
    });
  }

  return errors;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function generatePreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}

export function revokePreviewUrl(url: string): void {
  URL.revokeObjectURL(url);
}
