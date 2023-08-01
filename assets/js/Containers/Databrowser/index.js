import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import {
  Container,
  Row,
  Col,
  Button,
  Alert,
  Badge,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";

import { FaAlignJustify, FaList, FaTimes } from "react-icons/fa";

import queryString from "query-string";
import { withRouter } from "react-router";

import AccordionItemBody from "../../Components/AccordionItemBody";
import OwnPanel from "../../Components/OwnPanel";
import Spinner from "../../Components/Spinner";

import { initCap, underscoreToBlank } from "../../utils";

import {
  loadFacets,
  setMetadata,
  loadFiles,
  updateFacetSelection,
} from "./actions";

import TimeRangeSelector from "./TimeRangeSelector";
import FilesPanel from "./FilesPanel";
import DataBrowserCommand from "./DataBrowserCommand";
import FacetDropdown from "./FacetDropdown";

const ViewTypes = {
  RESULT_CENTERED: "RESULT_CENTERED",
  FACET_CENTERED: "FACET_CENTERED",
};

class Databrowser extends React.Component {
  constructor(props) {
    super(props);
    this.clickFacet = this.clickFacet.bind(this);
    this.renderFacetBadges = this.renderFacetBadges.bind(this);
    this.state = { viewPort: ViewTypes.RESULT_CENTERED };
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
          project: window.project,
          product: window.product,
          model: window.model,
          institute: window.institute,
          time_frequency: window.time_frequency,
          realm: window.realm,
          variable: window.variable,
          grid_label: window.grid_label,
          time_aggregation: window.time_aggregation,
          fs_type: window.fs_type,
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

  clickFacet(category, value = null) {
    const currentLocation = this.props.location.pathname;
    const originalQueryObject = this.props.location.query;
    const previousValue = originalQueryObject[category];
    if (previousValue && (value === null || value === previousValue)) {
      // delete
      const { [category]: toRemove, ...queryObject } =
        this.props.location.query;
      const query = queryString.stringify(queryObject);
      this.props.router.push(currentLocation + "?" + query);
      return;
    }
    const query = queryString.stringify({
      ...this.props.location.query,
      [category]: value,
    });
    if (query) {
      this.props.router.push(currentLocation + "?" + query);
    } else {
      this.props.router.push(currentLocation);
    }
  }

  // dropFacet(category) {
  //   const currentLocation = this.props.location.pathname;
  //   const { [category]: toRemove, ...queryObject } = this.props.location.query;
  //   const query = queryString.stringify(queryObject);
  //   this.props.router.push(currentLocation + "?" + query);
  // }

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
            <Badge bg="secondary d-flex align-items-center">
              {numberOfValues}
            </Badge>
          </span>
        );
      }
      return (
        <OwnPanel
          header={panelHeader}
          key={key}
          removeFacet={isFacetSelected ? () => this.clickFacet(key) : null}
        >
          <AccordionItemBody
            eventKey={key}
            value={value}
            isFacetCentered={this.state.viewPort === ViewTypes.FACET_CENTERED}
            facetClick={this.clickFacet}
            metadata={metadata[key] ? metadata[key] : null}
          />
        </OwnPanel>
      );
    });
  }

  dropTimeSelection() {
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
        removeFacet={isDateSelected ? () => this.dropTimeSelection() : null}
      >
        <TimeRangeSelector />
      </OwnPanel>
    );
  }

  renderFacetBadges() {
    const { dateSelector, minDate, maxDate } = this.props.databrowser;
    const isDateSelected = !!minDate;
    let values = [];
    if (
      Object.keys(this.props.databrowser.selectedFacets).length > 0 ||
      isDateSelected
    ) {
      values.push(
        <Button
          variant="danger"
          className="me-2 mb-2 badge d-flex align-items-center"
          onClick={(e) => {
            e.preventDefault();
            this.props.router.push(this.props.location.pathname);
          }}
          key={"clearall"}
        >
          Clear all
          <FaTimes className="ms-2 fs-6" />
        </Button>
      );
    }
    values = [
      ...values,
      ...Object.keys(this.props.databrowser.selectedFacets).map((x) => {
        return (
          <Button
            variant="secondary"
            className="me-2 mb-2 badge d-flex align-items-center"
            onClick={() => {
              this.clickFacet(x);
            }}
            key={"selected-" + x + this.props.databrowser.selectedFacets[x]}
          >
            {initCap(underscoreToBlank(x))}:{" "}
            {this.props.databrowser.selectedFacets[x]}
            <FaTimes className="ms-2 fs-6" />
          </Button>
        );
      }),
    ];

    if (isDateSelected) {
      const timeBadge = (
        <Button
          variant="secondary"
          className="me-2 mb-2 badge d-flex align-items-center"
          onClick={() => this.dropTimeSelection()}
          key={"time-selection" + { dateSelector } + { minDate } + { maxDate }}
        >
          Time: {minDate} to {maxDate} ({dateSelector})
          <FaTimes className="ms-2 fs-6" />
        </Button>
      );
      values.push(timeBadge);
    }

    return (
      <div className="d-flex justify-content-between flex-after flex-wrap my-2">
        {values}
      </div>
    );
  }

  render() {
    const { facets } = this.props.databrowser;
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
    const isFacetCentered = this.state.viewPort === ViewTypes.FACET_CENTERED;
    return (
      <Container>
        <Row>
          <div className="d-flex justify-content-between">
            <h2>
              Data-Browser&nbsp;
              {this.props.databrowser.facetLoading && (
                <Spinner outerClassName="d-inline fs-6 align-bottom" />
              )}
            </h2>
            <div>
              <OverlayTrigger
                overlay={<Tooltip>Change view with facets in focus</Tooltip>}
              >
                <Button
                  className="me-1"
                  variant="outline-secondary"
                  active={isFacetCentered}
                  onClick={() =>
                    this.setState({ viewPort: ViewTypes.FACET_CENTERED })
                  }
                >
                  <FaAlignJustify />
                </Button>
              </OverlayTrigger>
              <OverlayTrigger
                overlay={<Tooltip>Change view with results in focus</Tooltip>}
              >
                <Button
                  variant="outline-secondary"
                  active={!isFacetCentered}
                  onClick={() =>
                    this.setState({ viewPort: ViewTypes.RESULT_CENTERED })
                  }
                >
                  <FaList />
                </Button>
              </OverlayTrigger>
            </div>
          </div>

          <Col md={isFacetCentered ? 12 : 4}>
            <div className={"shadow-sm " + (isFacetCentered ? "mb-2" : "mb-3")}>
              <FacetDropdown clickFacet={this.clickFacet} />
            </div>
            {isFacetCentered && this.renderFacetBadges()}

            {facetPanels}
            {this.renderTimeSelectionPanel()}
          </Col>
          <Col md={isFacetCentered ? 12 : 8}>
            <DataBrowserCommand className={isFacetCentered ? "mb-3" : ""} />
            {!isFacetCentered && this.renderFacetBadges()}
            <FilesPanel />
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
