import React, { useState } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { FaRegClone } from "react-icons/fa";
import { Button, Card } from "react-bootstrap";

import ClipboardToast from "../../Components/ClipboardToast";
import { copyTextToClipboard } from "../../utils";

import {
  TIME_RANGE_FILE,
  TIME_RANGE_FLEXIBLE,
  TIME_RANGE_STRICT,
} from "./constants";

function DataBrowserCommandImpl(props) {
  const [showToast, setShowToast] = useState(false);
  const { selectedFacets } = props.databrowser;
  function getCliTimeSelector() {
    let dateSelectorToCli;
    const dateSelector = props.databrowser.dateSelector;
    if (dateSelector === TIME_RANGE_FLEXIBLE) {
      dateSelectorToCli = "flexible";
    } else if (dateSelector === TIME_RANGE_STRICT) {
      dateSelectorToCli = "strict";
    } else if (dateSelector === TIME_RANGE_FILE) {
      dateSelectorToCli = "file";
    }
    return dateSelectorToCli;
  }

  function getFullCliCommand(dateSelectorToCli) {
    return (
      "freva databrowser " +
      (props.databrowser.minDate
        ? `time=${props.databrowser.minDate}to${props.databrowser.maxDate} `
        : "") +
      Object.keys(selectedFacets)
        .map((key) => {
          const value = selectedFacets[key];
          return `${key}=${value}`;
        })
        .join(" ") +
      (dateSelectorToCli && props.databrowser.minDate
        ? ` --time-select ${dateSelectorToCli}`
        : "")
    ).trimEnd();
  }

  const dateSelectorToCli = getCliTimeSelector();
  const fullCommand = getFullCliCommand(dateSelectorToCli);
  return (
    <React.Fragment>
      <Card className={"p-3 py-2 d-block shadow-sm " + props.className}>
        <div className="fw-bold d-flex justify-content-between align-items-center border-bottom pb-2 mb-2">
          <div>Freva databrowser command</div>
          <Button
            variant="primary"
            className="d-flex align-items-center"
            onClick={() =>
              copyTextToClipboard(fullCommand, () => setShowToast(true))
            }
          >
            <FaRegClone className="me-1" /> Copy command
          </Button>
        </div>
        <pre className="mb-1" style={{ whiteSpace: "pre-wrap" }}>
          freva databrowser
          {props.databrowser.minDate && (
            <React.Fragment>
              &nbsp;time=
              <span className="fw-bold">
                {`${props.databrowser.minDate}to${props.databrowser.maxDate}`}
              </span>
            </React.Fragment>
          )}
          {Object.keys(selectedFacets).map((key) => {
            const value = selectedFacets[key];
            return (
              <React.Fragment key={`command-${key}`}>
                {" "}
                {key}=<strong>{value}</strong>
              </React.Fragment>
            );
          })}
          {dateSelectorToCli && props.databrowser.minDate && (
            <React.Fragment>
              &nbsp;--time-select
              <span className="fw-bold">
                &nbsp;
                {`${dateSelectorToCli}`}
              </span>
            </React.Fragment>
          )}
        </pre>
      </Card>
      <ClipboardToast show={showToast} setShow={setShowToast} />
    </React.Fragment>
  );
}

DataBrowserCommandImpl.propTypes = {
  className: PropTypes.string,
  databrowser: PropTypes.shape({
    facets: PropTypes.object,
    files: PropTypes.array,
    fileLoading: PropTypes.bool,
    facetLoading: PropTypes.bool,
    numFiles: PropTypes.number,
    selectedFacets: PropTypes.object,
    dateSelector: PropTypes.string,
    minDate: PropTypes.string,
    maxDate: PropTypes.string,
  }),
};

const mapStateToProps = (state) => ({
  databrowser: state.databrowserReducer,
});

export default connect(mapStateToProps)(DataBrowserCommandImpl);
