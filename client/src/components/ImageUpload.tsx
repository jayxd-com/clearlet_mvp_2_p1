import { useState, useRef } from "react";
import { Upload, X, AlertCircle, CheckCircle, FileText } from "lucide-react";
import {
  validateImageFile,
  generatePreviewUrl,
  revokePreviewUrl,
  formatFileSize,
  type ImageUploadConfig,
  type ValidationError,
} from "@/lib/imageUpload";
import { Button } from "./ui/button";

interface ImageUploadProps {
  config: ImageUploadConfig;
  onUpload: (file: File) => Promise<void> | void;
  onPreview?: (url: string) => void;
  maxFiles?: number;
  label?: string;
}

export default function ImageUpload({
  config,
  onUpload,
  onPreview,
  maxFiles = 1,
  label = "Upload Image",
}: ImageUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newErrors: ValidationError[] = [];
    const newFiles: File[] = [];
    const newPreviews: string[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      
      if (files.length + newFiles.length >= maxFiles) {
        newErrors.push({
          field: "count",
          message: `Maximum ${maxFiles} file(s) allowed`,
        });
        break;
      }

      const validationErrors = validateImageFile(file, config);
      if (validationErrors.length > 0) {
        newErrors.push(...validationErrors);
        continue;
      }

      const previewUrl = generatePreviewUrl(file);
      newFiles.push(file);
      newPreviews.push(previewUrl);
      onPreview?.(previewUrl);
      
      await onUpload(file);
    }

    setFiles([...files, ...newFiles]);
    setPreviews([...previews, ...newPreviews]);
    setErrors(newErrors);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    revokePreviewUrl(previews[index]);
    setFiles(newFiles);
    setPreviews(newPreviews);
  };

  return (
    <div className="space-y-4">
      <div
        className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 text-center hover:border-cyan-400 transition-colors cursor-pointer bg-slate-50 dark:bg-slate-900/50"
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="h-8 w-8 text-slate-400 mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{label}</p>
        <p className="text-xs text-slate-500 mt-1">
          Max size: {formatFileSize(config.maxSize)}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple={maxFiles > 1}
          accept={config.allowedTypes.join(",")}
          onChange={(e) => handleFileSelect(e.target.files)}
        />
      </div>

      {errors.length > 0 && (
        <div className="space-y-2">
          {errors.map((error, i) => (
            <p key={i} className="text-xs text-red-500 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {error.message}
            </p>
          ))}
        </div>
      )}

      {previews.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {previews.map((url, i) => (
            <div key={url} className="relative group aspect-square rounded-lg overflow-hidden border">
              {files[i]?.type === "application/pdf" ? (
                <div className="w-full h-full flex items-center justify-center bg-slate-100">
                  <FileText className="h-8 w-8 text-slate-400" />
                </div>
              ) : (
                <img src={url} alt="Preview" className="w-full h-full object-cover" />
              )}
              <button
                onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
