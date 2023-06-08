import React, { useState } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { Tooltip, OverlayTrigger, Button, Badge } from "react-bootstrap";

import { FaInfoCircle } from "react-icons/fa";

import NcdumpDialog from "../../Components/NcdumpDialog";
import CircularSpinner from "../../Components/Spinner";

import { getCookie } from "../../utils";

// import { loadNcdump } from "./actions";

function FilesPanelImpl(props) {
  const { files, numFiles, fileLoading } = props.databrowser;
  const [showDialog, setShowDialog] = useState(false);

  const [ncdump, setNcDump] = useState({
    status: "pw",
    output: null,
    error: null,
  });

  function loadNcdump(fn, pw) {
    const url = "/api/solr/ncdump/";
    // dispatch({ type: constants.LOAD_NCDUMP, fn });
    setNcDump({ ...ncdump, status: "loading" });
    return fetch(url, {
      credentials: "same-origin",
      method: "POST",
      headers: {
        "X-CSRFToken": getCookie("csrftoken"),
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        file: fn,
        pass: pw,
      }),
    })
      .then((resp) => {
        if (!resp.ok) {
          /* eslint-disable */
          return resp.json().then((json) => {
            console.log(resp.statusText);
            if (json.error_msg) {
              throw new Error(json.error_msg);
            } else {
              throw new Error(resp.statusText);
            }
          });
        }
        return resp.json();
      })
      .then((json) => {
        setNcDump({ output: json.ncdump, status: "ready", error: null });
      })
      .catch((error) => {
        setNcDump({ output: null, status: "error", error: error.message });
      });
  }

  const [filename, setFilename] = useState(null);
  return (
    <div className="pb-3">
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
        onClose={() => {
          setShowDialog(false);
          setNcDump({ status: "pw", error: null, output: null });
          // props.dispatch(resetNcdump());
        }}
        submitNcdump={(fn, pw) => loadNcdump(fn, pw)}
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
    selectedFacets: PropTypes.object,
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
