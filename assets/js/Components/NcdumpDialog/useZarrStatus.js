import { useState, useEffect, useRef } from "react";

import { TEMP_FREVA_AUTH_TOKEN } from "../../Containers/Databrowser/constants";

// get the token from cookies
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
 * Polls /api/freva-nextgen/data-portal/zarr-utils/status at a regular interval
 * and returns the numeric status code.
 *
 * Status codes from the backend:
 *   0  finished, ok
 *   1  finished, failed
 *   2  finished, not found
 *   3  waiting
 *   4  processing
 *   5  gone / unknown
 */
export function useZarrStatus(
  zarrUrl,
  { intervalMs = 2000, enabled = true } = {}
) {
  const [statusCode, setStatusCode] = useState(null);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!zarrUrl || !enabled) {
      return () => {};
    }

    let cancelled = false;

    async function poll() {
      try {
        const url = `/api/freva-nextgen/data-portal/zarr-utils/status?url=${encodeURIComponent(zarrUrl)}&timeout=1`;
        const res = await fetch(url, {
          credentials: "same-origin",
          headers: getAuthHeaders(),
        });

        if (!res.ok) {
          // treat as unknown but keep polling unless terminal
          setStatusCode(5);
          return;
        }

        const data = await res.json();
        const code = data.status ?? 5;

        if (!cancelled) {
          setStatusCode(code);
          setError(null);
        }

        // Stop polling once we reach a terminal state
        if (code <= 2) {
          clearInterval(timerRef.current);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      }
    }

    // Fire immediately, then on interval
    poll();
    timerRef.current = setInterval(poll, intervalMs);

    return () => {
      cancelled = true;
      clearInterval(timerRef.current);
    };
  }, [zarrUrl, intervalMs, enabled]);

  return { statusCode, error };
}
