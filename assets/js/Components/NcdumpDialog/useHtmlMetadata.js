import { useState, useEffect } from "react";

import { TEMP_FREVA_AUTH_TOKEN } from "../../Containers/Databrowser/constants";

/**
 * Returns the Authorization header for the current user, or an empty object
 * when no token is present. Mirrors the same helper in useZarrStatus.js.
 */
function getAuthHeaders() {
  const cookies = document.cookie.split(";");
  const authCookie = cookies.find((c) =>
    c.trim().startsWith(TEMP_FREVA_AUTH_TOKEN)
  );

  if (!authCookie) {
    return {};
  }

  try {
    let value = authCookie.substring(authCookie.indexOf("=") + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    return value ? { Authorization: `Bearer ${value}` } : {};
  } catch {
    return {};
  }
}

/**
 * Reads the Retry-After response header and returns the delay in milliseconds.
 * The server sends this on 503 responses when the zarr store is still
 * being built (status: waiting or processing). Falls back to `defaultMs`
 * when the header is absent (500, 404, network errors) or unparseable.
 *
 * The server-side constant _RETRY_AFTER is currently hardcoded to 2 seconds,
 * so in practice this will usually return 2000 — but reading it directly
 * means the client automatically adapts if the server value ever changes.
 */
function retryDelayMs(response, defaultMs) {
  const header = response.headers.get("Retry-After");
  if (!header) {
    return defaultMs;
  }
  const parsed = parseFloat(header);
  return Number.isFinite(parsed) && parsed > 0 ? parsed * 1000 : defaultMs;
}

/**
 * Polls /api/freva-nextgen/data-portal/zarr-utils/html for rendered xarray
 * HTML metadata. Each individual request uses a server-side timeout=1 so it
 * always returns quickly and never blocks the proxy. The hook retries on every
 * non-OK response or network error until `maxAttempts` is reached.
 *
 * On 503 responses the server includes a Retry-After header (currently always
 * 2 s). The hook uses that value as the retry delay when present, falling back
 * to `intervalMs` otherwise.
 *
 * Only activates when `enabled` is true — set enabled={statusCode === 0} so
 * the hook never fires before the zarr conversion job is finished.
 *
 * @param {string|null} rawZarrUrl  The internal zarr URL returned by /zarr/convert.
 * @param {object}      options
 * @param {boolean}     options.enabled      Activate polling (default false).
 * @param {number}      options.intervalMs   Fallback delay between retries in ms (default 2000).
 * @param {number}      options.maxAttempts  Give up after this many tries (default 15).
 *
 * @returns {{ html: string|null, loading: boolean, error: string|null, attempts: number }}
 */
export function useHtmlMetadata(
  rawZarrUrl,
  { enabled = false, intervalMs = 2000, maxAttempts = 15 } = {}
) {
  const [html, setHtml] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setHtml(null);
    setError(null);

    if (!rawZarrUrl || !enabled) {
      return () => {};
    }

    let cancelled = false;
    let attemptCount = 0;
    let timerId = null;

    async function poll() {
      if (cancelled) {
        return;
      }

      if (attemptCount >= maxAttempts) {
        if (!cancelled) {
          setError(
            `Metadata not ready after ${maxAttempts} attempts — try reloading the file.`
          );
        }
        return;
      }

      attemptCount += 1;

      try {
        const res = await fetch(
          `/api/freva-nextgen/data-portal/zarr-utils/html?url=${encodeURIComponent(rawZarrUrl)}&timeout=1`,
          {
            credentials: "same-origin",
            headers: getAuthHeaders(),
          }
        );

        if (res.ok) {
          const text = await res.text();
          if (!cancelled) {
            setHtml(text);
          }
          return;
        }

        // Non-OK response — use Retry-After when the server sends it (503),
        // fall back to intervalMs for everything else (500, 404, etc.).
        const delay = retryDelayMs(res, intervalMs);
        if (!cancelled) {
          timerId = setTimeout(poll, delay);
        }
      } catch {
        // Network error — no response headers available, use fixed fallback.
        if (!cancelled) {
          timerId = setTimeout(poll, intervalMs);
        }
      }
    }

    poll();

    return () => {
      cancelled = true;
      if (timerId) {
        clearTimeout(timerId);
      }
    };
  }, [rawZarrUrl, enabled, intervalMs, maxAttempts]);

  return { html, error };
}
