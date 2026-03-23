"use client";

import { PlaylistItem as PlaylistItemType, MediaType, CDN_BASE_URL } from "@/app/services/types";

interface PlaylistItemProps {
  item: PlaylistItemType;
  index: number;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  isFirst: boolean;
  isLast: boolean;
}

function getMediaUrl(src: string): string {
  if (src.startsWith("http://") || src.startsWith("https://")) {
    return src;
  }
  return `${CDN_BASE_URL}/${src.replace(/^\//, "")}`;
}

function formatDuration(seconds?: number): string {
  if (!seconds) return "-";
  return `${seconds}s`;
}

function getFileIcon(type: MediaType): string {
  return type === "video" ? "🎬" : "🖼️";
}

export default function PlaylistItemComponent({
  item,
  index,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: PlaylistItemProps) {
  const thumbnailUrl = getMediaUrl(item.src);

  return (
    <div className="flex items-center gap-4 p-4 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors">
      {/* Sıra numarası */}
      <div className="flex-shrink-0 w-8 text-center text-gray-400 font-mono">
        {index + 1}
      </div>

      {/* Thumbnail */}
      <div className="flex-shrink-0 w-20 h-14 bg-gray-900 rounded overflow-hidden">
        {item.type === "video" ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-700">
            <span className="text-2xl">🎬</span>
          </div>
        ) : (
          <img
            src={thumbnailUrl}
            alt={item.src}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              e.currentTarget.parentElement!.innerHTML = '<span class="text-2xl">🖼️</span>';
            }}
          />
        )}
      </div>

      {/* Bilgiler */}
      <div className="flex-grow min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getFileIcon(item.type)}</span>
          <span className="text-sm font-medium text-gray-200 truncate">
            {item.src.split("/").pop()}
          </span>
        </div>
        <div className="text-xs text-gray-400 mt-1">
          <span className="mr-3">Tip: {item.type === "video" ? "Video" : "Resim"}</span>
          {item.type === "image" && (
            <span>Süre: {formatDuration(item.duration)}</span>
          )}
        </div>
      </div>

      {/* Aksiyonlar */}
      <div className="flex-shrink-0 flex items-center gap-1">
        {/* Sıralama butonları */}
        <div className="flex flex-col gap-0.5 mr-2">
          <button
            onClick={() => onMoveUp(index)}
            disabled={isFirst}
            className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"
            title="Yukarı taşı"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <button
            onClick={() => onMoveDown(index)}
            disabled={isLast}
            className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"
            title="Aşağı taşı"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Düzenle butonu */}
        <button
          onClick={() => onEdit(index)}
          className="p-2 text-blue-400 hover:text-blue-300 hover:bg-gray-700 rounded"
          title="Düzenle"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>

        {/* Sil butonu */}
        <button
          onClick={() => onDelete(index)}
          className="p-2 text-red-400 hover:text-red-300 hover:bg-gray-700 rounded"
          title="Sil"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}
