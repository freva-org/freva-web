import { useState, useEffect } from "react";

import { getTokenFromCookie, normalizeUrl } from "../../utils";

/**
 * True when `base` resolves to the same origin as the running app.
 * Relative paths (Freva API) are same-origin; absolute external store
 * URLs (S3/minio) are not.
 */
function isSameOrigin(base) {
  try {
    return (
      new URL(base, window.location.origin).origin === window.location.origin
    );
  } catch {
    // If it does not parse as a URL, treat it as a relative/same-origin path.
    return true;
  }
}

/**
 * Checks whether a URL already points to a zarr store by probing
 * .zmetadata (v2 consolidated) and zarr.json (v2/v3).
 *
 * we try consolidated metadata first (open_consolidated), then fall back
 * to bare group detection (open_group).
 * The `consolidated` flag tells the caller whether client-side metadata
 * rendering is available; non-consolidated stores are still zarr and can
 * skip conversion, but won't have a metadata view until server-side rendering.
 */
export async function detectZarrStore(url) {
  if (!url) {
    return { isZarr: false, version: null, consolidated: false };
  }

  // Defensive: callers should already pass a decoded URL, but if a
  // percent-encoded one slips through, decode it here so the fetch
  // below is not treated as a relative path by the browser.
  const base = normalizeUrl(url).replace(/\/$/, "");
  // Only attach the Freva auth token for same-origin Freva API requests.
  // External object stores (e.g. the S3/minio buckets)
  // interpret an unexpected `Authorization` header as an AWS credential and
  // reject the request with 403
  const token = isSameOrigin(base) ? getTokenFromCookie() : null;
  const headers = token
    ? { Authorization: `${token.token_type} ${token.access_token}` }
    : {};
  const opts = {
    credentials: "same-origin",
    headers,
    signal: AbortSignal.timeout(5000),
  };

  // v2: .zmetadata is consolidated by definition
  try {
    const r = await fetch(`${base}/.zmetadata`, opts);
    if (r.ok) {
      return { isZarr: true, version: 2, consolidated: true };
    }
  } catch {
    /* I hope linter forgive me */
  }

  // v2/v3: zarr.json; read zarr_format field to determine version
  // xarray does the equivalent via zarr_group.metadata.zarr_format after
  // calling zarr.open_consolidated() or zarr.open_group().
  try {
    const r = await fetch(`${base}/zarr.json`, opts);
    if (r.ok) {
      const json = await r.json();
      // 2 or 3 per spec
      const version = json.zarr_format;
      if (version === 2 || version === 3) {
        // consolidated_metadata key present = renderable client-side (v3)
        const consolidated =
          // v2 via zarr.json has no .zmetadata
          version === 3 ? "consolidated_metadata" in json : false;
        return { isZarr: true, version, consolidated };
      }
    }
  } catch {
    /* I hope linter forgive me */
  }

  return { isZarr: false, version: null, consolidated: false };
}

/**
 * React hook wrapper around detectZarrStore.
 * Re-runs whenever `url` changes.
 */
export function useZarrDetector(url) {
  const [state, setState] = useState({
    isZarr: false,
    version: null,
    consolidated: false,
    checking: !!url,
  });

  useEffect(() => {
    if (!url) {
      setState({
        isZarr: false,
        version: null,
        consolidated: false,
        checking: false,
      });
      return () => {};
    }

    let cancelled = false;
    setState((s) => ({ ...s, checking: true }));

    (async () => {
      const result = await detectZarrStore(url);
      if (!cancelled) {
        setState({ ...result, checking: false });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [url]);

  return state;
}
