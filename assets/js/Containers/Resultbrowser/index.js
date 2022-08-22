import React, { useRef } from "react";
import PropTypes from "prop-types";

import { connect } from "react-redux";
import { Container, Row, Col, Card, Form, Pagination, Table, Alert } from "react-bootstrap";

import _ from "lodash";

import { useTable, useSortBy, usePagination, useGlobalFilter } from "react-table";

import { FaSort, FaSortDown, FaSortUp } from "react-icons/fa";

import AccordionItemBody from "../../Components/AccordionItemBody";
import OwnPanel from "../../Components/OwnPanel";
import Spinner from "../../Components/Spinner";
import { dateformatter, getCookie } from "../../utils";

import {
  loadResultFacets,
  selectResultFacet,
  clearResultFacet,
  clearAllResultFacets
} from "./actions";


function GlobalFilter ({
  globalFilter,
  setGlobalFilter,
}) {
  const debouncedSetGlobalFilter = useRef(_.debounce(setGlobalFilter, 300));
  const [value, setValue] = React.useState(globalFilter);

  const onChange = (value) => {
    if (value.length > 2 || value.length === 0) {
      debouncedSetGlobalFilter.current(value);
    }
  };


  // const dobouncedOnChange = _.debounce(onChange, 500);
  return (
    <input
      value={value || ""}
      className="float-end form-control w-25"
      onChange={
        e => {
          setValue(e.target.value);
          // dobouncedOnChange(e.target.value);
          onChange(e.target.value);
        }
      }
      placeholder="Search"
    />
  );
}

GlobalFilter.propTypes = {
  globalFilter: PropTypes.string,
  setGlobalFilter: PropTypes.func.isRequired
};

function ResultTable ({ columns, data, fetchData, loading, selectedFacets, pageCount: controlledPageCount }) {
  const skipPageResetRef = React.useRef();

  const {
    getTableProps,
    headerGroups,
    prepareRow,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize, sortBy, globalFilter },
    setGlobalFilter,
  } = useTable({
    columns,
    data,
    selectedFacets,
    initialState: { pageIndex: 0, pageSize: 25, sortBy: [], globalFilter: "" },
    manualPagination: true,
    manualSortBy: true,
    manualGlobalFilter: true,
    autoResetPage: true,
    autoResetSortBy: true,
    autoResetGlobalFilter: true,
    pageCount: controlledPageCount,
  }, useGlobalFilter, useSortBy, usePagination);

  React.useEffect(() => {
    gotoPage(0);
  }, [selectedFacets]);

  const debouncedFetchData = useRef(_.debounce(fetchData, 250));
  React.useEffect(() => {
    skipPageResetRef.current = true;
    debouncedFetchData.current({ pageIndex, pageSize, sortBy, globalFilter, selectedFacets });
  }, [fetchData, pageIndex, pageSize, sortBy, globalFilter, selectedFacets]);

  React.useEffect(() => {
    // After the table has updated, always remove the flag
    skipPageResetRef.current = false;
  });

  return (
    <div className="p-2">
      <Table striped hover responsive {...getTableProps()}>
        <thead>
          <tr>
            <th
              colSpan={columns.length}
            >
              <GlobalFilter
                globalFilter={globalFilter}
                setGlobalFilter={setGlobalFilter}
              />
            </th>
          </tr>
          {
            headerGroups.map(headerGroup => {
              const { key, ...restHeaderGroupProps } = headerGroup.getHeaderGroupProps();
              return (<tr key={key} {...restHeaderGroupProps}>
                {
                  headerGroup.headers.map(column => {
                    const { key, ...restHeaderProps } = column.getHeaderProps((column.canSort ? column.getSortByToggleProps() : undefined));
                    return (
                      <th key={key} {...restHeaderProps}>
                        {column.render("Header")}
                        <span>
                          {
                            column.canSort
                              ? column.isSorted
                                ? column.isSortedDesc
                                  ? <FaSortDown />
                                  : <FaSortUp />
                                : <FaSort className="text-muted" />
                              : ""
                          }
                        </span>
                      </th>
                    );
                  })
                }
              </tr>
              );
            })
          }
        </thead>
        <tbody>
          {
            loading ?
              <tr><td className="text-center" colSpan={columns.length}><Spinner /></td></tr>
              :
              page.length === 0 ?
                <tr><td className="fw-bold text-center" colSpan={columns.length}>No elements found</td></tr>
                :
                page.map((row) => {
                  prepareRow(row);
                  const { key, ...restRowProps } = row.getRowProps();
                  return (
                    <tr key={key} {...restRowProps}>
                      {
                        row.cells.map(cell => {
                          const { key, ...restCellProps } = cell.getCellProps();
                          return (
                            <td key={key} {...restCellProps}>
                              {cell.render("Cell")}
                            </td>
                          );
                        })
                      }
                    </tr>
                  );
                })
          }
        </tbody>
      </Table>
      <div className="d-flex justify-content-between px-0">
        <Form.Select
          className="w-25"
          size="sm"
          value={pageSize}
          onChange={
            e => {
              setPageSize(Number(e.target.value));
            }
          }
        >
          {
            [10, 25, 50].map(pageSize => (
              <option key={pageSize} value={pageSize}>
                Show {pageSize}
              </option>
            ))
          }
        </Form.Select>

        <span>
          Page{" "}
          <strong>
            {pageIndex + 1} of {pageOptions.length}
          </strong>{" "}
        </span>

        <Pagination className="m-0">
          <Pagination.First disabled={!canPreviousPage} onClick={() => gotoPage(0)} />
          <Pagination.Prev onClick={() => previousPage()} disabled={!canPreviousPage} />
          <Pagination.Next onClick={() => nextPage()} disabled={!canNextPage} />
          <Pagination.Last onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage} />
        </Pagination>
      </div>
    </div>
  );
}


