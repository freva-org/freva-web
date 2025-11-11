import React, { useState } from "react";
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

  async function loadNcdump(fn) {
    await refreshTokenIfNeeded();
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
      const queryParams = new URLSearchParams({
        path: fn,
      });

      const convertUrl = `/api/freva-nextgen/data-portal/zarr/convert?${queryParams}`;

      const response = await fetch(convertUrl, {
        method: "GET",
        credentials: "same-origin",
        headers,
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

      const zarrUrl = data.urls[0];

      if (!zarrUrl || zarrUrl.length === 0) {
        throw new Error("Empty zarr URL returned from server");
      }

      const getPathFromUrl = (url) => {
        try {
          const urlObj = new URL(url);
          return urlObj.pathname;
        } catch {
          return url;
        }
      };

      const relativeZarrUrl = getPathFromUrl(zarrUrl);

      setZarrUrl(zarrUrl);

      // Step 2:  Use the returned zarr URL directly to get metadata
      const metadataHeaders = {
        ...headers,
        Accept: "text/html",
      };

      const metadataUrl = `${relativeZarrUrl}/view`;

      const metadataResponse = await fetch(metadataUrl, {
        method: "GET",
        credentials: "same-origin",
        headers: metadataHeaders,
      });

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

  return (
    <div className="pb-3">
      <span className="d-flex justify-content-between">
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
            return (
              <li className="ext_nc" key={fn} style={{ whiteSpace: "normal" }}>
                <OverlayTrigger
                  overlay={<Tooltip>Click here to inspect metadata</Tooltip>}
                >
                  <Button
                    variant="link"
                    className="p-0 me-1"
                    onClick={() => {
                      setFilename(fn);
                      setShowDialog(true);
                    }}
                  >
                    <FaInfoCircle className="ncdump" />
                  </Button>
                </OverlayTrigger>
                {fn}
              </li>
            );
          })
        )}
      </ul>
      <NcdumpDialog
        show={showDialog}
        file={filename}
        zarrUrl={zarrUrl}
        onClose={() => {
          setShowDialog(false);
          setZarrUrl(null);
          setNcDump({
            status: NcDumpDialogState.READY,
            error: null,
            output: null,
          });
        }}
        submitNcdump={(fn) => loadNcdump(fn)}
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
