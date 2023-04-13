import React from "react";
import PropTypes from "prop-types";

import { connect } from "react-redux";
import { Container, Row, Col, Card, Alert, Badge } from "react-bootstrap";

import _ from "lodash";

import AccordionItemBody from "../../Components/AccordionItemBody";
import OwnPanel from "../../Components/OwnPanel";
import Spinner from "../../Components/Spinner";
import {
  dateformatter,
  getCookie,
  initCap,
  underscoreToBlank,
} from "../../utils";

import ResultTable from "./ResultTable";

import {
  loadResultFacets,
  selectResultFacet,
  clearResultFacet,
  clearAllResultFacets,
} from "./actions";

const LinkCell = (props) => {
  return <a href={props.cell.value}>Show</a>;
};

LinkCell.propTypes = {
  cell: PropTypes.shape({
    value: PropTypes.string,
  }).isRequired,
};

function TableContainer({ selectedFacets }) {
  const columns = React.useMemo(() => [
    {
      Header: "Timestamp",
      accessor: "timestamp",
      Cell: (properties) => {
        return dateformatter(properties.cell.value);
      },
    },
    {
      Header: "Id",
      accessor: "id",
    },
    {
      Header: "Plugin",
      accessor: "tool",
    },
    {
      Header: "Caption",
      accessor: "caption",
      Cell: (prop) => {
        return <div className="forced-textwrap"> {prop.cell.value}</div>;
      },
    },
    {
      Header: "User",
      accessor: "uid",
    },
    {
      Header: "Link",
      accessor: "link2results",
      Cell: LinkCell,
    },
  ]);

  const [data, setData] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [pageCount, setPageCount] = React.useState(0);
  const [resultCount, setResultCount] = React.useState(0);

  const fetchData = React.useCallback(
    ({ pageSize, pageIndex, sortBy, globalFilter, selectedFacets }) => {
      setLoading(true);

      let params = "";
      if (selectedFacets) {
        _.map(selectedFacets, (value, key) => {
          params += `&${key}=${value}`;
        });
      }

      const offset = pageSize * pageIndex;

      params += `&limit=${pageSize}&offset=${offset}`;

      if (sortBy.length > 0) {
        const sortElement = sortBy[0];
        const order = sortElement.desc ? "desc" : "asc";
        params += `&sortName=${sortElement.id}&sortOrder=${order}`;
      }
      if (globalFilter) {
        params += `&searchText=${globalFilter}`;
      }

      const url = `/api/history/result-browser-files/?${params}`;
      return fetch(url, {
        credentials: "same-origin",
        headers: {
          "X-CSRFToken": getCookie("csrftoken"),
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((json) => {
          setData(json.data);
          setResultCount(json.metadata.numFound);
          setPageCount(Math.ceil(json.metadata.numFound / pageSize));
          return;
        })
        .catch((err) => {
          return err;
        })
        .then(() => {
          return setLoading(false);
        });
    },
    []
  );

  return (
    <div>
      <ResultTable
        resultCount={resultCount}
        columns={columns}
        data={data}
        fetchData={fetchData}
        loading={loading}
        pageCount={pageCount}
        selectedFacets={selectedFacets}
      />
    </div>
  );
}

TableContainer.propTypes = {
  selectedFacets: PropTypes.object,
};

class Resultbrowser extends React.Component {
  constructor(props) {
    super(props);
  }

  /**
   * On mount we load all facets and files to display
   * Also load the metadata.js script
   */
  componentDidMount() {
    this.props.dispatch(loadResultFacets());
  }

  /**
   * Loop all facets and render the panels
   */
  renderFacetPanels() {
    const { facets, selectedFacets, metadata } = this.props.resultbrowser;
    const { dispatch } = this.props;
    return _.map(facets, (value, key) => {
      let panelHeader;
      const isFacetSelected = !!selectedFacets[key];
      if (isFacetSelected) {
        panelHeader = (
          <span>
            {initCap(underscoreToBlank(key))}:{" "}
            <span className="fw-bold">{selectedFacets[key]}</span>
          </span>
        );
      } else if (value.length === 2) {
        panelHeader = (
          <span>
            {initCap(underscoreToBlank(key))}:{" "}
            <span className="fw-bold">{value[0]}</span>
          </span>
        );
      } else {
        const numberOfValues = value.length / 2;
        panelHeader = (
          <span className="d-flex justify-content-between">
            <span>{initCap(underscoreToBlank(key))}</span>{" "}
            <Badge bg="secondary">{numberOfValues}</Badge>
          </span>
        );
      }
      return (
        <OwnPanel
          header={panelHeader}
          key={key}
          removeFacet={
            isFacetSelected ? () => dispatch(clearResultFacet(key)) : null
          }
        >
          <AccordionItemBody
            eventKey={key}
            value={value}
            facetClick={(key, item) => dispatch(selectResultFacet(key, item))}
            metadata={metadata[key] ? metadata[key] : null}
          />
        </OwnPanel>
      );
    });
  }

  renderFilesPanel() {
    //TODO: This should be a separate component
    const { selectedFacets } = this.props.resultbrowser;
    return <TableContainer selectedFacets={selectedFacets} />;
  }

  render() {
    const { facets, selectedFacets } = this.props.resultbrowser;
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

    return (
      <Container>
        <Row>
          <h2>
            Resultbrowser{" "}
            {this.props.resultbrowser.loadingFacets && (
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
                      dispatch(clearAllResultFacets());
                    }}
                  >
                    Clear all
                  </a>
                </Card>
              </Col>
            ) : null}
            {facetPanels}
          </Col>
          <Col md={8}>{this.renderFilesPanel()}</Col>
        </Row>
      </Container>
    );
  }
}

Resultbrowser.propTypes = {
  resultbrowser: PropTypes.shape({
    facets: PropTypes.object,
    selectedFacets: PropTypes.object,
    metadata: PropTypes.object,
    loadingFacets: PropTypes.bool,
  }),
  error: PropTypes.string,
  dispatch: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  resultbrowser: state.resultbrowserReducer,
  error: state.appReducer.error,
});

export default connect(mapStateToProps)(Resultbrowser);
