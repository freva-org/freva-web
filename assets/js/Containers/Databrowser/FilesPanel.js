import React, { useState, useRef } from "react";
import PropTypes from "prop-types";

import { connect } from "react-redux";
import { Tooltip, OverlayTrigger, Button } from "react-bootstrap";
import { withRouter } from "react-router";

import { FaInfoCircle } from "react-icons/fa";

import queryString from "query-string";

import NcdumpDialog, { NcDumpDialogState } from "../../Components/NcdumpDialog";
import CircularSpinner from "../../Components/Spinner";

import {
  getCookie,
  getTokenFromCookie,
  refreshTokenIfNeeded,
} from "../../utils";
import Pagination from "../../Components/Pagination";

import { useZarrStatus } from "../../Components/NcdumpDialog/useZarrStatus";
import { useHtmlMetadata } from "../../Components/NcdumpDialog/useHtmlMetadata";
import { detectZarrStore } from "../../Components/NcdumpDialog/detectZarrStore";

import { BATCH_SIZE } from "./constants";

const MAX_FILE_SELECTION = 10;

function FilesPanelImpl(props) {
  const { files, numFiles, fileLoading } = props.databrowser;
  const [showDialog, setShowDialog] = useState(false);
  const [rawZarrUrl, setRawZarrUrl] = useState(null);
  const [isDirectZarr, setIsDirectZarr] = useState(false);
  const [ncdump, setNcDump] = useState({
    status: NcDumpDialogState.READY,
    output: null,
    error: null,
  });

  const { statusCode, statusReason } = useZarrStatus(rawZarrUrl, {
    enabled: showDialog && !isDirectZarr,
  });

  // Only activates once the zarr job is done (statusCode === 0),
  // or immediately if the URL was already a zarr store.
  const { html: htmlMetadata, error: htmlError } = useHtmlMetadata(rawZarrUrl, {
    enabled: isDirectZarr || statusCode === 0,
  });

  // React to zarr job failure interpretaion
  React.useEffect(() => {
    if (statusCode === null) {
      return;
    }
    if (statusCode === 1) {
      setNcDump({
        status: NcDumpDialogState.ERROR,
        output: null,
        error:
          statusReason || "Zarr conversion failed on the server. Please retry.",
      });
    }
    if (statusCode === 2) {
      setNcDump({
        status: NcDumpDialogState.ERROR,
        output: null,
        error:
          statusReason ||
          "File not found — the server could not locate this file for streaming.",
      });
    }
  }, [statusCode, statusReason]);

  // React to HTML metadata arriving (or failing after retries)
  React.useEffect(() => {
    if (htmlMetadata) {
      setNcDump({
        status: NcDumpDialogState.READY,
        output: htmlMetadata,
        error: null,
      });
    }
    if (htmlError) {
      setNcDump({
        status: NcDumpDialogState.ERROR,
        output: null,
        error: htmlError,
      });
    }
  }, [htmlMetadata, htmlError]);

  const [filename, setFilename] = useState(null);
  const [zarrUrl, setZarrUrl] = useState(null);
  const [showPathInput, setShowPathInput] = useState(false);
  const [pathInput, setPathInput] = useState("");

  // Selection state for aggregation
  const [selectedFiles, setSelectedFiles] = useState([]);

  const abortControllerRef = useRef(null);

  function setPageOffset(offset) {
    const currentLocation = props.location.pathname;
    const query = queryString.stringify({
      ...props.location.query,
      start: (offset - 1) * BATCH_SIZE,
    });
    props.router.push(currentLocation + "?" + query);
  }

  // Toggle file selection
  function toggleFileSelection(fn) {
    setSelectedFiles((prev) => {
      if (prev.includes(fn)) {
        return prev.filter((f) => f !== fn);
      }
      if (prev.length >= MAX_FILE_SELECTION) {
        return prev;
      }
      return [...prev, fn];
    });
  }

  // Open aggregation dialog
  function openAggregationDialog() {
    if (selectedFiles.length === 0) {
      return;
    }
    setFilename(selectedFiles);
    setShowDialog(true);
  }

  // Clear selection
  function clearSelection() {
    setSelectedFiles([]);
  }

  /**
   * Submits the zarr conversion job and presigns the URL for sharing.
   * Returns immediately after both fast steps; the heavy lifting (conversion
   * + metadata fetch) is handled asynchronously by useZarrStatus and
   * useHtmlMetadata respectively; no blocking wait here.
   */
  async function loadNcdump(fn, aggregationConfig = null) {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

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
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenData.access_token}`,
      };

      const paths = Array.isArray(fn) ? fn : [fn];
      const hasAggConfig =
        aggregationConfig &&
        Object.values(aggregationConfig).some((v) => v !== null && v !== "");

      // Skip conversion for a single remote zarr URL with no active
      // aggregation parameters
      if (paths.length === 1 && paths[0].startsWith("http") && !hasAggConfig) {
        const { isZarr } = await detectZarrStore(paths[0]);
        if (isZarr) {
          setIsDirectZarr(true);
          setRawZarrUrl(paths[0]);
          return;
        }
      }
      setIsDirectZarr(false);

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

      // Step 1: submit conversion job; worker picks this up async, returns
      // immediately with a zarr URL. Setting rawZarrUrl starts useZarrStatus.
      const convertRes = await fetch(
        "/api/freva-nextgen/data-portal/zarr/convert",
        {
          method: "POST",
          credentials: "same-origin",
          headers,
          body: JSON.stringify(requestBody),
          signal,
        }
      );
      if (!convertRes.ok) {
        let detail = convertRes.statusText;
        try {
          const body = await convertRes.json();
          detail = body.detail || body.message || detail;
        } catch {
          // non-JSON body; keep statusText
        }
        throw new Error(detail);
      }
      const { urls } = await convertRes.json();
      if (!urls?.length) {
        throw new Error("No zarr URL returned from server");
      }

      const rawUrl = urls[0];
      // starts useZarrStatus polling
      setRawZarrUrl(rawUrl);

      // Step 2: presign for sharing / GridLook.
      const presignRes = await fetch(
        "/api/freva-nextgen/data-portal/share-zarr",
        {
          method: "POST",
          credentials: "same-origin",
          headers,
          body: JSON.stringify({ path: rawUrl, ttl_seconds: 3600 }),
          signal,
        }
      );
      if (presignRes.ok) {
        setZarrUrl((await presignRes.json()).url);
      }

      // Step3. Done. useZarrStatus polls /status; once status=0, useHtmlMetadata
      // polls /html with short timeouts and retries until it gets the content.
    } catch (err) {
      if (err.name === "AbortError") {
        return;
      }

      let errorMessage = err.message;
      if (err.message.includes("Authentication")) {
        errorMessage = "Authentication error. Please refresh your token.";
      } else if (err.message.includes("Failed to fetch")) {
        errorMessage = "Network error. Please check your connection.";
      } else if (err.message.includes("service not able to publish")) {
        errorMessage =
          "Zarr streaming service is not enabled. Please contact your administrator.";
      }

      setNcDump({
        output: null,
        status: NcDumpDialogState.ERROR,
        error: errorMessage,
      });
    }
  }

  const hasSelection = selectedFiles.length > 0;

  return (
    <div className="pb-3">
      {/* Action Bar */}
      {hasSelection && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: "50%",
            transform: "translateX(-50%)",
            maxWidth: "600px",
            width: "calc(100% - 32px)",
            margin: "0 16px",
            padding: "12px 20px",
            backgroundColor: "#e3f2fd",
            border: "1px solid #2196f3",
            borderRadius: "8px 8px 0 0",
            boxShadow: "0 -4px 12px rgba(0,0,0,0.15)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          <div className="d-flex align-items-center gap-2">
            <button
              className="btn btn-sm btn-link text-primary p-1"
              onClick={clearSelection}
              style={{ fontSize: "16px" }}
            >
              <i className="fas fa-times"></i>
            </button>
            <span style={{ fontSize: "14px", fontWeight: "500" }}>
              {selectedFiles.length}/{MAX_FILE_SELECTION} file
              {selectedFiles.length !== 1 ? "s" : ""} selected
              {selectedFiles.length >= MAX_FILE_SELECTION && (
                <span
                  style={{
                    color: "#f57c00",
                    marginLeft: "6px",
                    fontSize: "12px",
                  }}
                >
                  (max reached)
                </span>
              )}
            </span>
          </div>
          <button
            className="btn btn-sm btn-primary"
            onClick={openAggregationDialog}
          >
            <i className="fas fa-compress-arrows-alt me-2"></i>
            Aggregate
          </button>
        </div>
      )}

      <span className="d-flex justify-content-between align-items-start">
        <h3 className="d-inline">
          <span>Files</span>
        </h3>
        <div className="mb-2 d-flex align-items-end flex-column gap-2">
          <button
            className="btn btn-sm btn-outline-primary"
            onClick={() => setShowPathInput(!showPathInput)}
            style={{ fontSize: "13px" }}
          >
            <i className="fas fa-folder-open me-1"></i>
            Inspect Path
          </button>
          <Pagination
            items={Math.ceil(props.databrowser.numFiles / BATCH_SIZE)}
            active={Math.floor(props.databrowser.start / BATCH_SIZE) + 1}
            totalFiles={numFiles}
            batchSize={BATCH_SIZE}
            handleSubmit={setPageOffset}
          />
        </div>
      </span>

      {/* Path Input Section */}
      {showPathInput && (
        <div
          className="mb-3 p-3 border rounded"
          style={{ backgroundColor: "#f9fafb" }}
        >
          <label
            className="form-label mb-2"
            style={{ fontSize: "14px", fontWeight: "500" }}
          >
            <i className="fas fa-file me-1"></i>
            Enter file path to inspect metadata:
          </label>
          <div className="d-flex gap-2">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="/path/to/your/data.nc"
              value={pathInput}
              onChange={(e) => setPathInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && pathInput.trim()) {
                  setFilename(pathInput.trim());
                  setShowDialog(true);
                  setShowPathInput(false);
                }
              }}
            />
            <button
              className="btn btn-sm btn-primary"
              onClick={() => {
                if (pathInput.trim()) {
                  setFilename(pathInput.trim());
                  setShowDialog(true);
                  setShowPathInput(false);
                }
              }}
              disabled={!pathInput.trim()}
            >
              <i className="fas fa-search me-1"></i>
              Inspect
            </button>
          </div>
        </div>
      )}

      <ul
        className="jqueryFileTree border shadow-sm pb-3 rounded"
        style={{ maxHeight: "1000px", overflow: "auto" }}
      >
        {fileLoading ? (
          <CircularSpinner />
        ) : (
          files.map((fn) => {
            const isSelected = selectedFiles.includes(fn);
            return (
              <li
                className="ext_nc"
                key={fn}
                style={{
                  whiteSpace: "normal",
                  backgroundColor: isSelected ? "#e3f2fd" : "transparent",
                  padding: "6px 8px",
                  borderRadius: "4px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "background-color 0.15s ease",
                }}
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleFileSelection(fn)}
                  disabled={
                    !isSelected && selectedFiles.length >= MAX_FILE_SELECTION
                  }
                  className="form-check-input"
                  style={{
                    cursor:
                      !isSelected && selectedFiles.length >= MAX_FILE_SELECTION
                        ? "not-allowed"
                        : "pointer",
                    marginTop: 0,
                    flexShrink: 0,
                  }}
                />

                {/* Info icon */}
                <OverlayTrigger overlay={<Tooltip>Inspect metadata</Tooltip>}>
                  <Button
                    variant="link"
                    className="p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFilename(fn);
                      setShowDialog(true);
                    }}
                    style={{ flexShrink: 0 }}
                  >
                    <FaInfoCircle className="ncdump" />
                  </Button>
                </OverlayTrigger>

                {/* Filename */}
                <span
                  style={{ flex: 1, cursor: "pointer" }}
                  onClick={() => toggleFileSelection(fn)}
                >
                  {fn}
                </span>
              </li>
            );
          })
        )}
      </ul>

      <NcdumpDialog
        show={showDialog}
        file={filename}
        zarrUrl={zarrUrl}
        isAggregation={Array.isArray(filename)}
        onClose={() => {
          if (abortControllerRef.current) {
            abortControllerRef.current.abort();
          }
          // Setting rawZarrUrl to null stops both useZarrStatus and
          // useHtmlMetadata via their dependency arrays.
          setShowDialog(false);
          setZarrUrl(null);
          setRawZarrUrl(null);
          setNcDump({
            status: NcDumpDialogState.READY,
            error: null,
            output: null,
          });
        }}
        submitNcdump={(fn, aggregationConfig) =>
          loadNcdump(fn, aggregationConfig)
        }
        status={ncdump.status}
        output={ncdump.output}
        error={ncdump.error}
        zarrStatusCode={statusCode}
      />
    </div>
  );
}

FilesPanelImpl.propTypes = {
  databrowser: PropTypes.shape({
    facets: PropTypes.object,
    files: PropTypes.array,
    fileLoading: PropTypes.bool,
    facetLoading: PropTypes.bool,
    numFiles: PropTypes.number,
    start: PropTypes.number,
    selectedFacets: PropTypes.object,
    metadata: PropTypes.object,
    dateSelector: PropTypes.string,
    minDate: PropTypes.string,
    maxDate: PropTypes.string,
  }),
  location: PropTypes.object.isRequired,
  router: PropTypes.object.isRequired,
  error: PropTypes.string,
  dispatch: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  databrowser: state.databrowserReducer,
  error: state.appReducer.error,
});

export default withRouter(connect(mapStateToProps)(FilesPanelImpl));
