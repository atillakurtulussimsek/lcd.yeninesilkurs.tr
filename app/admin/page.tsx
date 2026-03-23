import { redirect } from "next/navigation";

/**
 * Admin root page - redirects to playlist management
 */
export default function AdminPage() {
  redirect("/admin/playlist");
}
