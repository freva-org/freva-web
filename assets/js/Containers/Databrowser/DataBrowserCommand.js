import React, { useState } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { FaPython, FaRegClone, FaTerminal } from "react-icons/fa";
import { Button, Card, OverlayTrigger, Tooltip } from "react-bootstrap";

import ClipboardToast from "../../Components/ClipboardToast";
import { copyTextToClipboard } from "../../utils";

import {
  TIME_RANGE_FILE,
  TIME_RANGE_FLEXIBLE,
  TIME_RANGE_STRICT,
} from "./constants";

const Modes = {
  CLI: "CLI",
  PYTHON: "PYTHON",
};
function DataBrowserCommandImpl(props) {
  const [showToast, setShowToast] = useState(false);
  const [mode, setMode] = useState(Modes.CLI);

  const selectedFacets = props.selectedFacets;
  function getCliTimeSelector() {
    let dateSelectorToCli;
    const dateSelector = props.dateSelector;
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
      (props.minDate ? `time=${props.minDate}to${props.maxDate} ` : "") +
      Object.keys(selectedFacets)
        .map((key) => {
          const value = selectedFacets[key];
          return `${key}=${value}`;
        })
        .join(" ") +
      (dateSelectorToCli && props.minDate
        ? ` --time-select ${dateSelectorToCli}`
        : "")
    ).trimEnd();
  }

  function renderCLICommand() {
    return (
      <pre className="mb-1" style={{ whiteSpace: "pre-wrap" }}>
        freva databrowser
        {props.minDate && (
          <React.Fragment>
            &nbsp;time=
            <span className="fw-bold">
              {`${props.minDate}to${props.maxDate}`}
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
        {dateSelectorToCli && props.minDate && (
          <React.Fragment>
            &nbsp;--time-select
            <span className="fw-bold">
              &nbsp;
              {`${dateSelectorToCli}`}
            </span>
          </React.Fragment>
        )}
      </pre>
    );
  }

  function getFullPythonCommand(dateSelectorToCli) {
    const args = Object.keys(selectedFacets).map((key) => {
      const value = selectedFacets[key];
      return `${key}="${value}"`;
    });
    props.minDate && args.push(`time="${props.minDate} to ${props.maxDate}"`);
    props.minDate && args.push(`time_select="${dateSelectorToCli}"`);
    return `freva.databrowser(${args.join(", ")})`.trimEnd();
  }

  function renderPythonCommand(dateSelectorToCli) {
    return (
      <pre className="mb-1" style={{ whiteSpace: "pre-wrap" }}>
        {getFullPythonCommand(dateSelectorToCli)}
      </pre>
    );
  }

  const dateSelectorToCli = getCliTimeSelector();
  const fullCLICommand = getFullCliCommand(dateSelectorToCli);
  const fullPythonCommand = getFullPythonCommand(dateSelectorToCli);
  return (
    <React.Fragment>
      <Card className={"p-3 py-2 d-block shadow-sm " + props.className}>
        <div className="fw-bold d-flex justify-content-between align-items-center border-bottom pb-2 mb-2">
          Freva databrowser command
          <div className="d-flex justify-content-between">
            <OverlayTrigger overlay={<Tooltip>Show CLI command</Tooltip>}>
              <Button
                className="me-1 d-flex align-items-center"
                active={mode === Modes.CLI}
                variant="outline-secondary"
                onClick={() => setMode(Modes.CLI)}
              >
                <div>
                  <FaTerminal className="fs-5" />
                </div>
              </Button>
            </OverlayTrigger>

            <OverlayTrigger overlay={<Tooltip>Show python command</Tooltip>}>
              <Button
                className="me-2 d-flex align-items-center"
                active={mode === Modes.PYTHON}
                variant="outline-secondary"
                onClick={() => setMode(Modes.PYTHON)}
              >
                <FaPython />
              </Button>
            </OverlayTrigger>
            <Button
              variant="primary"
              className="d-flex align-items-center"
              onClick={() =>
                copyTextToClipboard(
                  mode === Modes.CLI ? fullCLICommand : fullPythonCommand,
                  () => setShowToast(true)
                )
              }
            >
              <FaRegClone className="me-1" /> Copy command
            </Button>
          </div>
        </div>
        {mode === Modes.CLI && renderCLICommand()}
        {mode === Modes.PYTHON && renderPythonCommand(dateSelectorToCli)}
      </Card>
      <ClipboardToast show={showToast} setShow={setShowToast} />
    </React.Fragment>
  );
}

DataBrowserCommandImpl.propTypes = {
  className: PropTypes.string,
  selectedFacets: PropTypes.object,
  dateSelector: PropTypes.string,
  minDate: PropTypes.string,
  maxDate: PropTypes.string,
};

const mapStateToProps = (state) => ({
  selectedFacets: state.databrowserReducer.selectedFacets,
  dateSelector: state.databrowserReducer.dateSelector,
  minDate: state.databrowserReducer.minDate,
  maxDate: state.databrowserReducer.maxDate,
});

export default connect(mapStateToProps)(DataBrowserCommandImpl);
