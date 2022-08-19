import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import {
  Container,
  Row,
  Col,
  Accordion,
  Card,
  Tooltip,
  OverlayTrigger,
  Button,
  Alert,
} from "react-bootstrap";

import { FaInfoCircle } from "react-icons/fa";

import NcdumpDialog from "../../Components/NcdumpDialog";
import AccordionItemBody from "../../Components/AccordionItemBody";
import OwnPanel from "../../Components/OwnPanel";
import Spinner from "../../Components/Spinner";

import {
  loadFacets,
  selectFacet,
  clearFacet,
  clearAllFacets,
  setActiveFacet,
  setMetadata,
  loadFiles,
  loadNcdump,
  resetNcdump,
  clearTimeRange
} from "./actions";

import {
  TIME_RANGE_FILE,
  TIME_RANGE_STRICT,
  TIME_RANGE_FLEXIBLE
} from "./constants";

import TimeRangeSelector from "./TimeRangeSelector";

class Databrowser extends React.Component {

  constructor (props) {
    super(props);
    this.state = { showDialog: false, fn: null };
  }

  /**
     * On mount we load all facets and files to display
     * Also load the metadata.js script
     */
  componentDidMount () {
    this.props.dispatch(loadFacets());
    this.props.dispatch(loadFiles());
    const script = document.createElement("script");
    script.src = "/static/js/metadata.js";
    script.async = true;
    script.onload = () => this.props.dispatch(setMetadata({ variable: window.variable, model: window.model, institute: window.institute }));
    document.body.appendChild(script);
  }

  /**
     * Loop all facets and render the panels
     */
  renderFacetPanels () {
    const { facets, selectedFacets, activeFacet, metadata } = this.props.databrowser;
    const { dispatch } = this.props;

    return Object.keys(facets).map((key) => {
      const value = facets[key];
      let panelHeader;
      const isFacetSelected = !!selectedFacets[key];
      if (isFacetSelected) {
        panelHeader = <span>{key}: <strong>{selectedFacets[key]}</strong></span>;
      } else if (value.length === 2) {
        panelHeader = <span>{key}: <strong>{value[0]}</strong></span>;
      } else {
        const numberOfValues = value.length / 2;
        panelHeader = <span>{key} ({numberOfValues})</span>;
      }
      return (
        <OwnPanel
          header={panelHeader} eventKey={key} key={key} removeFacet={isFacetSelected ? (() => dispatch(clearFacet(key))) : null}
          collapse={() => dispatch(setActiveFacet(key))}
        >
          <AccordionItemBody
            eventKey={key} value={value} facetClick={(key, item) => dispatch(selectFacet(key, item))}
            metadata={metadata[key] ? metadata[key] : null} visible={key === activeFacet}
          />
        </OwnPanel>
      );
    });
  }

  renderTimeSelectionPanel () {
    const key = "time_range";
    const { dispatch } = this.props;
    const { dateSelector, minDate, maxDate, } = this.props.databrowser;
    const isDateSelected = !!minDate;
    const title = isDateSelected ?
      (
        <span>
          Time Range: &nbsp;
          <span className="fw-bold">
            {dateSelector}: {minDate} to {maxDate}
          </span>
        </span>
      ) :
      (
        <span>
          Time Range
        </span>
      );
    return (
      <OwnPanel
        header={title} eventKey={key} key={key} removeFacet={isDateSelected ? (() => dispatch(clearTimeRange())) : null}
        collapse={() => dispatch(setActiveFacet(key))}
      >
        <TimeRangeSelector />
      </OwnPanel>
    );
  }

  renderFilesPanel () {
    //TODO: This should be a separate component
    const { activeFacet, files, numFiles, } = this.props.databrowser;
    const { dispatch } = this.props;
    return (
      <Accordion activeKey={activeFacet}>
        <OwnPanel
          header={<span> Files [{numFiles}]</span>}
          eventKey="files"
          collapse={() => dispatch(setActiveFacet("files"))}
        >
          <div style={{ maxHeight:500,overflow:"auto" }}>
            <ul className="jqueryFileTree">
              {
                files.map((fn) => {
                  return (
                    <li className="ext_nc" key={fn} style={{ whiteSpace: "normal" }}>
                      <OverlayTrigger overlay={<Tooltip>Click here to inspect metadata</Tooltip>}>
                        <Button
                          variant="link" className="p-0" onClick={
                            () => {
                              this.setState({ showDialog: true, fn });
                            }
                          }
                        >
                          <FaInfoCircle className="ncdump" />
                        </Button>
                      </OverlayTrigger>
                      {" "}{fn}
                    </li>
                  );
                })
              }
            </ul>
          </div>
        </OwnPanel>
      </Accordion>
    );
  }

  render () {
    const { facets, selectedFacets, activeFacet, ncdumpStatus, ncdumpOutput, ncdumpError } = this.props.databrowser;
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
      return (
        <Spinner />
      );
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

    return (
      <Container>
        <Row>
          <Col md={12}>
            <h2>Data-Browser</h2>
          </Col>
        </Row>
        <Row>
          {
            Object.keys(selectedFacets).length !== 0 ?
              <Col md={12}>
                <Card className="shadow-sm">
                  <a
                    className="m-3"
                    href="#" onClick={
                      (e) => {
                        e.preventDefault(); dispatch(clearAllFacets());
                      }
                    }
                  >Clear all</a>
                </Card>
              </Col> : null
          }
        </Row>
        <Row>
          <Col md={12}>
            <Accordion activeKey={activeFacet}>
              {facetPanels}
              {this.renderTimeSelectionPanel()}
            </Accordion>

            <Card className="mt-2 p-3 d-block shadow-sm">
              freva databrowser
              {
                this.props.databrowser.minDate && <React.Fragment>
                  &nbsp;time=
                  <span className="fw-bold">
                    {`${this.props.databrowser.minDate}to${this.props.databrowser.maxDate}`}
                  </span>
                </React.Fragment>
              }
              {
                dateSelectorToCli && <React.Fragment>
                  &nbsp;time-select
                  <span className="fw-bold">
                    &nbsp;
                    {`${dateSelectorToCli}`}
                  </span>
                </React.Fragment>
              }
              {
                Object.keys(selectedFacets).map((key) => {
                  const value = selectedFacets[key];
                  return <React.Fragment key={`command-${key}`}> {key}=<strong>{value}</strong></React.Fragment>;
                })
              }
            </Card>

            {this.renderFilesPanel()}

            <NcdumpDialog
              show={this.state.showDialog}
              file={this.state.fn}
              onClose={
                () => {
                  this.setState({ showDialog: false }); dispatch(resetNcdump());
                }
              }
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
    numFiles: PropTypes.number,
    selectedFacets: PropTypes.object,
    activeFacet: PropTypes.string,
    ncdumpStatus: PropTypes.string,
    ncdumpOutput: PropTypes.string,
    ncdumpError: PropTypes.string,
    metadata: PropTypes.object,
    dateSelector : PropTypes.string,
    minDate: PropTypes.string,
    maxDate: PropTypes.string,
  }),
  error: PropTypes.string,
  dispatch: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
  databrowser: state.databrowserReducer,
  error: state.appReducer.error
});

export default connect(mapStateToProps)(Databrowser);
