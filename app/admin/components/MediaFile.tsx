"use client";

import { MediaType, CDN_BASE_URL } from "@/app/services/types";

export interface MediaFileData {
  key: string;
  size: number;
  lastModified: string;
  type: MediaType;
}

interface MediaFileProps {
  file: MediaFileData;
  onDelete: (key: string) => void;
  onSelect?: (key: string) => void;
  isSelected?: boolean;
  isSelectable?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("tr-TR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getMediaUrl(key: string): string {
  return `${CDN_BASE_URL}/${key}`;
}

function getFileIcon(type: MediaType): string {
  return type === "video" ? "🎬" : "🖼️";
}

export default function MediaFileComponent({
  file,
  onDelete,
  onSelect,
  isSelected = false,
  isSelectable = false,
}: MediaFileProps) {
  const thumbnailUrl = getMediaUrl(file.key);

  return (
    <div
      className={`group relative bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-750 transition-colors ${
        isSelectable ? "cursor-pointer" : ""
      } ${isSelected ? "ring-2 ring-blue-500" : ""}`}
      onClick={() => isSelectable && onSelect && onSelect(file.key)}
    >
      {/* Selection overlay */}
      {isSelectable && (
        <div className="absolute top-2 left-2 z-10">
          <div
            className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
              isSelected
                ? "bg-blue-500 border-blue-500"
                : "bg-gray-900/50 border-gray-400 group-hover:border-white"
            }`}
          >
            {isSelected && (
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* Thumbnail */}
      <div className="aspect-video bg-gray-900 relative">
        {file.type === "video" ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-700">
            <span className="text-4xl">🎬</span>
          </div>
        ) : (
          <img
            src={thumbnailUrl}
            alt={file.key}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              e.currentTarget.parentElement!.innerHTML =
                '<div class="w-full h-full flex items-center justify-center bg-gray-700"><span class="text-4xl">🖼️</span></div>';
            }}
          />
        )}

        {/* Type badge */}
        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 rounded text-xs text-white">
          {file.type === "video" ? "Video" : "Resim"}
        </div>
      </div>

      {/* File info */}
      <div className="p-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm">{getFileIcon(file.type)}</span>
          <span className="text-sm font-medium text-gray-200 truncate flex-grow">
            {file.key.split("/").pop()}
          </span>
        </div>
        <div className="text-xs text-gray-400 space-y-0.5">
          <div>Boyut: {formatFileSize(file.size)}</div>
          <div>{formatDate(file.lastModified)}</div>
        </div>
      </div>

      {/* Delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(file.key);
        }}
        className="absolute top-2 right-2 p-2 bg-red-500/80 hover:bg-red-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
        title="Sil"
      >
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}
