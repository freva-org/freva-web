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
    };
    this.handleBackdropClick = this.handleBackdropClick.bind(this);
    this.handleInspect = this.handleInspect.bind(this);
  }

  componentDidUpdate(prevProps) {
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
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '12px',
        }}
      >
        <div
          className="token-modal-content"
          style={{
            maxWidth: '1000px',
            width: '100%',
            maxHeight: '95vh',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div
            className="token-header"
            style={{
              flexShrink: 0,
              borderBottom: '1px solid #e5e7eb',
              paddingBottom: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h1 style={{ marginBottom: '12px', fontSize: 'clamp(16px, 4vw, 20px)' }}>
                  <i className="fas fa-info-circle me-2" style={{ fontSize: '16px', color: '#3b82f6' }}></i>
                  File Metadata
                </h1>

                {/* Path Input */}
                <div style={{ marginBottom: '8px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    color: '#6b7280',
                    marginBottom: '4px',
                    fontWeight: '500',
                  }}>
                    File path:
                  </label>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={this.state.pathInput}
                      onChange={(e) => this.setState({ pathInput: e.target.value })}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          this.handleInspect();
                        }
                      }}
                      placeholder="/path/to/data.nc"
                      style={{
                        flex: '1 1 200px',
                        fontSize: '13px',
                        padding: '6px 10px',
                        minWidth: 0,
                      }}
                    />
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={this.handleInspect}
                      disabled={!this.state.pathInput.trim() || status === NcDumpDialogState.LOADING}
                      style={{
                        padding: '6px 14px',
                        fontSize: '13px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <i className="fas fa-sync-alt me-1"></i>
                      Load
                    </button>
                  </div>
                </div>

                {/* Zarr URL */}
                {zarrUrl && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '6px',
                    padding: '8px 10px',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '6px',
                    fontSize: '11px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: '1 1 100%', minWidth: 0 }}>
                      <i className="fas fa-link" style={{ color: '#6b7280', flexShrink: 0 }}></i>
                      <span style={{ color: '#6b7280', fontWeight: '500', flexShrink: 0 }}>Zarr:</span>
                      <code style={{
                        flex: 1,
                        backgroundColor: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        color: '#1f2937',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        border: '1px solid #e5e7eb',
                        minWidth: 0,
                      }}>
                        {zarrUrl}
                      </code>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto' }}>
                      <button
                        onClick={() => navigator.clipboard.writeText(zarrUrl)}
                        className="btn btn-sm"
                        style={{
                          padding: '4px 10px',
                          fontSize: '11px',
                          backgroundColor: 'white',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          color: '#374151',
                        }}
                        title="Copy"
                      >
                        <i className="fas fa-copy"></i>
                      </button>
                      <a
                        href={zarrUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm"
                        style={{
                          padding: '4px 10px',
                          fontSize: '11px',
                          backgroundColor: 'white',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          color: '#374151',
                        }}
                        title="Open"
                      >
                        <i className="fas fa-external-link-alt"></i>
                      </a>
                    </div>
                  </div>
                )}
              </div>
              <button
                className="token-close-btn"
                onClick={onClose}
                style={{
                  fontSize: '28px',
                  lineHeight: 1,
                  flexShrink: 0,
                  width: '32px',
                  height: '32px',
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
              overflowY: 'auto',
              overflowX: 'hidden',
              padding: '16px 12px',
              maxHeight: 'calc(95vh - 160px)',
            }}
          >
            {status === NcDumpDialogState.ERROR && (
              <div
                style={{
                  borderRadius: '8px',
                  backgroundColor: '#fee2e2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  fontSize: '13px',
                  padding: '12px',
                  marginBottom: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'start', gap: '10px' }}>
                  <i className="fas fa-exclamation-circle" style={{ fontSize: '18px', marginTop: '2px', flexShrink: 0 }}></i>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ display: 'block', marginBottom: '6px' }}>Error loading metadata</strong>
                    <div style={{ wordWrap: 'break-word' }}>{error}</div>
                    <button
                      className="btn btn-sm mt-2"
                      onClick={this.handleInspect}
                      style={{
                        backgroundColor: '#dc2626',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        fontSize: '12px',
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
                <p className="mt-3 text-muted" style={{ fontSize: '13px' }}>
                  Loading metadata...
                </p>
              </div>
            )}

            {output && status === NcDumpDialogState.READY && (
              <div
                className="xarray-metadata-display"
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  width: '100%',
                  overflowX: 'auto',
                }}
              >
                <div dangerouslySetInnerHTML={{ __html: output }} />
              </div>
            )}
            
            {!output && status === NcDumpDialogState.READY && !error && (
              <div className="text-center py-4">
                <i className="fas fa-database" style={{ fontSize: '40px', color: '#d1d5db', marginBottom: '12px' }}></i>
                <p className="text-muted" style={{ fontSize: '13px', padding: '0 12px' }}>
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
