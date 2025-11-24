import React from "react";
import PropTypes from "prop-types";

import Spinner from "../Spinner";

export const NcDumpDialogState = {
  ERROR: "error",
  READY: "ready",
  LOADING: "loading",
};

class NcdumpDialog extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      pathInput: props.file || "",
      copied: false,
      gridlookCopied: false,
      activeTab: "metadata",
    };
    this.handleBackdropClick = this.handleBackdropClick.bind(this);
    this.handleInspect = this.handleInspect.bind(this);
    this.iframeRef = React.createRef();
  }

  componentDidUpdate(prevProps) {
    // TODO: temporary workaround to reset to metadata tab on open
    // because on big data such as cmip6, gridlook may take time to load
    // so we want to show metadata tab first and then switch to gridlook
    // when user clicks on gridlook tab again. it's a trick to improve
    // perceived performance.
    if (!prevProps.show && this.props.show) {
      this.setState({ activeTab: "metadata" });
    }
    if (prevProps.file !== this.props.file && this.props.file) {
      this.setState({ pathInput: this.props.file });
    }

    if (
      !prevProps.show &&
      this.props.show &&
      !this.props.output &&
      this.props.status === NcDumpDialogState.READY
    ) {
      this.props.submitNcdump(this.props.file);
    }
  }

  handleBackdropClick(e) {
    if (e.target === e.currentTarget) {
      this.props.onClose();
    }
  }

  handleInspect() {
    if (this.state.pathInput.trim()) {
      this.props.submitNcdump(this.state.pathInput.trim());
    }
  }

  render() {
    const { show, onClose, status, output, zarrUrl, error } = this.props;

    if (!show) {
      return null;
    }

    return (
      <div
        className="token-modal show"
        onClick={this.handleBackdropClick}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "12px",
        }}
      >
        <div
          className="token-modal-content"
          style={{
            maxWidth: "1200px",
            width: "100%",
            maxHeight: "95vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header */}
          <div
            className="token-header"
            style={{
              flexShrink: 0,
              borderBottom: "1px solid #e5e7eb",
              paddingBottom: "12px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "8px",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <h1
                  style={{
                    marginBottom: "12px",
                    fontSize: "clamp(16px, 4vw, 20px)",
                  }}
                >
                  <i
                    className="fas fa-info-circle me-2"
                    style={{ fontSize: "16px", color: "#3b82f6" }}
                  ></i>
                  File Inspector
                </h1>
                {/* Zarr URL */}
                {zarrUrl && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "6px",
                      padding: "8px 10px",
                      backgroundColor: "#f3f4f6",
                      borderRadius: "6px",
                      fontSize: "11px",
                      marginBottom: "8px",
                    }}
                  >
                    {/* Path Input */}
                    <div
                      style={{
                        marginBottom: "8px",
                        width: "100%",
                      }}
                    >
                      <label
                        style={{
                          display: "block",
                          fontSize: "12px",
                          color: "#6b7280",
                          marginBottom: "4px",
                          fontWeight: "500",
                        }}
                      >
                        File path:
                      </label>
                      <div
                        style={{
                          display: "flex",
                          gap: "6px",
                          flexWrap: "wrap",
                        }}
                      >
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={this.state.pathInput}
                          onChange={(e) =>
                            this.setState({ pathInput: e.target.value })
                          }
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              this.handleInspect();
                            }
                          }}
                          placeholder="/path/to/data.nc"
                          style={{
                            flex: "1 1 200px",
                            fontSize: "13px",
                            padding: "6px 10px",
                            minWidth: 0,
                          }}
                        />
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={this.handleInspect}
                          disabled={
                            !this.state.pathInput.trim() ||
                            status === NcDumpDialogState.LOADING
                          }
                          style={{
                            padding: "6px 14px",
                            fontSize: "13px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <i className="fas fa-sync-alt me-1"></i>
                          Load
                        </button>
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        flex: "1 1 100%",
                        minWidth: 0,
                      }}
                    >
                      <i
                        className="fas fa-link"
                        style={{ color: "#6b7280", flexShrink: 0 }}
                      ></i>
                      <span
                        style={{
                          color: "#6b7280",
                          fontWeight: "500",
                          flexShrink: 0,
                        }}
                      >
                        Zarr:
                      </span>
                      <code
                        style={{
                          flex: 1,
                          backgroundColor: "white",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "10px",
                          color: "#1f2937",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          border: "1px solid #e5e7eb",
                          minWidth: 0,
                        }}
                      >
                        {zarrUrl}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(zarrUrl);
                          this.setState({ copied: true });
                          setTimeout(
                            () => this.setState({ copied: false }),
                            2000
                          );
                        }}
                        className="btn btn-sm"
                        style={{
                          padding: "4px 10px",
                          fontSize: "11px",
                          backgroundColor: "white",
                          border: "1px solid #d1d5db",
                          borderRadius: "4px",
                          color: "#374151",
                          flexShrink: 0,
                        }}
                        title={this.state.copied ? "Copied!" : "Copy Zarr URL"}
                      >
                        <i
                          className={`fas fa-${this.state.copied ? "check" : "copy"}`}
                        ></i>
                      </button>
                    </div>
                  </div>
                )}

                {/* Tab Navigation*/}
                {zarrUrl && (
                  <div
                    style={{
                      display: "flex",
                      gap: "2px",
                      borderBottom: "2px solid #e5e7eb",
                      paddingBottom: "0",
                    }}
                  >
                    <button
                      onClick={() => this.setState({ activeTab: "metadata" })}
                      style={{
                        padding: "12px 16px",
                        fontSize: "14px",
                        fontWeight:
                          this.state.activeTab === "metadata" ? "600" : "500",
                        backgroundColor:
                          this.state.activeTab === "metadata"
                            ? "#f3f4f6"
                            : "transparent",
                        border: "none",
                        borderBottom:
                          this.state.activeTab === "metadata"
                            ? "3px solid #3b82f6"
                            : "none",
                        cursor: "pointer",
                        color:
                          this.state.activeTab === "metadata"
                            ? "#1f2937"
                            : "#6b7280",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (this.state.activeTab !== "metadata") {
                          e.target.style.backgroundColor = "#f9fafb";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (this.state.activeTab !== "metadata") {
                          e.target.style.backgroundColor = "transparent";
                        }
                      }}
                    >
                      <i className="fas fa-database me-2"></i>
                      Metadata
                    </button>
                    <button
                      onClick={() => this.setState({ activeTab: "gridlook" })}
                      style={{
                        padding: "12px 16px",
                        fontSize: "14px",
                        fontWeight:
                          this.state.activeTab === "gridlook" ? "600" : "500",
                        backgroundColor:
                          this.state.activeTab === "gridlook"
                            ? "#f3f4f6"
                            : "transparent",
                        border: "none",
                        borderBottom:
                          this.state.activeTab === "gridlook"
                            ? "3px solid #3b82f6"
                            : "none",
                        cursor: "pointer",
                        color:
                          this.state.activeTab === "gridlook"
                            ? "#1f2937"
                            : "#6b7280",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (this.state.activeTab !== "gridlook") {
                          e.target.style.backgroundColor = "#f9fafb";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (this.state.activeTab !== "gridlook") {
                          e.target.style.backgroundColor = "transparent";
                        }
                      }}
                    >
                      <i className="fas fa-cube me-2"></i>
                      3D Viewer
                    </button>
                  </div>
                )}
              </div>
              <button
                className="token-close-btn"
                onClick={onClose}
                style={{
                  fontSize: "28px",
                  lineHeight: 1,
                  flexShrink: 0,
                  width: "32px",
                  height: "32px",
                }}
              >
                ×
              </button>
            </div>
          </div>

          {/* Body */}
          <div
            className="token-section"
            style={{
              flex: 1,
              overflowY: "auto",
              overflowX: "hidden",
              padding: "16px 12px",
              maxHeight: "calc(95vh - 200px)",
            }}
          >
            {status === NcDumpDialogState.ERROR &&
              this.state.activeTab === "metadata" && (
                <div
                  style={{
                    borderRadius: "8px",
                    backgroundColor: "#fee2e2",
                    border: "1px solid #fecaca",
                    color: "#991b1b",
                    fontSize: "13px",
                    padding: "12px",
                    marginBottom: "16px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "start",
                      gap: "10px",
                    }}
                  >
                    <i
                      className="fas fa-exclamation-circle"
                      style={{
                        fontSize: "18px",
                        marginTop: "2px",
                        flexShrink: 0,
                      }}
                    ></i>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong style={{ display: "block", marginBottom: "6px" }}>
                        Error loading metadata
                      </strong>
                      <div style={{ wordWrap: "break-word" }}>{error}</div>
                      <button
                        className="btn btn-sm mt-2"
                        onClick={this.handleInspect}
                        style={{
                          backgroundColor: "#dc2626",
                          color: "white",
                          border: "none",
                          padding: "6px 12px",
                          fontSize: "12px",
                        }}
                      >
                        <i className="fas fa-redo me-1"></i>
                        Retry
                      </button>
                    </div>
                  </div>
                </div>
              )}

            {status === NcDumpDialogState.LOADING && (
              <div className="text-center py-4">
                <Spinner />
                <p className="mt-3 text-muted" style={{ fontSize: "13px" }}>
                  Loading metadata...
                </p>
              </div>
            )}

            {/* Metadata Tab */}
            {this.state.activeTab === "metadata" &&
              output &&
              status === NcDumpDialogState.READY && (
                <div
                  className="xarray-metadata-display"
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    width: "100%",
                    overflowX: "auto",
                  }}
                >
                  <div dangerouslySetInnerHTML={{ __html: output }} />
                </div>
              )}

            {/* 3D Viewer Tab*/}
            {this.state.activeTab === "gridlook" && zarrUrl && (
              <>
                {/* GridLook Link Bar */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "8px",
                    padding: "12px",
                    backgroundColor: "#eff6ff",
                    borderRadius: "8px",
                    fontSize: "12px",
                    marginBottom: "16px",
                    border: "1px solid #bfdbfe",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      flex: "1 1 100%",
                      minWidth: 0,
                    }}
                  >
                    <i
                      className="fas fa-external-link-alt"
                      style={{ color: "#0284c7", flexShrink: 0 }}
                    ></i>
                    <span
                      style={{
                        color: "#0284c7",
                        fontWeight: "600",
                        flexShrink: 0,
                      }}
                    >
                      GridLook URL:
                    </span>
                    <code
                      style={{
                        flex: 1,
                        backgroundColor: "white",
                        padding: "6px 10px",
                        borderRadius: "4px",
                        fontSize: "11px",
                        color: "#1f2937",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        border: "1px solid #93c5fd",
                        minWidth: 0,
                      }}
                    >
                      {`https://gridlook.pages.dev/#${zarrUrl}`}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `https://gridlook.pages.dev/#${zarrUrl}`
                        );
                        this.setState({ gridlookCopied: true });
                        setTimeout(
                          () => this.setState({ gridlookCopied: false }),
                          2000
                        );
                      }}
                      className="btn btn-sm"
                      style={{
                        padding: "6px 12px",
                        fontSize: "12px",
                        backgroundColor: "white",
                        border: "1px solid #93c5fd",
                        borderRadius: "4px",
                        color: "#0284c7",
                        flexShrink: 0,
                        transition: "all 0.2s",
                        cursor: "pointer",
                      }}
                      title={
                        this.state.gridlookCopied ? "Copied!" : "Copy link"
                      }
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = "#f0f9ff";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = "white";
                      }}
                    >
                      <i
                        className={`fas fa-${this.state.gridlookCopied ? "check" : "copy"}`}
                      ></i>
                    </button>
                    <button
                      onClick={() => {
                        this.setState({ activeTab: "metadata" }, () => {
                          this.setState({ activeTab: "gridlook" });
                        });
                      }}
                      className="btn btn-sm"
                      style={{
                        padding: "6px 12px",
                        fontSize: "12px",
                        backgroundColor: "white",
                        border: "1px solid #93c5fd",
                        borderRadius: "4px",
                        color: "#0284c7",
                        flexShrink: 0,
                        transition: "all 0.2s",
                        cursor: "pointer",
                      }}
                      title="Refresh GridLook viewer"
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = "#f0f9ff";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = "white";
                      }}
                    >
                      <i className="fas fa-redo me-1"></i>
                    </button>
                    <button
                      onClick={() => {
                        window.open(
                          `https://gridlook.pages.dev/#${zarrUrl}`,
                          "_blank"
                        );
                      }}
                      className="btn btn-sm"
                      style={{
                        padding: "6px 12px",
                        fontSize: "12px",
                        backgroundColor: "#0284c7",
                        border: "1px solid #0284c7",
                        borderRadius: "4px",
                        color: "white",
                        flexShrink: 0,
                        transition: "all 0.2s",
                        cursor: "pointer",
                      }}
                      title="Open in new tab"
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = "#0369a1";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = "#0284c7";
                      }}
                    >
                      <i className="fas fa-arrow-up-right-from-square me-1"></i>
                      Open in New Tab
                    </button>
                  </div>
                </div>

                {/* Iframe */}
                <div
                  style={{
                    width: "100%",
                    height: "calc(95vh - 280px)",
                    minHeight: "500px",
                    backgroundColor: "#f9fafb",
                    borderRadius: "8px",
                    overflow: "hidden",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <iframe
                    ref={this.iframeRef}
                    src={`https://gridlook.pages.dev/#${zarrUrl}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      border: "none",
                    }}
                    title="GridLook 3D Viewer"
                  />
                </div>
              </>
            )}

            {!output && status === NcDumpDialogState.READY && !error && (
              <div className="text-center py-4">
                <i
                  className="fas fa-database"
                  style={{
                    fontSize: "40px",
                    color: "#d1d5db",
                    marginBottom: "12px",
                  }}
                ></i>
                <p
                  className="text-muted"
                  style={{ fontSize: "13px", padding: "0 12px" }}
                >
                  Enter a file path and click Load to inspect metadata
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}

NcdumpDialog.propTypes = {
  show: PropTypes.bool,
  submitNcdump: PropTypes.func.isRequired,
  onClose: PropTypes.func,
  status: PropTypes.string,
  output: PropTypes.string,
  error: PropTypes.string,
  file: PropTypes.string,
  zarrUrl: PropTypes.string,
};

export default NcdumpDialog;
