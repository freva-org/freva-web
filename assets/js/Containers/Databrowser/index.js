import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import {
  Container,
  Row,
  Col,
  Card,
  Tooltip,
  OverlayTrigger,
  Button,
  Alert,
  Badge,
  Toast,
} from "react-bootstrap";

import { FaInfoCircle, FaRegClone } from "react-icons/fa";

import queryString from "query-string";
import { withRouter } from "react-router";

import NcdumpDialog from "../../Components/NcdumpDialog";
import AccordionItemBody from "../../Components/AccordionItemBody";
import OwnPanel from "../../Components/OwnPanel";
import Spinner from "../../Components/Spinner";

import { initCap, underscoreToBlank } from "../../utils";

import {
  loadFacets,
  setMetadata,
  loadFiles,
  loadNcdump,
  resetNcdump,
  updateFacetSelection,
} from "./actions";

import {
  TIME_RANGE_FILE,
  TIME_RANGE_STRICT,
  TIME_RANGE_FLEXIBLE,
} from "./constants";

import TimeRangeSelector from "./TimeRangeSelector";

function ClipboardToast({ show, setShow }) {
  return (
    <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 11 }}>
      <Toast
        onClose={() => setShow(false)}
        show={show}
        delay={3000}
        style={{ backgroundColor: "#ddede5" }}
        autohide
      >
        <Toast.Body>
          <strong id="clipboard-toast-text">Copied command to clipboard</strong>
        </Toast.Body>
      </Toast>
    </div>
  );
}

ClipboardToast.propTypes = {
  setShow: PropTypes.func.isRequired,
  show: PropTypes.bool.isRequired,
};

function copyTextFallback(text) {
  // Fallback: Show window prompt to copy-paste the command
  window.prompt("Copy to clipboard: Ctrl+C, Enter", text);
}

function copyTextToClipboard(text, showToast) {
  if (!navigator.clipboard) {
    copyTextFallback(text);
    return;
  }
  // writeText handles it errors inside the second function. No need
  // to catch Promise
  // eslint-disable-next-line promise/catch-or-return
  navigator.clipboard.writeText(text).then(showToast, function () {
    copyTextFallback(text);
  });
}

class Databrowser extends React.Component {
  constructor(props) {
    super(props);
    this.state = { showDialog: false, fn: null, showToast: false };
  }