ResultTable.propTypes = {
  columns: PropTypes.array,
  data: PropTypes.array,
  fetchData: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  selectedFacets: PropTypes.object,
  pageCount: PropTypes.number
};

const LinkCell = (props) => {
  return <a href={props.cell.value}>Show</a>;
};

LinkCell.propTypes = {
  cell: PropTypes.shape({
    value: PropTypes.string
  }).isRequired
};

function TableContainer ({ selectedFacets }) {
  const columns = React.useMemo(
    () => [
      {
        Header: "Timestamp",
        accessor: "timestamp",
        Cell: (properties) => {
          return dateformatter(properties.cell.value);
        }
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
      },
      {
        Header: "User",
        accessor: "uid",
      },
      {
        Header: "Link",
        accessor: "link2results",
        Cell: LinkCell
      }
    ]
  );

  const [data, setData] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [pageCount, setPageCount] = React.useState(0);
  const [resultCount, setResultCount] = React.useState(0);

  const fetchData = React.useCallback(({ pageSize, pageIndex, sortBy, globalFilter, selectedFacets }) => {
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
        "Accept": "application/json",
        "Content-Type": "application/json"
      }
    }).then(response => response.json())
      .then(json => {
        setData(json.data);
        setResultCount(json.metadata.numFound);
        setPageCount(Math.ceil(json.metadata.numFound / pageSize));
        return;
      })
      .catch(err => {
        return err;
      })
      .then(() => {
        return setLoading(false);
      });
  }, []);


  return (
    <OwnPanel
      header={<span>Results [{resultCount}]</span>}
      id="result-browser"
      isOpen
    >
      <ResultTable
        columns={columns}
        data={data}
        fetchData={fetchData}
        loading={loading}
        pageCount={pageCount}
        selectedFacets={selectedFacets}
      />
    </OwnPanel>
  );
}

TableContainer.propTypes = {
  selectedFacets: PropTypes.object,
};

class Resultbrowser extends React.Component {

  constructor (props) {
    super(props);
  }

  /**
     * On mount we load all facets and files to display
     * Also load the metadata.js script
     */
  componentDidMount () {
    this.props.dispatch(loadResultFacets());
  }

  /**
     * Loop all facets and render the panels
     */
  renderFacetPanels () {
    const { facets, selectedFacets, metadata } = this.props.resultbrowser;
    const { dispatch } = this.props;
    return _.map(facets, (value, key) => {
      let panelHeader;
      const isFacetSelected = !!selectedFacets[key];
      if (isFacetSelected) {
        panelHeader = <span>{key}: <span className="fw-bold">{selectedFacets[key]}</span></span>;
      } else if (value.length === 2) {
        panelHeader = <span>{key}: <span className="fw-bold">{value[0]}</span></span>;
      } else {
        const numberOfValues = value.length / 2;
        panelHeader = <span>{key} ({numberOfValues})</span>;
      }
      return (
        <OwnPanel
          header={panelHeader}
          key={key}
          removeFacet={isFacetSelected ? (() => dispatch(clearResultFacet(key))) : null}
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

  renderFilesPanel () {
    //TODO: This should be a separate component
    const { selectedFacets } = this.props.resultbrowser;
    return (
      <TableContainer
        selectedFacets={selectedFacets}
      />
    );
  }

  render () {
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
      return (
        <Spinner />
      );
    }

    const facetPanels = this.renderFacetPanels();

    return (
      <Container>
        <Row>
          <Col md={12}>
            <h2>
              Resultbrowser {this.props.resultbrowser.loadingFacets && <Spinner outerClassName="d-inline fs-6 align-bottom" />}
            </h2>
          </Col>
        </Row>
        <Row>
          {
            Object.keys(selectedFacets).length !== 0 ?
              <Col md={12}>
                <Card className="shadow-sm">
                  <a
                    className="m-3"
                    href="#"
                    onClick={
                      (e) => {
                        e.preventDefault();
                        dispatch(clearAllResultFacets());
                      }
                    }
                  >Clear all</a>
                </Card>
              </Col> : null
          }
        </Row>
        <Row>
          <Col md={12}>
            {facetPanels}
            {this.renderFilesPanel()}
          </Col>
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
    loadingFacets: PropTypes.bool
  }),
  error: PropTypes.string,
  dispatch: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  resultbrowser: state.resultbrowserReducer,
  error: state.appReducer.error
});

export default connect(mapStateToProps) (Resultbrowser);
