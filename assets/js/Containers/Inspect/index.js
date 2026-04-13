import React, { useState, useRef, useCallback } from "react";
import PropTypes from "prop-types";

import { withRouter } from "react-router";

import NcdumpDialog, { NcDumpDialogState } from "../../Components/NcdumpDialog";
import { useZarrStatus } from "../../Components/NcdumpDialog/useZarrStatus";
import { getCookie } from "../../utils";
import { TEMP_FREVA_AUTH_TOKEN } from "../Databrowser/constants";

const MAX_RETRIES = 20;
const RETRY_DELAY = 2000;

async function refreshTokenIfNeeded() {
  try {
    const res = await fetch("/api/token-health/", { credentials: "same-origin" });
    return res.ok;
  } catch {
    return false;
  }
}

function getTokenFromCookie() {
  const cookies = document.cookie.split(";");
  const authCookie = cookies.find((c) => c.trim().startsWith(TEMP_FREVA_AUTH_TOKEN));
  if (!authCookie) {
    return null;
  }
  try {
    let value = authCookie.substring(authCookie.indexOf("=") + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    return { access_token: value };
  } catch {
    return null;
  }
}

function InspectPage({ location, router }) {
  const raw = location.query.file;
  const files = raw ? (Array.isArray(raw) ? raw : [raw]) : [];
  const isAggregation = files.length > 1;
  const filename = isAggregation ? files : files[0] ?? null;

  const [ncdump, setNcDump] = useState({ status: NcDumpDialogState.READY, output: null, error: null });
  const [zarrUrl, setZarrUrl] = useState(null);
  const [rawZarrUrl, setRawZarrUrl] = useState(null);
  const { statusCode } = useZarrStatus(rawZarrUrl, { enabled: true });
  const abortRef = useRef(null);

  const loadNcdump = useCallback(async function loadNcdump(fn, retryCount = 0, aggregationConfig = null) {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();
    const { signal } = abortRef.current;

    await refreshTokenIfNeeded();
    if (signal.aborted) {
      return;
    }

    setNcDump({ status: NcDumpDialogState.LOADING, output: null, error: null });

    try {
      const tokenData = getTokenFromCookie();
      if (!tokenData?.access_token) {
        throw new Error("Authentication required. Please refresh your token.");
      }

      const headers = {
        "X-CSRFToken": getCookie("csrftoken"),
        Accept: "text/plain",
        Authorization: `Bearer ${tokenData.access_token}`,
      };

      const isAgg = Array.isArray(fn);
      const paths = isAgg ? fn : [fn];
      const requestBody = {
        path: paths.length === 1 ? paths[0] : paths,
        ...(aggregationConfig
          ? Object.fromEntries(Object.entries(aggregationConfig).filter(([, v]) => v !== null && v !== ""))
          : {}),
      };

      // Step 1: convert to zarr
      const convertRes = await fetch("/api/freva-nextgen/data-portal/zarr/convert", {
        method: "POST",
        credentials: "same-origin",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal,
      });
      if (!convertRes.ok) {
        throw new Error(`Failed to create zarr endpoint: ${await convertRes.text()}`);
      }
      const convertData = await convertRes.json();
      if (!convertData.urls?.length) {
        throw new Error("No zarr URL returned from server");
      }

      const rawUrl = convertData.urls[0];
      setRawZarrUrl(rawUrl);

      // Step 2: get presigned URL
      const presignRes = await fetch("/api/freva-nextgen/data-portal/share-zarr", {
        method: "POST",
        credentials: "same-origin",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ path: rawUrl, ttl_seconds: 3600 }),
        signal,
      });
      setZarrUrl((await presignRes.json()).url);

      // Step 3: fetch metadata HTML (with retry on 503)
      const timeout = isAgg ? aggregationConfig?.timeout || 120 : 60;
      const metaRes = await fetch(
        `/api/freva-nextgen/data-portal/zarr-utils/html?url=${encodeURIComponent(rawUrl)}&timeout=${timeout}`,
        { credentials: "same-origin", headers, signal }
      );

      if (metaRes.status === 503) {
        const text = await metaRes.text();
        if ((text.includes("processing") || text.includes("waiting")) && retryCount < MAX_RETRIES) {
          if (signal.aborted) {
            return;
          }
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
          if (signal.aborted) {
            return;
          }
          loadNcdump(fn, retryCount + 1, aggregationConfig);
          return;
        }
        throw new Error("Conversion failed or timed out");
      }

      if (!metaRes.ok) {
        throw new Error(`Metadata fetch failed: ${metaRes.statusText}`);
      }

      const html = await metaRes.text();
      if (!signal.aborted) {
        setNcDump({ status: NcDumpDialogState.READY, output: html, error: null });
      }
    } catch (err) {
      if (!signal.aborted) {
        setNcDump({ status: NcDumpDialogState.ERROR, output: null, error: err.message });
      }
    }
  }, []);

  React.useEffect(() => {
    if (statusCode === null) {
      return;
    }
    const terminalErrors = {
      1: "Zarr conversion failed on the server. Please retry.",
      2: "File not found — the server could not locate this file for streaming.",
    };
    if (terminalErrors[statusCode]) {
      setNcDump((prev) => ({ ...prev, status: NcDumpDialogState.ERROR, error: terminalErrors[statusCode] }));
    }
  }, [statusCode]);

  React.useEffect(() => {
    if (filename && !isAggregation) {
      loadNcdump(filename);
    }
  }, [filename, isAggregation, loadNcdump]);

  return (
    <NcdumpDialog
      show
      file={filename}
      isAggregation={isAggregation}
      zarrUrl={zarrUrl}
      zarrStatusCode={statusCode}
      status={ncdump.status}
      output={ncdump.output}
      error={ncdump.error}
      submitNcdump={(fn, config) => loadNcdump(fn, 0, config)}
      onClose={() => { document.title = document.title.replace("File Inspector", "Databrowser"); router.push("/databrowser/"); }}
    />
  );
}

InspectPage.propTypes = {
  location: PropTypes.shape({
    query: PropTypes.shape({
      file: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
    }).isRequired,
  }).isRequired,
  router: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
    push: PropTypes.func.isRequired,
  }).isRequired,
};

export default withRouter(InspectPage);