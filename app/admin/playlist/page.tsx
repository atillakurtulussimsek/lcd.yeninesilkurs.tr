"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import PlaylistItemComponent from "../components/PlaylistItem";
import { PlaylistItem, MediaType, DEFAULT_IMAGE_DURATION } from "@/app/services/types";

interface PlaylistResponse {
  playlist: PlaylistItem[];
}

interface MediaFile {
  key: string;
  size: number;
  lastModified: string;
  type: MediaType;
}

interface MediaListResponse {
  success: boolean;
  files: MediaFile[];
  total: number;
}

export default function PlaylistPage() {
  const router = useRouter();
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Form states
  const [itemType, setItemType] = useState<MediaType>("image");
  const [itemSrc, setItemSrc] = useState("");
  const [itemDuration, setItemDuration] = useState(DEFAULT_IMAGE_DURATION);

  // Media files for selection
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [showMediaSelector, setShowMediaSelector] = useState(false);

  // Fetch playlist
  const fetchPlaylist = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/playlist");
      if (!response.ok) {
        throw new Error("Playlist yüklenirken hata oluştu");
      }
      const data: PlaylistResponse = await response.json();
      setPlaylist(data.playlist || []);
    } catch (err) {
      console.error("Error fetching playlist:", err);
      setError("Playlist yüklenirken bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch media files
  const fetchMediaFiles = useCallback(async () => {
    setIsLoadingMedia(true);
    try {
      const response = await fetch("/api/admin/media");
      if (!response.ok) {
        throw new Error("Medya dosyaları yüklenirken hata oluştu");
      }
      const data: MediaListResponse = await response.json();
      setMediaFiles(data.files || []);
    } catch (err) {
      console.error("Error fetching media files:", err);
    } finally {
      setIsLoadingMedia(false);
    }
  }, []);

  useEffect(() => {
    fetchPlaylist();
  }, [fetchPlaylist]);

  // Save playlist
  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/admin/playlist", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ playlist }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Playlist kaydedilirken hata oluştu");
      }

      setSuccessMessage("Playlist başarıyla kaydedildi");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Error saving playlist:", err);
      setError(err instanceof Error ? err.message : "Playlist kaydedilirken bir hata oluştu");
    } finally {
      setIsSaving(false);
    }
  };

  // Add new item
  const handleAddItem = () => {
    if (!itemSrc.trim()) {
      setError("Lütfen bir medya dosyası seçin veya URL girin");
      return;
    }

    const newItem: PlaylistItem = {
      type: itemType,
      src: itemSrc,
    };

    if (itemType === "image") {
      newItem.duration = itemDuration;
    }

    setPlaylist([...playlist, newItem]);
    resetForm();
    setShowAddModal(false);
    setError(null);
  };

  // Edit item
  const handleEditItem = () => {
    if (editingIndex === null || !itemSrc.trim()) {
      setError("Lütfen bir medya dosyası seçin veya URL girin");
      return;
    }

    const updatedItem: PlaylistItem = {
      type: itemType,
      src: itemSrc,
    };

    if (itemType === "image") {
      updatedItem.duration = itemDuration;
    }

    const newPlaylist = [...playlist];
    newPlaylist[editingIndex] = updatedItem;
    setPlaylist(newPlaylist);
    resetForm();
    setShowEditModal(false);
    setEditingIndex(null);
    setError(null);
  };

  // Delete item
  const handleDeleteItem = (index: number) => {
    if (confirm("Bu öğeyi silmek istediğinizden emin misiniz?")) {
      const newPlaylist = playlist.filter((_, i) => i !== index);
      setPlaylist(newPlaylist);
    }
  };

  // Move item up
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newPlaylist = [...playlist];
    [newPlaylist[index - 1], newPlaylist[index]] = [newPlaylist[index], newPlaylist[index - 1]];
    setPlaylist(newPlaylist);
  };

  // Move item down
  const handleMoveDown = (index: number) => {
    if (index === playlist.length - 1) return;
    const newPlaylist = [...playlist];
    [newPlaylist[index], newPlaylist[index + 1]] = [newPlaylist[index + 1], newPlaylist[index]];
    setPlaylist(newPlaylist);
  };

  // Open edit modal
  const openEditModal = (index: number) => {
    const item = playlist[index];
    setEditingIndex(index);
    setItemType(item.type);
    setItemSrc(item.src);
    setItemDuration(item.duration || DEFAULT_IMAGE_DURATION);
    setShowEditModal(true);
  };

  // Reset form
  const resetForm = () => {
    setItemType("image");
    setItemSrc("");
    setItemDuration(DEFAULT_IMAGE_DURATION);
  };

  // Select media file
  const handleSelectMedia = (key: string) => {
    setItemSrc(key);
    setShowMediaSelector(false);
  };

  // Open media selector
  const openMediaSelector = async () => {
    setShowMediaSelector(true);
    if (mediaFiles.length === 0) {
      await fetchMediaFiles();
    }
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
          <h1 className="text-2xl font-bold text-white">Playlist Yönetimi</h1>
          <p className="text-gray-400 mt-1">Toplam {playlist.length} öğe</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Öğe Ekle</span>
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || playlist.length === 0}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            {isSaving ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Kaydediliyor...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Kaydet</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg">
          <div className="flex items-center gap-2 text-red-400">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
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

      {/* Playlist items */}
      {playlist.length === 0 ? (
        <div className="text-center py-16 bg-gray-800 rounded-lg border border-gray-700">
          <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          <p className="text-gray-400 text-lg">Henüz playlist öğesi yok</p>
          <p className="text-gray-500 mt-2">Başlamak için "Öğe Ekle" butonuna tıklayın</p>
        </div>
      ) : (
        <div className="space-y-3">
          {playlist.map((item, index) => (
            <PlaylistItemComponent
              key={index}
              item={item}
              index={index}
              onEdit={openEditModal}
              onDelete={handleDeleteItem}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              isFirst={index === 0}
              isLast={index === playlist.length - 1}
            />
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-6">Yeni Öğe Ekle</h2>

            <div className="space-y-4">
              {/* Type selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Medya Tipi</label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setItemType("image")}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                      itemType === "image"
                        ? "border-blue-500 bg-blue-600/20 text-white"
                        : "border-gray-600 text-gray-400 hover:border-gray-500"
                    }`}
                  >
                    🖼️ Resim
                  </button>
                  <button
                    type="button"
                    onClick={() => setItemType("video")}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                      itemType === "video"
                        ? "border-blue-500 bg-blue-600/20 text-white"
                        : "border-gray-600 text-gray-400 hover:border-gray-500"
                    }`}
                  >
                    🎬 Video
                  </button>
                </div>
              </div>

              {/* Media source */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Medya Kaynağı</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={itemSrc}
                    onChange={(e) => setItemSrc(e.target.value)}
                    placeholder="media/dosya-adi.jpg veya URL"
                    className="flex-grow px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={openMediaSelector}
                    className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    title="Medya kütüphanesinden seç"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Duration (for images) */}
              {itemType === "image" && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Gösterim Süresi (saniye)</label>
                  <input
                    type="number"
                    value={itemDuration}
                    onChange={(e) => setItemDuration(Number(e.target.value))}
                    min="1"
                    max="3600"
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="flex-1 py-3 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleAddItem}
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Ekle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-6">Öğeyi Düzenle</h2>

            <div className="space-y-4">
              {/* Type selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Medya Tipi</label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setItemType("image")}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                      itemType === "image"
                        ? "border-blue-500 bg-blue-600/20 text-white"
                        : "border-gray-600 text-gray-400 hover:border-gray-500"
                    }`}
                  >
                    🖼️ Resim
                  </button>
                  <button
                    type="button"
                    onClick={() => setItemType("video")}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                      itemType === "video"
                        ? "border-blue-500 bg-blue-600/20 text-white"
                        : "border-gray-600 text-gray-400 hover:border-gray-500"
                    }`}
                  >
                    🎬 Video
                  </button>
                </div>
              </div>

              {/* Media source */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Medya Kaynağı</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={itemSrc}
                    onChange={(e) => setItemSrc(e.target.value)}
                    placeholder="media/dosya-adi.jpg veya URL"
                    className="flex-grow px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={openMediaSelector}
                    className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    title="Medya kütüphanesinden seç"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Duration (for images) */}
              {itemType === "image" && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Gösterim Süresi (saniye)</label>
                  <input
                    type="number"
                    value={itemDuration}
                    onChange={(e) => setItemDuration(Number(e.target.value))}
                    min="1"
                    max="3600"
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  resetForm();
                  setEditingIndex(null);
                }}
                className="flex-1 py-3 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleEditItem}
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Selector Modal */}
      {showMediaSelector && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Medya Kütüphanesi</h2>
              <button
                onClick={() => setShowMediaSelector(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {isLoadingMedia ? (
              <div className="flex items-center justify-center py-16">
                <svg className="w-12 h-12 animate-spin text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
            ) : mediaFiles.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-400">Henüz yüklenmiş medya dosyası yok</p>
                <button
                  onClick={() => {
                    setShowMediaSelector(false);
                    router.push("/admin/media");
                  }}
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  Medya Yükle
                </button>
              </div>
            ) : (
              <div className="overflow-y-auto flex-grow">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {mediaFiles
                    .filter((file) => itemType === "image" ? file.type === "image" : file.type === "video")
                    .map((file) => (
                      <div
                        key={file.key}
                        onClick={() => handleSelectMedia(file.key)}
                        className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-colors ${
                          itemSrc === file.key
                            ? "border-blue-500 bg-blue-600/20"
                            : "border-gray-700 hover:border-gray-500"
                        }`}
                      >
                        <div className="aspect-video bg-gray-900 relative">
                          {file.type === "video" ? (
                            <div className="w-full h-full flex items-center justify-center bg-gray-700">
                              <span className="text-3xl">🎬</span>
                            </div>
                          ) : (
                            <img
                              src={`${process.env.NEXT_PUBLIC_CDN_BASE_URL || "https://lcd-cdn.yeninesilkurs.tr"}/${file.key}`}
                              alt={file.key}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          )}
                        </div>
                        <div className="p-2 bg-gray-800">
                          <p className="text-sm text-gray-300 truncate">{file.key.split("/").pop()}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
