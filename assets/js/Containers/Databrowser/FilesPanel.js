import React, { useState, useRef } from "react";
import PropTypes from "prop-types";

import { connect } from "react-redux";
import { Tooltip, OverlayTrigger, Button } from "react-bootstrap";
import { withRouter } from "react-router";

import { FaInfoCircle } from "react-icons/fa";

import queryString from "query-string";

import NcdumpDialog, { NcDumpDialogState } from "../../Components/NcdumpDialog";
import CircularSpinner from "../../Components/Spinner";

import { getCookie } from "../../utils";
import Pagination from "../../Components/Pagination";

import { BATCH_SIZE, TEMP_FREVA_AUTH_TOKEN } from "./constants";

const MAX_RETRIES = 20;
const RETRY_DELAY = 2000;

async function refreshTokenIfNeeded() {
  try {
    const response = await fetch("/api/token-health/", {
      credentials: "same-origin",
      method: "GET",
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

function FilesPanelImpl(props) {
  const { files, numFiles, fileLoading } = props.databrowser;
  const [showDialog, setShowDialog] = useState(false);
  const [ncdump, setNcDump] = useState({
    status: NcDumpDialogState.READY,
    output: null,
    error: null,
  });
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

  function getTokenFromCookie() {
    const cookies = document.cookie.split(";");
    const authCookie = cookies.find((cookie) =>
      cookie.trim().startsWith(TEMP_FREVA_AUTH_TOKEN)
    );

    if (!authCookie) {
      return null;
    }

    try {
      let cookieValue = authCookie
        .substring(authCookie.indexOf("=") + 1)
        .trim();
      if (cookieValue.startsWith('"') && cookieValue.endsWith('"')) {
        cookieValue = cookieValue.slice(1, -1);
      }
      return {
        access_token: cookieValue,
        token_type: "Bearer",
      };
    } catch (error) {
      return null;
    }
  }

  // Toggle file selection
  function toggleFileSelection(fn) {
    setSelectedFiles((prev) => {
      if (prev.includes(fn)) {
        return prev.filter((f) => f !== fn);
      } else {
        return [...prev, fn];
      }
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

  async function loadNcdump(fn, retryCount = 0, aggregationConfig = null) {
    // flush any previous request
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

      // Step 1: we use convert endpoint to be able to even
      // publush the zarr-endpoint arbitrary paths that are
      // indexed in the search backend.
      const isAggregation = Array.isArray(fn);
      const paths = isAggregation ? fn : [fn];

      const convertUrl = `/api/freva-nextgen/data-portal/zarr/convert`;

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

      const response = await fetch(convertUrl, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to create zarr endpoint: ${errorText || response.statusText}`
        );
      }

      const data = await response.json();
      if (!data.urls || data.urls.length === 0) {
        throw new Error("No zarr URL returned from server");
      }

      const rawzarrUrl = data.urls[0];

      // Step 1.5: Create presigned URL
      const presignResponse = await fetch(
        "/api/freva-nextgen/data-portal/share-zarr",
        {
          method: "POST",
          credentials: "same-origin",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({ path: rawzarrUrl, ttl_seconds: 3600 }),
          signal,
        }
      );
      const presignData = await presignResponse.json();
      const zarrUrl = presignData.url;
      setZarrUrl(zarrUrl);

      // Step 2: Get metadata with retry logic
      const timeout = isAggregation ? 120 : 60;
      const htmlUrl = `/api/freva-nextgen/data-portal/zarr-utils/html?url=${encodeURIComponent(rawzarrUrl)}&timeout=${timeout}`;
      const metadataResponse = await fetch(htmlUrl, {
        method: "GET",
        credentials: "same-origin",
        headers,
        signal,
      });

      // Handle 503
      if (metadataResponse.status === 503) {
        const errorText = await metadataResponse.text();

        // retriable state check
        if (
          (errorText.includes("processing") || errorText.includes("waiting")) &&
          retryCount < MAX_RETRIES
        ) {
          if (signal.aborted) {
            return;
          }

          setNcDump({
            status: NcDumpDialogState.LOADING,
            output: null,
            error: null,
          });
          // Wait before retrying
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
          if (signal.aborted) {
            return;
          }

          await loadNcdump(fn, retryCount + 1, aggregationConfig);
          return;
        }
        // If it's "finished, failed" or max retries reached
        throw new Error(errorText || "Service unavailable");
      }

      if (!metadataResponse.ok) {
        const errorText = await metadataResponse.text();
        throw new Error(errorText || "Failed to get metadata");
      }
      // IMPORTANT: Get the xarray HTML directly from backend,
      // no need to be processed in frontend.
      const htmlOutput = await metadataResponse.text();

      setNcDump({
        output: htmlOutput,
        status: NcDumpDialogState.READY,
        error: null,
      });
    } catch (error) {
      // Ignore abort errors since it's alreadt cancelled)
      if (error.name === "AbortError") {
        return;
      }

      let errorMessage = error.message;

      if (error.message.includes("Authentication")) {
        errorMessage = "Authentication error. Please refresh your token.";
      } else if (error.message.includes("Failed to fetch")) {
        errorMessage = "Network error. Please check your connection.";
      } else if (error.message.includes("service not able to publish")) {
        errorMessage =
          "Zarr streaming service is not enabled. Please contact your administrator.";
      } else if (error.message.includes("Failed to get zarr URL")) {
        errorMessage = `Cannot create zarr endpoint: ${error.message.split(": ")[1] || error.message}`;
      }
      // TODO: further error message parsing regarind zarr streaming can be done here

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
              {selectedFiles.length} file{selectedFiles.length !== 1 ? "s" : ""}{" "}
              selected
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
        className="jqueryFileTree border shadow-sm py-3 rounded"
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
                  className="form-check-input"
                  style={{
                    cursor: "pointer",
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
          // Cancel any pending request when closing
          if (abortControllerRef.current) {
            abortControllerRef.current.abort();
          }
          setShowDialog(false);
          setZarrUrl(null);
          setNcDump({
            status: NcDumpDialogState.READY,
            error: null,
            output: null,
          });
        }}
        submitNcdump={(fn, aggregationConfig) =>
          loadNcdump(fn, 0, aggregationConfig)
        }
        status={ncdump.status}
        output={ncdump.output}
        error={ncdump.error}
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
