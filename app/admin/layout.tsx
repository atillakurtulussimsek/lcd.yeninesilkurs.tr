"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isActive = (path: string) => pathname === path;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // Call logout API
      await fetch("/api/admin/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear Basic Auth by fetching with invalid credentials
      fetch("/api/admin/auth/logout", {
        method: "POST",
        headers: {
          Authorization: "Basic " + btoa("logout:logout"),
        },
      }).finally(() => {
        // Redirect to login page
        router.push("/admin/login");
      });
    }
  };

  return (
    <div className="admin-layout flex h-screen overflow-hidden bg-gray-900 text-white" style={{ cursor: "auto", userSelect: "auto" }}>
      {/* Override global styles for admin */}
      <style jsx global>{`
        .admin-layout, .admin-layout * {
          cursor: auto !important;
          -webkit-user-select: auto !important;
          user-select: auto !important;
        }
        .admin-layout ::-webkit-scrollbar {
          display: block;
          width: 8px;
        }
        .admin-layout ::-webkit-scrollbar-track {
          background: #1f2937;
        }
        .admin-layout ::-webkit-scrollbar-thumb {
          background: #4b5563;
          border-radius: 4px;
        }
        .admin-layout ::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
        .admin-layout {
          scrollbar-width: thin;
          -ms-overflow-style: auto;
        }
      `}</style>

      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-xl font-bold text-blue-400">LCD Signage</h1>
          <p className="text-sm text-gray-400 mt-1">Admin Panel</p>
        </div>

        {/* Navigation */}
        <nav className="flex-grow p-4 space-y-2">
          <a
            href="/admin/playlist"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive("/admin/playlist")
                ? "bg-blue-600 text-white"
                : "text-gray-300 hover:bg-gray-700 hover:text-white"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            <span className="font-medium">Playlist</span>
          </a>

          <a
            href="/admin/media"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive("/admin/media")
                ? "bg-blue-600 text-white"
                : "text-gray-300 hover:bg-gray-700 hover:text-white"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
            <span className="font-medium">Medya</span>
          </a>
        </nav>

        {/* Logout button at bottom of sidebar */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-red-600/20 hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoggingOut ? (
              <svg
                className="w-5 h-5 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            )}
            <span className="font-medium">{isLoggingOut ? "Çıkış yapılıyor..." : "Çıkış Yap"}</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-grow overflow-auto">
        <div className="h-full">{children}</div>
      </main>
    </div>
  );
}
