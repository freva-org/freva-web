import React, { useState } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { Tooltip, OverlayTrigger, Button, Badge } from "react-bootstrap";

import { FaInfoCircle } from "react-icons/fa";

import NcdumpDialog from "../../Components/NcdumpDialog";
import CircularSpinner from "../../Components/Spinner";

import { loadNcdump, resetNcdump } from "./actions";

function FilesPanelImpl(props) {
  const {
    files,
    numFiles,
    fileLoading,
    ncdumpStatus,
    ncdumpOutput,
    ncdumpError,
  } = props.databrowser;
  const [showDialog, setShowDialog] = useState(false);
  const [filename, setFilename] = useState(null);
  return (
    <div className="py-3">
      <h3 className="d-flex justify-content-between">
        <span>Files</span>
        <Badge bg="secondary">{numFiles.toLocaleString("en-US")}</Badge>
      </h3>
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
                      setFilename(filename);
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
        onClose={() => {
          setShowDialog(false);
          props.dispatch(resetNcdump());
        }}
        submitNcdump={(fn, pw) => props.dispatch(loadNcdump(fn, pw))}
        status={ncdumpStatus}
        output={ncdumpOutput}
        error={ncdumpError}
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
    selectedFacets: PropTypes.object,
    ncdumpStatus: PropTypes.string,
    ncdumpOutput: PropTypes.string,
    ncdumpError: PropTypes.string,
    metadata: PropTypes.object,
    dateSelector: PropTypes.string,
    minDate: PropTypes.string,
    maxDate: PropTypes.string,
  }),
  error: PropTypes.string,
  dispatch: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  databrowser: state.databrowserReducer,
  error: state.appReducer.error,
});

export default connect(mapStateToProps)(FilesPanelImpl);
