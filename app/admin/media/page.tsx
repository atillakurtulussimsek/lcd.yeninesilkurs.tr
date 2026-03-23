"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import MediaFileComponent, { MediaFileData } from "../components/MediaFile";

interface MediaListResponse {
  success: boolean;
  files: MediaFileData[];
  total: number;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: "uploading" | "success" | "error";
  error?: string;
}

export default function MediaPage() {
  const [files, setFiles] = useState<MediaFileData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch media files
  const fetchFiles = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/media");
      if (!response.ok) {
        throw new Error("Medya dosyaları yüklenirken hata oluştu");
      }
      const data: MediaListResponse = await response.json();
      setFiles(data.files || []);
    } catch (err) {
      console.error("Error fetching files:", err);
      setError("Medya dosyaları yüklenirken bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  // Upload a single file
  const uploadFile = async (file: File, index: number) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      // Update status to uploading
      setUploadingFiles((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], status: "uploading", progress: 0 };
        return updated;
      });

      const response = await fetch("/api/admin/media/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Dosya yüklenirken hata oluştu");
      }

      // Update status to success
      setUploadingFiles((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], status: "success", progress: 100 };
        return updated;
      });

      return true;
    } catch (err) {
      // Update status to error
      setUploadingFiles((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          status: "error",
          error: err instanceof Error ? err.message : "Dosya yüklenirken hata oluştu",
        };
        return updated;
      });

      return false;
    }
  };

  // Handle file selection
  const handleFileSelection = async (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    const newUploadingFiles: UploadingFile[] = Array.from(selectedFiles).map((file) => ({
      file,
      progress: 0,
      status: "uploading" as const,
    }));

    setUploadingFiles((prev) => [...prev, ...newUploadingFiles]);
    setError(null);

    const startIndex = uploadingFiles.length;
    let successCount = 0;

    for (let i = 0; i < selectedFiles.length; i++) {
      const success = await uploadFile(selectedFiles[i], startIndex + i);
      if (success) successCount++;
    }

    if (successCount > 0) {
      setSuccessMessage(`${successCount} dosya başarıyla yüklendi`);
      setTimeout(() => setSuccessMessage(null), 3000);
      await fetchFiles();
    }

    // Clean up completed uploads after a delay
    setTimeout(() => {
      setUploadingFiles((prev) => prev.filter((f) => f.status === "uploading"));
    }, 5000);
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelection(e.target.files);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    handleFileSelection(e.dataTransfer.files);
  };

  // Delete file
  const handleDelete = async (key: string) => {
    if (!confirm(`"${key.split("/").pop()}" dosyasını silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      const encodedKey = encodeURIComponent(key);
      const response = await fetch(`/api/admin/media/${encodedKey}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Dosya silinirken hata oluştu");
      }

      setFiles((prev) => prev.filter((f) => f.key !== key));
      setSuccessMessage("Dosya başarıyla silindi");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Error deleting file:", err);
      setError(err instanceof Error ? err.message : "Dosya silinirken bir hata oluştu");
    }
  };

  // Format file size
  const formatTotalSize = (fileList: MediaFileData[]): string => {
    const totalBytes = fileList.reduce((acc, f) => acc + f.size, 0);
    if (totalBytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(totalBytes) / Math.log(k));
    return `${parseFloat((totalBytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <svg className="w-12 h-12 animate-spin mx-auto text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <p className="mt-4 text-gray-400">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Medya Yönetimi</h1>
          <p className="text-gray-400 mt-1">
            {files.length} dosya, toplam {formatTotalSize(files)}
          </p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          <span>Dosya Yükle</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-400">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 bg-green-900/50 border border-green-700 rounded-lg">
          <div className="flex items-center gap-2 text-green-400">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      {/* Upload progress */}
      {uploadingFiles.length > 0 && (
        <div className="mb-6 space-y-2">
          {uploadingFiles.map((uf, i) => (
            <div key={i} className="p-3 bg-gray-800 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-300 truncate">{uf.file.name}</span>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded ${
                    uf.status === "uploading"
                      ? "bg-blue-900/50 text-blue-400"
                      : uf.status === "success"
                      ? "bg-green-900/50 text-green-400"
                      : "bg-red-900/50 text-red-400"
                  }`}
                >
                  {uf.status === "uploading"
                    ? "Yükleniyor..."
                    : uf.status === "success"
                    ? "Tamamlandı"
                    : "Hata"}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    uf.status === "uploading"
                      ? "bg-blue-500 animate-pulse"
                      : uf.status === "success"
                      ? "bg-green-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: uf.status === "uploading" ? "60%" : "100%" }}
                />
              </div>
              {uf.error && (
                <p className="text-xs text-red-400 mt-1">{uf.error}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Drag and Drop Zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`mb-8 p-8 border-2 border-dashed rounded-xl text-center transition-colors ${
          isDragOver
            ? "border-blue-500 bg-blue-900/20"
            : "border-gray-600 hover:border-gray-500"
        }`}
      >
        <svg className="w-12 h-12 mx-auto text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p className="text-gray-400 text-lg mb-2">
          Dosyaları buraya sürükleyip bırakın
        </p>
        <p className="text-gray-500 text-sm mb-4">
          veya
        </p>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          Dosya Seçin
        </button>
        <p className="text-gray-500 text-xs mt-4">
          Desteklenen formatlar: JPG, PNG, WebP, GIF, MP4, WebM, MOV (Maks. 500MB)
        </p>
      </div>

      {/* File Grid */}
      {files.length === 0 ? (
        <div className="text-center py-16 bg-gray-800 rounded-lg border border-gray-700">
          <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
          </svg>
          <p className="text-gray-400 text-lg">Henüz yüklenmiş medya dosyası yok</p>
          <p className="text-gray-500 mt-2">Başlamak için yukarıdaki alandan dosya yükleyin</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {files.map((file) => (
            <MediaFileComponent
              key={file.key}
              file={file}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