  /**
   * On mount we load all facets and files to display
   * Also load the metadata.js script
   */
  componentDidMount() {
    this.props.dispatch(loadFacets(this.props.location));
    this.props.dispatch(loadFiles(this.props.location));
    this.props.dispatch(updateFacetSelection(this.props.location.query));
    const script = document.createElement("script");
    script.src = "/static/js/metadata.js";
    script.async = true;
    script.onload = () =>
      this.props.dispatch(
        setMetadata({
          variable: window.variable,
          model: window.model,
          institute: window.institute,
        })
      );
    document.body.appendChild(script);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.location.search !== this.props.location.search) {
      this.props.dispatch(loadFacets(this.props.location));
      this.props.dispatch(loadFiles(this.props.location));
      this.props.dispatch(updateFacetSelection(this.props.location.query));
    }
  }
  /**
   * Loop all facets and render the panels
   */
  renderFacetPanels() {
    const { facets, selectedFacets, metadata } = this.props.databrowser;
    // const { dispatch } = this.props;

    return Object.keys(facets).map((key) => {
      const value = facets[key];
      let panelHeader;
      const isFacetSelected = !!selectedFacets[key];
      if (isFacetSelected) {
        panelHeader = (
          <span>
            {initCap(underscoreToBlank(key))}:{" "}
            <strong>{selectedFacets[key]}</strong>
          </span>
        );
      } else if (value.length === 2) {
        panelHeader = (
          <span>
            {initCap(underscoreToBlank(key))}: <strong>{value[0]}</strong>
          </span>
        );
      } else {
        const numberOfValues = value.length / 2;
        panelHeader = (
          <span className="d-flex justify-content-between">
            <span>{initCap(underscoreToBlank(key))}</span>
            <Badge bg="secondary">{numberOfValues}</Badge>
          </span>
        );
      }
      return (
        <OwnPanel
          header={panelHeader}
          key={key}
          removeFacet={
            isFacetSelected
              ? () => {
                  const currentLocation = this.props.location.pathname;
                  const { [key]: toRemove, ...queryObject } =
                    this.props.location.query;
                  const query = queryString.stringify(queryObject);
                  this.props.router.push(currentLocation + "?" + query);
                }
              : null
          }
        >
          <AccordionItemBody
            eventKey={key}
            value={value}
            facetClick={(key, item) => {
              const currentLocation = this.props.location.pathname;
              const query = queryString.stringify({
                ...this.props.location.query,
                [key]: item,
              });
              if (query) {
                this.props.router.push(currentLocation + "?" + query);
              } else {
                this.props.router.push(currentLocation);
              }
            }}
            metadata={metadata[key] ? metadata[key] : null}
          />
        </OwnPanel>
      );
    });
  }

  renderTimeSelectionPanel() {
    const key = "time_range";
    const { dateSelector, minDate, maxDate } = this.props.databrowser;
    const isDateSelected = !!minDate;
    const title = isDateSelected ? (
      <span>
        Time Range: &nbsp;
        <span className="fw-bold">
          {dateSelector}: {minDate} to {maxDate}
        </span>
      </span>
    ) : (
      <span>Time Range</span>
    );
    return (
      <OwnPanel
        header={title}
        key={key}
        removeFacet={
          isDateSelected
            ? () => {
                const currentLocation = this.props.location.pathname;
                const {
                  dateSelector: ignore1,
                  minDate: ignore2,
                  maxDate: ignore3,
                  ...queryObject
                } = this.props.location.query;
                const query = queryString.stringify(queryObject);
                if (query) {
                  this.props.router.push(currentLocation + "?" + query);
                } else {
                  this.props.router.push(currentLocation);
                }
              }
            : null
        }
      >
        <TimeRangeSelector />
      </OwnPanel>
    );
  }

  renderFilesPanel() {
    //TODO: This should be a separate component
    const { files, numFiles, fileLoading } = this.props.databrowser;
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
            <Spinner />
          ) : (
            files.map((fn) => {
              return (
                <li
                  className="ext_nc"
                  key={fn}
                  style={{ whiteSpace: "normal" }}
                >
                  <OverlayTrigger
                    overlay={<Tooltip>Click here to inspect metadata</Tooltip>}
                  >
                    <Button
                      variant="link"
                      className="p-0 me-1"
                      onClick={() => {
                        this.setState({ showDialog: true, fn });
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
      </div>
    );
  }

  render() {
    const { facets, selectedFacets, ncdumpStatus, ncdumpOutput, ncdumpError } =
      this.props.databrowser;
    const { dispatch } = this.props;
    if (this.props.error) {
      return (
        <Container>
          <Alert variant="danger">
            <div className="fs-4">{this.props.error}</div>
          </Alert>
        </Container>
      );
    }
    // Wait until facets are loaded
    if (!facets) {
      return <Spinner />;
    }

    const facetPanels = this.renderFacetPanels();

    let dateSelectorToCli;
    const dateSelector = this.props.databrowser.dateSelector;
    if (dateSelector === TIME_RANGE_FLEXIBLE) {
      dateSelectorToCli = "flexible";
    } else if (dateSelector === TIME_RANGE_STRICT) {
      dateSelectorToCli = "strict";
    } else if (dateSelector === TIME_RANGE_FILE) {
      dateSelectorToCli = "file";
    }

    const fullCommand = (
      "freva databrowser " +
      (this.props.databrowser.minDate
        ? `time=${this.props.databrowser.minDate}to${this.props.databrowser.maxDate} `
        : "") +
      Object.keys(selectedFacets)
        .map((key) => {
          const value = selectedFacets[key];
          return `${key}=${value}`;
        })
        .join(" ") +
      (dateSelectorToCli && this.props.databrowser.minDate
        ? ` --time-select ${dateSelectorToCli}`
        : "")
    ).trimEnd();

    return (
      <Container>
        <Row>
          <h2>
            Data-Browser&nbsp;
            {this.props.databrowser.facetLoading && (
              <Spinner outerClassName="d-inline fs-6 align-bottom" />
            )}
          </h2>

          <Col md={4}>
            {Object.keys(selectedFacets).length !== 0 ? (
              <Col md={12}>
                <Card className="shadow-sm mb-3">
                  <a
                    className="m-3"
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      this.props.router.push(this.props.location.pathname);
                    }}
                  >
                    Clear all
                  </a>
                </Card>
              </Col>
            ) : null}
            {facetPanels}
            {this.renderTimeSelectionPanel()}
          </Col>
          <Col md={8}>
            <Card className="p-3 py-2 d-block shadow-sm">
              <div className="fw-bold d-flex justify-content-between align-items-center border-bottom pb-2 mb-2">
                <div>Freva databrowser command</div>
                <Button
                  variant="primary"
                  className="d-flex align-items-center"
                  onClick={() =>
                    copyTextToClipboard(fullCommand, () =>
                      this.setState({ showToast: true })
                    )
                  }
                >
                  <FaRegClone className="me-1" /> Copy command
                </Button>
              </div>
              <pre className="mb-1" style={{ whiteSpace: "pre-wrap" }}>
                freva databrowser
                {this.props.databrowser.minDate && (
                  <React.Fragment>
                    &nbsp;time=
                    <span className="fw-bold">
                      {`${this.props.databrowser.minDate}to${this.props.databrowser.maxDate}`}
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
                {dateSelectorToCli && this.props.databrowser.minDate && (
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
            <ClipboardToast
              show={this.state.showToast}
              setShow={(val) => this.setState({ showToast: val })}
            />
            {this.renderFilesPanel()}

            <NcdumpDialog
              show={this.state.showDialog}
              file={this.state.fn}
              onClose={() => {
                this.setState({ showDialog: false });
                dispatch(resetNcdump());
              }}
              submitNcdump={(fn, pw) => dispatch(loadNcdump(fn, pw))}
              status={ncdumpStatus}
              output={ncdumpOutput}
              error={ncdumpError}
            />
          </Col>
        </Row>
      </Container>
    );
  }
}

Databrowser.propTypes = {
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
  location: PropTypes.object.isRequired,
  router: PropTypes.object.isRequired,
  error: PropTypes.string,
  dispatch: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  databrowser: state.databrowserReducer,
  error: state.appReducer.error,
});

export default withRouter(connect(mapStateToProps)(Databrowser));
