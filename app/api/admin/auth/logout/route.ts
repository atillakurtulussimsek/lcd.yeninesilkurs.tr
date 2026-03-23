import { NextResponse } from "next/server";

/**
 * Logout endpoint for admin panel
 * Returns 401 to help clear Basic Auth credentials
 * The client-side will redirect to login page
 */
export async function POST() {
  return NextResponse.json(
    { success: true, message: "Logged out successfully" },
    { status: 200 }
  );
}
