/**
 * Generates or retrieves a stable anonymous session identifier
 * stored in sessionStorage. Used to scope RLS policies so
 * anonymous users can only access their own data.
 */
const STORAGE_KEY = "wrenchli_anon_session_id";

export function getAnonSessionId(): string {
  try {
    let id = sessionStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    // Fallback if sessionStorage is unavailable
    return crypto.randomUUID();
  }
}
