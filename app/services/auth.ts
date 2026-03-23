/**
 * HTTP Basic Authentication Service
 * Simple username/password verification for admin panel
 */

export function verifyBasicAuth(username: string, password: string): boolean {
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminUsername || !adminPassword) {
    console.error("ADMIN_USERNAME or ADMIN_PASSWORD not configured");
    return false;
  }

  return username === adminUsername && password === adminPassword;
}

/**
 * Parse Basic Auth header
 * @param authHeader - Authorization header value (e.g., "Basic base64string")
 * @returns Object with username and password, or null if invalid
 */
export function parseBasicAuth(authHeader: string | null): { username: string; password: string } | null {
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return null;
  }

  try {
    // Extract base64 encoded credentials
    const base64Credentials = authHeader.substring(6);
    const credentials = Buffer.from(base64Credentials, "base64").toString("utf-8");
    
    // Split username:password
    const colonIndex = credentials.indexOf(":");
    if (colonIndex === -1) {
      return null;
    }

    const username = credentials.substring(0, colonIndex);
    const password = credentials.substring(colonIndex + 1);

    return { username, password };
  } catch (error) {
    console.error("Failed to parse Basic Auth header:", error);
    return null;
  }
}
