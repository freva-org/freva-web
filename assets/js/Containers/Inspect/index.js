import React, { useState, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import { withRouter } from "react-router";
import { Container } from "react-bootstrap";

import { AggregationConfig } from "../../Components/NcdumpDialog/AggregationConfig";
import { ZarrLoadingSteps } from "../../Components/NcdumpDialog/ZarrLoadingSteps";
import { NcDumpDialogState } from "../../Components/NcdumpDialog";
import { useZarrStatus } from "../../Components/NcdumpDialog/useZarrStatus";
import { getCookie } from "../../utils";
import { TEMP_FREVA_AUTH_TOKEN } from "../Databrowser/constants";

const MAX_RETRIES = 20;
const RETRY_DELAY = 2000;

async function refreshTokenIfNeeded() {
  try {
    const res = await fetch("/api/token-health/", {
      credentials: "same-origin",
    });
    return res.ok;
  } catch {
    return false;
  }
}

function getTokenFromCookie() {
  const cookies = document.cookie.split(";");
  const authCookie = cookies.find((c) =>
    c.trim().startsWith(TEMP_FREVA_AUTH_TOKEN)
  );
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

// Tab bar component

function TabBar({ activeTab, onTabChange, canViewGridlook }) {
  const tabs = [
    { id: "metadata", label: "Metadata", icon: "fa-database" },
    { id: "gridlook", label: "3D Viewer", icon: "fa-cube" },
  ];
  return (
    <div style={styles.tabBar}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const disabled = tab.id === "gridlook" && !canViewGridlook;
        return (
          <button
            key={tab.id}
            onClick={() => !disabled && onTabChange(tab.id)}
            disabled={disabled}
            style={{
              ...styles.tabBtn,
              ...(isActive ? styles.tabBtnActive : {}),
              ...(disabled ? styles.tabBtnDisabled : {}),
            }}
          >
            <i className={`fas ${tab.icon} me-2`} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

TabBar.propTypes = {
  activeTab: PropTypes.string.isRequired,
  onTabChange: PropTypes.func.isRequired,
  canViewGridlook: PropTypes.bool.isRequired,
};

// Empty state

function EmptyState() {
  return (
    <div style={styles.emptyState}>
      <div style={styles.emptyIconRing}>
        <i className="fas fa-microscope" style={styles.emptyIcon} />
      </div>
      <h4 style={styles.emptyTitle}>No file loaded</h4>
      <p style={styles.emptyText}>
        Enter a cliamte data path above and press <strong>Load</strong> to
        inspect its metadata and visualize its structure.
      </p>
      <div style={styles.emptyHints}>
        <div style={styles.hintBadge}>
          <i className="fas fa-info-circle me-1" style={{ color: "#3b82f6" }} />
          Supports single files and multi-file aggregations
        </div>
        <div style={styles.hintBadge}>
          <i className="fas fa-share-alt me-1" style={{ color: "#3b82f6" }} />
          Share inspect links via the URL — <code>?file=…</code>
        </div>
      </div>
    </div>
  );
}

// Main component

function InspectPage({ location, router }) {
  const raw = location.query.file;
  const initialFiles = raw ? (Array.isArray(raw) ? raw : [raw]) : [];
  const isAggregation = initialFiles.length > 1;
  const initialFilename = isAggregation
    ? initialFiles
    : (initialFiles[0] ?? null);

  // State
  const [pathInputs, setPathInputs] = useState(
    initialFiles.length > 0 ? initialFiles : [""]
  );
  const [activeTab, setActiveTab] = useState("metadata");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [gridlookCopied, setGridlookCopied] = useState(false);
  const [aggregationConfig, setAggregationConfig] = useState({
    aggregate: "auto",
    join: null,
    compat: null,
    data_vars: null,
    coords: null,
    dim: "",
    group_by: "",
    timeout: 120,
  });
  const [ncdump, setNcDump] = useState({
    status: NcDumpDialogState.READY,
    output: null,
    error: null,
  });
  const [zarrUrl, setZarrUrl] = useState(null);
  const [rawZarrUrl, setRawZarrUrl] = useState(null);
  const [currentFile, setCurrentFile] = useState(initialFilename);
  const [currentIsAgg, setCurrentIsAgg] = useState(isAggregation);

  const { statusCode } = useZarrStatus(rawZarrUrl, { enabled: true });
  const abortRef = useRef(null);
  const dropdownRef = useRef(null);
  const iframeRef = useRef(null);

  const loadNcdump = useCallback(async function loadNcdump(
    fn,
    retryCount = 0,
    aggregationConfig = null
  ) {
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
    setZarrUrl(null);
    setRawZarrUrl(null);

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
          ? Object.fromEntries(
              Object.entries(aggregationConfig).filter(
                ([, v]) => v !== null && v !== ""
              )
            )
          : {}),
      };

      const convertRes = await fetch(
        "/api/freva-nextgen/data-portal/zarr/convert",
        {
          method: "POST",
          credentials: "same-origin",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
          signal,
        }
      );
      if (!convertRes.ok) {
        throw new Error(
          `Failed to create zarr endpoint: ${await convertRes.text()}`
        );
      }
      const convertData = await convertRes.json();
      if (!convertData.urls?.length) {
        throw new Error("No zarr URL returned from server");
      }

      const rawUrl = convertData.urls[0];
      setRawZarrUrl(rawUrl);

      const presignRes = await fetch(
        "/api/freva-nextgen/data-portal/share-zarr",
        {
          method: "POST",
          credentials: "same-origin",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({ path: rawUrl, ttl_seconds: 3600 }),
          signal,
        }
      );
      setZarrUrl((await presignRes.json()).url);

      const timeout = isAgg ? aggregationConfig?.timeout || 120 : 60;
      const metaRes = await fetch(
        `/api/freva-nextgen/data-portal/zarr-utils/html?url=${encodeURIComponent(rawUrl)}&timeout=${timeout}`,
        { credentials: "same-origin", headers, signal }
      );

      if (metaRes.status === 503) {
        const text = await metaRes.text();
        if (
          (text.includes("processing") || text.includes("waiting")) &&
          retryCount < MAX_RETRIES
        ) {
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
        setNcDump({
          status: NcDumpDialogState.READY,
          output: html,
          error: null,
        });
      }
    } catch (err) {
      if (!signal.aborted) {
        setNcDump({
          status: NcDumpDialogState.ERROR,
          output: null,
          error: err.message,
        });
      }
    }
  }, []);

  // Effects
  React.useEffect(() => {
    if (statusCode === null) {
      return;
    }
    const terminalErrors = {
      1: "Zarr conversion failed on the server. Please retry.",
      2: "File not found — the server could not locate this file for streaming.",
    };
    if (terminalErrors[statusCode]) {
      setNcDump((prev) => ({
        ...prev,
        status: NcDumpDialogState.ERROR,
        error: terminalErrors[statusCode],
      }));
    }
  }, [statusCode]);

  React.useEffect(() => {
    if (initialFilename && !isAggregation) {
      loadNcdump(initialFilename);
    }
  }, []);

  React.useEffect(() => {
    function handleOutsideClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Path input helpers
  function updatePathInput(index, value) {
    setPathInputs((prev) => prev.map((v, i) => (i === index ? value : v)));
  }

  function addPathInput() {
    setPathInputs((prev) => [...prev, ""]);
  }

  function removePathInput(index) {
    setPathInputs((prev) => prev.filter((_, i) => i !== index));
  }

  // Handlers
  function handleLoad() {
    const filled = pathInputs.map((p) => p.trim()).filter(Boolean);
    if (!filled.length) {
      return;
    }

    if (filled.length === 1) {
      // Single file
      setCurrentFile(filled[0]);
      setCurrentIsAgg(false);
      setActiveTab("metadata");
      router.replace(`/inspect/?file=${encodeURIComponent(filled[0])}`);
      loadNcdump(filled[0]);
    } else {
      // Multiple files
      setCurrentFile(filled);
      setCurrentIsAgg(true);
      setActiveTab("metadata");
      setNcDump({ status: NcDumpDialogState.READY, output: null, error: null });
      setZarrUrl(null);
      setRawZarrUrl(null);
      const params = filled
        .map((f) => `file=${encodeURIComponent(f)}`)
        .join("&");
      router.replace(`/inspect/?${params}`);
    }
  }

  function handleForceReload() {
    const filled = pathInputs.map((p) => p.trim()).filter(Boolean);
    if (!filled.length) {
      return;
    }
    setDropdownOpen(false);
    loadNcdump(filled.length === 1 ? filled[0] : filled, 0, { reload: true });
  }

  function handleAggregateSubmit() {
    const files = Array.isArray(currentFile) ? currentFile : [];
    loadNcdump(files, 0, aggregationConfig);
  }

  function buildShareUrl() {
    if (currentIsAgg && Array.isArray(currentFile)) {
      const params = currentFile
        .map((f) => `file=${encodeURIComponent(f)}`)
        .join("&");
      return `${window.location.origin}/inspect/?${params}`;
    }
    const filled = pathInputs.map((p) => p.trim()).filter(Boolean);
    if (!filled.length) {
      return null;
    }
    const params = filled.map((f) => `file=${encodeURIComponent(f)}`).join("&");
    return `${window.location.origin}/inspect/?${params}`;
  }

  // Derived
  const filledInputs = pathInputs.map((p) => p.trim()).filter(Boolean);
  const isMultiFile = filledInputs.length > 1;
  const { status, output, error } = ncdump;
  const isLoading = status === NcDumpDialogState.LOADING;
  const hasOutput = status === NcDumpDialogState.READY && !!output;
  const hasError = status === NcDumpDialogState.ERROR;
  const hasContent = zarrUrl && (hasOutput || isLoading || hasError);
  const canViewGridlook = hasOutput && !!zarrUrl;
  const shareUrl = buildShareUrl();

  return (
    <div style={styles.page}>
      <Container style={styles.container}>
        {/* Page header */}
        <div style={styles.pageHeader}>
          <div style={styles.pageHeaderLeft}>
            <div style={styles.pageIconWrap}>
              <i
                className={`fas ${currentIsAgg ? "fa-layer-group" : "fa-microscope"}`}
                style={styles.pageIcon}
              />
            </div>
            <div>
              <h2 style={styles.pageTitle}>File Inspector</h2>
              <p style={styles.pageSubtitle}>
                Explore file contents, variables and structure
              </p>
            </div>
          </div>

          {shareUrl && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(shareUrl);
                setShareCopied(true);
                setTimeout(() => setShareCopied(false), 2000);
              }}
              style={styles.shareBtn}
              title={shareCopied ? "Link copied!" : "Copy shareable link"}
            >
              <i
                className={`fas fa-${shareCopied ? "check" : "share-alt"} me-2`}
              />
              {shareCopied ? "Copied!" : "Share"}
            </button>
          )}
        </div>

        {/* File input card */}
        <div style={styles.inputCard}>
          <label style={styles.inputLabel}>
            <i className="fas fa-file-alt me-2" style={{ color: "#3b82f6" }} />
            {pathInputs.length > 1 ? "File paths" : "File path"}
          </label>

          {/* Supported formats hint */}
          <div style={styles.formatHints}>
            <span style={styles.formatHintLabel}>Supports:</span>
            {["NetCDF", "GRIB", "HDF5", "Zarr"].map((fmt) => (
              <span
                key={fmt}
                style={{
                  fontSize: "11px",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  fontWeight: "600",
                  backgroundColor: window.MAIN_COLOR,
                  color: "white",
                  letterSpacing: "0.02em",
                }}
              >
                {fmt}
              </span>
            ))}
            <span style={styles.formatDivider}>·</span>
            {["remote", "local"].map((proto) => (
              <span
                key={proto}
                style={{
                  fontSize: "11px",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  fontFamily: "ui-monospace, monospace",
                  border: `1px solid ${window.MAIN_COLOR}`,
                  color: window.MAIN_COLOR,
                  backgroundColor: "transparent",
                }}
              >
                {proto}
              </span>
            ))}
          </div>

          {/* Stacked path inputs */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              marginBottom: "10px",
            }}
          >
            {pathInputs.map((val, idx) => (
              // eslint-disable-next-line react/no-array-index-key
              <div key={idx} style={styles.inputRow}>
                <span style={styles.inputIndex}>{idx + 1}</span>
                <input
                  type="text"
                  className="form-control"
                  value={val}
                  onChange={(e) => updatePathInput(idx, e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleLoad();
                    }
                  }}
                  placeholder="/path/to/your/data.nc"
                  style={styles.pathInput}
                  disabled={isLoading}
                />
                {pathInputs.length > 1 && (
                  <button
                    onClick={() => removePathInput(idx)}
                    disabled={isLoading}
                    style={styles.removeBtn}
                    title="Remove this path"
                  >
                    <i className="fas fa-times" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Bottom row: add + load */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <button
              onClick={addPathInput}
              disabled={isLoading}
              style={styles.addBtn}
              title="Add another file path to aggregate"
            >
              <i className="fas fa-plus me-2" />
              Add file
            </button>

            <div
              ref={dropdownRef}
              className="btn-group"
              style={{ position: "relative", flexShrink: 0 }}
            >
              <button
                className="btn btn-primary"
                onClick={handleLoad}
                disabled={!filledInputs.length || isLoading}
                style={{
                  ...styles.loadBtn,
                  borderRadius: isMultiFile ? "8px" : "8px 0 0 8px",
                }}
              >
                {isLoading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                    />
                    Loading…
                  </>
                ) : isMultiFile ? (
                  <>
                    <i className="fas fa-layer-group me-2" />
                    Aggregate &amp; Load
                  </>
                ) : (
                  <>
                    <i className="fas fa-search me-2" />
                    Load
                  </>
                )}
              </button>
              {!isMultiFile && (
                <>
                  <button
                    className="btn btn-primary dropdown-toggle dropdown-toggle-split"
                    onClick={() => setDropdownOpen((v) => !v)}
                    disabled={!filledInputs.length || isLoading}
                    style={{ padding: "0 10px" }}
                    title="More options"
                  >
                    <span className="visually-hidden">Toggle</span>
                  </button>
                  {dropdownOpen && (
                    <ul
                      className="dropdown-menu show"
                      style={{
                        position: "absolute",
                        top: "100%",
                        right: 0,
                        zIndex: 1050,
                        minWidth: "220px",
                        marginTop: "4px",
                      }}
                    >
                      <li>
                        <button
                          className="dropdown-item"
                          onClick={handleForceReload}
                          style={{ fontSize: "13px" }}
                        >
                          <i className="fas fa-ban me-2 text-warning" />
                          Force Reload (bypass cache)
                        </button>
                      </li>
                    </ul>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Zarr URL strip */}
        {zarrUrl && (
          <div style={styles.zarrStrip}>
            <i
              className="fas fa-link"
              style={{ color: "#6b7280", flexShrink: 0 }}
            />
            <span style={styles.zarrLabel}>Zarr:</span>
            <code style={styles.zarrCode}>{zarrUrl}</code>
            <button
              className="btn btn-sm"
              onClick={() => {
                navigator.clipboard.writeText(zarrUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              style={styles.stripBtn}
              title={copied ? "Copied!" : "Copy Zarr URL"}
            >
              <i className={`fas fa-${copied ? "check" : "copy"}`} />
            </button>
          </div>
        )}

        {/* Main content card */}
        <div style={styles.contentCard}>
          {hasContent && (
            <TabBar
              activeTab={activeTab}
              onTabChange={setActiveTab}
              canViewGridlook={canViewGridlook}
            />
          )}

          {/* Aggregation config — before first load */}
          {currentIsAgg && status === NcDumpDialogState.READY && !output && (
            <div style={{ padding: "24px" }}>
              <h5 className="mb-3">Aggregation Configuration</h5>
              <AggregationConfig
                initialConfig={aggregationConfig}
                onChange={(config) => setAggregationConfig(config)}
              />
              <div className="d-flex justify-content-end gap-2 mt-4">
                <button
                  className="btn btn-primary"
                  onClick={handleAggregateSubmit}
                >
                  <i className="fas fa-compress-arrows-alt me-2" />
                  Aggregate Files
                </button>
              </div>
            </div>
          )}

          {/* Loading (before zarr URL) */}
          {!zarrUrl && isLoading && (
            <div style={styles.centeredSection}>
              <ZarrLoadingSteps
                statusCode={statusCode ?? 6}
                isAggregation={currentIsAgg}
              />
              <p className="mt-3 text-muted" style={{ fontSize: "13px" }}>
                {currentIsAgg
                  ? "Aggregating files and loading metadata…"
                  : "Loading metadata…"}
              </p>
            </div>
          )}

          {/* Loading (zarr URL ready, polling metadata) */}
          {zarrUrl && isLoading && (
            <div style={styles.centeredSection}>
              <ZarrLoadingSteps
                statusCode={statusCode ?? 3}
                isAggregation={currentIsAgg}
              />
              <p className="mt-3 text-muted" style={{ fontSize: "13px" }}>
                {currentIsAgg
                  ? "Aggregating files and loading metadata…"
                  : "Loading metadata…"}
              </p>
            </div>
          )}

          {/* Error */}
          {hasError && activeTab === "metadata" && (
            <div style={styles.errorBox}>
              <div style={styles.errorInner}>
                <i
                  className="fas fa-exclamation-circle"
                  style={styles.errorIcon}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{ display: "block", marginBottom: "6px" }}>
                    Error loading metadata
                  </strong>
                  <div
                    style={{ wordWrap: "break-word", whiteSpace: "pre-wrap" }}
                  >
                    {error}
                  </div>
                  <button
                    className="btn btn-sm mt-2"
                    onClick={handleLoad}
                    style={styles.retryBtn}
                  >
                    <i className="fas fa-redo me-1" />
                    Retry
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Metadata tab */}
          {activeTab === "metadata" && hasOutput && (
            <div style={styles.metaContent}>
              <div
                className="xarray-metadata-display"
                dangerouslySetInnerHTML={{ __html: output }}
              />
            </div>
          )}

          {/* 3D Viewer tab */}
          {activeTab === "gridlook" && zarrUrl && (
            <div style={{ padding: "16px" }}>
              <div style={styles.gridlookBar}>
                <i
                  className="fas fa-external-link-alt"
                  style={{ color: "#0284c7", flexShrink: 0 }}
                />
                <span style={styles.gridlookLabel}>GridLook URL:</span>
                <code style={styles.gridlookCode}>
                  {`https://gridlook.pages.dev/#${zarrUrl}`}
                </code>
                <button
                  className="btn btn-sm"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `https://gridlook.pages.dev/#${zarrUrl}`
                    );
                    setGridlookCopied(true);
                    setTimeout(() => setGridlookCopied(false), 2000);
                  }}
                  style={styles.stripBtn}
                  title={gridlookCopied ? "Copied!" : "Copy link"}
                >
                  <i
                    className={`fas fa-${gridlookCopied ? "check" : "copy"}`}
                  />
                </button>
                <button
                  className="btn btn-sm"
                  onClick={() => {
                    setActiveTab("metadata");
                    setTimeout(() => setActiveTab("gridlook"), 0);
                  }}
                  style={styles.stripBtn}
                  title="Refresh viewer"
                >
                  <i className="fas fa-redo" />
                </button>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() =>
                    window.open(
                      `https://gridlook.pages.dev/#${zarrUrl}`,
                      "_blank"
                    )
                  }
                  style={{ fontSize: "12px", flexShrink: 0 }}
                >
                  <i className="fas fa-arrow-up-right-from-square me-1" />
                  Open in New Tab
                </button>
              </div>
              <div style={styles.iframeWrap}>
                <iframe
                  ref={iframeRef}
                  src={`https://gridlook.pages.dev/#${zarrUrl}`}
                  style={{ width: "100%", height: "100%", border: "none" }}
                  title="GridLook 3D Viewer"
                />
              </div>
            </div>
          )}

          {/* Empty state */}
          {!hasContent &&
            !isLoading &&
            status === NcDumpDialogState.READY &&
            !currentIsAgg && <EmptyState />}
        </div>
      </Container>
    </div>
  );
}

// Style

const styles = {
  page: {
    minHeight: "calc(100vh - 56px)",
    backgroundColor: "#f8f9fa",
    paddingBottom: "40px",
  },
  container: { paddingTop: "28px", maxWidth: "1200px" },
  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "20px",
    flexWrap: "wrap",
    gap: "12px",
  },
  pageHeaderLeft: { display: "flex", alignItems: "center", gap: "14px" },
  pageIconWrap: {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    backgroundColor: "#eff6ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  pageIcon: { fontSize: "20px", color: "#3b82f6" },
  pageTitle: {
    margin: 0,
    fontSize: "24px",
    fontWeight: "700",
    color: "#111827",
    lineHeight: 1.2,
  },
  pageSubtitle: {
    margin: 0,
    fontSize: "13px",
    color: "#6b7280",
    marginTop: "2px",
  },
  shareBtn: {
    padding: "8px 16px",
    fontSize: "13px",
    backgroundColor: "white",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    color: "#374151",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    fontWeight: "500",
  },
  formatHints: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "5px",
    marginBottom: "12px",
  },
  formatHintLabel: {
    fontSize: "11px",
    color: "#9ca3af",
    fontWeight: "600",
    marginRight: "2px",
  },
  formatDivider: { color: "#d1d5db", fontSize: "12px", margin: "0 2px" },
  inputCard: {
    backgroundColor: "white",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    padding: "20px",
    marginBottom: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  },
  inputLabel: {
    display: "block",
    fontSize: "13px",
    fontWeight: "600",
    color: "#374151",
    marginBottom: "10px",
  },
  inputRow: { display: "flex", gap: "8px", alignItems: "center" },
  inputIndex: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#9ca3af",
    minWidth: "16px",
    textAlign: "right",
    flexShrink: 0,
  },
  pathInput: {
    flex: "1 1 300px",
    fontSize: "14px",
    fontFamily: "ui-monospace, monospace",
    padding: "10px 14px",
    borderRadius: "8px",
    minWidth: 0,
  },
  addBtn: {
    fontSize: "13px",
    padding: "7px 14px",
    background: "white",
    border: "1px dashed #d1d5db",
    borderRadius: "8px",
    color: "#6b7280",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    fontWeight: "500",
    transition: "all 0.15s",
  },
  removeBtn: {
    padding: "8px 10px",
    background: "white",
    border: "1px solid #fee2e2",
    borderRadius: "7px",
    color: "#ef4444",
    cursor: "pointer",
    flexShrink: 0,
    fontSize: "12px",
  },
  loadBtn: {
    padding: "10px 20px",
    fontSize: "14px",
    borderRadius: "8px 0 0 8px",
    fontWeight: "600",
    whiteSpace: "nowrap",
  },
  zarrStrip: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 16px",
    backgroundColor: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    fontSize: "12px",
    marginBottom: "12px",
    flexWrap: "wrap",
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
  },
  zarrLabel: { color: "#6b7280", fontWeight: "600", flexShrink: 0 },
  zarrCode: {
    flex: 1,
    backgroundColor: "#f9fafb",
    padding: "4px 10px",
    borderRadius: "6px",
    fontSize: "11px",
    color: "#1f2937",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    border: "1px solid #e5e7eb",
    minWidth: 0,
  },
  stripBtn: {
    padding: "4px 10px",
    fontSize: "12px",
    backgroundColor: "white",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    color: "#374151",
    flexShrink: 0,
    cursor: "pointer",
  },
  contentCard: {
    backgroundColor: "white",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    overflow: "hidden",
    minHeight: "300px",
  },
  tabBar: {
    display: "flex",
    gap: "2px",
    borderBottom: "2px solid #f3f4f6",
    padding: "0 4px",
    backgroundColor: "#fafafa",
  },
  tabBtn: {
    padding: "14px 20px",
    fontSize: "14px",
    fontWeight: "500",
    backgroundColor: "transparent",
    border: "none",
    borderBottom: "3px solid transparent",
    cursor: "pointer",
    color: "#6b7280",
    transition: "all 0.15s ease",
    marginBottom: "-2px",
  },
  tabBtnActive: {
    fontWeight: "700",
    color: "#1f2937",
    borderBottom: "3px solid #3b82f6",
    backgroundColor: "white",
  },
  tabBtnDisabled: { opacity: 0.4, cursor: "not-allowed" },
  centeredSection: { textAlign: "center", padding: "48px 24px" },
  errorBox: {
    margin: "20px",
    borderRadius: "10px",
    backgroundColor: "#fee2e2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    fontSize: "13px",
    padding: "16px",
  },
  errorInner: { display: "flex", alignItems: "flex-start", gap: "12px" },
  errorIcon: { fontSize: "20px", marginTop: "2px", flexShrink: 0 },
  retryBtn: {
    backgroundColor: "#dc2626",
    color: "white",
    border: "none",
    padding: "6px 14px",
    fontSize: "12px",
    borderRadius: "6px",
    cursor: "pointer",
  },
  metaContent: {
    padding: "24px",
    overflowX: "auto",
    display: "flex",
    justifyContent: "center",
  },
  gridlookBar: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "8px",
    padding: "12px 14px",
    backgroundColor: "#eff6ff",
    borderRadius: "10px",
    fontSize: "12px",
    marginBottom: "14px",
    border: "1px solid #bfdbfe",
  },
  gridlookLabel: { color: "#0284c7", fontWeight: "600", flexShrink: 0 },
  gridlookCode: {
    flex: 1,
    backgroundColor: "white",
    padding: "6px 10px",
    borderRadius: "6px",
    fontSize: "11px",
    color: "#1f2937",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    border: "1px solid #93c5fd",
    minWidth: 0,
  },
  iframeWrap: {
    width: "100%",
    height: "600px",
    backgroundColor: "#f9fafb",
    borderRadius: "10px",
    overflow: "hidden",
    border: "1px solid #e5e7eb",
  },
  emptyState: { padding: "64px 32px", textAlign: "center" },
  emptyIconRing: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    backgroundColor: "#eff6ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 20px",
  },
  emptyIcon: { fontSize: "36px", color: "#93c5fd" },
  emptyTitle: { fontWeight: "700", color: "#374151", marginBottom: "10px" },
  emptyText: {
    color: "#6b7280",
    fontSize: "14px",
    maxWidth: "420px",
    margin: "0 auto 24px",
    lineHeight: "1.6",
  },
  emptyHints: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "10px",
  },
  hintBadge: {
    fontSize: "12px",
    padding: "8px 14px",
    backgroundColor: "#f3f4f6",
    borderRadius: "20px",
    color: "#374151",
    border: "1px solid #e5e7eb",
  },
};

InspectPage.propTypes = {
  location: PropTypes.shape({
    query: PropTypes.shape({
      file: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.arrayOf(PropTypes.string),
      ]),
    }).isRequired,
  }).isRequired,
  router: PropTypes.shape({
    replace: PropTypes.func.isRequired,
    push: PropTypes.func.isRequired,
    goBack: PropTypes.func.isRequired,
  }).isRequired,
};

export default withRouter(InspectPage);
