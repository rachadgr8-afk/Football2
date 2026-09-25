/**
 * Central API configuration for FOOTBALL CINEMATIC AI.
 *
 * All network calls (Gemini analysis, FFmpeg rendering, Veo generation) are
 * routed to the deployed backend. Override at build/runtime with the
 * VITE_API_BASE environment variable if you host the API elsewhere.
 */
export const API_BASE: string =
  (import.meta.env?.VITE_API_BASE as string | undefined)?.replace(/\/$/, '') ||
  'https://fotbal-1.onrender.com';

/** Build an absolute API endpoint URL, e.g. api('/api/presets'). */
export function api(path: string): string {
  return `${API_BASE}${path}`;
}

/**
 * Resilient API fetch.
 *
 * Tries the configured remote backend first. If the remote does not serve the
 * route yet (HTTP 404/405/501) or the network fails, it transparently retries
 * against the current origin (the locally running server). This keeps the app
 * fully functional before the rendering routes are deployed to production,
 * while remaining remote-first once they are.
 */
export async function apiFetch(
  path: string,
  options?: RequestInit
): Promise<Response> {
  const primaryUrl = api(path);
  try {
    const res = await fetch(primaryUrl, options);
    if (res.status !== 404 && res.status !== 405 && res.status !== 501) {
      return res;
    }
    // Remote route missing -> fall back to same-origin (if different)
    if (primaryUrl !== path) {
      return await fetch(path, options);
    }
    return res;
  } catch (err) {
    if (primaryUrl !== path) {
      return await fetch(path, options);
    }
    throw err;
  }
}

/**
 * Resolve a media URL returned by the backend into something the browser can
 * load. Relative paths such as "/videos/final_video.mp4" are prefixed with the
 * API base so rendered MP4s stream correctly from the remote server.
 */
export function resolveMediaUrl(url?: string | null): string {
  if (!url) return '';
  if (
    /^https?:\/\//i.test(url) ||
    url.startsWith('blob:') ||
    url.startsWith('data:')
  ) {
    return url;
  }
  if (url.startsWith('/')) {
    return `${API_BASE}${url}`;
  }
  return url;
}
